import type Stripe from "stripe";
import { prisma } from "~/server/db.server";
import { serverEnv } from "~/server/env.server";
import { stripe } from "~/server/stripe.server";
import type { Route } from "./+types/api.stripe.webhooks";

export async function action({ request }: Route.ActionArgs) {
	// Votre endpoint secret de webhook depuis Stripe Dashboard
	const WEBHOOK_SECRET = serverEnv.STRIPE_WEBHOOK_SECRET;

	// if (!WEBHOOK_SECRET) {
	// 	throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
	// }
	const payload = await request.text();
	const signature = request.headers.get("stripe-signature");

	if (!signature) {
		return new Response("Missing stripe-signature header", { status: 400 });
	}

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
	} catch (err) {
		console.error("Webhook signature verification failed:", err);
		return new Response("Invalid signature", { status: 400 });
	}

	try {
		switch (event.type) {
			case "checkout.session.completed":
				await handleCheckoutSessionCompleted(event.data.object);
				break;

			// case "payment_intent.succeeded":
			// 	await handlePaymentSucceeded(event.data.object);
			// 	break;

			// case "customer.created":
			// 	await handleCustomerCreated(event.data.object);
			// 	break;

			// case "customer.updated":
			// 	await handleCustomerUpdated(event.data.object);
			// 	break;

			// case "invoice.created":
			// 	await handleInvoiceCreated(event.data.object);
			// 	break;

			// case "invoice.payment_succeeded":
			// 	await handleInvoicePaymentSucceeded(event.data.object);
			// 	break;

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return new Response("Webhook processed successfully", { status: 200 });
	} catch (error) {
		console.error("Error processing webhook:", error);
		return new Response("Internal server error", { status: 500 });
	}
}

async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session,
) {
	const { orderId, userId, isGuest } = session.metadata || {};

	if (!orderId) {
		console.error("Order ID missing from checkout session metadata");
		return;
	}

	// Mettre à jour la commande avec les informations de paiement
	await prisma.order.update({
		where: { id: orderId },
		data: {
			orderStatus: "PAID",
			paymentStatus: "PAID",
			stripePaymentIntentId: session.payment_intent as string,
			// Sauvegarder les adresses depuis Stripe
			// shippingAddress: session.shipping_details
			// 	? {
			// 			name: session.shipping_details.name,
			// 			address: session.shipping_details.address,
			// 		}
			// 	: null,
			// @ts-ignore
			billingAddress: session.customer_details
				? {
						name: session.customer_details.name,
						email: session.customer_details.email,
						address: session.customer_details.address,
					}
				: null,
		},
	});

	// Créer ou lier le customer Stripe
	if (session.customer) {
		await linkStripeCustomer({
			stripeCustomerId: session.customer as string,
			userId: isGuest === "false" ? userId : undefined,
			email: session.customer_details?.email || undefined,
			orderId,
		});
	}

	console.log(`Order ${orderId} marked as paid`);
}

// async function handlePaymentSucceeded(paymentIntent: any) {
// 	// Optionnel : traitement supplémentaire après succès du paiement
// 	console.log(`Payment succeeded: ${paymentIntent.id}`);
// }

// async function handleCustomerCreated(customer: any) {
// 	// Le customer est créé automatiquement par Stripe Checkout
// 	// On peut enregistrer des métadonnées si nécessaire
// 	console.log(`Customer created: ${customer.id}`);
// }

// async function handleCustomerUpdated(customer: any) {
// 	// Synchroniser les modifications du customer
// 	if (customer.metadata?.userId) {
// 		await prisma.user.update({
// 			where: { id: customer.metadata.userId },
// 			data: {
// 				// Mettre à jour les infos si nécessaire
// 				name: customer.name || undefined,
// 			},
// 		});
// 	}
// }

// async function handleInvoiceCreated(invoice: any) {
// 	// Stripe crée automatiquement une facture après paiement
// 	const orderId = invoice.metadata?.orderId;

// 	if (orderId) {
// 		await prisma.invoice.create({
// 			data: {
// 				orderId,
// 				stripeInvoiceId: invoice.id,
// 				amountCents: invoice.amount_paid,
// 				paidAt: invoice.status_transitions?.paid_at
// 					? new Date(invoice.status_transitions.paid_at * 1000)
// 					: null,
// 			},
// 		});

// 		// Mettre à jour la commande avec l'ID de facture
// 		await prisma.order.update({
// 			where: { id: orderId },
// 			data: { stripeInvoiceId: invoice.id },
// 		});
// 	}
// }

// async function handleInvoicePaymentSucceeded(invoice: any) {
// 	// Mettre à jour la facture comme payée
// 	await prisma.invoice.updateMany({
// 		where: { stripeInvoiceId: invoice.id },
// 		data: {
// 			paidAt: new Date(invoice.status_transitions.paid_at * 1000),
// 			amountCents: invoice.amount_paid,
// 		},
// 	});
// }

async function linkStripeCustomer({
	stripeCustomerId,
	userId,
	email,
	orderId,
}: {
	stripeCustomerId: string;
	userId?: string;
	email?: string;
	orderId: string;
}) {
	if (userId) {
		// Utilisateur connecté : ajouter le Stripe customer ID s'il n'en a pas
		await prisma.user.update({
			where: { id: userId },
			data: {
				stripeCustomerId: stripeCustomerId,
			},
		});
	} else if (email) {
		// Utilisateur invité : vérifier s'il existe déjà un compte avec cet email
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			// Lier la commande à l'utilisateur existant et ajouter le customer ID
			await prisma.order.update({
				where: { id: orderId },
				data: { userId: existingUser.id },
			});

			// Ajouter le customer ID si l'utilisateur n'en a pas
			if (!existingUser.stripeCustomerId) {
				await prisma.user.update({
					where: { id: existingUser.id },
					data: { stripeCustomerId: stripeCustomerId },
				});
			}
		}
	}
}
