import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint } from '@conform-to/zod';
import { Fragment, useState } from 'react';
import { Form, Link, useActionData, useNavigation } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { Cart } from '~/hooks/use-cart';
import { useOptionalUser } from '~/root';
import { CreateOrderSchema, type action as createOrderAction } from '~/routes/_public+/cart';
import { ErrorList } from '../forms';

interface OrderSummaryProps {
    totalItems: number;
    totalPrice: number;
    cart: Cart;
}

export const OrderSummary = ({
    totalItems,
    totalPrice,
    cart,
}: OrderSummaryProps) => {
    const user = useOptionalUser();
    const actionData = useActionData<typeof createOrderAction>()
    const [guestEmail, setGuestEmail] = useState('');
    const [form, fields] = useForm({
        constraint: getZodConstraint(CreateOrderSchema),
        defaultValue: {
            intent: 'create-order',
            items: cart.items.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
            })),
            guestEmail: user ? undefined : guestEmail,
        },
        lastResult: actionData?.result
    });
    const cartItems = fields.items.getFieldList();
    const navigation = useNavigation();
    const isLoading = navigation.state === 'submitting';
    return (
        <Card className='sticky top-6'>
            <CardHeader>
                <CardTitle className='text-xl font-light'>Résumé de commande</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                {/* Détail des prix */}
                <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>
                            Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})
                        </span>
                        <span>{(totalPrice / 100).toLocaleString('fr-FR')}€</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Livraison</span>
                        <span className='text-green-600'>Gratuite</span>
                    </div>
                </div>

                <div className='border-t pt-4'>
                    <div className='flex justify-between text-lg font-medium'>
                        <span>Total</span>
                        <span>{(totalPrice / 100).toLocaleString('fr-FR')}€</span>
                    </div>
                </div>

                {/* Email pour les clients déconnectés */}
                {!user && (
                    <div className='pt-4 border-t'>
                        <Label htmlFor='guestEmail' className='text-sm font-medium'>
                            Votre email pour la commande
                        </Label>
                        <Input
                            id='guestEmail'
                            type='email'
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder='votre@email.com'
                            className='mt-2'
                            required
                        />
                    </div>
                )}

                {/* Bouton continuer les achats */}
                <div className='pt-4'>
                    <Link to='/products' className='block'>
                        <Button variant='outline' className='w-full' size='lg'>
                            Continuer mes achats
                        </Button>
                    </Link>
                </div>

                {/* Informations supplémentaires */}
                <div className='text-xs text-gray-500 space-y-1 pt-4 border-t'>
                    <p>✓ Livraison gratuite</p>
                    <p>✓ Retour sous 30 jours</p>
                    <p>✓ Garantie 2 ans</p>
                </div>
            </CardContent>

            {/* Bouton de commande fixé en bas */}
            <div className='border-t bg-gray-50 p-4'>
                <div className='flex items-center justify-between mb-3'>
                    <span className='text-sm text-gray-600'>Total à payer</span>
                    <span className='text-xl font-bold text-gray-900'>
                        {(totalPrice / 100).toLocaleString('fr-FR')}€
                    </span>
                </div>
                <Form method='post' {...getFormProps(form)} className='flex flex-col gap-2'>
                    <input {...getInputProps(fields.intent, { type: 'hidden' })} />
                    {/* <input {...getInputProps(fields.items, { type: 'hidden' })} /> */}

                    {cartItems.map((cartItem) => {
                        const { productId, quantity } = cartItem.getFieldset();
                        return (
                            <Fragment key={cartItem.key}>
                                <input {...getInputProps(productId, { type: 'hidden' })} />
                                <input {...getInputProps(quantity, { type: 'hidden' })} />
                                <ErrorList errors={cartItem.errors} />
                                <ErrorList errors={productId.errors} />
                                <ErrorList errors={quantity.errors} />
                            </Fragment>
                        );
                    })}
                    <input {...getInputProps(fields.guestEmail, { type: 'hidden' })} />
                    <ErrorList errors={form.errors} />
                    <Button
                        type='submit'
                        className='w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-medium'
                        size='lg'
                        disabled={!user && !guestEmail.trim() || isLoading}
                        isLoading={isLoading}
                    >
                        Commander maintenant
                    </Button>
                </Form>
            </div>
        </Card>
    );
};
