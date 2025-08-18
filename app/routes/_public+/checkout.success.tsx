import { CheckCircle, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { getOptionalUser } from '~/server/auth.server';
import { getCheckoutSession } from '~/server/polar.server';
import type { Route } from './+types/checkout.success';

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getOptionalUser(request);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
        throw new Response('Session ID required', { status: 400 });
    }

    // Verify the checkout session
    const checkoutResult = await getCheckoutSession(sessionId);

    if (!checkoutResult.success) {
        throw new Response('Invalid checkout session', { status: 404 });
    }

    return {
        user,
        checkout: checkoutResult.checkout,
        sessionId,
    };
}

export default function CheckoutSuccess({ loaderData }: Route.ComponentProps) {
    const { user, checkout } = loaderData;

    return (
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="text-center">
                        <CardHeader className="pb-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl md:text-3xl font-light text-gray-900">
                                Commande confirmée !
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-gray-600 font-light">
                                    Merci pour votre achat ! Votre commande a été traitée avec succès.
                                </p>
                                {user && (
                                    <p className="text-sm text-gray-500">
                                        Un email de confirmation a été envoyé à <strong>{user.email}</strong>
                                    </p>
                                )}
                            </div>

                            {checkout && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Détails de la commande
                                    </h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex justify-between">
                                            <span>ID de session :</span>
                                            <span className="font-mono text-xs">
                                                {checkout.id}
                                            </span>
                                        </div>
                                        {checkout.customerEmail && (
                                            <div className="flex justify-between">
                                                <span>Email :</span>
                                                <span>{checkout.customerEmail}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-4">
                                <p className="text-sm text-gray-600">
                                    Que souhaitez-vous faire maintenant ?
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link to="/products" className="flex-1">
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            size="lg"
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                            Continuer mes achats
                                        </Button>
                                    </Link>

                                    {user && (
                                        <Link to="/account/orders" className="flex-1">
                                            <Button
                                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                                size="lg"
                                            >
                                                Voir mes commandes
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p>✓ Paiement sécurisé via Polar</p>
                                    <p>✓ Accès immédiat à vos achats numériques</p>
                                    <p>✓ Support client disponible 24h/7j</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
