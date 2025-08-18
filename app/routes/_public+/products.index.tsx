import { Search, SlidersHorizontal } from "lucide-react"
import { useLoaderData } from "react-router"
import { ProductList } from "~/components/products/product-list"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
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

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Rechercher un modèle..."
                  className="pl-12 h-12 border-gray-200 rounded-full font-light text-base focus:ring-0 focus:border-gray-400"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3 w-full md:w-auto">
                <Select>
                  <SelectTrigger className="w-40 h-12 border-gray-200 rounded-full font-light">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phare">Modèle phare</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="industriel">Industriel</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="w-40 h-12 border-gray-200 rounded-full font-light">
                    <SelectValue placeholder="Prix" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-50000">0 - 50 000€</SelectItem>
                    <SelectItem value="50000-100000">50 000 - 100 000€</SelectItem>
                    <SelectItem value="100000+">100 000€+</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 border-gray-200 rounded-full font-light hover:bg-gray-50"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>

            {/* Results Counter */}
            <div className="text-center">
              <p className="text-gray-500 font-light">
                {products.length} modèle{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <ProductList products={products} />
        </div>
      </main>
    </div>
  )
}