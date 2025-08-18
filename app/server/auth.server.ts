import {
	checkout,
	polar,
	portal,
	usage,
	webhooks,
} from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { redirect } from "react-router";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "~/../generated/prisma/client";
import { env } from "./env.server";
import { polar as polarClient } from "./polar.server";

const prisma = new PrismaClient();
export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	plugins: [
		admin({
			// defaultRole: "customer",
			adminRoles: ["administrator", "super_administrator"],
		}),
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			use: [
				checkout({
					// Configure products here if needed
					// products: [{ productId: "your-product-id", slug: "pro" }],
					successUrl: "/checkout/success?checkout_id={CHECKOUT_ID}",
					authenticatedUsersOnly: true,
				}),
				portal(),
				usage(),
				webhooks({
					secret: env.POLAR_WEBHOOK_SECRET || "",
					onCustomerStateChanged: async (payload) => {
						console.log("Customer state changed:", payload);
					},
					onOrderPaid: async (payload) => {
						console.log("Order paid:", payload);
					},
					onPayload: async (payload) => {
						console.log("Polar webhook received:", payload);
					},
				}),
			],
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
		return session?.user || null;
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
