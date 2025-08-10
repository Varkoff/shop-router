import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import type { getProducts } from '~/server/products.server';

export const ProductCard = ({
    product,
    className,
}: {
    product: Awaited<ReturnType<typeof getProducts>>[number];
    className?: string;
}) => {
    return (
        <Card
            className={cn(
                'rounded-none border bg-card text-card-foreground shadow-sm flex flex-col relative h-full overflow-hidden py-0',
                className
            )}
        >
            {/* Link clickable sur toute la card */}
            <Link
                to={`/products/${product.id}`}
                className="absolute inset-0 z-10"
                aria-label={`Voir les détails de ${product.name}`}
            />

            {/* image - 16:9 */}
            {product.imageUrl ? (
                <div className='w-full aspect-video bg-muted overflow-hidden flex-shrink-0'>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className='w-full h-full object-cover'
                    />
                </div>
            ) : (
                <div className='w-full aspect-video bg-muted flex-shrink-0' />
            )}

            <div className="flex flex-col flex-grow p-2 lg:p-4">
                <div className='pb-1 lg:pb-2 flex-shrink-0'>
                    <h3 className='text-sm lg:text-base font-semibold leading-tight truncate max-w-[30ch]'>
                        {product.name}
                    </h3>
                    <p className='text-xs lg:text-sm text-muted-foreground truncate max-w-[60ch] mt-1'>
                        {product.description}
                    </p>
                </div>

                <div className="flex-grow" />

                <div className='py-1 lg:py-2 flex-shrink-0 flex items-center justify-between'>
                    <div className='text-sm lg:text-base font-medium'>
                        {(product.priceCents / 100).toFixed(2)}{"\u00A0€"}
                    </div>
                    <Button
                        className='rounded-none p-2 lg:p-2.5 relative z-20'
                        size='sm'
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Logique pour ajouter au panier
                        }}
                        aria-label="Ajouter au panier"
                    >
                        <ShoppingCart className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};
