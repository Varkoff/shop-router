import { generateMeta } from "@forge42/seo-tools/remix/metadata";
import { breadcrumbs } from '@forge42/seo-tools/structured-data/breadcrumb';
import { product as structuredDataProduct } from '@forge42/seo-tools/structured-data/product';
import { Calendar, Check, ChevronRight, Clock, Minus, Package, Plus, Shield, ShoppingCart, Trash2, Truck } from "lucide-react";
import { data, Link, useLoaderData } from "react-router";
import { MarkdownComponent } from "~/components/markdown";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useCartContext } from "~/contexts/cart-context";
import { getProduct } from "~/server/customer/products.server";
import type { Route } from "./+types/products.$productSlug";
export async function loader({ params }: Route.LoaderArgs) {
    const productData = await getProduct({
        productSlug: params.productSlug,
    })
    if (!productData.product) {
        throw new Response(`Le produit ${params.productSlug} n'a pas été trouvé`,
            {
                status: 404
            }
        )
    }

    return data({ product: productData.product, productImages: productData.productImages });
}

export function meta({ loaderData, location }: Route.MetaArgs) {
    if (!loaderData?.product) {
        return [
            { title: "Produit non trouvé" },
            { name: "description", content: "Ce produit n'existe pas." }
        ];
    }

    const { product, productImages } = loaderData;
    const baseUrl = "https://localhost:5173"; // Replace with your actual domain

    return generateMeta({
        title: product.name,
        description: product.description || "",
        image: productImages[0]?.url,
        url: `${baseUrl}${location.pathname}`
    },
        [{
            "script:ld+json": structuredDataProduct({
                "@type": "Product",
                name: product.name,
                description: product.description || "",
                image: productImages.map(img => img.url),
                brand: {
                    "@type": "Brand",
                    name: "Shop Router" // Replace with your brand name
                },
                offers: {
                    "@type": "Offer",
                    url: `${baseUrl}${location.pathname}`,
                    priceCurrency: product.currency,
                    price: (product.priceCents / 100).toString(),
                    availability: product.stock > 0 && product.isActive
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                    seller: {
                        "@type": "Organization",
                        name: "Shop Router" // Replace with your organization name
                    }
                },
                aggregateRating: product.stock > 0 ? {
                    "@type": "AggregateRating",
                    ratingValue: "4.5",
                    reviewCount: "12"
                } : undefined,
                category: product.categories.map(cat => cat.name).join(", ")
            })
        }, {
            "script:ld+json": breadcrumbs(
                `${baseUrl}${location.pathname}`,
                ["Accueil", "Collection", product.name]
            )
        }])
}

const formatPrice = (priceCents: number, currency = "EUR") => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(priceCents / 100);
};

const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
};

