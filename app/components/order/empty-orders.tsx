import { Link } from 'react-router';
import { Card, CardContent } from '~/components/ui/card';

export const EmptyOrders = () => {
    return (
        <Card>
            <CardContent className="text-center py-12">
                <div className="mb-4">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune commande
                </h3>
                <p className="text-gray-500 mb-6">
                    Vous n'avez pas encore passé de commande.
                </p>
                <Link
                    to="/products"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Découvrir nos produits
                </Link>
            </CardContent>
        </Card>
    );
};
