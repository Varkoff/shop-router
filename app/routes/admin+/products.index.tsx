import { parseWithZod } from '@conform-to/zod';
import { data, Link } from "react-router";
import { z } from 'zod';
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import { adminGetProducts, deleteProduct, toggleProductStatus } from '~/server/admin/admin-products.server';
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/products.index";
import { adminProductsColumns } from "./admin-products-columns";

const ToggleStatusSchema = z.object({
    intent: z.literal("toggle-status"),
    productSlug: z.string().min(1, "Product slug is required"),
});

const DeleteProductSchema = z.object({
    intent: z.literal("delete-product"),
    productSlug: z.string().min(1, "Product slug is required"),
});

export const ActionSchema = z.discriminatedUnion("intent", [
    ToggleStatusSchema,
    DeleteProductSchema,
]);

// Export individual schemas for components
export { ToggleStatusSchema };

export async function loader({ request }: Route.LoaderArgs) {
    await requireAdmin(request);

    const products = await adminGetProducts();
    return { products };
}

export async function action({ request }: Route.ActionArgs) {
    // Require authentication for actions too
    await requireAdmin(request);
    const formData = await request.formData();

    const submission = parseWithZod(formData, {
        schema: ActionSchema,
    });

    if (submission.status !== 'success') {
        return data(
            { result: submission.reply() },
            { status: 400 }
        );
    }


    switch (submission.value.intent) {
        case "toggle-status": {
            try {
                await toggleProductStatus(submission.value.productSlug);
                return data({ result: submission.reply(), success: true });
            } catch {
                return data(
                    {
                        result: submission.reply({
                            formErrors: ['Failed to toggle product status'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case "delete-product": {
            try {
                await deleteProduct(submission.value.productSlug);
                return data({ result: submission.reply(), success: true });
            } catch {
                return data(
                    {
                        result: submission.reply({
                            formErrors: ['Failed to delete product'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        default: {
            return data({ result: null }, { status: 400 });
        }
    }
}

export default function ProductsPage({ loaderData }: Route.ComponentProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-muted-foreground">
                        Manage your product inventory and details.
                    </p>
                </div>
                <Button asChild>
                    <Link to="/admin/products/new">
                        Créer un produit
                    </Link>
                </Button>
            </div>
            <DataTable
                columns={adminProductsColumns}
                data={loaderData.products}
                searchPlaceholder="Search products..."
            />
        </div>
    );
}