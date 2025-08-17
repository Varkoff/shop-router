import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useState } from 'react';
import { Form, Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { ErrorList, Field } from '~/components/forms';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { authClient } from '~/lib/auth-client';

const LoginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, fields] = useForm({
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: LoginSchema,
            });
        },
    });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const submission = parseWithZod(formData, {
            schema: LoginSchema,
        });

        if (submission.status !== 'success') {
            setIsLoading(false);
            return;
        }

        try {
            const { data: authData, error: authError } = await authClient.signIn.email({
                email: submission.value.email,
                password: submission.value.password,
            });

            if (authError) {
                if (authError.message?.includes('Invalid credentials') || authError.message?.includes('User not found')) {
                    setError('Invalid email or password');
                } else {
                    setError(authError.message || 'Login failed. Please try again.');
                }
                setIsLoading(false);
                return;
            }

            console.log('Login successful:', authData);

            if (authData?.token) {
                // Login successful, redirect to home
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Sign in to your account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your email and password to sign in
                    </CardDescription>
                </CardHeader>
                <Form {...getFormProps(form)} onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <ErrorList id={form.errorId} errors={form.errors} />

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <Field
                            labelProps={{
                                children: "Email",
                            }}
                            inputProps={{
                                ...getInputProps(fields.email, {
                                    type: "email",
                                }),
                                autoComplete: "email",
                                placeholder: "john@example.com",
                            }}
                            errors={fields.email.errors}
                        />

                        <Field
                            labelProps={{
                                children: "Password",
                            }}
                            inputProps={{
                                ...getInputProps(fields.password, {
                                    type: "password",
                                }),
                                autoComplete: "current-password",
                                placeholder: "Enter your password",
                            }}
                            errors={fields.password.errors}
                        />
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">
                                Don't have an account?{" "}
                            </span>
                            <Link
                                to="/register"
                                className="text-primary hover:text-primary/80 font-medium"
                            >
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </Form>
            </Card>
        </div>
    );
}
