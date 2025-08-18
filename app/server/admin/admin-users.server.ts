import type z from "zod";
import type {
	// BanUserSchema, // COMMENTED OUT - not needed
	SetRoleSchema,
	UpdateUserSchema,
	VerifyEmailSchema,
} from "~/routes/admin+/users+/$userId";
import type { CreateUserSchema } from "~/routes/admin+/users+/index";
import { auth } from "../auth.server";
import { prisma } from "../db.server";
import {
	getAllUsersWithRoles,
	getUserWithRole,
	updateUserRole,
} from "./roles.server";

interface BetterAuthError extends Error {
	body?: {
		code?: string;
		message?: string;
	};
	status?: string;
	statusCode?: number;
}

/**
 * Lists all users (admin only)
 */
export async function listUsers() {
	try {
		// Use our custom role system to get users with proper roles
		const result = await getAllUsersWithRoles();
		return result;
	} catch (error) {
		console.error("Error listing users:", error);
		return { success: false, error: "Failed to list users" };
	}
}

/**
 * Get a single user by ID (admin only)
 */
export async function getUser(userId: string) {
	try {
		const result = await getUserWithRole(userId);
		return result;
	} catch (error) {
		console.error("Error getting user:", error);
		return { success: false, error: "Failed to get user" };
	}
}

/**
 * Get user sessions (admin only)
 */
export async function getUserSessions(userId: string) {
	try {
		// Get sessions directly from database for more detailed information
		const sessions = await prisma.session.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				token: true,
				expiresAt: true,
				createdAt: true,
				updatedAt: true,
				ipAddress: true,
				userAgent: true,
				impersonatedBy: true,
			},
		});
		return { success: true, sessions };
	} catch (error) {
		console.error("Error getting user sessions:", error);
		return { success: false, error: "Failed to get user sessions" };
	}
}

/**
 * Create a new user (admin only)
 */
export async function createUser({
	data,
}: {
	data: z.infer<typeof CreateUserSchema>;
}) {
	try {
		// Map our custom roles to Better Auth roles for authentication
		const betterAuthRole =
			data.role === "administrator" || data.role === "super_administrator"
				? "admin"
				: "user";

		const result = await auth.api.createUser({
			body: {
				email: data.email,
				password: data.password,
				name: data.name,
				role: betterAuthRole,
			},
		});

		// Update the role to our custom role system
		if (data.role && result.user) {
			await updateUserRole({
				data: {
					intent: "set-role",
					role: data.role,
					userId: result.user.id,
				},
			});
		}

		return { success: true, user: result.user };
	} catch (error) {
		console.error("Error creating user:", error);

		const betterAuthError = error as BetterAuthError;

		// Handle specific Better Auth errors
		if (betterAuthError.body?.code === "USER_ALREADY_EXISTS") {
			return {
				success: false,
				error: "Un utilisateur avec cet email existe déjà",
				field: "email", // Pour cibler le champ email spécifiquement
			};
		}

		if (betterAuthError.body?.code === "INVALID_EMAIL") {
			return {
				success: false,
				error: "L'adresse email n'est pas valide",
				field: "email",
			};
		}

		// Error générique
		return {
			success: false,
			error:
				betterAuthError.body?.message ||
				"Erreur lors de la création de l'utilisateur",
		};
	}
}

/**
 * Update user information (admin only)
 */
export async function updateUser({
	data,
}: {
	data: z.infer<typeof UpdateUserSchema>;
}) {
	try {
		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { id: data.userId },
		});

		if (!existingUser) {
			return { success: false, error: "Utilisateur non trouvé" };
		}

		// Check if email is already taken by another user
		if (data.email !== existingUser.email) {
			const emailExists = await prisma.user.findFirst({
				where: {
					email: data.email,
					id: { not: data.userId },
				},
			});

			if (emailExists) {
				return {
					success: false,
					error: "Un autre utilisateur utilise déjà cet email",
					field: "email",
				};
			}
		}

		// Update user in database
		await prisma.user.update({
			where: { id: data.userId },
			data: {
				name: data.name,
				email: data.email,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error updating user:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to update user",
		};
	}
}

