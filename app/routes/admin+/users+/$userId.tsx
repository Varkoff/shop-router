import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { CheckCircle, Monitor, Smartphone, Trash2, X /* UserCheck, UserX */ } from "lucide-react";
// import { useState } from "react"; // COMMENTED OUT - not needed without ban feature
import { data, useFetcher } from "react-router";
import { z } from "zod";
import { Field } from "~/components/forms";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

// import { Textarea } from "~/components/ui/textarea"; // COMMENTED OUT - not needed without ban feature
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { /* banUser, */ deleteAllUserSessions, deleteUserSession, getUser, getUserSessions, removeUser, setUserRole, /* unbanUser, */ updateUser, verifyUserEmail } from "~/server/admin/admin-users.server";
import { requireAdmin } from "~/server/auth.server";
import type { Route } from "./+types/$userId";

type UserResponse = Awaited<ReturnType<typeof getUser>>;
type User = NonNullable<UserResponse["user"]>;
type CurrentUser = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>

// Schemas de validation avec discriminated unions
export const UpdateUserSchema = z.object({
    intent: z.literal("update-user"),
    userId: z.string().min(1, "User ID requis"),
    name: z.string().min(1, "Le nom est requis"),
    email: z.string().email("Email invalide"),
});

export const SetRoleSchema = z.object({
    intent: z.literal("set-role"),
    userId: z.string().min(1, "User ID requis"),
    role: z.enum(["customer", "administrator", "super_administrator"]),
});

// COMMENTED OUT - Ban feature not needed for now
// export const BanUserSchema = z.object({
//     intent: z.literal("ban-user"),
//     userId: z.string().min(1, "User ID requis"),
//     banReason: z.string().optional(),
// });

// export const UnbanUserSchema = z.object({
//     intent: z.literal("unban-user"),
//     userId: z.string().min(1, "User ID requis"),
// });

export const DeleteUserSchema = z.object({
    intent: z.literal("delete-user"),
    userId: z.string().min(1, "User ID requis"),
});

export const VerifyEmailSchema = z.object({
    intent: z.literal("verify-email"),
    userId: z.string().min(1, "User ID requis"),
});

export const DeleteSessionSchema = z.object({
    intent: z.literal("delete-session"),
    sessionId: z.string().min(1, "Session ID requis"),
});

export const DeleteAllSessionsSchema = z.object({
    intent: z.literal("delete-all-sessions"),
    userId: z.string().min(1, "User ID requis"),
});

export const ActionSchema = z.discriminatedUnion("intent", [
    UpdateUserSchema,
    SetRoleSchema,
    // BanUserSchema, // COMMENTED OUT - Ban feature not needed for now
    // UnbanUserSchema, // COMMENTED OUT - Ban feature not needed for now
    DeleteUserSchema,
    VerifyEmailSchema,
    DeleteSessionSchema,
    DeleteAllSessionsSchema,
]);

export async function loader({ request, params }: Route.LoaderArgs) {
    const currentUser = await requireAdmin(request);

    if (!params.userId) {
        throw new Response("User ID requis", { status: 400 });
    }

    const userResult = await getUser(params.userId);

    if (!userResult.success) {
        throw new Response(userResult.error || "Utilisateur non trouvé", {
            status: 404,
        });
    }

    // Get user sessions
    const sessionsResult = await getUserSessions(params.userId);

    return data({
        user: userResult.user,
        currentUser,
        sessions: sessionsResult.success ? sessionsResult.sessions : [],
    });
}

