import type { z } from "zod";
import type { ProductSchema } from "~/routes/admin+/products.$productSlug";
import { prisma } from "../db.server";

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
