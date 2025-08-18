import { prisma } from "~/server/db.server";

/**
 * Récupère les statistiques pour le dashboard admin
 */
export async function getDashboardStats() {
	const [
		totalUsers,
		totalProducts,
		totalOrders,
		recentOrders,
		recentUsers,
		pendingOrders,
		paidOrders,
		fulfilledOrders,
		revenue,
	] = await Promise.all([
		// Total utilisateurs
		prisma.user.count(),

		// Total produits
		prisma.product.count(),

		// Total commandes
		prisma.order.count(),

		// 5 dernières commandes
		prisma.order.findMany({
			take: 5,
			orderBy: { createdAt: "desc" },
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
				items: true,
			},
		}),

		// 5 derniers utilisateurs inscrits
		prisma.user.findMany({
			take: 5,
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
			},
		}),

		// Compter les commandes en attente
		prisma.order.count({
			where: { orderStatus: "PENDING" },
		}),

		// Compter les commandes payées
		prisma.order.count({
			where: { orderStatus: "PAID" },
		}),

		// Compter les commandes livrées
		prisma.order.count({
			where: { orderStatus: "FULFILLED" },
		}),

		// Chiffre d'affaires (commandes payées)
		prisma.order.aggregate({
			where: {
				paymentStatus: "PAID",
			},
			_sum: {
				totalCents: true,
			},
		}),
	]);

	// Calcul du chiffre d'affaires en euros
	const totalRevenue = (revenue._sum.totalCents || 0) / 100;

	return {
		totals: {
			users: totalUsers,
			products: totalProducts,
			orders: totalOrders,
			revenue: totalRevenue,
		},
		ordersByStatus: {
			PENDING: pendingOrders,
			PAID: paidOrders,
			FULFILLED: fulfilledOrders,
		},
		recentOrders,
		recentUsers,
	};
}