export async function action({ request, params }: Route.ActionArgs) {
    await requireAdmin(request);

    if (!params.userId) {
        throw new Response("User ID requis", { status: 400 });
    }

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
        case "update-user": {
            try {
                const result = await updateUser({ data: submission.value });

                if (!result.success) {
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

                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Failed to update user'],
                            }),
                        },
                        { status: 400 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: "Utilisateur mis à jour avec succès !"
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors de la mise à jour'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case "set-role": {
            try {
                const result = await setUserRole({ data: submission.value });

                if (!result.success) {
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Failed to set role'],
                            }),
                        },
                        { status: 500 }
                    );
                }

                return data({ result: submission.reply(), success: "Rôle mis à jour avec succès !" });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors du changement de rôle'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        // COMMENTED OUT - Ban feature not needed for now
        // case "ban-user": {
        //     try {
        //         const result = await banUser({ data: submission.value });

        //         if (!result.success) {
        //             return data(
        //                 {
        //                     result: submission.reply({
        //                         formErrors: [result.error || 'Failed to ban user'],
        //                     }),
        //                 },
        //                 { status: 500 }
        //             );
        //         }

        //         return data({ result: submission.reply(), success: "Utilisateur banni avec succès !" });
        //     } catch (error) {
        //         return data(
        //             {
        //                 result: submission.reply({
        //                     formErrors: [error instanceof Error ? error.message : 'Erreur lors du bannissement'],
        //                 }),
        //             },
        //             { status: 500 }
        //         );
        //     }
        // }

        // case "unban-user": {
        //     try {
        //         const result = await unbanUser(submission.value.userId);

        //         if (!result.success) {
        //             return data(
        //                 {
        //                     result: submission.reply({
        //                         formErrors: [result.error || 'Failed to unban user'],
        //                     }),
        //                 },
        //                 { status: 500 }
        //             );
        //         }

        //         return data({ result: submission.reply(), success: "Utilisateur débanni avec succès !" });
        //     } catch (error) {
        //         return data(
        //             {
        //                 result: submission.reply({
        //                     formErrors: [error instanceof Error ? error.message : 'Erreur lors du débannissement'],
        //                 }),
        //             },
        //             { status: 500 }
        //         );
        //     }
        // }

        case "delete-user": {
            try {
                const result = await removeUser(submission.value.userId);

                if (!result.success) {
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Failed to delete user'],
                            }),
                        },
                        { status: 500 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: "Utilisateur supprimé avec succès !"
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors de la suppression'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case "verify-email": {
            try {
                const result = await verifyUserEmail({ data: submission.value });

                if (!result.success) {
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Failed to verify email'],
                            }),
                        },
                        { status: 500 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: "Email vérifié avec succès !"
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors de la vérification'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case "delete-session": {
            try {
                const result = await deleteUserSession(submission.value.sessionId);

                if (!result.success) {
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Failed to delete session'],
                            }),
                        },
                        { status: 500 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: "Session supprimée avec succès !"
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors de la suppression de la session'],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case "delete-all-sessions": {
            try {
                const result = await deleteAllUserSessions(submission.value.userId);

                if (!result.success) {
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Failed to delete all sessions'],
                            }),
                        },
                        { status: 500 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: `Toutes les sessions supprimées avec succès ! (${result.deletedCount || 0} sessions)`
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [error instanceof Error ? error.message : 'Erreur lors de la suppression des sessions'],
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

const UserEditForm = ({ user }: { user: User }) => {
    const fetcher = useFetcher();

    const [form, fields] = useForm({
        constraint: getZodConstraint(UpdateUserSchema),
        lastResult: fetcher.data?.result,
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: UpdateUserSchema.omit({ intent: true }),
            });
        },
        defaultValue: {
            name: user.name || "",
            email: user.email || "",
        },
    });

    const isSubmitting = fetcher.state === "submitting";

    return (
        <fetcher.Form method="POST" {...getFormProps(form)} className="space-y-4">
            <input type="hidden" name="intent" value="update-user" />
            <input type="hidden" name="userId" value={user.id} />

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

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
            </Button>
        </fetcher.Form>
    );
};

