import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { Lock, Monitor, Save, Smartphone, User, X } from 'lucide-react';
import { data, Form, useFetcher, useNavigation } from 'react-router';
import { z } from 'zod';
import { ErrorList, Field } from '~/components/forms';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { deleteCurrentUserSession, getCurrentUserSessions, requireUser, updateUserName, updateUserPassword } from '~/server/auth.server';
import type { Route } from './+types/profile';

type Session = {
    id: string;
    token: string;
    expiresAt: string | Date;
    createdAt: string | Date;
    updatedAt: string | Date;
    ipAddress: string | null;
    userAgent: string | null;
    impersonatedBy: string | null;
};

const UpdateNameSchema = z.object({
    intent: z.literal('update-name'),
    name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
});

const UpdatePasswordBaseSchema = z.object({
    intent: z.literal('update-password'),
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
    newPassword: z
        .string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
        ),
    confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
});

const DeleteSessionSchema = z.object({
    intent: z.literal('delete-session'),
    sessionId: z.string().min(1, 'Session ID requis'),
});

export const ActionSchema = z.discriminatedUnion('intent', [
    UpdateNameSchema,
    UpdatePasswordBaseSchema,
    DeleteSessionSchema,
]);

export async function loader({ request }: Route.LoaderArgs) {
    const user = await requireUser(request);
    const sessionsResult = await getCurrentUserSessions(request);

    return data({
        user,
        sessions: sessionsResult.success ? sessionsResult.sessions : []
    });
}

