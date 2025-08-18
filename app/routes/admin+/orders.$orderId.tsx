import {
    ArrowLeft,
    Calendar,
    CreditCard,
    ExternalLink,
    Mail,
    MapPin,
    Package,
    RefreshCw,
    User
} from "lucide-react";
import { data, Link, useFetcher } from "react-router";
import { OrderItemComponent } from "~/components/order/order-item";
import { OrderStatusBadge, PaymentStatusBadge } from "~/components/order/order-status-badge";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { getOrderForAdmin, updateOrderStatus } from "~/server/admin/admin-orders.server";
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/orders.$orderId";

export async function loader({ params, request }: Route.LoaderArgs) {
    await requireAdmin(request);

    const order = await getOrderForAdmin(params.orderId);

    if (!order) {
        throw data('Commande introuvable', { status: 404 });
    }

    return data({ order });
}

export async function action({ request, params }: Route.ActionArgs) {
    await requireAdmin(request);

    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'update-status') {
        const orderStatus = formData.get('orderStatus') as string;
        const paymentStatus = formData.get('paymentStatus') as string;

        const updates: {
            orderStatus?: 'DRAFT' | 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELED' | 'REFUNDED';
            paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
            deliveryStatus?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';
        } = {};
        if (orderStatus) updates.orderStatus = orderStatus as any;
        if (paymentStatus) updates.paymentStatus = paymentStatus as any;

        const updatedOrder = await updateOrderStatus(params.orderId, updates);

        return data({ success: true, order: updatedOrder });
    }

    if (intent === 'refund') {
        // TODO: Implémenter le remboursement Stripe
        return data({ success: true, message: 'Remboursement initié (fonctionnalité à implémenter)' });
    }

    return data({ success: false, message: 'Action inconnue' });
}

export default function AdminOrderDetailsPage({ loaderData }: Route.ComponentProps) {
    const { order } = loaderData;
    const fetcher = useFetcher();

    return (
        <div className="space-y-6">
            {/* Header avec navigation */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/orders">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour aux commandes
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Commande #{order.id.slice(-8)}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <OrderStatusBadge status={order.orderStatus} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <Badge variant="outline">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Colonne principale - Détails de la commande */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Articles commandés */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Articles commandés ({order.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="pb-4 border-b last:border-b-0">
                                    <OrderItemComponent item={item} showDetails={true} />
                                    {item.product && (
                                        <div className="mt-2 flex gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                SKU: {item.productId}
                                            </Badge>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link to={`/admin/products/${item.product.slug}`}>
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    Voir produit
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Informations du client */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Informations client
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.user ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium">{order.user.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Client depuis le {new Date(order.user.createdAt).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{order.user.email}</span>
                                    </div>
                                    {order.user.stripeCustomerId && (
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-mono">
                                                {order.user.stripeCustomerId}
                                            </span>
                                            <Button variant="ghost" size="sm">
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                Voir dans Stripe
                                            </Button>
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to={`/admin/users/${order.user.id}`}>
                                            Voir profil client
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Client invité</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{order.guestEmail}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Adresses */}
                    {(order.shippingAddress || order.billingAddress) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Adresses
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.shippingAddress && (
                                    <div>
                                        <h4 className="font-medium mb-2">Adresse de livraison</h4>
                                        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                                            <pre className="whitespace-pre-wrap font-sans">
                                                {JSON.stringify(order.shippingAddress, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                                {order.billingAddress && (
                                    <div>
                                        <h4 className="font-medium mb-2">Adresse de facturation</h4>
                                        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                                            <pre className="whitespace-pre-wrap font-sans">
                                                {JSON.stringify(order.billingAddress, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Colonne latérale - Actions et résumé */}
                <div className="space-y-6">

                    {/* Actions rapides */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <fetcher.Form method="post" className="space-y-4">
                                <input type="hidden" name="intent" value="update-status" />

                                <div>
                                    <label htmlFor="orderStatus" className="text-sm font-medium">Statut commande</label>
                                    <Select name="orderStatus" defaultValue={order.orderStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DRAFT">Brouillon</SelectItem>
                                            <SelectItem value="PENDING">En attente</SelectItem>
                                            <SelectItem value="PAID">Payée</SelectItem>
                                            <SelectItem value="FULFILLED">Livrée</SelectItem>
                                            <SelectItem value="CANCELED">Annulée</SelectItem>
                                            <SelectItem value="REFUNDED">Remboursée</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label htmlFor="paymentStatus" className="text-sm font-medium">Statut paiement</label>
                                    <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">En attente</SelectItem>
                                            <SelectItem value="PAID">Payé</SelectItem>
                                            <SelectItem value="FAILED">Échoué</SelectItem>
                                            <SelectItem value="REFUNDED">Remboursé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button type="submit" className="w-full">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Mettre à jour
                                </Button>
                            </fetcher.Form>

                            <Separator />

                            {order.paymentStatus === 'PAID' && (
                                <fetcher.Form method="post">
                                    <input type="hidden" name="intent" value="refund" />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="w-full text-red-600 border-red-600 hover:bg-red-50"
                                    >
                                        Initier un remboursement
                                    </Button>
                                </fetcher.Form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Résumé financier */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Résumé financier</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sous-total</span>
                                <span>{(order.subtotalCents / 100).toLocaleString('fr-FR')}€</span>
                            </div>

                            {order.taxCents > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Taxes</span>
                                    <span>{(order.taxCents / 100).toLocaleString('fr-FR')}€</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Livraison</span>
                                <span className={order.shippingCents === 0 ? 'text-green-600' : ''}>
                                    {order.shippingCents === 0 ? 'Gratuite' : `${(order.shippingCents / 100).toLocaleString('fr-FR')}€`}
                                </span>
                            </div>

                            <Separator />

                            <div className="flex justify-between font-medium">
                                <span>Total</span>
                                <span>{(order.totalCents / 100).toLocaleString('fr-FR')}€</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informations Stripe */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Informations Stripe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Session ID:</span>
                                    <span className="font-mono text-xs">
                                        {order.stripeCheckoutSession || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment Intent:</span>
                                    <span className="font-mono text-xs">
                                        {order.stripePaymentIntentId || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Devise:</span>
                                    <span className="uppercase">{order.currency}</span>
                                </div>
                            </div>

                            {order.stripeCheckoutSession && (
                                <Button variant="outline" size="sm" className="w-full">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Voir dans Stripe Dashboard
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Métadonnées */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Historique
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Créée le:</span>
                                    <span>{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Mise à jour:</span>
                                    <span>{new Date(order.updatedAt).toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
