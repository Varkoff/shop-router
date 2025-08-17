import { getFormProps, getInputProps, getSelectProps, getTextareaProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { data, Form, Link, redirect, useNavigation } from 'react-router';
import { z } from 'zod';
import {
    ErrorList,
    Field,
    PriceField,
    SelectField,
    SwitchField
} from '~/components/forms';
import { ImageSelector } from '~/components/image-selector';
import { MarkdownField } from '~/components/markdown-field';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import {
    createProduct,
    isSlugTaken,
    updateProduct,
} from '~/server/admin/admin-products.server';
import { requireAdmin } from '~/server/auth.server';
import { linkImagesToProduct, unlinkImageFromProduct } from '~/server/db.server';
import { getProduct } from '~/server/products.server';
import { listS3Objects } from '~/server/s3.server';
import type { Route } from './+types/products.$productSlug';

const ProductSchema = z.object({
    intent: z.literal('update-product'),
    name: z.string().min(1, 'Le nom est requis'),
    slug: z.string().min(1, 'Le slug est requis'),
    description: z.string().optional(),
    content: z.string().optional(),
    priceCents: z.coerce.number().min(0, 'Le prix doit être positif'),
    currency: z.string().default('EUR'),
    stock: z.coerce.number().min(0, 'Le stock doit être positif'),
    isActive: z.boolean().default(false),
});

const LinkImagesSchema = z.object({
    intent: z.literal('link-images'),
    productId: z.string().uuid(),
    imageUrls: z.array(z.string().url()).min(1, 'Au moins une image est requise'),
});

const UnlinkImageSchema = z.object({
    intent: z.literal('unlink-image'),
    productId: z.string().uuid(),
    imageUrl: z.string().url(),
});

export const ActionSchema = z.discriminatedUnion('intent', [
    ProductSchema,
    LinkImagesSchema,
    UnlinkImageSchema,
]);



export async function loader({ params, request }: Route.LoaderArgs) {
    await requireAdmin(request);
    const isCreating = params.productSlug === 'new';

    const [productResult, s3Result] = await Promise.all([
        isCreating ? { product: null } : getProduct({ productSlug: params.productSlug }),
        listS3Objects(),
    ]);

    if (!isCreating && !productResult.product) {
        throw new Response('Produit non trouvé', { status: 404 });
    }

    if (!s3Result.success) {
        throw new Response(s3Result.error || 'Erreur lors du chargement des images', {
            status: 500,
        });
    }

    return data({
        product: productResult.product,
        isCreating,
        images: s3Result.objects || [],
    });
}

export async function action({ request, params }: Route.ActionArgs) {
    await requireAdmin(request);
    const formData = await request.formData();
    const productSlug = params.productSlug;
    const isCreating = productSlug === 'new';

    const submission = await parseWithZod(formData, {
        schema: ActionSchema,
        async: true,
    });

    if (submission.status !== 'success') {
        return data({ result: submission.reply() }, { status: 400 });
    }

    switch (submission.value.intent) {
        case 'link-images': {
            try {
                const result = await linkImagesToProduct({ data: submission.value });
                return data({
                    result: submission.reply(),
                    success: `${result.linkedCount} image${result.linkedCount > 1 ? 's' : ''} liée${result.linkedCount > 1 ? 's' : ''} avec succès !`
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors de la liaison des images'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case 'unlink-image': {
            try {
                await unlinkImageFromProduct({
                    imageUrl: submission.value.imageUrl,
                    productId: submission.value.productId,
                });
                return data({
                    result: submission.reply(),
                    success: 'Image déconnectée avec succès !'
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors de la déconnexion de l\'image'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case 'update-product': {
            // Validate slug uniqueness for product updates
            const slugValidation = await parseWithZod(formData, {
                async: true,
                schema: ProductSchema.superRefine(async (data, ctx) => {
                    const slugTaken = await isSlugTaken({
                        slug: data.slug,
                    });

                    if (slugTaken && data.slug !== productSlug) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: 'Le slug est déjà attaché à un produit',
                            path: ['slug'],
                        });
                    }
                }),
            });

            if (slugValidation.status !== 'success') {
                return data({ result: slugValidation.reply() }, { status: 400 });
            }

            try {
                if (isCreating) {
                    const { intent: _, ...productData } = submission.value;
                    const newProduct = await createProduct({ data: productData });
                    return redirect(`/admin/products/${newProduct.slug}`);
                }

                const { intent: _, ...productData } = submission.value;
                const updatedProduct = await updateProduct({
                    productSlug: productSlug,
                    data: productData,
                });

                if (updatedProduct.hasUpdatedSlug) {
                    return redirect(`/admin/products/${updatedProduct.slug}`);
                }
                return data({ result: submission.reply() });

            } catch {
                return data(
                    {
                        result: submission.reply({
                            formErrors: ['Une erreur est survenue lors de la sauvegarde'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        default: {
            return data({ result: null }, { status: 400 });
        }
    }
}

export default function ProductForm({
    loaderData,
    actionData,
}: Route.ComponentProps) {
    const { product, isCreating, images } = loaderData;
    const lastResult = actionData?.result;
    const successMessage = actionData && 'success' in actionData ? actionData.success as string : undefined;

    const [content, setContent] = useState(product?.content || '');

    const [form, fields] = useForm({
        lastResult,
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: ProductSchema.omit({ intent: true })
            });
        },
        defaultValue: {
            name: product?.name || '',
            slug: product?.slug || '',
            description: product?.description || '',
            content: product?.content || '',
            priceCents: product?.priceCents || 0,
            currency: product?.currency || 'EUR',
            stock: product?.stock || 0,
            isActive: product?.isActive || false,
        },
    });


    const navigation = useNavigation();
    const isLoading = navigation.state === "submitting";

    return (
        <div className='container mx-auto px-4 py-8'>
            <Card className='max-w-4xl mx-auto'>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {isCreating ? 'Créer un produit' : `Modifier ${product?.name}`}
                        </CardTitle>
                        {!isCreating && product && (
                            <Button variant="outline" size="sm" asChild className='h-fit'>
                                <Link to={`/products/${product.slug}`} target="_blank"

                                    className='flex items-center gap-2'>
                                    <ExternalLink className="size-4 shrink-0 mr-2" />
                                    <span>Voir la page publique</span>
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {successMessage && (
                        <Alert className="mb-6">
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    <Form method='POST' {...getFormProps(form)} className='space-y-6' data-image-form>
                        <input type="hidden" name="intent" value="update-product" />
                        <ErrorList id={form.errorId} errors={form.errors} />

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <Field
                                labelProps={{ children: 'Nom du produit' }}
                                inputProps={{
                                    ...getInputProps(fields.name, {
                                        type: 'text'
                                    }),
                                    placeholder: 'Nom du produit',
                                }}
                                errors={fields.name.errors}
                            />

                            <Field
                                labelProps={{ children: 'Slug' }}
                                inputProps={{
                                    ...getInputProps(fields.slug, {
                                        type: 'text',
                                    }),
                                    placeholder: 'slug-du-produit',
                                }}
                                errors={fields.slug.errors}
                            />
                        </div>

                        <Field
                            labelProps={{ children: 'Description courte' }}
                            inputProps={{
                                ...getInputProps(fields.description, {
                                    type: 'text',
                                }),
                                placeholder: 'Description courte du produit',
                            }}
                            errors={fields.description.errors}
                        />

                        <MarkdownField
                            content={content}
                            onContentChange={setContent}
                            labelProps={{ children: 'Contenu détaillé (Markdown)' }}
                            textareaProps={{
                                ...getTextareaProps(fields.content),
                                placeholder: 'Contenu détaillé en markdown...',
                                rows: 10,
                            }}
                            errors={fields.content.errors}
                        />

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                            <PriceField
                                labelProps={{ children: 'Prix (en centimes)' }}
                                inputProps={{
                                    ...getInputProps(fields.priceCents, {
                                        type: 'number',
                                        min: '0',
                                        placeholder: '2990',
                                    }),
                                }}
                                errors={fields.priceCents.errors}
                            />

                            <SelectField
                                labelProps={{ children: 'Devise' }}

                                selectProps={{
                                    ...getSelectProps(fields.currency),
                                    defaultValue: fields.currency.initialValue,
                                }}
                                placeholder="Sélectionner une devise"
                                options={[
                                    { value: 'EUR', label: '€ Euro' },
                                    { value: 'USD', label: '$ Dollar américain' },
                                    { value: 'GBP', label: '£ Livre sterling' },
                                    { value: 'CHF', label: '₣ Franc suisse' },
                                    { value: 'CAD', label: '$ Dollar canadien' },
                                ]}
                                errors={fields.currency.errors}
                            />

                            <Field
                                labelProps={{ children: 'Stock' }}
                                inputProps={{
                                    ...getInputProps(fields.stock, {
                                        type: 'number',
                                        min: '0',
                                        placeholder: '10',
                                    }),
                                }}
                                errors={fields.stock.errors}
                            />
                        </div>

                        <SwitchField
                            labelProps={{ children: 'Produit actif' }}
                            switchProps={{
                                ...getInputProps(fields.isActive, { type: 'checkbox' }),
                                type: "button",
                            }}
                            errors={fields.isActive.errors}
                        />

                        {!isCreating && product && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Images du produit</Label>
                                    <div className="flex gap-2">
                                        <ImageSelector
                                            images={images}
                                            productId={product.id}
                                            selectedImages={product.images?.map(img => ({
                                                key: img.url,
                                                url: img.url,
                                                name: img.alt || 'Image',
                                                size: 0,
                                                lastModified: new Date()
                                            })) || []}
                                            trigger={
                                                <Button type="button" variant="outline" size="sm" className="gap-2">
                                                    <ImageIcon className="w-4 h-4" />
                                                    Choisir des images
                                                </Button>
                                            }
                                        />
                                    </div>
                                </div>

                                {product.images && product.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {product.images.map((image, index) => (
                                            <div key={image.id} className="space-y-2">
                                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                                                    <img
                                                        src={image.url}
                                                        alt={image.alt || `Image ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground text-center truncate">
                                                    {image.alt || `Image ${index + 1}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(!product.images || product.images.length === 0) && (
                                    <div className="text-center py-8 border border-dashed rounded-lg">
                                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            Aucune image associée à ce produit
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className='flex gap-4 w-full'>
                            <Button type='submit'
                                isLoading={isLoading}
                                disabled={isLoading}
                            >
                                {isCreating ? 'Créer le produit' : 'Mettre à jour'}
                            </Button>
                            <Button type='button' variant='outline' asChild>
                                <a href='/admin/products'>Annuler</a>
                            </Button>
                        </div>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
