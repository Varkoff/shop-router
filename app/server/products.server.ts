import { prisma } from "./db.server";

export async function getProducts() {
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
		where: {
			isActive: true,
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

export async function getProductBySlug({
	productSlug,
}: {
	productSlug: string;
}) {
	const product = await prisma.product.findUnique({
		where: {
			slug: productSlug,
		},
		select: {
			id: true,
			name: true,
			description: true,
			priceCents: true,
			slug: true,
			content: true,
			stock: true,
			images: true,
			updatedAt: true,
			createdAt: true,
			currency: true,
			categories: true,
			isActive: true,
			polarPriceId: true,
			polarProductId: true,
		},
	});

	let productImages: {
		id: string;
		url: string;
		alt: string;
	}[] = [];

	if (product) {
		productImages =
			product?.images.length > 0
				? product?.images.map((image) => ({
						id: image.id,
						url: image.url,
						alt: image.alt || product.name,
					}))
				: [
						{
							id: "placeholder-1",
							url: `https://picsum.photos/seed/${encodeURIComponent(String(product.id))}/800/600`,
							alt: product.name,
						},
						{
							id: "placeholder-2",
							url: `https://picsum.photos/seed/${encodeURIComponent(String(product.id))}-2/800/600`,
							alt: `${product.name} - Vue 2`,
						},
						{
							id: "placeholder-3",
							url: `https://picsum.photos/seed/${encodeURIComponent(String(product.id))}-3/800/600`,
							alt: `${product.name} - Vue 3`,
						},
					];
	}

	return { product, productImages };
}

export async function getProductById({ productId }: { productId: string }) {
	const product = await prisma.product.findUnique({
		where: {
			id: productId,
		},
		select: {
			id: true,
			name: true,
			description: true,
			priceCents: true,
			slug: true,
			content: true,
			stock: true,
			images: true,
			updatedAt: true,
			createdAt: true,
			currency: true,
			categories: true,
			isActive: true,
			polarPriceId: true,
			polarProductId: true,
		},
	});

	let productImages: {
		id: string;
		url: string;
		alt: string;
	}[] = [];

	if (product) {
		productImages =
			product?.images.length > 0
				? product?.images.map((image) => ({
						id: image.id,
						url: image.url,
						alt: image.alt || product.name,
					}))
				: [
						{
							id: "placeholder-1",
							url: `https://picsum.photos/seed/${encodeURIComponent(String(product.id))}/800/600`,
							alt: product.name,
						},
						{
							id: "placeholder-2",
							url: `https://picsum.photos/seed/${encodeURIComponent(String(product.id))}-2/800/600`,
							alt: `${product.name} - Vue 2`,
						},
						{
							id: "placeholder-3",
							url: `https://picsum.photos/seed/${encodeURIComponent(String(product.id))}-3/800/600`,
							alt: `${product.name} - Vue 3`,
						},
					];
	}

	return { product, productImages };
}
