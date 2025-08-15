import { ProductCard } from "~/components/products/product-card"
import type { getProducts } from "~/server/products.server"

export const ProductList = ({ products }: {
    products: Awaited<ReturnType<typeof getProducts>>
}) => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12 md:mb-20">
            {products.map((p) => (
                <ProductCard key={p.id} product={p} />
            ))}
        </section>
    )

}


