import { getFormProps, getInputProps, getTextareaProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { data, Form, redirect } from 'react-router';
import { z } from 'zod';
import {
    CheckboxField,
    ErrorList,
    Field,
    TextareaField,
} from '~/components/forms';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
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

    return (
        <div className='container mx-auto px-4 py-8'>
            <Card className='max-w-4xl mx-auto'>
                <CardHeader>
                    <CardTitle>
                        {isCreating ? 'Créer un produit' : `Modifier ${product?.name}`}
                    </CardTitle>
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

                        <TextareaField
                            labelProps={{ children: 'Contenu détaillé (Markdown)' }}
                            textareaProps={{
                                ...getTextareaProps(fields.content),
                                placeholder: 'Contenu détaillé en markdown...',
                                rows: 10,
                            }}
                            errors={fields.content.errors}
                        />

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                            <Field
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

                            <Field
                                labelProps={{ children: 'Devise' }}
                                inputProps={{
                                    ...getInputProps(fields.currency, {
                                        type: 'text',
                                    }),
                                    placeholder: 'EUR',
                                }}
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

                        <CheckboxField
                            labelProps={{ children: 'Produit actif' }}
                            buttonProps={{
                                ...getInputProps(fields.isActive, { type: 'checkbox' }),
                            }}
                            errors={fields.isActive.errors}
                        />

                        <div className='flex gap-4'>
                            <Button type='submit' className='flex-1'>
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
