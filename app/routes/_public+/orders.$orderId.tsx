import { useEffect } from 'react'
import { data, href, Link, useSearchParams } from 'react-router'
import { Badge } from '~/components/ui/badge'
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

const getStatusBadge = (status: string) => {
    const statusMap = {
        DRAFT: { label: 'Brouillon', variant: 'secondary' as const },
        CONFIRMED: { label: 'Confirmée', variant: 'default' as const },
        PROCESSING: { label: 'En cours', variant: 'default' as const },
        SHIPPED: { label: 'Expédiée', variant: 'default' as const },
        DELIVERED: { label: 'Livrée', variant: 'default' as const },
        CANCELLED: { label: 'Annulée', variant: 'destructive' as const },
    }

    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
}

const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
        PENDING: { label: 'En attente', variant: 'secondary' as const },
        PAID: { label: 'Payé', variant: 'default' as const },
        FAILED: { label: 'Échec', variant: 'destructive' as const },
        REFUNDED: { label: 'Remboursé', variant: 'secondary' as const },
    }

    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
}

export default function OrderDetailsRoute({ loaderData }: Route.ComponentProps) {
    const { order } = loaderData
    const { clearCart } = useCart()

    const orderStatus = getStatusBadge(order.orderStatus)
    const paymentStatus = getPaymentStatusBadge(order.paymentStatus)
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
                            <Badge variant={orderStatus.variant}>{orderStatus.label}</Badge>
                            <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>
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
                                        <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">

                                            {/* Image du produit */}
                                            <div className="flex-shrink-0">
                                                {item.product?.images?.[0]?.url ? (
                                                    <img
                                                        src={item.product.images[0].url}
                                                        alt={item.product.images[0].alt || item.productName}
                                                        className="w-16 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">Pas d'image</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Informations du produit */}
                                            <div className="flex-1 min-w-0">
                                                {item.product?.slug ? (
                                                    <Link
                                                        to={href('/products/:productSlug', { productSlug: item.product.slug })}
                                                        className="font-medium text-lg leading-tight mb-1 hover:text-blue-600 transition-colors"
                                                    >
                                                        {item.productName}
                                                    </Link>
                                                ) : (
                                                    <h3 className="font-medium text-lg leading-tight mb-1">
                                                        {item.productName}
                                                    </h3>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600 text-sm">
                                                        Quantité: {item.quantity}
                                                    </span>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-600">
                                                            {(item.unitPriceCents / 100).toLocaleString('fr-FR')}€ × {item.quantity}
                                                        </div>
                                                        <div className="font-medium">
                                                            {(item.totalPriceCents / 100).toLocaleString('fr-FR')}€
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
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
