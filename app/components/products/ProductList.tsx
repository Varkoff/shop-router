import { ProductCard } from "~/components/products/ProductCard"
import type { getProducts } from "~/server/products.server"

export const ProductList = ({ products }: {
    products: Awaited<ReturnType<typeof getProducts>>
}) => {
    return (
        <section className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 p-2 lg:p-4 auto-rows-fr">
            {products.map((p) => (
                <ProductCard key={p.id} product={p} />
            ))}
        </section>
    )

}


