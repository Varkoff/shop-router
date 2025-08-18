import { Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface CartHeaderProps {
    totalItems: number
    onClearCart: () => void
}

export const CartHeader = ({ totalItems, onClearCart }: CartHeaderProps) => {
    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-light mb-2 tracking-tight">
                    Panier
                </h1>
                <p className="text-gray-600 font-light">
                    {totalItems} article{totalItems > 1 ? 's' : ''}
                </p>
            </div>
            <Button
                variant="outline"
                onClick={onClearCart}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Vider le panier
            </Button>
        </div>
    )
}
