import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { redirect } from "react-router";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "~/../generated/prisma/client";
import {
	sendAccountCreatedEmail,
	sendPasswordResetEmail,
} from "~/server/emails.server";
import { serverEnv } from "./env.server";

const prisma = new PrismaClient();
export const auth = betterAuth({
	baseURL: serverEnv.BETTER_AUTH_URL,
	secret: serverEnv.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),

	emailVerification: {
		sendOnSignUp: true,
		async sendVerificationEmail(data) {
			await sendAccountCreatedForUser(
				data.user.email,
				data.user.name,
				// data.token,
			);
		},
	},
	plugins: [
		admin({
			// defaultRole: "customer",
			adminRoles: ["administrator", "super_administrator"],
		}),
	],
});

/**
 * Requires a user to be authenticated. If not, redirects to login page.
 * Also clears invalid cookies automatically.
 *
 * @param request - The incoming request object
 * @param redirectTo - Optional redirect path after login (default: current path)
 * @returns The authenticated user
 * @throws Redirect to login page if not authenticated
 */
export async function requireUser(request: Request, redirectTo?: string) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			// No valid session found
			const url = new URL(request.url);
			const currentPath = redirectTo || url.pathname + url.search;

			// Create redirect URL with return path
			const loginUrl = new URL("/login", url.origin);
			if (currentPath !== "/login") {
				loginUrl.searchParams.set("redirectTo", currentPath);
			}

			throw redirect(loginUrl.toString(), {
				headers: {
					// Clear the session cookie if it exists but is invalid
					"Set-Cookie":
						"better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
				},
			});
		}

		return session.user;
	} catch (error) {
		// If it's already a redirect, re-throw it
		if (error instanceof Response) {
			throw error;
		}

		// For any other error, treat as unauthenticated
		const url = new URL(request.url);
		const currentPath = redirectTo || url.pathname + url.search;

		const loginUrl = new URL("/login", url.origin);
		if (currentPath !== "/login") {
			loginUrl.searchParams.set("redirectTo", currentPath);
		}

		throw redirect(loginUrl.toString(), {
			headers: {
				"Set-Cookie":
					"better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
			},
		});
	}
}

/**
 * Gets the current user without redirecting if not authenticated.
 * Useful for optional authentication.
 *
 * @param request - The incoming request object
 * @returns The authenticated user or null
 */
export async function getOptionalUser(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		let stripeCustomerId: string | null = null;
		if (session?.user) {
			const customerData = await prisma.user.findUnique({
				where: { id: session.user.id },
				select: {
					stripeCustomerId: true,
				},
			});
			if (customerData) {
				stripeCustomerId = customerData.stripeCustomerId;
			}
		}
		return session?.user ? { ...session?.user, stripeCustomerId } : null;
	} catch {
		return null;
	}
}

/**
 * Requires an admin user (administrator or super_administrator).
 * Redirects to login if not authenticated or signs out and redirects if not admin.
 *
 * @param request - The incoming request object
 * @returns The authenticated admin user
 * @throws Redirect if not authenticated or not admin
 */
export async function requireAdmin(request: Request) {
	const user = await requireUser(request);

	if (user.role !== "administrator" && user.role !== "super_administrator") {
		// Sign out the user since they don't have admin privileges
		await auth.api.signOut({
			headers: request.headers,
		});

		throw redirect("/login", {
			headers: {
				"Set-Cookie":
					"better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
			},
		});
	}

	return user;
}

/**
 * Requires a super administrator user.
 * Redirects to login if not authenticated or signs out and redirects if not super admin.
 *
 * @param request - The incoming request object
 * @returns The authenticated super admin user
 * @throws Redirect if not authenticated or not super admin
 */
export async function requireSuperAdmin(request: Request) {
	const user = await requireUser(request);

	if (user.role !== "super_administrator") {
		// Sign out the user since they don't have super admin privileges
		await auth.api.signOut({
			headers: request.headers,
		});

		throw redirect("/login", {
			headers: {
				"Set-Cookie":
					"better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
			},
		});
	}

	return user;
}

/**
 * Updates the user's display name
 *
 * @param request - The incoming request object
 * @param newName - The new display name
 * @returns Success or error response
 */
export async function updateUserName(request: Request, newName: string) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			throw new Error("User not authenticated");
		}

		const updatedUser = await prisma.user.update({
			where: { id: session.user.id },
			data: { name: newName },
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
			},
		});

		return { success: true, user: updatedUser };
	} catch (error) {
		console.error("Error updating user name:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to update name",
		};
	}
}

/**
 * Updates the user's password using Better Auth
 *
 * @param request - The incoming request object
 * @param currentPassword - The current password for verification
 * @param newPassword - The new password
 * @returns Success or error response
 */
export async function updateUserPassword(
	request: Request,
	currentPassword: string,
	newPassword: string,
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			throw new Error("User not authenticated");
		}

		// Use Better Auth's changePassword method
		await auth.api.changePassword({
			body: {
				currentPassword,
				newPassword,
				revokeOtherSessions: false, // Keep other sessions active
			},
			headers: request.headers,
		});

		return { success: true };
	} catch (error) {
		console.error("Error updating password:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update password",
		};
	}
}

/**
 * Gets the current user's sessions
 *
 * @param request - The incoming request object
 * @returns User sessions or error response
 */
export async function getCurrentUserSessions(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			throw new Error("User not authenticated");
		}

		// Get sessions directly from database for more detailed information
		const sessions = await prisma.session.findMany({
			where: { userId: session.user.id },
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
		return {
			success: false,
			error: "Failed to get user sessions",
			sessions: [],
		};
	}
}

/**
 * Deletes a user's own session
 *
 * @param request - The incoming request object
 * @param sessionId - The session ID to delete
 * @returns Success or error response
 */
export async function deleteCurrentUserSession(
	request: Request,
	sessionId: string,
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			throw new Error("User not authenticated");
		}

		// Verify that the session belongs to the current user
		const targetSession = await prisma.session.findFirst({
			where: {
				id: sessionId,
				userId: session.user.id,
			},
		});

		if (!targetSession) {
			throw new Error("Session not found or access denied");
		}

		// Delete the session
		await prisma.session.delete({
			where: { id: sessionId },
		});

		return { success: true };
	} catch (error) {
		console.error("Error deleting user session:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete session",
		};
	}
}

/**
 * Sends a password reset email using Resend templates
 */
export async function sendPasswordResetForUser(
	email: string,
	resetToken: string,
	name?: string,
) {
	const baseUrl = serverEnv.FRONTEND_URL || "";
	const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;

	await sendPasswordResetEmail({
		email,
		name,
		resetUrl,
	});
}

/**
 * Sends an account created/welcome email, with optional verify link
 */
export async function sendAccountCreatedForUser(
	email: string,
	name?: string,
	verifyToken?: string,
) {
	const baseUrl = serverEnv.FRONTEND_URL || "";
	const loginUrl = `${baseUrl}/login`;
	const verifyUrl = verifyToken
		? `${baseUrl}/verify-email?token=${encodeURIComponent(verifyToken)}&email=${encodeURIComponent(email)}`
		: undefined;

	await sendAccountCreatedEmail({
		email,
		name,
		loginUrl,
		verifyUrl,
	});
}
