import { prisma } from "~/server/db.server";

export async function getUserOrders(userId: string) {
	return await prisma.order.findMany({
		where: { userId },
		include: {
			items: true,
			invoice: true,
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function getGuestOrder({
	orderId,
	email,
}: {
	orderId: string;
	email: string;
}) {
	return await prisma.order.findFirst({
		where: {
			id: orderId,
			guestEmail: email,
		},
		include: {
			items: true,
			invoice: true,
		},
	});
}

export async function getOrderWithInvoice(orderId: string) {
	return await prisma.order.findUnique({
		where: { id: orderId },
		include: {
			items: true,
			invoice: true,
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});
}

// Fonction pour synchroniser une commande avec Stripe (utile pour le debugging)
export async function syncOrderWithStripe(orderId: string) {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		include: { invoice: true },
	});

	if (!order?.stripeCheckoutSession) {
		throw new Error("Order has no Stripe checkout session");
	}

	// Récupérer les détails depuis Stripe
	const { stripe } = await import("~/server/stripe.server");
	const session = await stripe.checkout.sessions.retrieve(
		order.stripeCheckoutSession,
	);

	// Mettre à jour les statuts si nécessaire
	const updates: any = {};

	if (session.payment_status === "paid" && order.paymentStatus !== "PAID") {
		updates.paymentStatus = "PAID";
		updates.orderStatus = "PAID";
	}

	if (session.payment_intent) {
		updates.stripePaymentIntentId = session.payment_intent;
	}

	if (Object.keys(updates).length > 0) {
		await prisma.order.update({
			where: { id: orderId },
			data: updates,
		});
	}

	return { order, session, updated: Object.keys(updates).length > 0 };
}
