import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../ui/button";

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
                        <span className="text-xl font-light text-black">NEXUS</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/"
                            className="text-gray-600 hover:text-black font-light transition-colors duration-200"
                        >
                            Accueil
                        </Link>
                        <Link
                            to="/products"
                            className="text-gray-600 hover:text-black font-light transition-colors duration-200"
                        >
                            Produits
                        </Link>
                        <Link
                            to="/about"
                            className="text-gray-600 hover:text-black font-light transition-colors duration-200"
                        >
                            À propos
                        </Link>
                        <Link
                            to="/contact"
                            className="text-gray-600 hover:text-black font-light transition-colors duration-200"
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Cart Icon */}
                        <button
                            type="button"
                            className="p-2 text-gray-600 hover:text-black transition-colors duration-200"
                            aria-label="Panier"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                role="img"
                                aria-label="Icône panier"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h7M17 18a1 1 0 11-2 0 1 1 0 012 0zM9 18a1 1 0 11-2 0 1 1 0 012 0z"
                                />
                            </svg>
                        </button>

                        {/* Auth Buttons */}
                        <div className="hidden md:flex items-center space-x-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-black font-light"
                            >
                                Connexion
                            </Button>
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-full px-6"
                            >
                                S'inscrire
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-black transition-colors duration-200"
                            aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                role="img"
                                aria-label={isMobileMenuOpen ? "Icône fermer" : "Icône menu"}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto">
                        <div className="px-6 py-8 h-full flex flex-col">
                            {/* Mobile Navigation Links */}
                            <div className="space-y-8 flex-1">
                                <Link
                                    to="/"
                                    className="block text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Accueil
                                </Link>
                                <Link
                                    to="/products"
                                    className="block text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Produits
                                </Link>
                                <Link
                                    to="/about"
                                    className="block text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    À propos
                                </Link>
                                <Link
                                    to="/contact"
                                    className="block text-2xl text-gray-700 hover:text-black font-light transition-colors duration-200 py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Contact
                                </Link>
                            </div>

                            {/* Mobile Auth Buttons */}
                            <div className="space-y-4 pt-8 border-t border-gray-200">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="w-full justify-center text-xl text-gray-700 hover:text-black font-light py-4"
                                >
                                    Connexion
                                </Button>
                                <Button
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-full py-4 text-xl"
                                >
                                    S'inscrire
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};
