import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useCartContext } from '~/contexts/cart-context'

export default function CartRoute() {
    const {
        cart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems
    } = useCartContext()

    if (cart.items.length === 0) {
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
                                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-medium">
                                    Voir la collection
                                </Button>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-light mb-2 tracking-tight">
                                Panier
                            </h1>
                            <p className="text-gray-600 font-light">
                                {getTotalItems()} article{getTotalItems() > 1 ? 's' : ''}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={clearCart}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Vider le panier
                        </Button>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* Liste des articles */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.items.map((item) => (
                                <Card key={item.product.id} className="overflow-hidden">
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
                                                        onClick={() => removeFromCart(item.product.id)}
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
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
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
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
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
                            ))}
                        </div>

                        {/* Résumé de commande */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle className="text-xl font-light">
                                        Résumé de commande
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">

                                    {/* Détail des prix */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                Sous-total ({getTotalItems()} article{getTotalItems() > 1 ? 's' : ''})
                                            </span>
                                            <span>{(getTotalPrice() / 100).toLocaleString('fr-FR')}€</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Livraison</span>
                                            <span className="text-green-600">Gratuite</span>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between text-lg font-medium">
                                            <span>Total</span>
                                            <span>{(getTotalPrice() / 100).toLocaleString('fr-FR')}€</span>
                                        </div>
                                    </div>

                                    {/* Boutons d'action */}
                                    <div className="space-y-3 pt-4">
                                        <Button
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-full font-medium"
                                            size="lg"
                                        >
                                            Commander maintenant
                                        </Button>
                                        <Link to="/products" className="block">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                size="lg"
                                            >
                                                Continuer mes achats
                                            </Button>
                                        </Link>
                                    </div>

                                    {/* Informations supplémentaires */}
                                    <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
                                        <p>✓ Livraison gratuite</p>
                                        <p>✓ Retour sous 30 jours</p>
                                        <p>✓ Garantie 2 ans</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
