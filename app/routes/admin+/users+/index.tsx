import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { data, useFetcher } from "react-router";
import { z } from "zod";
import { Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { createUser, listUsers } from "~/server/admin/admin-users.server";
import { requireAdmin } from "~/server/auth.server";
import { createAdminUsersColumns } from "../admin-users-columns";
import type { Route } from "./+types/index";

// Schema de validation pour la création uniquement
export const CreateUserSchema = z.object({
    intent: z.literal("create-user"),
    name: z.string().min(1, "Le nom est requis"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    role: z.enum(["customer", "administrator", "super_administrator"]).default("customer"),
});

export const ActionSchema = z.discriminatedUnion("intent", [
    CreateUserSchema,
]);

export async function loader({ request }: Route.LoaderArgs) {
    const currentUser = await requireAdmin(request);

    const usersResult = await listUsers();

    if (!usersResult.success) {
        throw new Response(usersResult.error || "Erreur lors du chargement des utilisateurs", {
            status: 500,
        });
    }

    return data({
        users: usersResult.users || [],
        currentUser,
    });
}

export async function action({ request }: Route.ActionArgs) {
    await requireAdmin(request);

    const formData = await request.formData();

    const submission = parseWithZod(formData, {
        schema: ActionSchema,
    });

    if (submission.status !== 'success') {
        return data(
            { result: submission.reply() },
            { status: 400 }
        );
    }

    switch (submission.value.intent) {
        case "create-user": {
            try {
                const result = await createUser({
                    data: submission.value
                });

                if (!result.success) {
                    // Si on a un champ spécifique pour l'erreur, on l'utilise
                    if (result.field) {
                        return data(
                            {
                                result: submission.reply({
                                    fieldErrors: {
                                        [result.field]: [result.error || 'Erreur de validation'],
                                    },
                                }),
                            },
                            { status: 400 }
                        );
                    }

                    // Sinon erreur générale
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Failed to create user'],
                            }),
                        },
                        { status: 400 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: `Utilisateur ${submission.value.name} créé avec succès !`
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors de la création'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        default: {
            return data({ result: null }, { status: 400 });
        }
    }
}

const CreateUserDialog = ({ currentUserRole }: { currentUserRole: string }) => {
    const fetcher = useFetcher();
    const [open, setOpen] = useState(false);

    const [form, fields] = useForm({
        constraint: getZodConstraint(CreateUserSchema),
        lastResult: fetcher.data?.result,
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: CreateUserSchema.omit({ intent: true }),
            });
        },
        defaultValue: {
            name: "",
            email: "",
            password: "",
            role: "customer",
        },
    });

    const isSubmitting = fetcher.state === "submitting";

    // Fermer le dialog en cas de succès
    useEffect(() => {
        if (fetcher.data?.success && open) {
            setOpen(false);
        }
    }, [fetcher.data?.success, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="size-4 mr-2" />
                    Créer un utilisateur
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                    <DialogDescription>
                        Créer un compte utilisateur avec le rôle approprié.
                    </DialogDescription>
                </DialogHeader>

                <fetcher.Form method="POST" {...getFormProps(form)} className="space-y-4">
                    <input type="hidden" name="intent" value="create-user" />

                    <Field
                        labelProps={{ children: "Nom" }}
                        inputProps={{
                            ...getInputProps(fields.name, { type: "text" }),
                            placeholder: "Nom complet",
                        }}
                        errors={fields.name.errors}
                    />

                    <Field
                        labelProps={{ children: "Email" }}
                        inputProps={{
                            ...getInputProps(fields.email, { type: "email" }),
                            placeholder: "email@example.com",
                        }}
                        errors={fields.email.errors}
                    />

                    <Field
                        labelProps={{ children: "Mot de passe" }}
                        inputProps={{
                            ...getInputProps(fields.password, { type: "password" }),
                            placeholder: "Mot de passe sécurisé",
                        }}
                        errors={fields.password.errors}
                    />

                    <div className="space-y-2">
                        <Label htmlFor={fields.role.id}>Rôle</Label>
                        <Select name={fields.role.name} defaultValue="customer">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="administrator">Administrator</SelectItem>
                                {currentUserRole === "super_administrator" && (
                                    <SelectItem value="super_administrator">Super Administrator</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {fields.role.errors && (
                            <div className="text-sm text-red-600">
                                {fields.role.errors.join(", ")}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Création..." : "Créer"}
                        </Button>
                    </div>
                </fetcher.Form>
            </DialogContent>
        </Dialog>
    );
};

export default function UsersPage({ loaderData }: Route.ComponentProps) {
    const { users, currentUser } = loaderData;
    const userRole = currentUser?.role || "customer";
    const columns = createAdminUsersColumns(currentUser?.id);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des clients</h1>
                    <p className="text-muted-foreground">
                        Gérez les comptes clients, leurs commandes et leurs données.
                    </p>
                </div>
                <CreateUserDialog currentUserRole={userRole} />
            </div>

            <div className="flex items-start w-full flex-row gap-6">
                {/* Liste des utilisateurs à gauche */}
                <div className="shrink-0 basis-[300px] grow w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Clients ({users.length})</CardTitle>
                            <CardDescription>
                                Cliquez sur un client pour voir et éditer ses informations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={columns}
                                data={users}
                                searchPlaceholder="Rechercher des clients..."
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Zone d'édition à droite */}
                {/* <div className="shrink-0 basis-[200px] grow w-full">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Détails client</CardTitle>
                            <CardDescription>
                                Sélectionnez un client pour voir ses détails et l'éditer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Outlet />
                        </CardContent>
                    </Card>
                </div> */}
            </div>
        </div>
    );
}