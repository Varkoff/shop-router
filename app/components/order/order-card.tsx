import { href, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type { getUserOrders } from '~/server/customer/orders.server';
import { OrderItemComponent } from './order-item';
import { OrderStatusBadge, PaymentStatusBadge } from './order-status-badge';


export const OrderCard = ({ order }: {
    order: Awaited<ReturnType<typeof getUserOrders>>[number]
}) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-medium">
                            Commande #{order.id.slice(-8)}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            <OrderStatusBadge status={order.orderStatus} />
                            <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                        <span className="text-lg font-medium">
                            {(order.totalCents / 100).toLocaleString('fr-FR')}€
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Aperçu des articles (max 3) */}
                    <div className="space-y-2">
                        {order.items.slice(0, 3).map((item) => (
                            <OrderItemComponent key={item.id} item={item} />
                        ))}
                        {order.items.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                                et {order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''} article{order.items.length - 3 > 1 ? 's' : ''}...
                            </div>
                        )}
                    </div>

                    {/* Lien vers les détails */}
                    <div className="pt-3 border-t">
                        <Link
                            to={href('/orders/:orderId', { orderId: order.id })}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                            Voir les détails de la commande →
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
