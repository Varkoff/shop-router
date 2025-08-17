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
			},
			orderBy: { createdAt: "desc" },
		});
		return { success: true, users };
	} catch (error) {
		console.error("Error listing users:", error);
		return { success: false, error: "Failed to list users" };
	}
}
