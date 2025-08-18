import { Stripe } from "stripe";
import { adminGetProduct } from "./admin/admin-products.server";
import type { getOptionalUser } from "./auth.server";
import type { createOrder } from "./customer/orders.server";
import { prisma } from "./db.server";

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-07-30.basil",
});

type ProductData = {
	id: string;
	name: string;
	description: string | null;
	priceCents: number;
	currency: string;
	stripeProductId: string | null;
	stripePriceId: string | null;
	images: { url: string }[];
};

async function syncStripePrice(product: ProductData): Promise<Stripe.Price> {
	if (!product.stripeProductId) {
		throw new Error("Product must have a Stripe product ID to sync price");
	}

	if (!product.stripePriceId) {
		// Create new price
		const newPrice = await stripe.prices.create({
			product: product.stripeProductId,
			unit_amount: product.priceCents,
			currency: product.currency.toLowerCase(),
			nickname: `${product.name} - ${product.currency}`,
			metadata: {
				productId: product.id,
			},
		});

		// Update local product with price ID
		await prisma.product.update({
			where: { id: product.id },
			data: { stripePriceId: newPrice.id },
		});

		return newPrice;
	}

	// ! Le prix existe
	// Get existing price to check if amount or currency changed
	const existingPrice = await stripe.prices.retrieve(product.stripePriceId);
	const hasPriceChanged =
		existingPrice.unit_amount !== product.priceCents ||
		existingPrice.currency !== product.currency.toLowerCase();

	if (!hasPriceChanged) {
		// Just update metadata and nickname
		return await stripe.prices.update(product.stripePriceId, {
			nickname: `${product.name} - ${product.currency}`,
			metadata: {
				productId: product.id,
			},
		});
	}

	// Archive old price and create new one
	await stripe.prices.update(product.stripePriceId, {
		active: false,
	});
	// then delete the old price

	const newPrice = await stripe.prices.create({
		product: product.stripeProductId,
		unit_amount: product.priceCents,
		currency: product.currency.toLowerCase(),
		nickname: `${product.name} - ${product.currency}`,
		metadata: {
			productId: product.id,
		},
	});

	// Update local product with new price ID
	await prisma.product.update({
		where: { id: product.id },
		data: { stripePriceId: newPrice.id },
	});

	return newPrice;
}

async function updateStripeProductData(
	product: ProductData,
): Promise<Stripe.Product> {
	if (!product.stripeProductId) {
		throw new Error("Product must have a Stripe product ID to update");
	}

	const imageUrls = product.images.map((image) => image.url);

	return await stripe.products.update(product.stripeProductId, {
		name: product.name,
		description: product.description || undefined,
		images: imageUrls,
	});
}

export async function syncProductWithStripe(productId: string) {
	console.log("Syncing product with Stripe", productId);
	const product = await adminGetProduct({ productId });

	if (!product) {
		throw new Error("Product not found");
	}

	// Check if product already has a Stripe ID
	if (product.stripeProductId) {
		// Update existing Stripe product and price
		const stripeProduct = await updateStripeProductData(product);
		const stripePrice = await syncStripePrice(product);

		return {
			success: true,
			action: "updated",
			stripeProduct,
			stripePrice,
		};
	}

	// Search for existing Stripe product by name
	const existingProducts = await stripe.products.search({
		query: `name:"${product.name}"`,
		limit: 1,
	});

	if (existingProducts.data.length > 0) {
		// Link existing Stripe product
		const stripeProduct = existingProducts.data[0];

		// Update local product with Stripe product ID
		await prisma.product.update({
			where: { id: productId },
			data: { stripeProductId: stripeProduct.id },
		});

		// Update product data with our local info
		const updatedProduct = { ...product, stripeProductId: stripeProduct.id };
		const updatedStripeProduct = await updateStripeProductData(updatedProduct);
		const stripePrice = await syncStripePrice(updatedProduct);

		return {
			success: true,
			action: "linked",
			stripeProduct: updatedStripeProduct,
			stripePrice,
		};
	}

	// Create new Stripe product
	const imageUrls = product.images.map((image) => image.url);

	const stripeProduct = await stripe.products.create({
		name: product.name,
		description: product.description || undefined,
		images: imageUrls,
		metadata: {
			productId: product.id,
		},
	});

	// Update local product with Stripe product ID
	await prisma.product.update({
		where: { id: productId },
		data: { stripeProductId: stripeProduct.id },
	});

	// Create price using the helper function
	const updatedProduct = { ...product, stripeProductId: stripeProduct.id };
	const stripePrice = await syncStripePrice(updatedProduct);

	return {
		success: true,
		action: "created",
		stripeProduct,
		stripePrice,
	};
}

