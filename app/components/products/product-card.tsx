import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

import { cn } from '~/lib/utils';
import type { getProducts } from '~/server/customer/products.server';

export const ProductCard = ({
    product,
    className,
}: {
    product: Awaited<ReturnType<typeof getProducts>>[number];
    className?: string;
}) => {
    const backgroundImage = product.imageUrl
        ? `url(${product.imageUrl})`
        : undefined;

    return (
        <Card
            className={cn(
                'border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col relative h-full overflow-hidden group min-h-[400px] md:min-h-[450px]',
                className
            )}
            style={{
                backgroundImage,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Overlay gradient pour la lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Link clickable sur toute la card */}
            <Link
                to={`/products/${product.slug}`}
                className="absolute inset-0 z-10"
                aria-label={`Voir les détails de ${product.name}`}
            />

            {/* Placeholder si pas d'image */}
            {!product.imageUrl && (
                <div className='absolute inset-0 bg-gray-50 flex items-center justify-center'>
                    <div className="w-16 md:w-20 h-20 md:h-28 bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg" />
                </div>
            )}

            {/* Contenu en bas de la card */}
            <div className="flex flex-col justify-end h-full p-4 md:p-6 relative z-5">
                <div className='mb-3 md:mb-4 flex-shrink-0'>
                    <h3 className='text-xl md:text-2xl font-light mb-1 md:mb-2 leading-tight text-white'>
                        {product.name}
                    </h3>
                    <p className='text-white/80 font-light text-sm leading-relaxed line-clamp-2'>
                        {product.description}
                    </p>
                </div>

                <div className='flex items-center justify-between'>
                    <div className='text-sm text-white/70 font-light'>
                        À partir de {(product.priceCents / 100).toLocaleString('fr-FR')}€
                    </div>
                    <Button
                        className='bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 relative z-20 font-medium text-sm'
                        size='sm'
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Navigation vers la page produit (géré par le Link parent)
                        }}
                        aria-label="Voir le produit"
                    >
                        <ShoppingCart className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden md:inline">Voir le produit</span>
                        <span className="md:hidden">→</span>
                    </Button>
                </div>
            </div>
        </Card>
    );
};
