import { useLoaderData } from "react-router";
import { prisma } from "~/server/db.server";


export async function loader() {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
    }
  })
}

export default function Home() {
  const products = useLoaderData<typeof loader>();

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1 className="text-4xl font-bold text-sky-600">
            Shop Router
          </h1>
        </header>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id}>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p>{product.price.d} €</p>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
}

function ProductCard({ product }: { product: any }) {
  return (
    <div>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p>{Number(product.price).toFixed(2)} €</p>
    </div>
  )
}