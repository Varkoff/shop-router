import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useFetcher } from "react-router";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header";
import { Switch } from "~/components/ui/switch";
import type { adminGetProducts } from "~/server/admin/admin-products.server";
import { ToggleStatusSchema } from "./products.index";

type Product = Awaited<ReturnType<typeof adminGetProducts>>[number];

const ProductStatusToggle = ({ product }: { product: Product }) => {
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";
    const [form, fields] = useForm({
        constraint: getZodConstraint(ToggleStatusSchema),
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: ToggleStatusSchema,
            });
        },
    });

    return (
        <fetcher.Form
            method="POST"
            {...getFormProps(form)}
            style={{ display: "contents" }}
        >
            <input
                {...getInputProps(fields.intent, { type: "hidden" })}
                value="toggle-status"
            />
            <input
                {...getInputProps(fields.productSlug, { type: "hidden" })}
                value={product.slug}
            />
            <Switch
                checked={product.isActive}
                disabled={isSubmitting}
                onClick={(e) => {
                    fetcher.submit(e.currentTarget.form);
                }}
            />
        </fetcher.Form>
    );
};

const ProductDeleteButton = ({ product }: { product: Product }) => {
    const [isOpen, setIsOpen] = useState(false);
    const fetcher = useFetcher();
    const isDeleting = fetcher.state === "submitting";

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    setIsOpen(true);
                }}
                disabled={isDeleting}
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Supprimer</span>
            </Button>

            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le produit "{product.name}" ?
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                const formData = new FormData();
                                formData.set("intent", "delete-product");
                                formData.set("productSlug", product.slug);
                                fetcher.submit(formData, { method: "POST" });
                                setIsOpen(false);
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Suppression..." : "Supprimer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export const adminProductsColumns: ColumnDef<Product>[] = [
    {
        accessorKey: "imageUrl",
        header: "Image",
        cell: ({ row }) => {
            const product = row.original;
            return (
                <button
                    type="button"
                    onClick={() => {
                        window.open(product.imageUrl, "_blank");
                    }}
                    className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
                >
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </button>
            );
        },
    },
    {
        accessorKey: "name",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Name" />;
        },
        cell: ({ row }) => (
            <Link
                to={`/admin/products/${row.original.slug}`}
                className="font-medium hover:underline"
            >
                {row.original.name}
            </Link>
        ),
    },
    {
        accessorKey: "description",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Description" />;
        },
        cell: ({ row }) => {
            const description = row.original.description as string | null;
            return (
                <Link
                    to={`/admin/products/${row.original.slug}`}
                    className="max-w-[200px] truncate block hover:underline"
                >
                    {description || (
                        <span className="text-muted-foreground">No description</span>
                    )}
                </Link>
            );
        },
    },
    {
        accessorKey: "priceCents",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Price" />;
        },
        cell: ({ row }) => {
            const priceCents = row.original.priceCents;
            const formatted = new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
            }).format(priceCents / 100);

            return <div className="font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "stock",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Stock" />;
        },
        cell: ({ row }) => {
            const stock = row.original.stock;
            return (
                <Badge
                    variant={
                        stock > 10 ? "default" : stock > 0 ? "secondary" : "destructive"
                    }
                >
                    {stock}
                </Badge>
            );
        },
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
            return <ProductStatusToggle product={row.original} />;
        },
    },
    {
        accessorKey: "slug",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Slug" />;
        },
        cell: ({ row }) => (
            <Link
                to={`/admin/products/${row.original.slug}`}
                className="font-mono text-xs hover:underline"
            >
                {row.original.slug}
            </Link>
        ),
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const product = row.original;
            return (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/products/${product.slug}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to={`/products/${product.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Voir</span>
                        </Link>
                    </Button>
                    <ProductDeleteButton product={product} />
                </div>
            );
        },
    },
];
