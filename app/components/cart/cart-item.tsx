import { Minus, Plus, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import type { CartItem as CartItemType } from '~/hooks/use-cart'

interface CartItemProps {
    item: CartItemType
    onRemove: (productId: string) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
}

export const CartItem = ({ item, onRemove, onUpdateQuantity }: CartItemProps) => {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Image du produit */}
                    <div className="flex-shrink-0">
                        <div
                            className="w-20 h-20 bg-gray-100 rounded-lg bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${item.product.imageUrl})`
                            }}
                        />
                    </div>

                    {/* Informations du produit */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-medium text-lg leading-tight">
                                    {item.product.name}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-2 font-light">
                                    {item.product.description}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(item.product.id)}
                                className="text-gray-400 hover:text-red-600 p-1"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Prix et contrôles quantité */}
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-medium">
                                {(item.product.priceCents / 100).toLocaleString('fr-FR')}€
                            </div>

                            {/* Contrôles de quantité */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                    className="h-8 w-8 p-0"
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                    {item.quantity}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                    className="h-8 w-8 p-0"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
