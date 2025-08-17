import { data, Outlet } from "react-router";
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/index";
export async function loader({ request }: Route.LoaderArgs) {
    await requireAdmin(request);
    return data(null)
}
export default function AdminIndex() {
    return <Outlet />
}