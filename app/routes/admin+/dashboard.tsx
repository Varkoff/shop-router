import { Euro, Package, ShoppingCart, Users } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { getDashboardStats } from "~/server/admin/dashboard-stats.server";
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/dashboard";

export async function loader({ request }: Route.LoaderArgs) {
    await requireAdmin(request);

    const stats = await getDashboardStats();
    return { stats };
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
    const { stats } = loaderData;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Vue d'ensemble de votre boutique
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total utilisateurs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totals.users}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total produits</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totals.products}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totals.orders}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totals.revenue.toLocaleString('fr-FR')}€
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Commandes par statut */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En attente</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.ordersByStatus.PENDING || 0}</div>
                        <p className="text-xs text-muted-foreground">commandes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payées</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.ordersByStatus.PAID || 0}</div>
                        <p className="text-xs text-muted-foreground">commandes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Livrées</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.ordersByStatus.FULFILLED || 0}</div>
                        <p className="text-xs text-muted-foreground">commandes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tables des activités récentes */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Dernières commandes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dernières commandes</CardTitle>
                        <CardDescription>
                            Les 5 commandes les plus récentes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Commande</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.recentOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                #{order.id.slice(-8)}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {order.user ? order.user.name : 'Client invité'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {(order.totalCents / 100).toLocaleString('fr-FR')}€
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Derniers utilisateurs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Nouveaux utilisateurs</CardTitle>
                        <CardDescription>
                            Les 5 derniers utilisateurs inscrits
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Inscription</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.recentUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Link
                                                to={`/admin/users/${user.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {user.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