const UserRoleForm = ({ user, currentUser }: { user: User, currentUser: CurrentUser }) => {
    const fetcher = useFetcher();

    const canManageUser = currentUser.role === "super_administrator" ||
        (currentUser.role === "administrator" && user.role === "customer");

    if (!canManageUser || user.id === currentUser.id) {
        return null;
    }

    const availableRoles = currentUser.role === "super_administrator"
        ? ["customer", "administrator", "super_administrator"]
        : ["customer"];

    return (
        <div className="space-y-2">
            <Label>Rôle</Label>
            <Select
                defaultValue={user.role || "customer"}
                onValueChange={(value) => {
                    if (value !== user.role) {
                        const formData = new FormData();
                        formData.set("intent", "set-role");
                        formData.set("userId", user.id);
                        formData.set("role", value);
                        fetcher.submit(formData, { method: "POST" });
                    }
                }}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                            {role === "super_administrator" ? "Super Admin" :
                                role === "administrator" ? "Admin" : "Customer"}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

const UserActionsSection = ({ user, currentUser }: { user: User, currentUser: CurrentUser }) => {
    const fetcher = useFetcher();
    // const [banReason, setBanReason] = useState(""); // COMMENTED OUT - not needed without ban feature

    const canManageUser = currentUser.role === "super_administrator" ||
        (currentUser.role === "administrator" && user.role === "customer");

    if (!canManageUser || user.id === currentUser.id) {
        return null;
    }

    const isSubmitting = fetcher.state === "submitting";

    return (
        <div className="space-y-4">
            {/* Vérification email */}
            {!user.emailVerified && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const formData = new FormData();
                                    formData.set("intent", "verify-email");
                                    formData.set("userId", user.id);
                                    fetcher.submit(formData, { method: "POST" });
                                }}
                                disabled={isSubmitting}
                                className="w-full text-green-600 hover:text-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Vérifier l'email
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Vérifier l'email manuellement</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {currentUser.role === "super_administrator" && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`)) {
                            const formData = new FormData();
                            formData.set("intent", "delete-user");
                            formData.set("userId", user.id);
                            fetcher.submit(formData, { method: "POST" });
                        }
                    }}
                    disabled={isSubmitting}
                    className="w-full"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                </Button>
            )}
        </div>
    );
};

