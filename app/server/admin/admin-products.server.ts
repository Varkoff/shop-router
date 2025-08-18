import { prisma } from "../db.server";
import { deleteStripeProduct, updateStripeProduct } from "../stripe.server";

type ProductData = {
	name: string;
	slug: string;
	description?: string;
	content?: string;
	priceCents: number;
	currency: string;
	stock: number;
	isActive: boolean;
};

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
	data: ProductData;
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
	data: ProductData;
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

	// Update Stripe product if it exists
	try {
		await updateStripeProduct(updatedProduct.id);
	} catch (error) {
		// Log error but don't fail the update
		console.error("Failed to update Stripe product:", error);
	}

	return { ...updatedProduct, hasUpdatedSlug };
}

export async function deleteProduct(productSlug: string) {
	// Get product ID first for Stripe cleanup
	const product = await prisma.product.findUnique({
		where: { slug: productSlug },
		select: { id: true },
	});

	if (!product) {
		throw new Error("Product not found");
	}

	// Delete from Stripe first (if it exists)
	try {
		await deleteStripeProduct(product.id);
	} catch (error) {
		// Log error but don't fail the deletion
		console.error("Failed to delete Stripe product:", error);
	}

	// Then delete from database
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

export async function adminGetProduct({ productId }: { productId: string }) {
	return await prisma.product.findUnique({
		where: { id: productId },
		select: {
			id: true,
			name: true,
			description: true,
			priceCents: true,
			currency: true,
			stripeProductId: true,
			stripePriceId: true,
			images: {
				select: {
					url: true,
				},
			},
		},
	});
}
