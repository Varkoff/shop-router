import { useMemo } from "react";
import { useFetcher } from "react-router";
import { useLocalStorage } from "usehooks-ts";
import { useOptionalUser, useProducts, useUserCart } from "~/root";
import type { getProducts } from "~/server/customer/products.server";

// Type du produit inféré depuis le serveur
type Product = Awaited<ReturnType<typeof getProducts>>[number];

// Type d'un item du panier (localStorage) - minimal
export type CartItemStorage = {
	productId: string;
	quantity: number;
};

// Type du panier (localStorage) - minimal
export type CartStorage = {
	items: CartItemStorage[];
};

// Type d'un item du panier enrichi (pour l'UI)
export type CartItem = {
	product: Product;
	quantity: number;
};

// Type du panier enrichi (pour l'UI)
export type Cart = {
	items: CartItem[];
};

export const useCart = () => {
	const user = useOptionalUser();
	const userCart = useUserCart();
	const products = useProducts();
	const isAuthenticated = !!user;
	const fetcher = useFetcher();

	// localStorage contient seulement productId + quantity
	const [cartStorage, setCartStorage] = useLocalStorage<CartStorage>("cart", {
		items: userCart.items.map((item) => ({
			productId: item.product.id,
			quantity: item.quantity,
		})),
	});

	// Enrichir le panier avec les données serveur
	const cart: Cart = useMemo(() => {
		const enrichedItems: CartItem[] = [];

		// Créer une map des produits pour un accès plus rapide
		// Priorité : panier utilisateur connecté, sinon tous les produits
		const allProducts =
			isAuthenticated && userCart.items.length > 0
				? userCart.items.map((item) => item.product)
				: products;

		const productsMap = new Map(
			allProducts.map((product) => [product.id, product]),
		);

		for (const storageItem of cartStorage.items) {
			// Chercher le produit dans les données serveur
			const serverProduct = productsMap.get(storageItem.productId);

			if (serverProduct) {
				enrichedItems.push({
					product: serverProduct,
					quantity: storageItem.quantity,
				});
			}
		}

		return { items: enrichedItems };
	}, [cartStorage, userCart, products, isAuthenticated]);

	// Ajouter un produit au panier
	const addToCart = (product: Product, quantity: number = 1) => {
		console.log("addToCart", product, quantity);
		setCartStorage((currentCart) => {
			const existingItemIndex = currentCart.items.findIndex(
				(item) => item.productId === product.id,
			);

			if (existingItemIndex >= 0) {
				// Le produit existe déjà, on augmente la quantité
				const newItems = [...currentCart.items];
				newItems[existingItemIndex] = {
					...newItems[existingItemIndex],
					quantity: newItems[existingItemIndex].quantity + quantity,
				};
				return { items: newItems };
			} else {
				// Nouveau produit
				return {
					items: [...currentCart.items, { productId: product.id, quantity }],
				};
			}
		});

		// Synchroniser avec le serveur immédiatement pour cette action
		if (isAuthenticated) {
			const formData = new FormData();
			formData.set("intent", "add-to-cart");
			formData.set("productId", product.id);
			formData.set("quantity", quantity.toString());
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		}
	};

	// Retirer un produit du panier
	const removeFromCart = (productId: string) => {
		setCartStorage((currentCart) => ({
			items: currentCart.items.filter((item) => item.productId !== productId),
		}));

		// Synchroniser avec le serveur
		if (isAuthenticated) {
			const formData = new FormData();
			formData.set("intent", "remove-from-cart");
			formData.set("productId", productId);
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		}
	};

	// Modifier la quantité d'un produit
	const updateQuantity = (productId: string, quantity: number) => {
		if (quantity <= 0) {
			removeFromCart(productId);
			return;
		}

		setCartStorage((currentCart) => {
			const newItems = currentCart.items.map((item) =>
				item.productId === productId ? { ...item, quantity } : item,
			);
			return { items: newItems };
		});

		// Synchroniser avec le serveur
		if (isAuthenticated) {
			const formData = new FormData();
			formData.set("intent", "update-quantity");
			formData.set("productId", productId);
			formData.set("quantity", quantity.toString());
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		}
	};

	type ClearCartProps = { disableAuthenticatedClearCart?: boolean };
	// Vider le panier
	const clearCart = ({
		disableAuthenticatedClearCart = false,
	}: ClearCartProps = {}) => {
		if (cart.items.length === 0) return;
		setCartStorage({ items: [] });

		// Synchroniser avec le serveur
		if (isAuthenticated && !disableAuthenticatedClearCart) {
			const formData = new FormData();
			formData.set("intent", "clear-cart");
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		}
	};

	// Calculer le total du panier
	const getTotalPrice = () => {
		return cart.items.reduce((total, item) => {
			return total + item.product.priceCents * item.quantity;
		}, 0);
	};

	// Calculer le nombre total d'articles
	const getTotalItems = () => {
		return cart.items.reduce((total, item) => total + item.quantity, 0);
	};

	// Vérifier si un produit est dans le panier
	const isInCart = (productId: string) => {
		return cartStorage.items.some((item) => item.productId === productId);
	};

	// Obtenir la quantité d'un produit dans le panier
	const getItemQuantity = (productId: string) => {
		const item = cartStorage.items.find((item) => item.productId === productId);
		return item?.quantity || 0;
	};

	return {
		cart,
		addToCart,
		removeFromCart,
		updateQuantity,
		clearCart,
		getTotalPrice,
		getTotalItems,
		isInCart,
		getItemQuantity,
	};
};
