import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useCartContext } from '~/contexts/cart-context';
import { signOut } from '~/lib/auth-client';
import { useOptionalUser } from '~/root';
import { Button, buttonVariants } from '../ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Separator } from '../ui/separator';

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const user = useOptionalUser();
    const { cart, getTotalItems, getTotalPrice, removeFromCart, updateQuantity } = useCartContext();

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    };

    return (
        <nav className='bg-white border-b border-gray-200 sticky top-0 z-50'>
            <div className='container mx-auto px-6'>
                <div className='flex items-center justify-between h-16'>
                    {/* Logo */}
                    <Link to='/' className='flex items-center space-x-2'>
                        <div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg'></div>
                        <span className='text-xl font-light text-black'>NEXUS</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className='hidden md:flex items-center space-x-8'>
                        <Link
                            to='/'
                            className='text-gray-600 hover:text-black font-light transition-colors duration-200'
                        >
                            Accueil
                        </Link>
                        <Link
                            to='/products'
                            className='text-gray-600 hover:text-black font-light transition-colors duration-200'
                        >
                            Produits
                        </Link>
                        <Link
                            to='/about'
                            className='text-gray-600 hover:text-black font-light transition-colors duration-200'
                        >
                            À propos
                        </Link>
                        <Link
                            to='/contact'
                            className='text-gray-600 hover:text-black font-light transition-colors duration-200'
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Right Side Actions */}
                    <div className='flex items-center space-x-4'>
                        {/* Cart Icon with Hover Card */}
                        <HoverCard openDelay={100} closeDelay={200}>
                            <HoverCardTrigger asChild>
                                <Link
                                    to="/cart"
                                    className='relative p-2 text-gray-600 hover:text-black transition-colors duration-200 block'
                                    aria-label='Panier'
                                >
                                    <ShoppingCart className="w-6 h-6" />
                                    {getTotalItems() > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {getTotalItems()}
                                        </span>
                                    )}
                                </Link>
                            </HoverCardTrigger>

                            {getTotalItems() > 0 && (
                                <HoverCardContent className="w-80 p-0" align="end" side="bottom">
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-gray-900">Panier</h3>
                                            <span className="text-sm text-gray-500">{getTotalItems()} article{getTotalItems() > 1 ? 's' : ''}</span>
                                        </div>

                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {cart.items.slice(0, 3).map((item) => (
                                                <div key={item.product.id} className="flex items-center gap-3">
                                                    <div
                                                        className="w-12 h-12 bg-gray-100 rounded-lg bg-cover bg-center flex-shrink-0"
                                                        style={{ backgroundImage: `url(${item.product.imageUrl})` }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {item.product.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {(item.product.priceCents / 100).toLocaleString('fr-FR')}€
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="text-sm font-medium w-6 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeFromCart(item.product.id)}
                                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {cart.items.length > 3 && (
                                                <div className="text-center text-sm text-gray-500">
                                                    et {cart.items.length - 3} autre{cart.items.length - 3 > 1 ? 's' : ''} article{cart.items.length - 3 > 1 ? 's' : ''}...
                                                </div>
                                            )}
                                        </div>

                                        <Separator className="my-3" />

                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-gray-900">Total</span>
                                            <span className="font-medium text-gray-900">
                                                {(getTotalPrice() / 100).toLocaleString('fr-FR')}€
                                            </span>
                                        </div>

                                        <Link
                                            to="/cart"
                                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 font-medium text-sm transition-colors"
                                        >
                                            Voir le panier
                                        </Link>
                                    </div>
                                </HoverCardContent>
                            )}
                        </HoverCard>
                    </div>

                    {/* Auth Buttons */}
                    <div className='hidden md:flex items-center space-x-3'>
                        {user ? (
                            <>
                                <span className='text-gray-600 font-light'>
                                    Bonjour, {user.name}
                                </span>
                                <Link
                                    to='/admin'
                                    className={buttonVariants({
                                        size: 'sm',
                                        variant: 'outline',
                                        className: 'font-light',
                                    })}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    type='button'
                                    onClick={handleSignOut}
                                    className={buttonVariants({
                                        size: 'sm',
                                        variant: 'ghost',
                                        className: 'text-gray-600 hover:text-red-600 font-light',
                                    })}
                                >
                                    Déconnexion
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to='/login'
                                    className={buttonVariants({
                                        variant: 'ghost',
                                        size: 'sm',
                                        className: 'text-gray-600 hover:text-black font-light',
                                    })}
                                >
                                    Connexion
                                </Link>

                                <Link
                                    to='/register'
                                    className={buttonVariants({
                                        size: 'sm',
                                        className:
                                            'bg-blue-600 hover:bg-blue-700 text-white font-medium px-6',
                                    })}
                                >
                                    S'inscrire
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        type='button'
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className='md:hidden p-2 text-gray-600 hover:text-black transition-colors duration-200'
                        aria-label={
                            isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'
                        }
                    >
                        <svg
                            className='w-6 h-6'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            role='img'
                            aria-label={isMobileMenuOpen ? 'Icône fermer' : 'Icône menu'}
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={1.5}
                                d={
                                    isMobileMenuOpen
                                        ? 'M6 18L18 6M6 6l12 12'
                                        : 'M4 6h16M4 12h16M4 18h16'
                                }
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className='md:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto'>
                    <div className='px-6 py-8 h-full flex flex-col'>
                        {/* Mobile Navigation Links */}
                        <div className='space-y-8 flex-1'>
                            <Link
                                to='/'
                                className='block text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2'
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Accueil
                            </Link>
                            <Link
                                to='/products'
                                className='block text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2'
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Produits
                            </Link>
                            <Link
                                to='/about'
                                className='block text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2'
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                À propos
                            </Link>
                            <Link
                                to='/contact'
                                className='block text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2'
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>
                            <Link
                                to='/cart'
                                className='flex items-center text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2'
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Panier
                                {getTotalItems() > 0 && (
                                    <span className="ml-2 bg-blue-600 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center font-medium">
                                        {getTotalItems()}
                                    </span>
                                )}
                            </Link>
                        </div>

                        {/* Mobile Auth Buttons */}
                        <div className='space-y-4 pt-8 border-t border-gray-200'>
                            {user ? (
                                <>
                                    <div className='text-center py-4'>
                                        <span className='text-xl text-gray-700 font-light'>
                                            Bonjour, {user.name}
                                        </span>
                                    </div>
                                    <Link
                                        to='/admin'
                                        className={buttonVariants({
                                            size: 'lg',
                                            variant: 'outline',
                                            className: 'w-full justify-center text-xl font-light py-4',
                                        })}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            handleSignOut();
                                        }}
                                        className={buttonVariants({
                                            size: 'lg',
                                            variant: 'ghost',
                                            className: 'w-full justify-center text-xl text-gray-700 hover:text-red-600 font-light py-4',
                                        })}
                                    >
                                        Déconnexion
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to='/login'
                                        className={buttonVariants({
                                            variant: 'ghost',
                                            size: 'lg',
                                            className: 'w-full justify-center text-xl text-gray-700 hover:text-black font-light py-4',
                                        })}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Connexion
                                    </Link>
                                    <Link
                                        to='/register'
                                        className={buttonVariants({
                                            size: 'lg',
                                            className: 'w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 text-xl',
                                        })}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        S'inscrire
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav >
    );
}