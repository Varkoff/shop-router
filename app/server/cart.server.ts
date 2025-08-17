import { prisma } from "~/server/db.server";

export async function getUserCart(userId: string) {
	const cart = await prisma.cart.findUnique({
		where: { userId },
		include: {
			items: {
				include: {
					product: {
						include: {
							images: true,
							categories: true,
						},
					},
				},
			},
		},
	});

	if (!cart) {
		return { items: [] };
	}

	// Transformer les données pour correspondre au format attendu par le hook
	const items = cart.items.map((item) => ({
		product: {
			id: item.product.id,
			name: item.product.name,
			slug: item.product.slug,
			description: item.product.description,
			priceCents: item.product.priceCents,
			currency: item.product.currency,
			stock: item.product.stock,
			isActive: item.product.isActive,
			createdAt: item.product.createdAt,
			updatedAt: item.product.updatedAt,
			categories: item.product.categories,
			images: item.product.images.map((img) => ({
				id: img.id,
				url: img.url,
				alt: img.alt,
			})),
			imageUrl: item.product.images[0]?.url || "",
		},
		quantity: item.quantity,
	}));

	return { items };
}

export async function addToCart({
	userId,
	productId,
	quantity,
}: {
	userId: string;
	productId: string;
	quantity: number;
}) {
	// Vérifier que le produit existe et est actif
	const product = await prisma.product.findUnique({
		where: { id: productId },
		select: { id: true, isActive: true, stock: true, priceCents: true },
	});

	if (!product || !product.isActive) {
		throw new Error("Product not found or inactive");
	}

	if (product.stock < quantity) {
		throw new Error("Insufficient stock");
	}

	// Assurer qu'un panier existe pour l'utilisateur
	const cart = await prisma.cart.upsert({
		where: { userId },
		update: {},
		create: { userId },
	});

	// Ajouter ou mettre à jour l'item du panier
	const existingItem = await prisma.cartItem.findFirst({
		where: { cartId: cart.id, productId },
	});

	if (existingItem) {
		const newQuantity = existingItem.quantity + quantity;
		if (newQuantity > product.stock) {
			throw new Error("Insufficient stock");
		}

		await prisma.cartItem.update({
			where: { id: existingItem.id },
			data: { quantity: newQuantity },
		});
	} else {
		await prisma.cartItem.create({
			data: {
				cartId: cart.id,
				productId,
				quantity,
				unitPriceCents: product.priceCents,
			},
		});
	}

	return { success: true };
}

export async function removeFromCart({
	userId,
	productId,
}: {
	userId: string;
	productId: string;
}) {
	const cart = await prisma.cart.findUnique({
		where: { userId },
	});

	if (cart) {
		await prisma.cartItem.deleteMany({
			where: { cartId: cart.id, productId },
		});
	}

	return { success: true };
}

export async function updateCartQuantity({
	userId,
	productId,
	quantity,
}: {
	userId: string;
	productId: string;
	quantity: number;
}) {
	const cart = await prisma.cart.findUnique({
		where: { userId },
	});

	if (!cart) {
		return { success: true }; // Pas de panier = rien à faire
	}

	if (quantity === 0) {
		// Supprimer l'item
		await prisma.cartItem.deleteMany({
			where: { cartId: cart.id, productId },
		});
	} else {
		// Vérifier le stock
		const product = await prisma.product.findUnique({
			where: { id: productId },
			select: { stock: true, isActive: true, priceCents: true },
		});

		if (!product || !product.isActive) {
			throw new Error("Product not found or inactive");
		}

		if (product.stock < quantity) {
			throw new Error("Insufficient stock");
		}

		await prisma.cartItem.upsert({
			where: {
				cartId_productId: {
					cartId: cart.id,
					productId,
				},
			},
			update: { quantity },
			create: {
				cartId: cart.id,
				productId,
				quantity,
				unitPriceCents: product.priceCents,
			},
		});
	}

	return { success: true };
}

export async function clearCart({ userId }: { userId: string }) {
	const cart = await prisma.cart.findUnique({
		where: { userId },
	});

	if (cart) {
		await prisma.cartItem.deleteMany({
			where: { cartId: cart.id },
		});
	}

	return { success: true };
}
