import { z } from "zod";

// Schéma pour toutes les variables d'environnement serveur
const serverEnvSchema = z.object({
	// Database
	DATABASE_URL: z.string().url(),

	// Auth
	BETTER_AUTH_SECRET: z.string().min(1),
	BETTER_AUTH_URL: z.string().url(),

	// AWS S3
	AWS_ACCESS_KEY_ID: z.string().min(1),
	AWS_SECRET_ACCESS_KEY: z.string().min(1),
	AWS_REGION: z.string().min(1),
	AWS_S3_BUCKET_NAME: z.string().min(1),

	// Polar
	POLAR_ACCESS_TOKEN: z.string().min(1),
	POLAR_ORGANIZATION_ID: z.string().min(1),
	POLAR_WEBHOOK_SECRET: z.string().min(1),

	// Environment
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
});

// Variables d'environnement validées
export const env = serverEnvSchema.parse(process.env);
