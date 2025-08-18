import type z from "zod";
import type { ProductSchema } from "~/routes/admin+/products.$productSlug";
import { prisma } from "../db.server";
import {
	createPolarProduct,
	getPolarProduct,
	updatePolarProductPrice,
} from "../polar.server";

export async function adminGetProducts() {
	const products = await prisma.product.findMany({
		select: {
			id: true,
			name: true,
			description: true,
			priceCents: true,
			slug: true,
			stock: true,
			isActive: true,
			polarProductId: true,
			polarPriceId: true,
			images: {
				select: {
					id: true,
					url: true,
					alt: true,
				},
				take: 1,
			},
		},
		orderBy: {
			id: "asc",
		},
	});

	// attach a placeholder image URL for each product using picsum (stable per id)
	return products.map((p) => ({
		...p,
		imageUrl:
			p.images.length > 0
				? p.images[0].url
				: `https://picsum.photos/seed/${encodeURIComponent(String(p.id))}/600/400`,
	}));
}

export async function createProduct({
	data: {
		currency,
		isActive,
		name,
		priceCents,
		slug,
		stock,
		content,
		description,
	},
}: {
	data: z.infer<typeof ProductSchema>;
}) {
	return await prisma.product.create({
		data: {
			currency,
			isActive,
			name,
			priceCents,
			slug,
			stock,
			content,
			description,
		},
		select: {
			id: true,
			slug: true,
		},
	});
}

export async function updateProduct({
	data,
	productSlug,
}: {
	productSlug: string;
	data: z.infer<typeof ProductSchema>;
}) {
	let hasUpdatedSlug = false;
	const existingProduct = await prisma.product.findUnique({
		where: { slug: productSlug },
		select: {
			slug: true,
		},
	});
	if (!existingProduct) {
		throw new Error("Product not found");
	}
	const {
		currency,
		isActive,
		name,
		priceCents,
		slug,
		stock,
		content,
		description,
	} = data;

	if (existingProduct.slug !== slug) {
		hasUpdatedSlug = true;
	}

	const updatedProduct = await prisma.product.update({
		where: { slug: productSlug },
		data: {
			currency,
			isActive,
			name,
			priceCents,
			slug,
			stock,
			content,
			description,
		},
		select: {
			id: true,
			slug: true,
		},
	});
	return { ...updatedProduct, hasUpdatedSlug };
}

export async function deleteProduct(productSlug: string) {
	return await prisma.product.delete({
		where: { slug: productSlug },
	});
}

export async function toggleProductStatus(productSlug: string) {
	const product = await prisma.product.findUnique({
		where: { slug: productSlug },
		select: { isActive: true },
	});

	if (!product) {
		throw new Error("Product not found");
	}

	return await prisma.product.update({
		where: { slug: productSlug },
		data: { isActive: !product.isActive },
		select: { isActive: true },
	});
}

export async function isSlugTaken({ slug }: { slug: string }) {
	const existingProduct = await prisma.product.findUnique({
		where: { slug },
		select: { id: true },
	});

	return Boolean(existingProduct);
}

/**
 * Synchronise un produit avec Polar.sh
 * Crée le produit sur Polar s'il n'existe pas, ou le met à jour s'il existe
 * Met à jour les IDs Polar dans la base de données
 */
