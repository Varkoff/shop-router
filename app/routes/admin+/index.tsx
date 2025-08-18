import { redirect } from "react-router";
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
    await requireAdmin(request);


    return redirect("/admin/dashboard");


}

export default function AdminIndex() {
    return (
        <div className="text-center py-8">
            <h2 className="text-2xl font-bold">Redirection vers le dashboard...</h2>
        </div>
    );
}