import z from "zod";

const minLength = 4;

const serverEnvSchema = z.object({
	DATABASE_URL: z
		.string({
			message: "DATABASE_URL is missing",
		})
		.min(minLength, {
			message: "DATABASE_URL is too short",
		}),
	FRONTEND_URL: z
		.string({
			message: "DATABASE_URL is missing",
		})
		.min(minLength, {
			message: "DATABASE_URL is too short",
		}),
	AWS_ACCESS_KEY_ID: z
		.string({
			message: "AWS_ACCESS_KEY_ID is missing",
		})
		.min(minLength, {
			message: "AWS_ACCESS_KEY_ID is too short",
		}),
	AWS_SECRET_ACCESS_KEY: z
		.string({
			message: "AWS_SECRET_ACCESS_KEY is missing",
		})
		.min(minLength, {
			message: "AWS_SECRET_ACCESS_KEY is too short",
		}),
	AWS_REGION: z
		.string({
			message: "AWS_REGION is missing",
		})
		.min(minLength, {
			message: "AWS_REGION is too short",
		}),
	AWS_S3_BUCKET_NAME: z
		.string({
			message: "AWS_S3_BUCKET_NAME is missing",
		})
		.min(minLength, {
			message: "AWS_S3_BUCKET_NAME is too short",
		}),
	BETTER_AUTH_SECRET: z
		.string({
			message: "BETTER_AUTH_SECRET is missing",
		})
		.min(minLength, {
			message: "BETTER_AUTH_SECRET is too short",
		}),
	BETTER_AUTH_URL: z
		.string({
			message: "BETTER_AUTH_URL is missing",
		})
		.min(minLength, {
			message: "BETTER_AUTH_URL is too short",
		}),
	STRIPE_WEBHOOK_SECRET: z
		.string({
			message: "STRIPE_WEBHOOK_SECRET is missing",
		})
		.min(minLength, {
			message: "STRIPE_WEBHOOK_SECRET is too short",
		}),
	STRIPE_PUBLISHABLE_KEY: z
		.string({
			message: "STRIPE_PUBLISHABLE_KEY is missing",
		})
		.min(minLength, {
			message: "STRIPE_PUBLISHABLE_KEY is too short",
		}),
	STRIPE_SECRET_KEY: z
		.string({
			message: "STRIPE_SECRET_KEY is missing",
		})
		.min(minLength, {
			message: "STRIPE_SECRET_KEY is too short",
		}),
	RESEND_API_KEY: z
		.string({
			message: "RESEND_API_KEY is missing",
		})
		.min(minLength, {
			message: "RESEND_API_KEY is too short",
		}),
	RESEND_FROM_EMAIL: z
		.string({
			message: "RESEND_FROM_EMAIL is missing",
		})
		.min(minLength, {
			message: "RESEND_FROM_EMAIL is too short",
		}),
});

export const serverEnv = serverEnvSchema.parse(process.env);

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof serverEnvSchema> {}
	}
}
