import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData
} from "react-router";

import '@mdxeditor/editor/style.css';
import type { Route } from "./+types/root";
import "./app.css";
import { GeneralErrorBoundary } from "./components/error-boundary";
import { getOptionalUser } from "./server/auth.server";
import { getUserCart } from "./server/customer/cart.server";
import { getProducts } from "./server/customer/products.server";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];


export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request);

  // Récupérer le panier utilisateur s'il est connecté
  const userCart = user ? await getUserCart(user.id) : { items: [] };

  // Récupérer tous les produits pour enrichir le panier localStorage
  const products = await getProducts();

  return data({ user, userCart, products });
}

export function useOptionalUser() {
  return useRouteLoaderData<typeof loader>("root")?.user || null
}

export function useUserCart() {
  return useRouteLoaderData<typeof loader>("root")?.userCart || { items: [] };
}

export function useProducts() {
  return useRouteLoaderData<typeof loader>("root")?.products || [];
}

export function useUser() {
  const user = useOptionalUser()
  if (!user) {
    throw new Error("User not found")
  }
  return user
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* <Navbar />
        <div className="flex-1"> */}
        {children}
        {/* </div>
        <Footer /> */}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export const ErrorBoundary = GeneralErrorBoundary

// export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
//   let message = "Oops!";
//   let details = "An unexpected error occurred.";
//   let stack: string | undefined;

//   if (isRouteErrorResponse(error)) {
//     message = error.status === 404 ? "404" : "Error";
//     details =
//       error.status === 404
//         ? "The requested page could not be found."
//         : error.statusText || details;
//   } else if (import.meta.env.DEV && error && error instanceof Error) {
//     details = error.message;
//     stack = error.stack;
//   }

//   return (
//     <main className="pt-16 p-4 container mx-auto">
//       <h1>{message}</h1>
//       <p>{details}</p>
//       {stack && (
//         <pre className="w-full p-4 overflow-x-auto">
//           <code>{stack}</code>
//         </pre>
//       )}
//     </main>
//   );
// }
