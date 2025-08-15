import { Link } from "react-router";

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
                            <span className="text-xl font-light text-black">NEXUS</span>
                        </div>
                        <p className="text-gray-500 font-light leading-relaxed">
                            L'avenir du travail avec des robots humanoïdes conçus pour s'intégrer parfaitement dans votre quotidien.
                        </p>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400 font-light">Contact</p>
                            <a
                                href="mailto:contact@algomax.fr"
                                className="text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                contact@algomax.fr
                            </a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-light text-black">Navigation</h3>
                        <div className="space-y-3">
                            <Link
                                to="/"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                Accueil
                            </Link>
                            <Link
                                to="/products"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                Produits
                            </Link>
                            <Link
                                to="/about"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                À propos
                            </Link>
                            <Link
                                to="/contact"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                Contact
                            </Link>
                            <Link
                                to="/blog"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                Blog
                            </Link>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-light text-black">Nos Modèles</h3>
                        <div className="space-y-3">
                            <Link
                                to="/products/nexus-01"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                NEXUS-01
                            </Link>
                            <Link
                                to="/products/atlas-02"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                ATLAS-02
                            </Link>
                            <Link
                                to="/products/titan-03"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                TITAN-03
                            </Link>
                        </div>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-light text-black">Informations</h3>
                        <div className="space-y-3">
                            <Link
                                to="/mentions-legales"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                Mentions légales
                            </Link>
                            <Link
                                to="/cgv"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                CGV
                            </Link>
                            <Link
                                to="/conditions-utilisation"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                Conditions d'utilisation
                            </Link>
                            <Link
                                to="/politique-confidentialite"
                                className="block text-gray-600 hover:text-black font-light transition-colors duration-200"
                            >
                                Politique de confidentialité
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className="text-gray-500 font-light text-sm">
                        © {new Date().getFullYear()} NEXUS. Tous droits réservés.
                    </p>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-400 font-light text-sm">Propulsé par</span>
                        <a
                            href="https://algomax.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-black font-light transition-colors duration-200 text-sm"
                        >
                            algomax.fr
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}