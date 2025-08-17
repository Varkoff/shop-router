import { getFormProps, getInputProps, getSelectProps, getTextareaProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ExternalLink } from 'lucide-react';
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
import { MarkdownField } from '~/components/markdown-field';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import {
    createProduct,
    isSlugTaken,
    updateProduct,
} from '~/server/admin/admin-products.server';
import { getProduct } from '~/server/products.server';
import type { Route } from './+types/products.$productSlug';

export const ProductSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    slug: z.string().min(1, 'Le slug est requis'),
    description: z.string().optional(),
    content: z.string().optional(),
    priceCents: z.coerce.number().min(0, 'Le prix doit être positif'),
    currency: z.string().default('EUR'),
    stock: z.coerce.number().min(0, 'Le stock doit être positif'),
    isActive: z.boolean().default(false),
});

export async function loader({ params }: Route.LoaderArgs) {
    const isCreating = params.productSlug === 'new';

    if (isCreating) {
        return data({
            product: null,
            isCreating: true,
        });
    }

    const { product } = await getProduct({ productSlug: params.productSlug });

    if (!product) {
        throw new Response('Produit non trouvé', { status: 404 });
    }

    return data({
        product,
        isCreating: false,
    });
}

export async function action({ request, params }: Route.ActionArgs) {
    const formData = await request.formData();
    const productSlug = params.productSlug
    const isCreating = productSlug === 'new';

    const submission = await parseWithZod(formData, {
        async: true,
        schema: ProductSchema.superRefine(async (data, ctx) => {
            // Vérifier si le slug est déjà pris
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

    if (submission.status !== 'success') {
        return data({ result: submission.reply() }, { status: 400 });
    }

    try {
        if (isCreating) {
            const newProduct = await createProduct({ data: submission.value });
            return redirect(`/admin/products/${newProduct.slug}`);
        }

        const updatedProduct = await updateProduct({
            productSlug: productSlug,
            data: submission.value,
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

export default function ProductForm({
    loaderData,
    actionData,
}: Route.ComponentProps) {
    const { product, isCreating } = loaderData;
    const lastResult = actionData?.result;

    const [content, setContent] = useState(product?.content || '');

    const [form, fields] = useForm({
        lastResult,
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: ProductSchema });
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


    const navigation = useNavigation()
    const isLoading = navigation.state === "submitting"

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
                    <Form method='POST' {...getFormProps(form)} className='space-y-6'>
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

                        {!isCreating && product?.images && product.images.length > 0 && (
                            <div className="space-y-2">
                                <Label>Image du produit</Label>
                                <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border">
                                    <img
                                        src={product.images[0].url}
                                        alt={product.name || 'Image du produit'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
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