export async function updateStripeProduct(productId: string) {
	const product = await adminGetProduct({ productId });

	if (!product || !product.stripeProductId) {
		return null;
	}

	try {
		// Update both product and price using helper functions
		const stripeProduct = await updateStripeProductData(product);
		const stripePrice = await syncStripePrice(product);

		return { stripeProduct, stripePrice };
	} catch (error) {
		console.error("Failed to update Stripe product:", error);
		return null;
	}
}

export async function deleteStripeProduct(productId: string) {
	const product = await adminGetProduct({ productId });

	if (!product || !product.stripeProductId) {
		return null;
	}

	try {
		// Get all prices for this product
		const prices = await stripe.prices.list({
			product: product.stripeProductId,
			limit: 100, // Get all prices
		});

		// Archive all prices first
		for (const price of prices.data) {
			if (price.active) {
				await stripe.prices.update(price.id, {
					active: false,
				});
			}
		}

		// Now archive the product instead of deleting it
		// Stripe doesn't allow deleting products with user-created prices
		await stripe.products.update(product.stripeProductId, {
			active: false,
		});

		return { success: true, action: "archived" };
	} catch (error) {
		console.error("Failed to archive Stripe product:", error);
		return null;
	}
}

// Fonction pour créer une session Stripe Checkout
export async function createStripeCheckoutSession({
	order,
	user,
	guestEmail,
	successUrl,
	cancelUrl,
}: {
	order: Awaited<ReturnType<typeof createOrder>>;
	user?: Awaited<ReturnType<typeof getOptionalUser>>;
	guestEmail?: string;
	successUrl: string;
	cancelUrl: string;
}) {
	// Préparer les line items pour Stripe
	const lineItems = await Promise.all(
		order.items.map(async (item) => {
			// Vérifier que le productId existe
			if (!item.productId) {
				throw new Error(`Product ID is missing for item ${item.productName}`);
			}

			// Récupérer le produit pour obtenir le stripePriceId
			const product = await prisma.product.findUnique({
				where: { id: item.productId },
				select: { stripePriceId: true, name: true },
			});

			if (!product?.stripePriceId) {
				throw new Error(
					`Product ${item.productName} doesn't have a Stripe price ID`,
				);
			}

			return {
				price: product.stripePriceId,
				quantity: item.quantity,
			};
		}),
	);

	// // Gérer le customer Stripe
	// let customerId = user?.stripeCustomerId;

	// // Si l'utilisateur n'a pas de customer Stripe, en créer un
	// if (user && !customerId) {
	// 	const customer = await stripe.customers.create({
	// 		email: user.email,
	// 		name: user.name || undefined,
	// 		metadata: {
	// 			userId: user.id,
	// 		},
	// 	});

	// 	// Mettre à jour l'utilisateur avec le customer ID
	// 	await prisma.user.update({
	// 		where: { id: user.id },
	// 		data: { stripeCustomerId: customer.id },
	// 	});

	// 	customerId = customer.id;
	// }

	// Créer la session Stripe
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ["card"],
		line_items: lineItems,
		mode: "payment",
		success_url: successUrl,
		cancel_url: cancelUrl,
		billing_address_collection: "required",
		shipping_address_collection: {
			allowed_countries: ["FR", "BE", "LU", "CH", "IT", "ES", "DE", "NL"],
		},
		customer: user?.stripeCustomerId || undefined,
		customer_creation: user?.stripeCustomerId ? undefined : "always",
		customer_email: user?.stripeCustomerId
			? undefined
			: user?.email || guestEmail,
		metadata: {
			orderId: order.id,
			userId: user?.id || "",
			isGuest: user ? "false" : "true",
		},
	});

	// Mettre à jour la commande avec l'ID de la session Stripe
	await prisma.order.update({
		where: { id: order.id },
		data: {
			stripeCheckoutSession: session.id,
			paymentStatus: "PENDING",
		},
	});

	return session;
}
