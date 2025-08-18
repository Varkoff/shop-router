import { data } from "react-router";
import {
	processWebhookEvent,
	verifyWebhookSignature,
} from "~/server/polar.server";
import type { Route } from "./+types/api.polar.webhooks";
import { env } from "~/server/env.server";

export async function action({ request }: Route.ActionArgs) {
	try {
		// Get the raw body for signature verification
		const body = await request.text();
		const signature = request.headers.get("X-Polar-Webhook-Signature");

		if (!signature) {
			console.error("Missing webhook signature");
			return data({ error: "Missing signature" }, { status: 400 });
		}

		// Verify the webhook signature
		const webhookSecret = env.POLAR_WEBHOOK_SECRET;
		if (!webhookSecret) {
			console.error("POLAR_WEBHOOK_SECRET not configured");
			return data({ error: "Webhook secret not configured" }, { status: 500 });
		}

		const isValid = verifyWebhookSignature(body, signature, webhookSecret);

		if (!isValid) {
			console.error("Invalid webhook signature");
			return data({ error: "Invalid signature" }, { status: 401 });
		}

		// Parse the event
		const event = JSON.parse(body);

		// Process the webhook event
		const result = await processWebhookEvent(event);

		if (!result.success) {
			console.error("Failed to process webhook event:", result.error);
			return data({ error: "Failed to process event" }, { status: 500 });
		}

		// Return success response
		return data({ received: true });
	} catch (error) {
		console.error("Webhook processing error:", error);
		return data({ error: "Internal server error" }, { status: 500 });
	}
}
