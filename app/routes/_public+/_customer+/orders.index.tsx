import { EmptyOrders } from '~/components/order/empty-orders';
import { OrderCard } from '~/components/order/order-card';
import { requireUser } from '~/server/auth.server';
import { getUserOrders } from '~/server/customer/orders.server';
import type { Route } from './+types/orders.index';

export async function loader({ request }: Route.LoaderArgs) {
    const user = await requireUser(request);
    const orders = await getUserOrders(user.id);

    return { orders, user };
}



export default function OrdersPage({ loaderData }: Route.ComponentProps) {
    const { orders, user } = loaderData;

    return (
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-light mb-2 tracking-tight">
                            Mes commandes
                        </h1>
                        <p className="text-gray-600 font-light">
                            Bienvenue {user.name}, retrouvez ici l'historique de vos commandes.
                        </p>
                    </div>

                    {/* Liste des commandes */}
                    {orders.length === 0 ? (
                        <EmptyOrders />
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
