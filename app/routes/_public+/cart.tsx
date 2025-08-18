import { parseWithZod } from '@conform-to/zod';
import { data, redirect, useFetcher } from 'react-router';
import { z } from 'zod';
import { CartHeader } from '~/components/cart/cart-header';
import { CartItem } from '~/components/cart/cart-item';
import { EmptyCart } from '~/components/cart/empty-cart';
import { OrderSummary } from '~/components/cart/order-summary';
import { useCartContext } from '~/contexts/cart-context';
import { useCart } from '~/hooks/use-cart';
import { getOptionalUser } from '~/server/auth.server';
import { clearCart } from '~/server/customer/cart.server';
import { createOrder } from '~/server/customer/orders.server';
import { createStripeCheckoutSession } from '~/server/stripe.server';
import type { Route } from './+types/cart';


// Schéma Zod pour les items de commande
const CartItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.coerce.number().int().positive('Quantity must be positive'),
});

// Schéma Zod pour vider le panier
const ClearCartSchema = z.object({
    intent: z.literal('clear-cart'),
});

// Schéma Zod pour la création de commande
export const CreateOrderSchema = z.object({
    intent: z.literal('create-order'),
    items: z.array(CartItemSchema).min(1, 'Votre panier est vide'),
    guestEmail: z.string().email('Email invalide').optional(),
});

// Schéma combiné pour toutes les actions
const CartPageActionSchema = z.discriminatedUnion('intent', [
    ClearCartSchema,
    CreateOrderSchema,
]);



export async function action({ request }: Route.ActionArgs) {
    const user = await getOptionalUser(request);
    const formData = await request.formData();

    const submission = parseWithZod(formData, {
        schema: CartPageActionSchema.superRefine((data, ctx) => {
            if (data.intent === "create-order") {
                if (!user && !data.guestEmail) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Email requis pour les commandes sans compte',
                    });
                }
            }
        }),
    });

    if (submission.status !== 'success') {
        return data({ result: submission.reply() }, { status: 400 });
    }

    switch (submission.value.intent) {
        case 'clear-cart': {
            if (!user) {
                return data({ result: submission.reply() }, { status: 401 });
            }

            try {
                await clearCart({ userId: user.id });
                return data({ result: submission.reply() });
            } catch (error) {
                console.error('Clear cart error:', error);
                return data({ result: submission.reply() }, { status: 500 });
            }
        }
        case "create-order": {
            const { guestEmail } = submission.value;
            try {
                // Créer la commande avec les items du panier
                const order = await createOrder({
                    cartData: submission.value,
                    userId: user?.id,
                });

                // Construire les URLs de succès et d'annulation
                const baseUrl = new URL(request.url).origin;
                const successUrl = user
                    ? `${baseUrl}/orders/${order.id}?success=true`
                    : `${baseUrl}/orders/${order.id}?email=${encodeURIComponent(guestEmail || '')}&success=true`;
                const cancelUrl = `${baseUrl}/cart`;

                // Créer la session Stripe Checkout
                const stripeSession = await createStripeCheckoutSession({
                    order,
                    user,
                    guestEmail,
                    successUrl,
                    cancelUrl,
                });

                // Vider le panier uniquement pour les utilisateurs connectés
                // Pour les invités, on le fera via le webhook après paiement réussi
                if (user) {
                    await clearCart({ userId: user.id });
                }

                // Rediriger vers Stripe Checkout
                if (!stripeSession.url) {
                    throw new Error('Erreur lors de la création de la session Stripe');
                }
                return redirect(stripeSession.url);

            } catch (error) {
                console.error('Order creation error:', error);

                if (error instanceof Error) {
                    return data({
                        result: submission.reply({
                            formErrors: [error.message]
                        })
                    }, { status: 400 });
                }

                return data({
                    result: submission.reply({
                        formErrors: ['Erreur lors de la création de la commande']
                    })
                }, { status: 500 });
            }
        }
    }
}

export default function CartRoute() {
    const {
        cart,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        getTotalItems
    } = useCartContext()

    const { clearCart } = useCart()
    const clearCartFetcher = useFetcher()

    // Fonction pour vider le panier
    const handleClearCart = () => {
        const formData = new FormData()
        formData.set('intent', 'clear-cart')

        clearCartFetcher.submit(formData, {
            method: 'POST',
        })

        // Pour les utilisateurs non connectés, vider aussi le localStorage
        clearCart({ disableAuthenticatedClearCart: true })
    }

    if (cart.items.length === 0) {
        return <EmptyCart />
    }

    return (
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">
                    <CartHeader
                        totalItems={getTotalItems()}
                        onClearCart={handleClearCart}
                    />

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Liste des articles */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.items.map((item) => (
                                <CartItem
                                    key={item.product.id}
                                    item={item}
                                    onRemove={removeFromCart}
                                    onUpdateQuantity={updateQuantity}
                                />
                            ))}
                        </div>

                        {/* Résumé de commande */}
                        <div className="lg:col-span-1">
                            <OrderSummary
                                key={JSON.stringify(cart)}
                                totalItems={getTotalItems()}
                                totalPrice={getTotalPrice()}
                                cart={cart}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
