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

	// localStorage uniquement pour les utilisateurs non connectés
	const [cartStorage, setCartStorage] = useLocalStorage<CartStorage>("cart", {
		items: [],
	});

	// Source de vérité selon l'état d'authentification
	const cart: Cart = useMemo(() => {
		if (isAuthenticated) {
			// Utilisateurs connectés : serveur comme source de vérité
			return {
				items: userCart.items.map((item) => ({
					product: item.product,
					quantity: item.quantity,
				})),
			};
		} else {
			// Utilisateurs non connectés : localStorage
			const enrichedItems: CartItem[] = [];
			const productsMap = new Map(
				products.map((product) => [product.id, product]),
			);

			for (const storageItem of cartStorage.items) {
				const serverProduct = productsMap.get(storageItem.productId);
				if (serverProduct) {
					enrichedItems.push({
						product: serverProduct,
						quantity: storageItem.quantity,
					});
				}
			}

			return { items: enrichedItems };
		}
	}, [isAuthenticated, userCart, cartStorage, products]);

	// Ajouter un produit au panier
	const addToCart = (product: Product, quantity: number = 1) => {
		if (isAuthenticated) {
			// Utilisateurs connectés : action serveur uniquement
			const formData = new FormData();
			formData.set("intent", "add-to-cart");
			formData.set("productId", product.id);
			formData.set("quantity", quantity.toString());
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		} else {
			// Utilisateurs non connectés : localStorage
			setCartStorage((currentCart) => {
				const existingItemIndex = currentCart.items.findIndex(
					(item) => item.productId === product.id,
				);

				if (existingItemIndex >= 0) {
					const newItems = [...currentCart.items];
					newItems[existingItemIndex] = {
						...newItems[existingItemIndex],
						quantity: newItems[existingItemIndex].quantity + quantity,
					};
					return { items: newItems };
				} else {
					return {
						items: [...currentCart.items, { productId: product.id, quantity }],
					};
				}
			});
		}
	};

	// Retirer un produit du panier
	const removeFromCart = (productId: string) => {
		if (isAuthenticated) {
			// Utilisateurs connectés : action serveur uniquement
			const formData = new FormData();
			formData.set("intent", "remove-from-cart");
			formData.set("productId", productId);
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		} else {
			// Utilisateurs non connectés : localStorage
			setCartStorage((currentCart) => ({
				items: currentCart.items.filter((item) => item.productId !== productId),
			}));
		}
	};

	// Modifier la quantité d'un produit
	const updateQuantity = (productId: string, quantity: number) => {
		if (quantity <= 0) {
			removeFromCart(productId);
			return;
		}

		if (isAuthenticated) {
			// Utilisateurs connectés : action serveur uniquement
			const formData = new FormData();
			formData.set("intent", "update-quantity");
			formData.set("productId", productId);
			formData.set("quantity", quantity.toString());
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		} else {
			// Utilisateurs non connectés : localStorage
			setCartStorage((currentCart) => {
				const newItems = currentCart.items.map((item) =>
					item.productId === productId ? { ...item, quantity } : item,
				);
				return { items: newItems };
			});
		}
	};

	type ClearCartProps = { disableAuthenticatedClearCart?: boolean };
	// Vider le panier
	const clearCart = ({
		disableAuthenticatedClearCart = false,
	}: ClearCartProps = {}) => {
		if (cart.items.length === 0) return;

		if (isAuthenticated && !disableAuthenticatedClearCart) {
			// Utilisateurs connectés : action serveur uniquement
			const formData = new FormData();
			formData.set("intent", "clear-cart");
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		} else if (!isAuthenticated) {
			// Utilisateurs non connectés : localStorage uniquement
			setCartStorage({ items: [] });
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
		if (isAuthenticated) {
			return cart.items.some((item) => item.product.id === productId);
		} else {
			return cartStorage.items.some((item) => item.productId === productId);
		}
	};

	// Obtenir la quantité d'un produit dans le panier
	const getItemQuantity = (productId: string) => {
		if (isAuthenticated) {
			const item = cart.items.find((item) => item.product.id === productId);
			return item?.quantity || 0;
		} else {
			const item = cartStorage.items.find(
				(item) => item.productId === productId,
			);
			return item?.quantity || 0;
		}
	};

	// Migrer le panier localStorage vers le serveur (appelé lors de la connexion)
	const migrateLocalCartToServer = () => {
		if (!isAuthenticated || cartStorage.items.length === 0) return;

		// Envoyer chaque item du localStorage vers le serveur
		for (const item of cartStorage.items) {
			const formData = new FormData();
			formData.set("intent", "add-to-cart");
			formData.set("productId", item.productId);
			formData.set("quantity", item.quantity.toString());
			fetcher.submit(formData, {
				method: "POST",
				action: "/api/cart",
			});
		}

		// Vider le localStorage après migration
		setCartStorage({ items: [] });
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
		migrateLocalCartToServer,
	};
};
