import type { ColumnDef } from "@tanstack/react-table";
import {
    Activity,
    CreditCard,
    ExternalLink,
    Package,
    Shield,
    ShieldCheck,
    ShoppingCart,
    User
} from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import type { listUsers } from "~/server/admin/admin-users.server";




const getRoleIcon = (role: string) => {
    switch (role) {
        case "super_administrator":
            return <ShieldCheck className="size-4" />;
        case "administrator":
            return <Shield className="size-4" />;
        case "customer":
        default:
            return null;
    }
};

const getRoleBadgeVariant = (role: string) => {
    switch (role) {
        case "super_administrator":
            return "destructive" as const;
        case "administrator":
            return "default" as const;
        case "customer":
        default:
            return "secondary" as const;
    }
};

const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(cents / 100);
};

const formatLastLogin = (date: string | Date | null) => {
    if (!date) return "Jamais";

    const loginDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - loginDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return loginDate.toLocaleDateString("fr-FR");
};

type UserType = NonNullable<Awaited<ReturnType<typeof listUsers>>["users"]>[number];

export const createAdminUsersColumns = (currentUserId?: string): ColumnDef<UserType>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Client" />;
        },
        cell: ({ row }) => {
            const user = row.original;
            const isCurrentUser = user.id === currentUserId;
            return (
                <div className={`space-y-1 ${isCurrentUser ? 'p-2 bg-blue-50 border border-blue-200 rounded-md' : ''}`}>
                    <div className={`font-medium flex items-center gap-2 ${isCurrentUser ? 'text-blue-900' : ''}`}>
                        {user.name}
                        {isCurrentUser && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <User className="size-3 text-blue-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Utilisateur connecté</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <div className={`text-sm max-w-[200px] truncate ${isCurrentUser ? 'text-blue-700' : 'text-muted-foreground'}`}>
                        {user.email}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "role",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Rôle" />;
        },
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="space-y-1">
                    <Badge
                        variant={getRoleBadgeVariant(user.role || "customer")}
                        className="flex items-center gap-1 w-fit"
                    >
                        {getRoleIcon(user.role || "customer")}
                        {user.role === "super_administrator" ? "Super Admin" :
                            user.role === "administrator" ? "Admin" : "Customer"}
                    </Badge>
                    {user.emailVerified ? (
                        <Badge variant="outline" className="text-xs">Vérifié</Badge>
                    ) : (
                        <Badge variant="secondary" className="text-xs">Non vérifié</Badge>
                    )}
                </div>
            );
        },
    },
    {
        id: "orders",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Commandes" />;
        },
        cell: ({ row }) => {
            const user = row.original;
            const metrics = user.customerMetrics;

            if (!metrics) {
                return <div className="text-muted-foreground">-</div>;
            }

            return (
                <TooltipProvider>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Package className="size-3" />
                            <span className="font-medium">{metrics.ordersCount}</span>
                            {metrics.paidOrdersCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                    {metrics.paidOrdersCount} payées
                                </Badge>
                            )}
                        </div>
                        {metrics.totalOrderValueCents > 0 && (
                            <div className="text-sm text-muted-foreground">
                                {formatCurrency(metrics.totalOrderValueCents)}
                            </div>
                        )}
                    </div>
                </TooltipProvider>
            );
        },
    },
    {
        id: "cart",
        header: "Panier",
        cell: ({ row }) => {
            const user = row.original;
            const metrics = user.customerMetrics;

            if (!metrics) {
                return <div className="text-muted-foreground">-</div>;
            }

            if (!metrics.hasActiveCart) {
                return <div className="text-muted-foreground text-sm">Vide</div>;
            }

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="size-3 text-orange-500" />
                                    <span className="font-medium">{metrics.cartItemsCount}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatCurrency(metrics.cartValueCents)}
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Panier actif avec {metrics.cartItemsCount} articles</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        id: "stripe",
        header: "Stripe",
        cell: ({ row }) => {
            const user = row.original;
            const metrics = user.customerMetrics;

            if (!metrics) {
                return <div className="text-muted-foreground">-</div>;
            }

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                <CreditCard className={`size-3 ${metrics.hasStripeCustomer ? 'text-green-500' : 'text-muted-foreground'}`} />
                                {metrics.hasStripeCustomer ? (
                                    <Badge variant="outline" className="text-xs">Configuré</Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Non</span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{metrics.hasStripeCustomer ? 'Client Stripe configuré' : 'Pas de client Stripe'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        id: "activity",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Activité" />;
        },
        cell: ({ row }) => {
            const user = row.original;
            const metrics = user.customerMetrics;

            if (!metrics) {
                return <div className="text-muted-foreground">-</div>;
            }

            return (
                <TooltipProvider>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Activity className={`size-3 ${metrics.activeSessionsCount > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                            {metrics.activeSessionsCount > 0 ? (
                                <Badge variant="outline" className="text-xs">En ligne</Badge>
                            ) : (
                                <span className="text-xs text-muted-foreground">Hors ligne</span>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {formatLastLogin(metrics.lastLoginAt)}
                        </div>
                    </div>
                </TooltipProvider>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Inscrit le" />;
        },
        cell: ({ row }) => {
            return (
                <div className="text-sm">
                    {new Date(row.original.createdAt).toLocaleDateString("fr-FR")}
                </div>
            );
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const user = row.original;
            const isCurrentUser = user.id === currentUserId;
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to={`/admin/users/${user.id}`}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {isCurrentUser ? "Voir profil" : "Voir détails"}
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isCurrentUser ? "Voir votre profil" : `Voir les détails de ${user.name}`}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
];

// Legacy export for backward compatibility
export const adminUsersColumns = createAdminUsersColumns();
