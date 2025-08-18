import { Polar } from "@polar-sh/sdk";
import { env } from "./env.server";

// Initialize Polar SDK
export const polar = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: "sandbox",
});

export interface CreateCheckoutRequest {
	productPriceId: string;
	successUrl: string;
	customerEmail?: string;
	metadata?: Record<string, string>;
}

/**
 * Create a new product in Polar with duplicate check
 */
export async function createPolarProduct(data: {
	name: string;
	description?: string;
	price: {
		currency: string;
		amount: number; // Amount in cents
		isRecurring?: boolean;
		recurringInterval?: "month" | "year";
	};
}) {
	try {
		// Double check: vérifier si un produit avec ce nom existe déjà dans l'organisation
		const existingProducts = await polar.products.list({
			organizationId: env.POLAR_ORGANIZATION_ID,
			query: data.name,
			limit: 25,
		});

		if (existingProducts && existingProducts.result.items.length > 0) {
			const existingProduct = existingProducts.result.items.find(
				(product) =>
					product.name.trim().toLowerCase() === data.name.trim().toLowerCase(),
			);

			if (existingProduct) {
				return {
					success: false,
					error: `Un produit avec le nom "${data.name}" existe déjà sur Polar`,
					existingProduct,
				};
			}
		}

		const result = await polar.products.create({
			name: data.name,
			description: data.description,
			recurringInterval: null,
			prices: [
				{
					amountType: "fixed",
					priceAmount: data.price.amount,
					priceCurrency: "usd", // Polar n'accepte que USD
				},
			],
			organizationId: env.POLAR_ORGANIZATION_ID,
		});

		return { success: true, product: result };
	} catch (error) {
		console.error("Error creating Polar product:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create product",
		};
	}
}

/**
 * Update an existing product in Polar
 */
export async function updatePolarProduct(
	productId: string,
	data: {
		name?: string;
		description?: string;
	},
) {
	try {
		const result = await polar.products.update({
			id: productId,
			productUpdate: {
				name: data.name,
				description: data.description,
			},
		});

		return { success: true, product: result };
	} catch (error) {
		console.error("Error updating Polar product:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update product",
		};
	}
}

/**
 * Archive a product from Polar (equivalent to delete)
 */
export async function archivePolarProduct(productId: string) {
	try {
		// Polar might not have a delete method, try updating to archived status
		const result = await polar.products.update({
			id: productId,
			productUpdate: {
				isArchived: true,
			},
		});
		return { success: true, product: result };
	} catch (error) {
		console.error("Error archiving Polar product:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to archive product",
		};
	}
}

/**
 * Update price for an existing product in Polar by recreating the product
 * This is a simplified approach that ensures price changes are properly handled
 */
export async function updatePolarProductPrice(
	productId: string,
	productData: {
		name: string;
		description?: string;
		amount: number;
		currency: string;
	},
) {
	try {
		// Lire produit pour comparer le prix
		const current = await getPolarProduct(productId);
		if (!current.success || !current.product) {
			return {
				success: false,
				error: "Could not fetch current product from Polar",
			};
		}

		const currentPrice = current.product.prices?.[0];
		let currentAmount: number | null = null;

		if (currentPrice) {
			// Handle different price types from Polar API
			if (
				"priceAmount" in currentPrice &&
				typeof currentPrice.priceAmount === "number"
			) {
				currentAmount = currentPrice.priceAmount;
			} else if (
				"amount" in currentPrice &&
				typeof currentPrice.amount === "number"
			) {
				currentAmount = currentPrice.amount;
			}
		}

		if (currentAmount === productData.amount) {
			// Mettre à jour uniquement name/description
			const upd = await polar.products.update({
				id: productId,
				productUpdate: {
					name: productData.name,
					description: productData.description,
				},
			});
			return {
				success: true,
				product: upd,
				skipped: true,
				message: "Price unchanged",
			};
		}

		// Mettre à jour le prix via products.update (pas d'archivage produit)
		const updated = await polar.products.update({
			id: productId,
			productUpdate: {
				name: productData.name,
				description: productData.description,
				prices: [
					{
						amountType: "fixed",
						priceAmount: productData.amount,
						priceCurrency: "usd",
					},
				],
			},
		});

		return { success: true, product: updated, message: "Price updated" };
	} catch (error) {
		console.error("Error updating Polar product price:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to update product price",
		};
	}
}

/**
 * Get a product from Polar
 */
export async function getPolarProduct(productId: string) {
	try {
		const result = await polar.products.get({ id: productId });
		return { success: true, product: result };
	} catch (error) {
		console.error("Error fetching Polar product:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to fetch product",
		};
	}
}

/**
 * Create a checkout session
 */
export async function createCheckoutSession(data: CreateCheckoutRequest) {
	try {
		const result = await polar.checkouts.create({
			// checkoutCreate: {
			// 	productPriceId: data.productPriceId,
			// 	successUrl: data.successUrl,
			// 	customerEmail: data.customerEmail,
			// 	metadata: data.metadata,
			// },
			products: [data.productPriceId],
			successUrl: data.successUrl,
			customerEmail: data.customerEmail,
			metadata: data.metadata,
		});

		return { success: true, checkout: result };
	} catch (error) {
		console.error("Error creating checkout session:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to create checkout session",
		};
	}
}

/**
 * Get checkout session
 */
export async function getCheckoutSession(checkoutId: string) {
	try {
		const result = await polar.checkouts.get({ id: checkoutId });
		return { success: true, checkout: result };
	} catch (error) {
		console.error("Error fetching checkout session:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to fetch checkout session",
		};
	}
}

/**
 * Create or get customer
 */
export async function createOrGetCustomer(email: string, name?: string) {
	try {
		// Try to find existing customer first
		const customers = await polar.customers.list({
			email: email,
			limit: 1,
		});

		// Check if customer exists
		if (customers && customers.result.items.length > 0) {
			return { success: true, customer: customers.result.items[0] };
		}

		// Create new customer
		const result = await polar.customers.create({
			email: email,
			name: name,
		});

		return { success: true, customer: result };
	} catch (error) {
		console.error("Error creating/fetching customer:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to create/fetch customer",
		};
	}
}

/**
 * List orders for a customer
 */
export async function getCustomerOrders(customerId: string) {
	try {
		const result = await polar.orders.list({
			customerId: customerId,
		});

		return { success: true, orders: result };
	} catch (error) {
		console.error("Error fetching customer orders:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to fetch orders",
		};
	}
}

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
): boolean {
	try {
		// Polar uses HMAC-SHA256 for webhook verification
		const crypto = require("crypto");
		const expectedSignature = crypto
			.createHmac("sha256", secret)
			.update(payload)
			.digest("hex");

		return crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(expectedSignature),
		);
	} catch (error) {
		console.error("Error verifying webhook signature:", error);
		return false;
	}
}

/**
 * Process webhook events
 */
export async function processWebhookEvent(event: Record<string, unknown>) {
	try {
		switch (event.type) {
			case "checkout.completed":
				// Handle successful checkout
				console.log("Checkout completed:", event.data);
				break;

			case "order.created":
				// Handle order creation
				console.log("Order created:", event.data);
				break;

			case "subscription.created":
				// Handle subscription creation
				console.log("Subscription created:", event.data);
				break;

			case "subscription.cancelled":
				// Handle subscription cancellation
				console.log("Subscription cancelled:", event.data);
				break;

			default:
				console.log("Unhandled event type:", event.type);
		}

		return { success: true };
	} catch (error) {
		console.error("Error processing webhook event:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to process webhook event",
		};
	}
}