/**
 * Set user role (admin only)
 */
export async function setUserRole({
	data,
}: {
	data: z.infer<typeof SetRoleSchema>;
}) {
	try {
		// Note: Headers are required for Better Auth API calls in server context
		// We'll skip Better Auth role update for now and just use our custom system
		// const betterAuthRole = role === "administrator" || role === "super_administrator" ? "admin" : "user";
		// await auth.api.setRole({
		//	 headers: {}, // Would need proper headers
		//	 body: { userId, role: betterAuthRole },
		// });

		// Update our custom role system
		await updateUserRole({
			data,
		});

		return { success: true };
	} catch (error) {
		console.error("Error setting user role:", error);
		return { success: false, error: "Failed to set user role" };
	}
}

/**
 * Ban user (admin only)
 * COMMENTED OUT - Feature not needed for now
 */
// export async function banUser({
// 	data,
// }: {
// 	data: z.infer<typeof BanUserSchema>;
// }) {
// 	try {
// 		await auth.api.banUser({
// 			body: { userId: data.userId, banReason: data.banReason },
// 		});
// 		return { success: true };
// 	} catch (error) {
// 		console.error("Error banning user:", error);
// 		return { success: false, error: "Failed to ban user" };
// 	}
// }

/**
 * Unban user (admin only)
 * COMMENTED OUT - Feature not needed for now
 */
// export async function unbanUser(userId: string) {
// 	try {
// 		await auth.api.unbanUser({
// 			body: { userId },
// 		});
// 		return { success: true };
// 	} catch (error) {
// 		console.error("Error unbanning user:", error);
// 		return { success: false, error: "Failed to unban user" };
// 	}
// }

/**
 * Remove user (admin only)
 */
export async function removeUser(userId: string) {
	try {
		// Check if user exists before deletion
		const existingUser = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!existingUser) {
			return { success: false, error: "User not found" };
		}

		// Remove from Better Auth first (this might also remove from database)
		try {
			await auth.api.removeUser({
				body: { userId },
			});
		} catch (authError) {
			console.warn(
				"Better Auth removal failed, continuing with direct database deletion:",
				authError,
			);
		}

		// Ensure user is removed from our database
		// This might fail if Better Auth already removed it, which is OK

		await prisma.user.delete({
			where: { id: userId },
		});

		return { success: true };
	} catch (error) {
		console.error("Error removing user:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to remove user",
		};
	}
}

/**
 * Verify user email (admin only)
 */
export async function verifyUserEmail({
	data,
}: {
	data: z.infer<typeof VerifyEmailSchema>;
}) {
	try {
		// Update user in database to mark email as verified
		await prisma.user.update({
			where: { id: data.userId },
			data: {
				emailVerified: true,
			},
		});

		// Also update in Better Auth if needed
		// Note: Better Auth verifyEmail may require different parameters
		// We'll skip this for now since we updated our database directly
		// try {
		//     await auth.api.verifyEmail({ userId: data.userId });
		// } catch (authError) {
		//     console.warn("Better Auth email verification failed:", authError);
		// }

		return { success: true };
	} catch (error) {
		console.error("Error verifying email:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to verify email",
		};
	}
}

/**
 * Delete a specific session (admin only)
 */
export async function deleteUserSession(sessionId: string) {
	try {
		await prisma.session.delete({
			where: { id: sessionId },
		});
		return { success: true };
	} catch (error) {
		console.error("Error deleting session:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete session",
		};
	}
}

/**
 * Delete all sessions for a user (admin only)
 */
export async function deleteAllUserSessions(userId: string) {
	try {
		const result = await prisma.session.deleteMany({
			where: { userId },
		});
		return { success: true, deletedCount: result.count };
	} catch (error) {
		console.error("Error deleting all user sessions:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to delete all sessions",
		};
	}
}