export async function action({ request }: Route.ActionArgs) {
    await requireUser(request);
    const formData = await request.formData();

    const submission = await parseWithZod(formData, {
        schema: ActionSchema.superRefine((
            (data, ctx) => {
                if (data.intent === "update-password") {
                    if (data.newPassword !== data.confirmPassword) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: 'Les mots de passe ne correspondent pas',
                            path: ['confirmPassword'],
                        });
                    }
                }
            })
        ),
        async: true,
    });

    if (submission.status !== 'success') {
        return data({ result: submission.reply() }, { status: 400 });
    }

    switch (submission.value.intent) {
        case 'update-name': {
            try {
                const result = await updateUserName(request, submission.value.name);

                if (!result.success) {
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Erreur lors de la mise à jour du nom'],
                            }),
                        },
                        { status: 400 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: 'Nom mis à jour avec succès !',
                    intent: 'update-name',
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [
                                error instanceof Error ? error.message : 'Erreur lors de la mise à jour du nom',
                            ],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case 'update-password': {
            try {
                const result = await updateUserPassword(
                    request,
                    submission.value.currentPassword,
                    submission.value.newPassword
                );

                if (!result.success) {
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Erreur lors de la mise à jour du mot de passe'],
                            }),
                        },
                        { status: 400 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: 'Mot de passe mis à jour avec succès !',
                    intent: 'update-password',
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [
                                error instanceof Error
                                    ? error.message
                                    : 'Erreur lors de la mise à jour du mot de passe',
                            ],
                        }),
                    },
                    { status: 500 }
                );
            }
        }

        case 'delete-session': {
            try {
                const result = await deleteCurrentUserSession(
                    request,
                    submission.value.sessionId
                );

                if (!result.success) {
                    return data(
                        {
                            result: submission.reply({
                                formErrors: [result.error || 'Erreur lors de la suppression de la session'],
                            }),
                        },
                        { status: 400 }
                    );
                }

                return data({
                    result: submission.reply(),
                    success: 'Session supprimée avec succès !',
                    intent: 'delete-session',
                });
            } catch (error) {
                return data(
                    {
                        result: submission.reply({
                            formErrors: [
                                error instanceof Error
                                    ? error.message
                                    : 'Erreur lors de la suppression de la session',
                            ],
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

const UserSessionsSection = ({ sessions }: { sessions: Session[] }) => {
    const fetcher = useFetcher();

    const isSubmitting = fetcher.state === 'submitting';

    // Helper to detect device type from user agent
    const getDeviceType = (userAgent: string | null) => {
        if (!userAgent) return 'unknown';
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'mobile';
        }
        return 'desktop';
    };

    // Helper to get browser name from user agent
    const getBrowserName = (userAgent: string | null) => {
        if (!userAgent) return 'Inconnu';
        const ua = userAgent.toLowerCase();
        if (ua.includes('chrome')) return 'Chrome';
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('safari')) return 'Safari';
        if (ua.includes('edge')) return 'Edge';
        return 'Autre';
    };

    // Helper to format date
    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
            </div>

            {!sessions || sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune session active</p>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`border rounded-lg p-4 space-y-2 ${isExpired(session.expiresAt) ? 'bg-muted opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getDeviceType(session.userAgent) === 'mobile' ? (
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
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
                                                        const formData = new FormData();
                                                        formData.set('intent', 'delete-session');
                                                        formData.set('sessionId', session.id);
                                                        fetcher.submit(formData, { method: 'POST' });
                                                    }
                                                }}
                                                disabled={isSubmitting}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Supprimer cette session</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                                {session.ipAddress && <p>IP: {session.ipAddress}</p>}
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

export default function ProfilePage({
    loaderData,
    actionData,
}: Route.ComponentProps) {
    const { user, sessions } = loaderData;
    const lastResult = actionData?.result;
    const successMessage = actionData && 'success' in actionData ? actionData.success as string : undefined;
    const successIntent = actionData && 'intent' in actionData ? actionData.intent as string : undefined;
    const navigation = useNavigation();

    // Check if we're submitting a specific form
    const isSubmittingName = navigation.state === 'submitting' &&
        navigation.formData?.get('intent') === 'update-name';
    const isSubmittingPassword = navigation.state === 'submitting' &&
        navigation.formData?.get('intent') === 'update-password';

    // Form for updating name
    const [nameForm, nameFields] = useForm({
        lastResult: successIntent === 'update-name' ? undefined : lastResult,
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: UpdateNameSchema.omit({ intent: true }),
            });
        },
        defaultValue: {
            name: user.name || '',
        },
    });

    // Form for updating password
    const [passwordForm, passwordFields] = useForm({
        lastResult: successIntent === 'update-password' ? undefined : lastResult,
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: UpdatePasswordBaseSchema.omit({ intent: true }),
            });
        },
        defaultValue: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Mon Profil</h1>
                    <p className="text-muted-foreground">
                        Gérez vos informations personnelles et vos préférences de compte.
                    </p>
                </div>

                {successMessage && (
                    <Alert>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="size-5" />
                            Informations personnelles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Email</div>
                            <div className="mt-1 text-sm">{user.email}</div>
                        </div>

                        <Form method="POST" {...getFormProps(nameForm)} className="space-y-4">
                            <input type="hidden" name="intent" value="update-name" />
                            <ErrorList id={nameForm.errorId} errors={nameForm.errors} />

                            <Field
                                labelProps={{ children: 'Nom d\'affichage' }}
                                inputProps={{
                                    ...getInputProps(nameFields.name, { type: 'text' }),
                                    placeholder: 'Votre nom d\'affichage',
                                }}
                                errors={nameFields.name.errors}
                            />

                            <Button
                                type="submit"
                                className="gap-2"
                                isLoading={isSubmittingName}
                                disabled={isSubmittingName}
                            >
                                <Save className="size-4" />
                                {isSubmittingName ? 'Mise à jour...' : 'Mettre à jour le nom'}
                            </Button>
                        </Form>
                    </CardContent>
                </Card>

                {/* Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="size-5" />
                            Sécurité
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form method="POST" {...getFormProps(passwordForm)} className="space-y-4">
                            <input type="hidden" name="intent" value="update-password" />
                            <ErrorList id={passwordForm.errorId} errors={passwordForm.errors} />

                            <Field
                                labelProps={{ children: 'Mot de passe actuel' }}
                                inputProps={{
                                    ...getInputProps(passwordFields.currentPassword, { type: 'password' }),
                                    placeholder: 'Votre mot de passe actuel',
                                    autoComplete: 'current-password',
                                }}
                                errors={passwordFields.currentPassword.errors}
                            />

                            <Separator />

                            <Field
                                labelProps={{ children: 'Nouveau mot de passe' }}
                                inputProps={{
                                    ...getInputProps(passwordFields.newPassword, { type: 'password' }),
                                    placeholder: 'Votre nouveau mot de passe',
                                    autoComplete: 'new-password',
                                }}
                                errors={passwordFields.newPassword.errors}
                            />

                            <Field
                                labelProps={{ children: 'Confirmer le nouveau mot de passe' }}
                                inputProps={{
                                    ...getInputProps(passwordFields.confirmPassword, { type: 'password' }),
                                    placeholder: 'Confirmez votre nouveau mot de passe',
                                    autoComplete: 'new-password',
                                }}
                                errors={passwordFields.confirmPassword.errors}
                            />

                            <Button
                                type="submit"
                                className="gap-2"
                                isLoading={isSubmittingPassword}
                                disabled={isSubmittingPassword}
                            >
                                <Lock className="size-4" />
                                {isSubmittingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                            </Button>
                        </Form>
                    </CardContent>
                </Card>

                {/* Sessions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="size-5" />
                            Sessions actives
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UserSessionsSection sessions={sessions} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
