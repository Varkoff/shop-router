import type z from "zod";
import { PrismaClient } from "~/../generated/prisma/client";
import type { SetRoleSchema } from "~/routes/admin+/users+/$userId";

const prisma = new PrismaClient();

export type UserRole = "customer" | "administrator" | "super_administrator";

/**
 * Update user role in database directly
 */
export async function updateUserRole({
	data: { role, userId },
}: {
	data: z.infer<typeof SetRoleSchema>;
}) {
	try {
		await prisma.user.update({
			where: { id: userId },
			data: { role },
		});
		return { success: true };
	} catch (error) {
		console.error("Error updating user role:", error);
		return { success: false, error: "Failed to update role" };
	}
}

/**
 * Get user with role from database
 */
export async function getUserWithRole(userId: string) {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
				emailVerified: true,
				banned: true,
				banReason: true,
				banExpires: true,
			},
		});
		return { success: true, user };
	} catch (error) {
		console.error("Error getting user:", error);
		return { success: false, error: "Failed to get user" };
	}
}

/**
 * List all users with roles from database
 */
export async function getAllUsersWithRoles() {
	try {
		const users = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
				emailVerified: true,
				banned: true,
				banReason: true,
				banExpires: true,
				stripeCustomerId: true,
				// Include customer-specific data
				orders: {
					select: {
						id: true,
						totalCents: true,
						orderStatus: true,
						paymentStatus: true,
						createdAt: true,
					},
					orderBy: { createdAt: "desc" },
				},
				cart: {
					select: {
						id: true,
						updatedAt: true,
						items: {
							select: {
								id: true,
								quantity: true,
								unitPriceCents: true,
							},
						},
					},
				},
				sessions: {
					select: {
						id: true,
						expiresAt: true,
						createdAt: true,
						updatedAt: true,
					},
					orderBy: { updatedAt: "desc" },
					take: 1, // Get most recent session for last login
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Calculate derived customer metrics
		const usersWithMetrics = users.map((user) => {
			const now = new Date();
			const activeSessions = user.sessions.filter(
				(session) => session.expiresAt > now,
			);
			const lastSession = user.sessions[0];
			const totalOrderValue = user.orders.reduce(
				(sum, order) => sum + order.totalCents,
				0,
			);
			const paidOrders = user.orders.filter(
				(order) => order.paymentStatus === "PAID",
			);
			const cartItemsCount =
				user.cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
			const cartValue =
				user.cart?.items.reduce(
					(sum, item) => sum + item.quantity * item.unitPriceCents,
					0,
				) || 0;

			return {
				...user,
				customerMetrics: {
					ordersCount: user.orders.length,
					paidOrdersCount: paidOrders.length,
					totalOrderValueCents: totalOrderValue,
					hasActiveCart: !!user.cart && cartItemsCount > 0,
					cartItemsCount,
					cartValueCents: cartValue,
					hasStripeCustomer: !!user.stripeCustomerId,
					activeSessionsCount: activeSessions.length,
					lastLoginAt: lastSession?.updatedAt || null,
				},
			};
		});

		return { success: true, users: usersWithMetrics };
	} catch (error) {
		console.error("Error listing users:", error);
		return { success: false, error: "Failed to list users" };
	}
}
