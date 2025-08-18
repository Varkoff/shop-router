import { AlertTriangle, Package, ShoppingCart, Users } from "lucide-react";
import { data, Link } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/$";

export async function loader({ request }: Route.LoaderArgs) {
    await requireAdmin(request);
    // Throw a 404 for any unmatched admin route
    throw data("Page d'administration introuvable", { status: 404 });
}

export default function AdminCatchAll() {
    // This component should never render since loader always throws
    return null;
}

export function ErrorBoundary() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <Card className="border-orange-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="size-5" />
                        Page d'administration introuvable
                    </CardTitle>
                    <CardDescription>
                        La page d'administration demandée n'existe pas ou a été déplacée
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert className="border-orange-200">
                        <AlertTriangle className="size-4" />
                        <AlertTitle>Erreur 404</AlertTitle>
                        <AlertDescription>
                            Cette page d'administration n'a pas été trouvée. Vérifiez l'URL ou utilisez la navigation.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                        <h3 className="font-medium text-sm text-gray-700">Pages disponibles :</h3>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            <Button variant="outline" asChild className="justify-start h-auto p-3">
                                <Link to="/admin">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-blue-100 rounded">
                                            <Package className="size-4 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Tableau de bord</div>
                                            <div className="text-xs text-gray-500">Vue d'ensemble</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="justify-start h-auto p-3">
                                <Link to="/admin/products">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-green-100 rounded">
                                            <Package className="size-4 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Produits</div>
                                            <div className="text-xs text-gray-500">Gestion catalogue</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="justify-start h-auto p-3">
                                <Link to="/admin/users">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-purple-100 rounded">
                                            <Users className="size-4 text-purple-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Utilisateurs</div>
                                            <div className="text-xs text-gray-500">Gestion comptes</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="justify-start h-auto p-3">
                                <Link to="/admin/orders">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-orange-100 rounded">
                                            <ShoppingCart className="size-4 text-orange-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Commandes</div>
                                            <div className="text-xs text-gray-500">Suivi ventes</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="justify-start h-auto p-3">
                                <Link to="/admin/library">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-indigo-100 rounded">
                                            <Package className="size-4 text-indigo-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Bibliothèque</div>
                                            <div className="text-xs text-gray-500">Médias & assets</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="justify-start h-auto p-3">
                                <Link to="/admin/categories">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-teal-100 rounded">
                                            <Package className="size-4 text-teal-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium">Catégories</div>
                                            <div className="text-xs text-gray-500">Organisation</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="pt-2 border-t">
                        <Button asChild>
                            <Link to="/admin">
                                Retour au tableau de bord
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
