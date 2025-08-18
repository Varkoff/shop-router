import { AlertTriangle, BarChart3, Image, LogOut, Package, RefreshCw, ShoppingCart, Users } from "lucide-react";
import { data, Link, Outlet, useLocation } from "react-router";
import { GeneralErrorBoundary } from "~/components/error-boundary";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger
} from "~/components/ui/sidebar";
import { signOut } from "~/lib/auth-client";
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/_adminLayout";

export async function loader({ request }: Route.LoaderArgs) {
    await requireAdmin(request);
    return data(null)
}

const adminLinks = [
    {
        to: "/admin/dashboard",
        label: "Dashboard",
        icon: BarChart3
    },
    {
        to: "/admin/products",
        label: "Products",
        icon: Package
    },
    {
        to: "/admin/library",
        label: "Library",
        icon: Image
    },
    {
        to: "/admin/users",
        label: "Customers",
        icon: Users
    },
    {
        to: "/admin/orders",
        label: "Orders",
        icon: ShoppingCart
    }
];

export const AdminSidebar = () => {
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <h2 className="text-lg font-semibold px-2">Admin Panel</h2>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminLinks.map((link) => {
                                const IconComponent = link.icon;
                                const isActive = location.pathname === link.to;

                                return (
                                    <SidebarMenuItem key={link.to}>
                                        <SidebarMenuButton asChild isActive={isActive}>
                                            <Link to={link.to}>
                                                <IconComponent className="size-4" />
                                                <span>{link.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={handleSignOut} className="text-red-600 hover:text-red-700">
                                    <LogOut className="size-4" />
                                    <span>Déconnexion</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

export default function AdminLayout() {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <h1 className="text-xl font-semibold">Administration</h1>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export function ErrorBoundary() {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <h1 className="text-xl font-semibold text-destructive">Administration - Erreur</h1>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <GeneralErrorBoundary
                        defaultStatusHandler={({ error }) => (
                            <Card className="border-destructive">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="size-5" />
                                        Erreur d'administration
                                    </CardTitle>
                                    <CardDescription>
                                        Une erreur s'est produite dans le panel d'administration
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Alert variant="destructive">
                                        <AlertTriangle className="size-4" />
                                        <AlertTitle>Erreur {error.status}</AlertTitle>
                                        <AlertDescription>
                                            {error.data || "Une erreur inattendue s'est produite"}
                                        </AlertDescription>
                                    </Alert>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => window.location.reload()}
                                            className="flex items-center gap-2"
                                        >
                                            <RefreshCw className="size-4" />
                                            Recharger
                                        </Button>
                                        <Button asChild>
                                            <Link to="/admin">
                                                Retour au tableau de bord
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        statusHandlers={{
                            404: ({ error }) => (
                                <Card className="border-orange-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-orange-600">
                                            <AlertTriangle className="size-5" />
                                            Page admin introuvable
                                        </CardTitle>
                                        <CardDescription>
                                            La page d'administration demandée n'existe pas
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Alert className="border-orange-200">
                                            <AlertTriangle className="size-4" />
                                            <AlertTitle>Erreur 404</AlertTitle>
                                            <AlertDescription>
                                                {error.data || "Cette page d'administration n'a pas été trouvée"}
                                            </AlertDescription>
                                        </Alert>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <Button variant="outline" asChild>
                                                <Link to="/admin/products">
                                                    <Package className="size-4 mr-2" />
                                                    Produits
                                                </Link>
                                            </Button>
                                            <Button variant="outline" asChild>
                                                <Link to="/admin/users">
                                                    <Users className="size-4 mr-2" />
                                                    Utilisateurs
                                                </Link>
                                            </Button>
                                            <Button variant="outline" asChild>
                                                <Link to="/admin/orders">
                                                    <ShoppingCart className="size-4 mr-2" />
                                                    Commandes
                                                </Link>
                                            </Button>
                                            <Button asChild>
                                                <Link to="/admin">
                                                    Tableau de bord
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ),
                            403: ({ error }) => (
                                <Card className="border-red-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-red-600">
                                            <AlertTriangle className="size-5" />
                                            Accès refusé
                                        </CardTitle>
                                        <CardDescription>
                                            Vous n'avez pas les permissions nécessaires
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Alert variant="destructive">
                                            <AlertTriangle className="size-4" />
                                            <AlertTitle>Erreur 403</AlertTitle>
                                            <AlertDescription>
                                                {error.data || "Accès non autorisé à cette ressource administrative"}
                                            </AlertDescription>
                                        </Alert>
                                        <Button asChild>
                                            <Link to="/admin">
                                                Retour au tableau de bord
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        }}
                        unexpectedErrorHandler={(error) => (
                            <Card className="border-destructive">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="size-5" />
                                        Erreur système
                                    </CardTitle>
                                    <CardDescription>
                                        Une erreur technique inattendue s'est produite
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Alert variant="destructive">
                                        <AlertTriangle className="size-4" />
                                        <AlertTitle>Erreur interne</AlertTitle>
                                        <AlertDescription>
                                            {error instanceof Error ? error.message : "Erreur technique non identifiée"}
                                        </AlertDescription>
                                    </Alert>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => window.location.reload()}
                                            className="flex items-center gap-2"
                                        >
                                            <RefreshCw className="size-4" />
                                            Recharger
                                        </Button>
                                        <Button asChild>
                                            <Link to="/admin">
                                                Retour au tableau de bord
                                            </Link>
                                        </Button>
                                    </div>
                                    {import.meta.env.DEV && error instanceof Error && error.stack && (
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium">
                                                Détails techniques (dev)
                                            </summary>
                                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                                {error.stack}
                                            </pre>
                                        </details>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}