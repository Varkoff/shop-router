import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Shield, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header";
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

type User = NonNullable<Awaited<ReturnType<typeof listUsers>>["users"]>[number];

export const adminUsersColumns: ColumnDef<User>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Nom" />;
        },
        cell: ({ row }) => (
            <div className="font-medium">{row.original.name}</div>
        ),
    },
    {
        accessorKey: "email",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Email" />;
        },
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate">{row.original.email}</div>
        ),
    },
    {
        accessorKey: "role",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Rôle" />;
        },
        cell: ({ row }) => {
            const user = row.original;
            return (
                <Badge
                    variant={getRoleBadgeVariant(user.role || "customer")}
                    className="flex items-center gap-1 w-fit"
                >
                    {getRoleIcon(user.role || "customer")}
                    {user.role === "super_administrator" ? "Super Admin" :
                        user.role === "administrator" ? "Admin" : "Customer"}
                </Badge>
            );
        },
    },
    {
        accessorKey: "emailVerified",
        header: "Email vérifié",
        cell: ({ row }) => {
            return row.original.emailVerified ? (
                <Badge variant="default">Vérifié</Badge>
            ) : (
                <Badge variant="secondary">Non vérifié</Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Créé le" />;
        },
        cell: ({ row }) => {
            return new Date(row.original.createdAt).toLocaleDateString("fr-FR");
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const user = row.original;
            return (
                <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/users/${user.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Éditer
                    </Link>
                </Button>
            );
        },
    },
];
