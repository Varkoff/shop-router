import { useLoaderData } from "react-router"
import { ProductList } from "~/components/products/ProductList"
import { getProducts } from "~/server/products.server"

export async function loader() {
  return await getProducts()
}

export default function ProductsRoute() {
  const products = useLoaderData<typeof loader>()

  return (
    <main className="flex items-center justify-center pt-12 pb-8 w-full">
      <div className="w-full max-w-7xl px-4">
        <header className="flex flex-col items-start gap-2 mb-6">
          <h1 className="text-3xl font-semibold text-primary">Shop Router</h1>
          <p className="text-sm text-muted-foreground">A minimal catalogue built with shadcn variables.</p>
        </header>

        <ProductList products={products} />
      </div>
    </main>
  )
}