export default function ProductDetails() {
    const { product, productImages } = useLoaderData<typeof loader>();
    const { addToCart, getItemQuantity, updateQuantity, removeFromCart } = useCartContext();

    const isInStock = product.stock > 0;
    const stockStatus = product.stock > 10 ? 'En stock' : product.stock > 0 ? `Plus que ${product.stock} en stock` : 'Rupture de stock';

    const currentQuantity = getItemQuantity(product.id);

    const handleAddToCart = () => {
        // Créer un produit compatible avec le type attendu par addToCart
        const cartProduct = {
            ...product,
            imageUrl: productImages[0]?.url
        };
        addToCart(cartProduct, 1);
    };

    const handleIncrement = () => {
        if (currentQuantity < product.stock) {
            updateQuantity(product.id, currentQuantity + 1);
        }
    };

    const handleDecrement = () => {
        if (currentQuantity > 1) {
            updateQuantity(product.id, currentQuantity - 1);
        } else {
            updateQuantity(product.id, 0); // This will remove the item
        }
    };

    const handleRemoveFromCart = () => {
        removeFromCart(product.id);
    };

    return (
        <div className="min-h-screen bg-white text-black">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="max-w-7xl mx-auto">

                    {/* Breadcrumb */}
                    <nav className="mb-8" aria-label="Breadcrumb">
                        <div className="flex items-center space-x-2 text-sm font-light">
                            <Link
                                to="/"
                                className="text-gray-500 hover:text-black transition-colors"
                            >
                                Accueil
                            </Link>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                            <Link
                                to="/products"
                                className="text-gray-500 hover:text-black transition-colors"
                            >
                                Collection
                            </Link>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">
                                {product.name}
                            </span>
                        </div>
                    </nav>

                    <div className="grid lg:grid-cols-2 gap-12 mb-16">

                        {/* Images Section */}
                        <div className="space-y-6">
                            <div className="aspect-[4/3] md:aspect-square bg-gray-50 rounded-3xl overflow-hidden">
                                <img
                                    src={productImages[0].url}
                                    alt={productImages[0].alt || product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {productImages.length > 1 && (
                                <div className="grid grid-cols-3 gap-4">
                                    {productImages.slice(1).map((image) => (
                                        <div key={image.id} className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                                            <img
                                                src={image.url}
                                                alt={image.alt || product.name}
                                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info Section */}
                        <div className="space-y-8">

                            {/* Header */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {product.categories.map((category) => (
                                        <Badge key={category.id} variant="secondary" className="font-light">
                                            {category.name}
                                        </Badge>
                                    ))}
                                    {!product.isActive && (
                                        <Badge variant="outline" className="font-light">
                                            Non disponible
                                        </Badge>
                                    )}
                                </div>

                                <h1 className="text-4xl md:text-5xl font-extralight tracking-tight leading-none">
                                    {product.name}
                                </h1>

                                {product.description && (
                                    <p className="text-lg text-gray-600 font-light leading-relaxed">
                                        {product.description}
                                    </p>
                                )}
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <div className="text-3xl font-light">
                                    {formatPrice(product.priceCents, product.currency)}
                                </div>
                                <div className="flex items-center gap-2">
                                    {isInStock ? (
                                        <>
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="text-green-600 font-light">{stockStatus}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="h-4 w-4 text-orange-500" />
                                            <span className="text-orange-500 font-light">{stockStatus}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Add to Cart */}
                            <div className="space-y-6">
                                {/* Add to Cart Button or Quantity Controls */}
                                <div className="space-y-3">
                                    {currentQuantity > 0 ? (
                                        <div className="space-y-3">
                                            {/* Quantity Controls with Cart and Trash Icons */}
                                            <div className="flex items-center justify-center gap-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleDecrement}
                                                    className="h-10 w-10 p-0"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>

                                                <div className="flex items-center gap-2">
                                                    <ShoppingCart className="h-4 w-4 text-green-600" />
                                                    <span className="w-12 text-center font-medium text-lg">
                                                        {currentQuantity}
                                                    </span>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleIncrement}
                                                    disabled={currentQuantity >= product.stock}
                                                    className="h-10 w-10 p-0"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRemoveFromCart}
                                                    className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:border-red-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Link
                                                to="/cart"
                                                className={buttonVariants({
                                                    size: "lg",
                                                    className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-medium"
                                                })}
                                            >
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                Voir le panier
                                            </Link>
                                        </div>
                                    ) : (
                                        <Button
                                            size="lg"
                                            onClick={handleAddToCart}
                                            disabled={!isInStock || !product.isActive}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            {isInStock && product.isActive
                                                ? 'Ajouter au panier'
                                                : 'Non disponible'
                                            }
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="flex flex-col items-center space-y-2">
                                        <Shield className="h-6 w-6 text-gray-400" />
                                        <span className="text-sm text-gray-500 font-light">Garantie 5 ans</span>
                                    </div>
                                    <div className="flex flex-col items-center space-y-2">
                                        <Truck className="h-6 w-6 text-gray-400" />
                                        <span className="text-sm text-gray-500 font-light">Livraison gratuite</span>
                                    </div>
                                    <div className="flex flex-col items-center space-y-2">
                                        <Package className="h-6 w-6 text-gray-400" />
                                        <span className="text-sm text-gray-500 font-light">Installation incluse</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-16" />

                    {/* Product Details */}
                    <div className="grid lg:grid-cols-3 gap-12">

                        {/* Content Section */}
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h2 className="text-2xl font-light mb-6">Description détaillée</h2>
                                {product.content ? (
                                    <MarkdownComponent content={product.content} />
                                ) : (
                                    <p className="text-gray-500 font-light">
                                        Aucune description détaillée disponible pour ce produit.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Product Info Card */}
                        <div>
                            <Card className="p-6 border border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-light mb-6">Informations produit</h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-light">Stock disponible</span>
                                        <span className="font-light">{product.stock} unités</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-light">Référence</span>
                                        <span className="font-light text-sm font-mono">{product.id.slice(-8).toUpperCase()}</span>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600 font-light">Ajouté le</span>
                                            <span className="text-sm font-light">{formatDate(product.createdAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600 font-light">Mis à jour le</span>
                                            <span className="text-sm font-light">{formatDate(product.updatedAt)}</span>
                                        </div>
                                    </div>

                                    {product.categories.length > 0 && (
                                        <>
                                            <Separator />
                                            <div>
                                                <span className="text-gray-600 font-light text-sm">Catégories</span>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {product.categories.map((category) => (
                                                        <Badge key={category.id} variant="outline" className="text-xs font-light">
                                                            {category.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
