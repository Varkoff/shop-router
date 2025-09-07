import { Resend } from "resend";
import { serverEnv } from "./env.server";

// Initialiser Resend avec la clé API
const resend = new Resend(serverEnv.RESEND_API_KEY);

interface OrderEmailData {
	orderId: string;
	customerName: string;
	customerEmail: string;
	orderItems: Array<{
		productName: string;
		quantity: number;
		unitPriceCents: number;
		totalPriceCents: number;
	}>;
	subtotalCents: number;
	taxCents: number;
	shippingCents: number;
	totalCents: number;
	currency: string;
	orderDate: Date;
}

// Template HTML pour l'email de confirmation de commande
const orderConfirmationTemplate = (data: OrderEmailData) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .order-info {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .order-info h2 {
            margin-top: 0;
            color: #1e293b;
        }
        .order-items {
            margin: 20px 0;
        }
        .item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .item:last-child {
            border-bottom: none;
        }
        .item-details {
            flex: 1;
        }
        .item-name {
            font-weight: 600;
            color: #1e293b;
        }
        .item-quantity {
            color: #64748b;
            font-size: 14px;
        }
        .item-price {
            font-weight: 600;
            color: #1e293b;
        }
        .totals {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
        }
        .total-line {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
        }
        .total-line.final {
            font-weight: bold;
            font-size: 18px;
            color: #2563eb;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Commande confirmée</h1>
            <p>Merci pour votre commande, ${data.customerName} !</p>
        </div>

        <div class="order-info">
            <h2>Détails de votre commande</h2>
            <p><strong>Numéro de commande :</strong> ${data.orderId}</p>
            <p><strong>Date de commande :</strong> ${data.orderDate.toLocaleDateString(
							"fr-FR",
							{
								weekday: "long",
								year: "numeric",
								month: "long",
								day: "numeric",
							},
						)}</p>
            <p><strong>Email :</strong> ${data.customerEmail}</p>
        </div>

        <div class="order-items">
            <h3>Articles commandés</h3>
            ${data.orderItems
							.map(
								(item) => `
                <div class="item">
                    <div class="item-details">
                        <div class="item-name">${item.productName}</div>
                        <div class="item-quantity">Quantité : ${item.quantity}</div>
                    </div>
                    <div class="item-price">${formatPrice(item.totalPriceCents, data.currency)}</div>
                </div>
            `,
							)
							.join("")}
        </div>

        <div class="totals">
            <div class="total-line">
                <span>Sous-total :</span>
                <span>${formatPrice(data.subtotalCents, data.currency)}</span>
            </div>
            ${
							data.shippingCents > 0
								? `
                <div class="total-line">
                    <span>Frais de livraison :</span>
                    <span>${formatPrice(data.shippingCents, data.currency)}</span>
                </div>
            `
								: ""
						}
            ${
							data.taxCents > 0
								? `
                <div class="total-line">
                    <span>Taxes :</span>
                    <span>${formatPrice(data.taxCents, data.currency)}</span>
                </div>
            `
								: ""
						}
            <div class="total-line final">
                <span>Total :</span>
                <span>${formatPrice(data.totalCents, data.currency)}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${serverEnv.FRONTEND_URL}/orders/${data.orderId}" class="cta-button">
                Suivre ma commande
            </a>
        </div>

        <div class="footer">
            <p>Vous recevrez un email de confirmation d'expédition dès que votre commande sera expédiée.</p>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        </div>
    </div>
</body>
</html>
`;

// Template texte simple pour les clients qui ne supportent pas HTML
const orderConfirmationTextTemplate = (data: OrderEmailData) => `
Confirmation de commande - ${data.orderId}

Bonjour ${data.customerName},

Merci pour votre commande ! Voici un récapitulatif :

Numéro de commande : ${data.orderId}
Date : ${data.orderDate.toLocaleDateString("fr-FR")}
Email : ${data.customerEmail}

Articles commandés :
${data.orderItems
	.map(
		(item) =>
			`- ${item.productName} (x${item.quantity}) : ${formatPrice(item.totalPriceCents, data.currency)}`,
	)
	.join("\n")}

Sous-total : ${formatPrice(data.subtotalCents, data.currency)}
${data.shippingCents > 0 ? `Frais de livraison : ${formatPrice(data.shippingCents, data.currency)}\n` : ""}
${data.taxCents > 0 ? `Taxes : ${formatPrice(data.taxCents, data.currency)}\n` : ""}
Total : ${formatPrice(data.totalCents, data.currency)}

Vous pouvez suivre votre commande à l'adresse : ${serverEnv.FRONTEND_URL}/orders/${data.orderId}

Merci de votre confiance !
`;

// Fonction utilitaire pour formater les prix
const formatPrice = (priceCents: number, currency: string) => {
	const price = priceCents / 100;
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: currency.toUpperCase(),
	}).format(price);
};

// Fonction pour envoyer l'email de confirmation de commande
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
	try {
		const result = await resend.emails.send({
			from: serverEnv.RESEND_FROM_EMAIL,
			to: data.customerEmail,
			subject: `Confirmation de commande #${data.orderId}`,
			html: orderConfirmationTemplate(data),
			text: orderConfirmationTextTemplate(data),
		});

		console.log("Email de confirmation envoyé:", result);
		return result;
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email:", error);
		throw error;
	}
}

