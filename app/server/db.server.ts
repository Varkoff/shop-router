import { withAccelerate } from "@prisma/extension-accelerate";
import { z } from "zod";
import { PrismaClient } from "~/../generated/prisma/client";

export const prisma = new PrismaClient().$extends(withAccelerate());

const CreateImageFromUrlSchema = z.object({
	url: z.string().url("URL invalide"),
	alt: z.string().optional(),
	productId: z.string().uuid().optional(),
});

export async function createImageFromUrl({
	input,
}: {
	input: z.infer<typeof CreateImageFromUrlSchema>;
}) {
	const validated = CreateImageFromUrlSchema.parse(input);

	// Vérifier que le produit existe si un productId est fourni
	if (validated.productId) {
		const product = await prisma.product.findUnique({
			where: { id: validated.productId },
		});

		if (!product) {
			throw new Error(`Produit avec l'ID ${validated.productId} introuvable`);
		}
	}

	return await prisma.image.create({
		data: {
			url: validated.url,
			alt: validated.alt,
			...(validated.productId && {
				product: {
					connect: { id: validated.productId },
				},
			}),
		},
	});
}

const LinkImagesToProductSchema = z.object({
	productId: z.string().uuid("ID produit invalide"),
	imageUrls: z
		.array(z.string().url("URL image invalide"))
		.min(1, "Au moins une image est requise"),
});

export async function linkImagesToProduct({
	data,
}: {
	data: z.infer<typeof LinkImagesToProductSchema>;
}) {
	// Vérifier que le produit existe
	const product = await prisma.product.findUnique({
		where: { id: data.productId },
	});

	if (!product) {
		throw new Error(`Produit avec l'ID ${data.productId} introuvable`);
	}

	// Récupérer toutes les images en une seule requête
	const existingImages = await getImagesByUrls(data.imageUrls);

	// Créer un map pour un accès rapide
	const imagesByUrl = new Map(existingImages.map((img) => [img.url, img]));

	const results = await Promise.allSettled(
		data.imageUrls.map(async (url) => {
			const existingImage = imagesByUrl.get(url);

			// Si l'image n'existe pas, la créer et la lier
			if (!existingImage) {
				const image = await prisma.image.create({
					data: {
						url,
						product: {
							connect: { id: data.productId },
						},
					},
				});
				return { created: true, image };
			}

			// Vérifier si l'image est déjà liée à ce produit
			const isAlreadyLinked = existingImage.product.some(
				(p) => p.id === data.productId,
			);

			if (isAlreadyLinked) {
				return { alreadyLinked: true, image: existingImage };
			}

			// Lier l'image au produit (many-to-many permet plusieurs produits)
			const updatedImage = await prisma.image.update({
				where: { id: existingImage.id },
				data: {
					product: {
						connect: { id: data.productId },
					},
				},
			});

			return { linked: true, image: updatedImage };
		}),
	);

	// Compter les résultats
	const successful = results.filter((result) => result.status === "fulfilled");
	const failed = results.filter((result) => result.status === "rejected");

	if (failed.length > 0) {
		const errors = failed.map((result) =>
			result.status === "rejected" ? result.reason.message : "Erreur inconnue",
		);
		throw new Error(`Erreurs lors de la liaison: ${errors.join(", ")}`);
	}

	return {
		success: true,
		linkedCount: successful.length,
		details: successful.map((result) => result.value),
	};
}

export async function getAllImages() {
	return await prisma.image.findMany({
		orderBy: { createdAt: "desc" },
	});
}

export async function getImagesByUrls(urls: string[]) {
	return await prisma.image.findMany({
		where: { url: { in: urls } },
		select: {
			id: true,
			url: true,
			product: {
				select: {
					id: true,
				},
			},
		},
	});
}

export async function unlinkImageFromProduct({
	imageUrl,
	productId,
}: {
	imageUrl: string;
	productId: string;
}) {
	console.log(
		`🔍 Recherche de l'image avec URL: ${imageUrl} pour le produit: ${productId}`,
	);

	const image = await prisma.image.findFirst({
		where: { url: imageUrl },
		include: { product: true },
	});

	if (!image) {
		console.log(`❌ Image avec l'URL ${imageUrl} introuvable`);
		throw new Error(`Image avec l'URL ${imageUrl} introuvable`);
	}

	console.log(
		`✅ Image trouvée: ${image.id}, liée à ${image.product.length} produit(s)`,
	);
	console.log(
		`📋 Produits liés:`,
		image.product.map((p) => p.id),
	);

	const isLinked = image.product.some((p) => p.id === productId);
	if (!isLinked) {
		console.log(`❌ L'image n'est pas liée au produit ${productId}`);
		throw new Error(`L'image n'est pas liée à ce produit`);
	}

	console.log(`🔗 Déconnexion de l'image ${image.id} du produit ${productId}`);

	await prisma.image.update({
		where: { id: image.id },
		data: {
			product: {
				disconnect: { id: productId },
			},
		},
	});

	console.log(`✅ Image déconnectée avec succès`);
	return { success: true };
}
