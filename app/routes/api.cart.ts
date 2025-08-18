import { parseWithZod } from "@conform-to/zod";
import { data } from "react-router";
import { z } from "zod";
import { getOptionalUser } from "~/server/auth.server";
import {
	addToCart,
	clearCart,
	removeFromCart,
	updateCartQuantity,
} from "~/server/customer/cart.server";
import type { Route } from "./+types/api.cart";

// Schémas Zod pour les actions du panier
const AddToCartSchema = z.object({
	intent: z.literal("add-to-cart"),
	productId: z.string().min(1, "Product ID is required"),
	quantity: z.coerce.number().int().positive("Quantity must be positive"),
});

const RemoveFromCartSchema = z.object({
	intent: z.literal("remove-from-cart"),
	productId: z.string().min(1, "Product ID is required"),
});

const UpdateQuantitySchema = z.object({
	intent: z.literal("update-quantity"),
	productId: z.string().min(1, "Product ID is required"),
	quantity: z.coerce.number().int().min(0, "Quantity must be non-negative"),
});

const ClearCartSchema = z.object({
	intent: z.literal("clear-cart"),
});

export const CartActionSchema = z.discriminatedUnion("intent", [
	AddToCartSchema,
	RemoveFromCartSchema,
	UpdateQuantitySchema,
	ClearCartSchema,
]);

// Actions pour gérer le panier côté serveur
export async function action({ request }: Route.ActionArgs) {
	const user = await getOptionalUser(request);

	if (!user) {
		return data({ error: "User not authenticated" }, { status: 401 });
	}

	const formData = await request.formData();

	const submission = parseWithZod(formData, {
		schema: CartActionSchema,
	});

	if (submission.status !== "success") {
		return data({ result: submission.reply() }, { status: 400 });
	}

	const userId = user.id;

	try {
		switch (submission.value.intent) {
			case "add-to-cart": {
				const { productId, quantity } = submission.value;
				await addToCart({ userId, productId, quantity });
				return data({ success: true });
			}

			case "remove-from-cart": {
				const { productId } = submission.value;
				await removeFromCart({ userId, productId });
				return data({ success: true });
			}

			case "update-quantity": {
				const { productId, quantity } = submission.value;
				await updateCartQuantity({ userId, productId, quantity });
				return data({ success: true });
			}

			case "clear-cart": {
				await clearCart({ userId });
				return data({ success: true });
			}

			default: {
				return data({ error: "Unknown action" }, { status: 400 });
			}
		}
	} catch (error) {
		console.error("Cart action error:", error);

		// Handle specific error messages from cart.server.ts
		if (error instanceof Error) {
			if (
				error.message.includes("not found") ||
				error.message.includes("inactive")
			) {
				return data({ error: error.message }, { status: 404 });
			}
			if (error.message.includes("stock")) {
				return data({ error: error.message }, { status: 400 });
			}
		}

		return data({ error: "Internal server error" }, { status: 500 });
	}
}
