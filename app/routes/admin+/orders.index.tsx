import { Calendar, Euro, Eye, Package, RefreshCw, User } from "lucide-react";
import { data, Link, useSearchParams } from "react-router";
import { OrderStatusBadge, PaymentStatusBadge } from "~/components/order/order-status-badge";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { getAllOrders } from "~/server/admin/admin-orders.server";
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/orders.index";

export async function loader({ request }: Route.LoaderArgs) {
    await requireAdmin(request);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    const result = await getAllOrders({ page, limit: 20 });

    return data(result);
}

export default function AdminOrdersPage({ loaderData }: Route.ComponentProps) {
    const { orders, pagination } = loaderData;
    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestion des commandes</h1>
                <p className="text-muted-foreground">
                    Gérez toutes les commandes de la boutique
                </p>
            </div>

            {/* Statistiques rapides */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pagination.totalCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commandes en attente</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(o => o.orderStatus === 'PENDING').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paiements en attente</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(o => o.paymentStatus === 'PENDING').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders
                                .filter(o => o.paymentStatus === 'PAID')
                                .reduce((sum, o) => sum + o.totalCents, 0) / 100}€
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* Table des commandes */}
            <Card>
                <CardHeader>
                    <CardTitle>Commandes ({pagination.totalCount})</CardTitle>
                    <CardDescription>
                        Page {pagination.page} sur {pagination.totalPages}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Commande</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Articles</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Paiement</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <div className="font-medium">#{order.id.slice(-8)}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                {order.user ? (
                                                    <div>
                                                        <div className="font-medium">{order.user.name}</div>
                                                        <div className="text-sm text-muted-foreground">{order.user.email}</div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Client invité</div>
                                                        <div className="text-sm">{order.guestEmail}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div className="text-sm">
                                                {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {order.items.length} article{order.items.length > 1 ? 's' : ''}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <OrderStatusBadge status={order.orderStatus} />
                                    </TableCell>
                                    <TableCell>
                                        <PaymentStatusBadge status={order.paymentStatus} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {(order.totalCents / 100).toLocaleString('fr-FR')}€
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link to={`/admin/orders/${order.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-muted-foreground">
                                Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} sur{' '}
                                {pagination.totalCount} commandes
                            </div>
                            <div className="flex gap-2">
                                {pagination.hasPreviousPage && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set('page', (pagination.page - 1).toString());
                                            setSearchParams(newParams);
                                        }}
                                    >
                                        Précédent
                                    </Button>
                                )}
                                {pagination.hasNextPage && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.set('page', (pagination.page + 1).toString());
                                            setSearchParams(newParams);
                                        }}
                                    >
                                        Suivant
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
