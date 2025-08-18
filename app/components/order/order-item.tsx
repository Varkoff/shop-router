import { href, Link } from 'react-router';

interface OrderItemData {
    id: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    totalPriceCents: number;
    product?: {
        slug?: string;
        images?: {
            url: string;
            alt?: string | null;
        }[];
    } | null;
}

interface OrderItemProps {
    item: OrderItemData;
    showDetails?: boolean;
}

export const OrderItemComponent = ({ item, showDetails = false }: OrderItemProps) => {
    return (
        <div className="flex items-center gap-3">
            {/* Image du produit */}
            <div className="flex-shrink-0">
                {item.product?.images?.[0]?.url ? (
                    <img
                        src={item.product.images[0].url}
                        alt={item.product.images[0].alt || item.productName}
                        className={showDetails ? "w-16 h-16 object-cover rounded-lg" : "w-10 h-10 object-cover rounded"}
                    />
                ) : (
                    <div className={`bg-gray-100 rounded ${showDetails ? "w-16 h-16" : "w-10 h-10"} flex items-center justify-center`}>
                        <span className="text-gray-400 text-xs">{showDetails ? "Pas d'image" : "?"}</span>
                    </div>
                )}
            </div>

            {/* Informations du produit */}
            <div className="flex-1 min-w-0">
                {item.product?.slug ? (
                    <Link
                        to={href('/products/:productSlug', { productSlug: item.product.slug })}
                        className={`font-medium hover:text-blue-600 transition-colors ${showDetails ? "text-lg leading-tight mb-1" : "text-sm"} truncate block`}
                    >
                        {item.productName}
                    </Link>
                ) : (
                    <h3 className={`font-medium ${showDetails ? "text-lg leading-tight mb-1" : "text-sm"} truncate`}>
                        {item.productName}
                    </h3>
                )}

                {showDetails ? (
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">
                            Quantité: {item.quantity}
                        </span>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">
                                {(item.unitPriceCents / 100).toLocaleString('fr-FR')}€ × {item.quantity}
                            </div>
                            <div className="font-medium">
                                {(item.totalPriceCents / 100).toLocaleString('fr-FR')}€
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">
                        Quantité: {item.quantity} • {(item.unitPriceCents / 100).toLocaleString('fr-FR')}€
                    </p>
                )}
            </div>
        </div>
    );
};