export async function syncProductWithPolar({
	productIdentifier,
}: {
	productIdentifier: string; // Peut être un ID, un slug, ou un polarProductId
}) {
	try {
		// Rechercher le produit par ID, slug, ou polarProductId
		const product = await prisma.product.findFirst({
			where: {
				OR: [
					{ id: productIdentifier },
					{ slug: productIdentifier },
					{ polarProductId: productIdentifier },
				],
			},
			select: {
				id: true,
				name: true,
				slug: true,
				description: true,
				priceCents: true,
				currency: true,
				polarProductId: true,
				polarPriceId: true,
			},
		});

		if (!product) {
			return {
				success: false,
				error: "Produit non trouvé",
			};
		}

		// Si le produit n'a pas d'ID Polar, le créer
		if (!product.polarProductId) {
			const polarResult = await createPolarProduct({
				name: product.name,
				description: product.description || undefined,
				price: {
					currency: "USD", // Polar n'accepte que USD
					amount: product.priceCents,
					isRecurring: false,
				},
			});

			if (!polarResult.success) {
				return {
					success: false,
					error: `Erreur lors de la création du produit Polar: ${polarResult.error}`,
				};
			}

			// Mettre à jour le produit avec les IDs Polar
			await prisma.product.update({
				where: { id: product.id },
				data: {
					polarProductId: polarResult.product?.id,
					polarPriceId: polarResult.product?.prices?.[0]?.id || null,
				},
			});

			return {
				success: true,
				message: "Produit créé et synchronisé avec Polar",
				polarProductId: polarResult.product?.id,
				polarPriceId: polarResult.product?.prices?.[0]?.id || null,
			};
		} else {
			// Tentative de mise à jour du prix d'abord (qui peut recréer le produit)
			const priceUpdateResult = await updatePolarProductPrice(
				product.polarProductId,
				{
					name: product.name,
					description: product.description || undefined,
					amount: product.priceCents,
					currency: "USD", // Polar n'accepte que USD
				},
			);

			// Si la mise à jour a réussi
			if (priceUpdateResult.success) {
				// Si le prix n'a pas changé (skipped), on a déjà mis à jour le nom/description
				if (priceUpdateResult.skipped) {
					return {
						success: true,
						message: "Produit mis à jour sur Polar (prix inchangé)",
						polarProductId: product.polarProductId,
						polarPriceId: product.polarPriceId,
						priceUpdated: false,
					};
				}

				// Si le prix a été mis à jour, mettre à jour l'ID du prix si nécessaire
				if (priceUpdateResult.product) {
					const newPolarPriceId =
						priceUpdateResult.product.prices?.[0]?.id || null;

					// Mettre à jour l'ID du prix seulement s'il a changé
					if (newPolarPriceId && newPolarPriceId !== product.polarPriceId) {
						await prisma.product.update({
							where: { id: product.id },
							data: {
								polarPriceId: newPolarPriceId,
							},
						});
					}

					return {
						success: true,
						message: "Produit et prix mis à jour sur Polar",
						polarProductId: product.polarProductId,
						polarPriceId: newPolarPriceId || product.polarPriceId,
						priceUpdated: true,
					};
				}
			}

			// Si erreur lors de la mise à jour du prix
			if (!priceUpdateResult.success) {
				return {
					success: false,
					error: `Erreur lors de la mise à jour du prix: ${priceUpdateResult.error}`,
				};
			}

			return {
				success: true,
				message: "Produit mis à jour sur Polar",
				polarProductId: product.polarProductId,
				polarPriceId: product.polarPriceId,
				priceUpdated: false,
			};
		}
	} catch (error) {
		console.error("Erreur lors de la synchronisation avec Polar:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue",
		};
	}
}

/**
 * Vérifie le statut de synchronisation d'un produit avec Polar
 */
export async function getProductPolarStatus(productIdentifier: string) {
	try {
		const product = await prisma.product.findFirst({
			where: {
				OR: [{ id: productIdentifier }, { slug: productIdentifier }],
			},
			select: {
				id: true,
				name: true,
				polarProductId: true,
				polarPriceId: true,
			},
		});

		if (!product) {
			return {
				success: false,
				error: "Produit non trouvé",
			};
		}

		const isSynced = Boolean(product.polarProductId);

		let polarProductExists = false;
		if (isSynced && product.polarProductId) {
			// Vérifier si le produit existe toujours sur Polar
			const polarResult = await getPolarProduct(product.polarProductId);
			polarProductExists = polarResult.success;
		}

		return {
			success: true,
			product: {
				id: product.id,
				name: product.name,
				isSynced,
				polarProductId: product.polarProductId,
				polarPriceId: product.polarPriceId,
				polarProductExists,
			},
		};
	} catch (error) {
		console.error("Erreur lors de la vérification du statut Polar:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue",
		};
	}
}
