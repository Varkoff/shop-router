import { useEffect } from 'react'
import { data, useSearchParams } from 'react-router'
import { OrderItemComponent } from '~/components/order/order-item'
import { OrderStatusBadge, PaymentStatusBadge } from '~/components/order/order-status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useCart } from '~/hooks/use-cart'
import { getOptionalUser } from '~/server/auth.server'
import { prisma } from '~/server/db.server'
import type { Route } from './+types/orders.$orderId'

export async function loader({ params, request }: Route.LoaderArgs) {
    const user = await getOptionalUser(request)
    const url = new URL(request.url)
    const guestEmail = url.searchParams.get('email')

    // Pour les utilisateurs connectés
    if (user) {
        const order = await prisma.order.findUnique({
            where: {
                id: params.orderId,
                userId: user.id
            },
            include: {
                items: true
            }
        })

        if (!order) {
            throw data('Commande introuvable', { status: 404 })
        }

        // Récupérer les produits et leurs images pour chaque item
        const itemsWithProducts = await Promise.all(
            order.items.map(async (item) => {
                if (!item.productId) {
                    return { ...item, product: null }
                }

                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    include: { images: true }
                })

                return { ...item, product }
            })
        )

        return { order: { ...order, items: itemsWithProducts } }
    }

    // Pour les clients déconnectés, vérifier avec l'email
    if (!guestEmail) {
        throw data('Email requis pour accéder à cette commande', { status: 401 })
    }

    const order = await prisma.order.findUnique({
        where: {
            id: params.orderId,
            guestEmail: guestEmail
        },
        include: {
            items: true
        }
    })

    if (!order) {
        throw data('Commande introuvable', { status: 404 })
    }

    // Récupérer les produits et leurs images pour chaque item
    const itemsWithProducts = await Promise.all(
        order.items.map(async (item) => {
            if (!item.productId) {
                return { ...item, product: null }
            }

            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { images: true }
            })

            return { ...item, product }
        })
    )

    return { order: { ...order, items: itemsWithProducts } }
}



export default function OrderDetailsRoute({ loaderData }: Route.ComponentProps) {
    const { order } = loaderData
    const { clearCart } = useCart()
    const [searchParams] = useSearchParams()

    // Vider le localStorage si on arrive depuis une commande réussie
    useEffect(() => {
        const isSuccess = searchParams.get('success') === 'true'

        if (isSuccess) {
            clearCart({
                disableAuthenticatedClearCart: true
            })
        }
    }, [clearCart, searchParams])

    return (
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-light mb-2 tracking-tight">
                            Commande #{order.id.slice(-8)}
                        </h1>
                        <div className="flex gap-2 mb-4">
                            <OrderStatusBadge status={order.orderStatus} />
                            <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                        <p className="text-gray-600 font-light">
                            Créée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* Articles commandés */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-light">
                                        Articles commandés
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="pb-4 border-b last:border-b-0">
                                            <OrderItemComponent item={item} showDetails={true} />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Résumé de la commande */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-light">
                                        Résumé
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">

                                    {/* Détail des prix */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Sous-total</span>
                                            <span>{(order.subtotalCents / 100).toLocaleString('fr-FR')}€</span>
                                        </div>
                                        {order.taxCents > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Taxes</span>
                                                <span>{(order.taxCents / 100).toLocaleString('fr-FR')}€</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Livraison</span>
                                            <span className={order.shippingCents === 0 ? 'text-green-600' : ''}>
                                                {order.shippingCents === 0 ? 'Gratuite' : `${(order.shippingCents / 100).toLocaleString('fr-FR')}€`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between text-lg font-medium">
                                            <span>Total payé</span>
                                            <span>{(order.totalCents / 100).toLocaleString('fr-FR')}€</span>
                                        </div>
                                    </div>

                                    {/* Informations de livraison */}
                                    {order.shippingAddress && (
                                        <div className="border-t pt-4">
                                            <h4 className="font-medium mb-2">Adresse de livraison</h4>
                                            <div className="text-sm text-gray-600">
                                                <pre className="whitespace-pre-wrap font-sans">
                                                    {JSON.stringify(order.shippingAddress, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
