import { useFetcher } from "react-router";
import { useLocalStorage } from "usehooks-ts";
import { useOptionalUser, useUserCart } from "~/root";
import type { getProducts } from "~/server/products.server";

// Type du produit inféré depuis le serveur
type Product = Awaited<ReturnType<typeof getProducts>>[number];

// Type d'un item du panier
type CartItem = {
	product: Product;
	quantity: number;
};

// Type du panier
type Cart = {
	items: CartItem[];
};

export const useCart = () => {
	const user = useOptionalUser();
	const userCart = useUserCart();
	const isAuthenticated = !!user;
	const fetcher = useFetcher();

	const [cart, setCart] = useLocalStorage<Cart>("cart", {
		items: userCart.items,
	});

	// Ajouter un produit au panier
	const addToCart = (product: Product, quantity: number = 1) => {
		console.log("addToCart", product, quantity);
		setCart((currentCart) => {
			const existingItemIndex = currentCart.items.findIndex(
				(item) => item.product.id === product.id,
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
					items: [...currentCart.items, { product, quantity }],
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
		setCart((currentCart) => ({
			items: currentCart.items.filter((item) => item.product.id !== productId),
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

		setCart((currentCart) => {
			const newItems = currentCart.items.map((item) =>
				item.product.id === productId ? { ...item, quantity } : item,
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

	// Vider le panier
	const clearCart = () => {
		setCart({ items: [] });

		// Synchroniser avec le serveur
		if (isAuthenticated) {
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
		return cart.items.some((item) => item.product.id === productId);
	};

	// Obtenir la quantité d'un produit dans le panier
	const getItemQuantity = (productId: string) => {
		const item = cart.items.find((item) => item.product.id === productId);
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
