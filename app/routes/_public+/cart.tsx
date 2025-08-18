import { parseWithZod } from '@conform-to/zod';
import { data, redirect } from 'react-router';
import { z } from 'zod';
import { CartHeader, CartItem, EmptyCart, OrderSummary } from '~/components/cart';
import { useCartContext } from '~/contexts/cart-context';
import { useCart } from '~/hooks/use-cart';
import { getOptionalUser } from '~/server/auth.server';
import { clearCart } from '~/server/customer/cart.server';
import { createOrder } from '~/server/customer/orders.server';
import type { Route } from './+types/cart';


// Schéma Zod pour les items de commande
const CartItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.coerce.number().int().positive('Quantity must be positive'),
});

// Schéma Zod pour la création de commande
export const CreateOrderSchema = z.object({
    intent: z.literal('create-order'),
    items: z.array(CartItemSchema).min(1, 'Votre panier est vide'),
    guestEmail: z.string().email('Email invalide').optional(),
});

export async function action({ request }: Route.ActionArgs) {
    const user = await getOptionalUser(request);
    const formData = await request.formData();

    const submission = parseWithZod(formData, {
        schema: CreateOrderSchema.superRefine((data, ctx) => {
            if (!user && !data.guestEmail) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Email requis pour les commandes sans compte',
                });
            }
        }),
    });

    if (submission.status !== 'success') {
        return data({ result: submission.reply() }, { status: 400 });
    }

    const { guestEmail } = submission.value;
    try {
        // Créer la commande avec les items du panier
        const order = await createOrder({
            cartData: submission.value,
            userId: user?.id,
        });

        if (user) {
            await clearCart({ userId: user.id });
        }

        // Rediriger vers la page de confirmation ou de paiement avec paramètre de succès
        const redirectUrl = user
            ? `/orders/${order.id}?success=true`
            : `/orders/${order.id}?email=${encodeURIComponent(guestEmail || '')}&success=true`;
        return redirect(redirectUrl);

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

export default function CartRoute() {
    const {
        cart,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        getTotalItems
    } = useCartContext()

    const { clearCart } = useCart()

    if (cart.items.length === 0) {
        return <EmptyCart />
    }

    return (
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">
                    <CartHeader
                        totalItems={getTotalItems()}
                        onClearCart={clearCart}
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
