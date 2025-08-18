import { prisma } from "~/server/db.server";

/**
 * Récupère toutes les commandes pour l'admin avec pagination
 */
export async function getAllOrders({
	page = 1,
	limit = 20,
	orderBy = "createdAt",
	orderDirection = "desc" as "asc" | "desc",
} = {}) {
	const skip = (page - 1) * limit;

	const [orders, totalCount] = await Promise.all([
		prisma.order.findMany({
			skip,
			take: limit,
			orderBy: {
				[orderBy]: orderDirection,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						stripeCustomerId: true,
					},
				},
				items: true,
			},
		}),
		prisma.order.count(),
	]);

	// Enrichir avec les informations des produits pour les preview
	const enrichedOrders = await Promise.all(
		orders.map(async (order) => {
			const enrichedItems = await Promise.all(
				order.items.map(async (item) => {
					if (!item.productId) {
						return { ...item, product: null };
					}

					const product = await prisma.product.findUnique({
						where: { id: item.productId },
						select: {
							id: true,
							name: true,
							slug: true,
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

	return {
		orders: enrichedOrders,
		pagination: {
			page,
			limit,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			hasNextPage: page < Math.ceil(totalCount / limit),
			hasPreviousPage: page > 1,
		},
	};
}

/**
 * Récupère une commande spécifique pour l'admin
 */
export async function getOrderForAdmin(orderId: string) {
	const order = await prisma.order.findUnique({
		where: {
			id: orderId,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					stripeCustomerId: true,
					createdAt: true,
				},
			},
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

/**
 * Met à jour le statut d'une commande
 */
export async function updateOrderStatus(
	orderId: string,
	updates: {
		orderStatus?:
			| "DRAFT"
			| "PENDING"
			| "PAID"
			| "FULFILLED"
			| "CANCELED"
			| "REFUNDED";
		paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
		deliveryStatus?:
			| "PENDING"
			| "PROCESSING"
			| "SHIPPED"
			| "DELIVERED"
			| "RETURNED";
	},
) {
	return prisma.order.update({
		where: { id: orderId },
		data: updates,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			items: true,
		},
	});
}

/**
 * Recherche des commandes par critères
 */
export async function searchOrders({
	query,
	status,
	paymentStatus,
	page = 1,
	limit = 20,
}: {
	query?: string;
	status?: string;
	paymentStatus?: string;
	page?: number;
	limit?: number;
} = {}) {
	const skip = (page - 1) * limit;

	const where: Record<string, any> = {};

	// Recherche par email utilisateur, nom ou ID de commande
	if (query) {
		where.OR = [
			{ id: { contains: query, mode: "insensitive" } },
			{ guestEmail: { contains: query, mode: "insensitive" } },
			{
				user: {
					OR: [
						{ email: { contains: query, mode: "insensitive" } },
						{ name: { contains: query, mode: "insensitive" } },
					],
				},
			},
		];
	}

	if (status) {
		where.orderStatus = status;
	}

	if (paymentStatus) {
		where.paymentStatus = paymentStatus;
	}

	const [orders, totalCount] = await Promise.all([
		prisma.order.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						stripeCustomerId: true,
					},
				},
				items: true,
			},
		}),
		prisma.order.count({ where }),
	]);

	// Enrichir avec les informations des produits pour les preview
	const enrichedOrders = await Promise.all(
		orders.map(async (order) => {
			const enrichedItems = await Promise.all(
				order.items.map(async (item) => {
					if (!item.productId) {
						return { ...item, product: null };
					}

					const product = await prisma.product.findUnique({
						where: { id: item.productId },
						select: {
							id: true,
							name: true,
							slug: true,
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

	return {
		orders: enrichedOrders,
		pagination: {
			page,
			limit,
			totalCount,
			totalPages: Math.ceil(totalCount / limit),
			hasNextPage: page < Math.ceil(totalCount / limit),
			hasPreviousPage: page > 1,
		},
	};
}
