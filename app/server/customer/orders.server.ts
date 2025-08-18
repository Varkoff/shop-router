import type { Prisma } from "generated/prisma/client";
import type z from "zod";
import type { CreateOrderSchema } from "~/routes/_public+/cart";
import { prisma } from "~/server/db.server";

export async function createOrder({
	cartData,
	userId,
}: {
	cartData: z.infer<typeof CreateOrderSchema>;
	userId?: string;
}) {
	const { items: cartItems, guestEmail } = cartData;
	// Validation : il faut soit un userId soit un guestEmail
	if (!userId && !guestEmail) {
		throw new Error("Either userId or guestEmail is required");
	}

	// Validation : le panier ne doit pas être vide
	if (!cartItems || cartItems.length === 0) {
		throw new Error("Cart is empty");
	}

	// Vérifier que tous les produits existent et sont actifs
	const productIds = cartItems.map((item) => item.productId);
	const products = await prisma.product.findMany({
		where: {
			id: { in: productIds },
			isActive: true,
		},
		select: {
			id: true,
			name: true,
			priceCents: true,
			stock: true,
			stripePriceId: true,
		},
	});

	// Vérifier que tous les produits du panier existent
	if (products.length !== productIds.length) {
		const foundIds = products.map((p) => p.id);
		const missingIds = productIds.filter((id) => !foundIds.includes(id));
		throw new Error(`Products not found or inactive: ${missingIds.join(", ")}`);
	}

	// Vérifier le stock et calculer les totaux
	let subtotalCents = 0;
	const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

	for (const cartItem of cartItems) {
		const product = products.find((p) => p.id === cartItem.productId);
		if (!product) {
			throw new Error(`Product ${cartItem.productId} not found`);
		}

		// Vérifier le stock
		if (product.stock < cartItem.quantity) {
			throw new Error(
				`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`,
			);
		}

		const totalPriceCents = product.priceCents * cartItem.quantity;
		subtotalCents += totalPriceCents;

		orderItems.push({
			productId: product.id,
			productName: product.name,
			quantity: cartItem.quantity,
			unitPriceCents: product.priceCents,
			totalPriceCents,
			stripePriceId: product.stripePriceId,
		});
	}

	// Calculer les frais (pour l'instant, pas de taxes ni de frais de livraison)
	const taxCents = 0;
	const shippingCents = 0;
	const totalCents = subtotalCents + taxCents + shippingCents;

	// Créer la commande avec ses items
	const order = await prisma.order.create({
		data: {
			userId,
			guestEmail,
			// shippingAddress,
			// billingAddress,
			subtotalCents,
			taxCents,
			shippingCents,
			totalCents,
			currency: "EUR",
			orderStatus: "DRAFT",
			paymentStatus: "PENDING",
			deliveryStatus: "PENDING",
			items: {
				create: orderItems,
			},
		},
		include: {
			items: true,
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	// Décrémenter le stock des produits
	for (const cartItem of cartItems) {
		await prisma.product.update({
			where: { id: cartItem.productId },
			data: {
				stock: {
					decrement: cartItem.quantity,
				},
			},
		});
	}

	return order;
}

/**
 * Récupère toutes les commandes d'un utilisateur
 */
export async function getUserOrders(userId: string) {
	const orders = await prisma.order.findMany({
		where: {
			userId,
		},
		orderBy: {
			createdAt: "desc",
		},
		include: {
			items: true,
		},
	});

	// Enrichir avec les informations des produits
	const enrichedOrders = await Promise.all(
		orders.map(async (order) => {
			const enrichedItems = await Promise.all(
				order.items.map(async (item) => {
					if (!item.productId) {
						return { ...item, product: null };
					}

					const product = await prisma.product.findUnique({
						where: { id: item.productId },
						include: {
							images: {
								take: 1,
							},
						},
					});

					return { ...item, product };
				}),
			);

			return { ...order, items: enrichedItems };
		}),
	);

	return enrichedOrders;
}

/**
 * Récupère une commande spécifique d'un utilisateur
 */
export async function getUserOrder(userId: string, orderId: string) {
	const order = await prisma.order.findUnique({
		where: {
			id: orderId,
			userId,
		},
		include: {
			items: true,
		},
	});

	if (!order) {
		return null;
	}

	// Enrichir avec les informations des produits
	const enrichedItems = await Promise.all(
		order.items.map(async (item) => {
			if (!item.productId) {
				return { ...item, product: null };
			}

			const product = await prisma.product.findUnique({
				where: { id: item.productId },
				include: {
					images: true,
				},
			});

			return { ...item, product };
		}),
	);

	return { ...order, items: enrichedItems };
}
