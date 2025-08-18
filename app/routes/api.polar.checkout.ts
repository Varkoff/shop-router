import { parseWithZod } from "@conform-to/zod";
import { data, redirect } from "react-router";
import { z } from "zod";
import { requireUser } from "~/server/auth.server";
import { createCheckoutSession } from "~/server/polar.server";
import { getProductById } from "~/server/products.server";
import type { Route } from "./+types/api.polar.checkout";

const CreateCheckoutSchema = z.object({
	intent: z.literal("create-checkout"),
	cartItems: z.array(
		z.object({
			productId: z.string(),
			quantity: z.number().int().min(1),
			unitPriceCents: z.number().int().min(0),
		}),
	),
});

export async function action({ request }: Route.ActionArgs) {
	const user = await requireUser(request);
	const formData = await request.formData();

	const submission = parseWithZod(formData, {
		schema: CreateCheckoutSchema,
	});

	if (submission.status !== "success") {
		return data(
			{
				error: "Invalid request data",
				result: submission.reply(),
			},
			{ status: 400 },
		);
	}

	const { cartItems } = submission.value;

	try {
		// For now, we'll create individual checkout sessions for each item
		// In a real-world scenario, you might want to create a bundle or handle multiple items differently
		if (cartItems.length === 0) {
			return data({ error: "Cart is empty" }, { status: 400 });
		}

		// For simplicity, we'll create a checkout for the first item
		// You can modify this logic to handle multiple items as needed
		const firstItem = cartItems[0];

		// Get the product details to ensure it has Polar integration
		const productResult = await getProductById({
			productId: firstItem.productId,
		});

		if (!productResult.product) {
			return data({ error: "Product not found" }, { status: 404 });
		}

		const product = productResult.product;

		// Check if product has Polar integration
		if (!product.polarProductId || !product.polarPriceId) {
			return data(
				{
					error: "Product not synchronized with Polar. Please contact support.",
				},
				{ status: 400 },
			);
		}

		// Create checkout session
		const checkoutResult = await createCheckoutSession({
			productPriceId: product.polarPriceId,
			successUrl: `${new URL(request.url).origin}/checkout/success?session_id={CHECKOUT_ID}`,
			customerEmail: user.email,
			metadata: {
				userId: user.id,
				productId: product.id,
				quantity: firstItem.quantity.toString(),
			},
		});

		if (!checkoutResult.success) {
			console.error("Failed to create checkout session:", checkoutResult.error);
			return data(
				{
					error: "Failed to create checkout session. Please try again.",
				},
				{ status: 500 },
			);
		}

		// Redirect to Polar checkout
		return redirect(checkoutResult.checkout?.url || "/");
	} catch (error) {
		console.error("Checkout creation error:", error);
		return data(
			{
				error: "An unexpected error occurred. Please try again.",
			},
			{ status: 500 },
		);
	}
}