// Template pour l'email de mise à jour du statut de commande
const orderStatusUpdateTemplate = (
	data: OrderEmailData & { status: string; statusMessage: string },
) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mise à jour de commande</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .status-update {
            background-color: #f0f9ff;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Mise à jour de votre commande</h1>
            <p>Commande #${data.orderId}</p>
        </div>

        <div class="status-update">
            <h2>Nouveau statut : ${data.status}</h2>
            <p>${data.statusMessage}</p>
        </div>

        <div style="text-align: center;">
            <a href="${serverEnv.FRONTEND_URL}/orders/${data.orderId}" class="cta-button">
                Voir ma commande
            </a>
        </div>
    </div>
</body>
</html>
`;

// Fonction pour envoyer un email de mise à jour du statut
export async function sendOrderStatusUpdateEmail(
	data: OrderEmailData & { status: string; statusMessage: string },
) {
	try {
		const result = await resend.emails.send({
			from: serverEnv.RESEND_FROM_EMAIL,
			to: data.customerEmail,
			subject: `Mise à jour de votre commande #${data.orderId}`,
			html: orderStatusUpdateTemplate(data),
		});

		console.log("Email de mise à jour envoyé:", result);
		return result;
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email de mise à jour:", error);
		throw error;
	}
}

// ------------------------------------------------------------
// Auth Emails: Password Reset & Account Created
// ------------------------------------------------------------

// Utilitaire pour échapper le HTML dans les champs dynamiques
const escapeHtml = (unsafe: string) =>
	unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

interface PasswordResetEmailData {
	email: string;
	name?: string;
	resetUrl: string;
}

const passwordResetTemplate = (data: PasswordResetEmailData) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Réinitialisation du mot de passe</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .card { background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    h1 { font-size: 22px; margin: 0 0 12px; color: #111827; }
    p { margin: 6px 0; }
    .cta { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .muted { color: #475569; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Réinitialisez votre mot de passe</h1>
    <p>Bonjour ${escapeHtml(data.name || "")},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer.</p>
    <p><a class="cta" href="${data.resetUrl}">Choisir un nouveau mot de passe</a></p>
    <p class="muted">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
  </div>
</body>
</html>
`;

const passwordResetTextTemplate = (data: PasswordResetEmailData) => `
Réinitialisation du mot de passe

Bonjour ${data.name || ""},

Vous avez demandé à réinitialiser votre mot de passe. Ouvrez ce lien:
${data.resetUrl}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
`;

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
	try {
		const result = await resend.emails.send({
			from: serverEnv.RESEND_FROM_EMAIL,
			to: data.email,
			subject: "Réinitialisation de votre mot de passe",
			html: passwordResetTemplate(data),
			text: passwordResetTextTemplate(data),
		});

		console.log("Email de réinitialisation envoyé:", result);
		return result;
	} catch (error) {
		console.error(
			"Erreur lors de l'envoi de l'email de réinitialisation:",
			error,
		);
		throw error;
	}
}

interface AccountCreatedEmailData {
	email: string;
	name?: string;
	loginUrl: string;
	verifyUrl?: string;
}

const accountCreatedTemplate = (data: AccountCreatedEmailData) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .card { background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    h1 { font-size: 22px; margin: 0 0 12px; color: #111827; }
    p { margin: 6px 0; }
    .cta { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .muted { color: #475569; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Bienvenue${data.name ? `, ${escapeHtml(data.name)}` : ""} 👋</h1>
    <p>Votre compte a bien été créé.</p>
    ${
			data.verifyUrl
				? `<p>Pour sécuriser votre compte, veuillez confirmer votre adresse email.</p>
    <p><a class="cta" href="${data.verifyUrl}">Confirmer mon email</a></p>`
				: `<p>Vous pouvez vous connecter dès maintenant.</p>
    <p><a class="cta" href="${data.loginUrl}">Se connecter</a></p>`
		}
    <p class="muted">Si vous n'êtes pas à l'origine de cette création, contactez le support.</p>
  </div>
</body>
</html>
`;

const accountCreatedTextTemplate = (data: AccountCreatedEmailData) => `
Bienvenue${data.name ? `, ${data.name}` : ""}

Votre compte a bien été créé.
${data.verifyUrl ? `Confirmez votre email: ${data.verifyUrl}` : `Connectez-vous: ${data.loginUrl}`}
`;

export async function sendAccountCreatedEmail(data: AccountCreatedEmailData) {
	try {
		const result = await resend.emails.send({
			from: serverEnv.RESEND_FROM_EMAIL,
			to: data.email,
			subject: "Bienvenue — Votre compte est prêt",
			html: accountCreatedTemplate(data),
			text: accountCreatedTextTemplate(data),
		});

		console.log("Email de création de compte envoyé:", result);
		return result;
	} catch (error) {
		console.error(
			"Erreur lors de l'envoi de l'email de création de compte:",
			error,
		);
		throw error;
	}
}
