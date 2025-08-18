import type { VariantProps } from 'class-variance-authority';
import type { OrderStatus, PaymentStatus } from 'generated/prisma/enums';
import { Badge, type badgeVariants } from '~/components/ui/badge';

// Mapping pour les statuts de commande (orderStatus)
const orderStatusMap: Record<OrderStatus, { label: string, variant: VariantProps<typeof badgeVariants>["variant"] }> = {
    DRAFT: { label: 'Brouillon', variant: 'secondary' },
    PENDING: { label: 'En attente', variant: 'secondary' },
    PAID: { label: 'Confirmée', variant: 'default' },
    FULFILLED: { label: 'Livrée', variant: 'default' },
    CANCELED: { label: 'Annulée', variant: 'destructive' },
    REFUNDED: { label: 'Remboursée', variant: 'secondary' },
};

// Mapping pour les statuts de paiement (paymentStatus)
const paymentStatusMap: Record<PaymentStatus, { label: string, variant: VariantProps<typeof badgeVariants>["variant"] }> = {
    PENDING: { label: 'En attente', variant: 'secondary' },
    PAID: { label: 'Payé', variant: 'default' },
    FAILED: { label: 'Échec', variant: 'destructive' },
    REFUNDED: { label: 'Remboursé', variant: 'secondary' },
};

interface OrderStatusBadgeProps {
    status: OrderStatus;
}

interface PaymentStatusBadgeProps {
    status: PaymentStatus;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
    const statusInfo = orderStatusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
    const statusInfo = paymentStatusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};
