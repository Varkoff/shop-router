import type { Route } from "./+types/products.$id";

export async function loader({ params }: Route.LoaderArgs) {
    // Pour l'instant, juste retourner l'id
    return { productId: params.id };
}

export default function ProductDetails({ loaderData }: Route.ComponentProps) {
    return (
        <div className="container mx-auto p-4">
            <h1>Product Details</h1>
            <p>Product ID: {loaderData.productId}</p>
        </div>
    );
}
