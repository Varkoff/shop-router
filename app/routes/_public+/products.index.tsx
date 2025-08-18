import { useLoaderData } from "react-router"
import { ProductList } from "~/components/products/product-list"
import { getProducts } from "~/server/customer/products.server"

export async function loader() {
  return await getProducts()
}

export default function ProductsRoute() {
  const products = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-white text-black">
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extralight mb-3 tracking-tight leading-none">
              Collection
              <span className="font-light"> Robots</span>
            </h1>
            <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed font-light">
              Découvrez notre gamme complète de robots humanoïdes
            </p>
          </div>



          <ProductList products={products} />
        </div>
      </main>
    </div>
  )
}