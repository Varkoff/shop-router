import { prisma } from "./db.server";

export async function getProducts() {
	const products = await prisma.product.findMany({
		select: {
			id: true,
			name: true,
			description: true,
			priceCents: true,
		},
	});

	// attach a placeholder image URL for each product using picsum (stable per id)
	return products.map((p) => ({
		...p,
		imageUrl: `https://picsum.photos/seed/${encodeURIComponent(String(p.id))}/600/400`,
	}));
}