const UserSessionsSection = ({ sessions, userId, currentUser }: {
    sessions: Awaited<ReturnType<typeof getUserSessions>>["sessions"],
    userId: string,
    currentUser: CurrentUser
}) => {
    const fetcher = useFetcher();

    const canManageSessions = currentUser.role === "super_administrator" ||
        currentUser.role === "administrator";

    if (!canManageSessions) {
        return null;
    }

    const isSubmitting = fetcher.state === "submitting";

    // Helper to detect device type from user agent
    const getDeviceType = (userAgent: string | null) => {
        if (!userAgent) return "unknown";
        const ua = userAgent.toLowerCase();
        if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
            return "mobile";
        }
        return "desktop";
    };

    // Helper to get browser name from user agent
    const getBrowserName = (userAgent: string | null) => {
        if (!userAgent) return "Inconnu";
        const ua = userAgent.toLowerCase();
        if (ua.includes("chrome")) return "Chrome";
        if (ua.includes("firefox")) return "Firefox";
        if (ua.includes("safari")) return "Safari";
        if (ua.includes("edge")) return "Edge";
        return "Autre";
    };

    // Helper to format date
    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Check if session is expired
    const isExpired = (expiresAt: string | Date) => {
        return new Date(expiresAt) < new Date();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium">Sessions actives ({sessions?.length || 0})</h4>
                {sessions && sessions.length > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            if (confirm("Êtes-vous sûr de vouloir supprimer toutes les sessions ? L'utilisateur sera déconnecté de tous ses appareils.")) {
                                const formData = new FormData();
                                formData.set("intent", "delete-all-sessions");
                                formData.set("userId", userId);
                                fetcher.submit(formData, { method: "POST" });
                            }
                        }}
                        disabled={isSubmitting}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer toutes
                    </Button>
                )}
            </div>

            {!sessions || sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune session active</p>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`border rounded-lg p-4 space-y-2 ${isExpired(session.expiresAt) ? "bg-muted opacity-60" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getDeviceType(session.userAgent) === "mobile" ? (
                                        <Smartphone className="h-4 w-4" />
                                    ) : (
                                        <Monitor className="h-4 w-4" />
                                    )}
                                    <span className="font-medium">
                                        {getBrowserName(session.userAgent)}
                                    </span>
                                    {isExpired(session.expiresAt) && (
                                        <Badge variant="secondary">Expirée</Badge>
                                    )}
                                    {session.impersonatedBy && (
                                        <Badge variant="outline">Impersonation</Badge>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (confirm("Êtes-vous sûr de vouloir supprimer cette session ?")) {
                                            const formData = new FormData();
                                            formData.set("intent", "delete-session");
                                            formData.set("sessionId", session.id);
                                            fetcher.submit(formData, { method: "POST" });
                                        }
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                                {session.ipAddress && (
                                    <p>IP: {session.ipAddress}</p>
                                )}
                                <p>Créée: {formatDate(session.createdAt)}</p>
                                <p>Expire: {formatDate(session.expiresAt)}</p>
                                {session.updatedAt !== session.createdAt && (
                                    <p>Dernière activité: {formatDate(session.updatedAt)}</p>
                                )}
                            </div>

                            {session.userAgent && (
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                        User Agent
                                    </summary>
                                    <p className="mt-1 font-mono break-all">{session.userAgent}</p>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function UserEditPage({ loaderData }: Route.ComponentProps) {
    const { user, currentUser, sessions } = loaderData;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
                        Utilisateur non trouvé
                    </h2>
                    <p className="text-muted-foreground">
                        L'utilisateur demandé n'existe pas ou a été supprimé.
                    </p>
                </div>
            </div>
        );
    }

    const canManageUser = currentUser.role === "super_administrator" ||
        (currentUser.role === "administrator" && user.role === "customer");

    const showActions = canManageUser && user.id !== currentUser.id;

    return (
        <div className="min-h-screen bg-muted/20">
            <div className="container mx-auto py-8 space-y-6">
                {/* Header avec informations principales */}
                <div className="bg-background border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold">{user.name}</h1>
                                <Badge variant={user.emailVerified ? "default" : "secondary"} className="text-sm">
                                    {user.emailVerified ? "Email vérifié" : "Email non vérifié"}
                                </Badge>
                                {user.id === currentUser.id && (
                                    <Badge variant="outline" className="text-sm border-blue-200 text-blue-700">
                                        Vous
                                    </Badge>
                                )}
                            </div>
                            <p className="text-lg text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Créé le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
                                <span>•</span>
                                <span>ID: {user.id}</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <Badge
                                variant={
                                    user.role === "super_administrator" ? "destructive" :
                                        user.role === "administrator" ? "default" : "secondary"
                                }
                                className="text-base px-3 py-1"
                            >
                                {user.role === "super_administrator" ? "Super Administrateur" :
                                    user.role === "administrator" ? "Administrateur" : "Client"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Informations personnelles */}
                    <div className="bg-background border rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
                        <UserEditForm user={user} />
                    </div>

                    {/* Gestion du rôle */}
                    {canManageUser && user.id !== currentUser.id && (
                        <div className="bg-background border rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Gestion du rôle</h2>
                            <UserRoleForm user={user} currentUser={currentUser} />
                        </div>
                    )}

                    {/* Actions administratives */}
                    {showActions && (
                        <div className="bg-background border rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Actions administratives</h2>
                            <UserActionsSection user={user} currentUser={currentUser} />
                        </div>
                    )}
                </div>

                {/* Sessions - section complète en bas */}
                <div className="bg-background border rounded-lg p-6">
                    <UserSessionsSection sessions={sessions} userId={user.id} currentUser={currentUser} />
                </div>
            </div>
        </div>
    );
}
