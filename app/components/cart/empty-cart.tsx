import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export const EmptyCart = () => {
    return (
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-16">
                        <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                        <h1 className="text-3xl font-light mb-4 text-gray-900">
                            Votre panier est vide
                        </h1>
                        <p className="text-gray-600 mb-8 font-light">
                            Découvrez notre collection de robots et ajoutez vos favoris
                        </p>
                        <Link to="/products">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-medium">
                                Voir la collection
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
