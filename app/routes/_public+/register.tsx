import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useState } from 'react';
import { Form, Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { ErrorList, Field } from '~/components/forms';
import { Button } from '~/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '~/components/ui/card';
import { signUp } from '~/lib/auth-client';

const RegisterSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Please enter a valid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

// export async function action({ request }: Route.ActionArgs) {
//     const formData = await request.formData();

//     const submission = parseWithZod(formData, {
//         schema: RegisterSchema,
//     });

//     if (submission.status !== 'success') {
//         return data(
//             { result: submission.reply() },
//             { status: 400 }
//         );
//     }

//     try {
//         const { data: authData, error } = await authClient.signUp.email({
//             email: submission.value.email,
//             password: submission.value.password,
//             name: submission.value.name,
//         });

//         if (error) {
//             // Handle specific auth errors
//             if (error.message?.includes('User already exists') || error.message?.includes('already registered')) {
//                 return data(
//                     {
//                         result: submission.reply({
//                             fieldErrors: {
//                                 email: ['An account with this email already exists'],
//                             },
//                         }),
//                     },
//                     { status: 400 }
//                 );
//             }

//             return data(
//                 {
//                     result: submission.reply({
//                         formErrors: [error.message || 'Registration failed. Please try again.'],
//                     }),
//                 },
//                 { status: 400 }
//             );
//         }

//         console.log(authData)
//         if (authData?.token) {
//             // Registration successful, redirect to home or dashboard
//             // Better Auth handles session cookies automatically
//             return redirect('/');
//         }

//         return data(
//             {
//                 result: submission.reply({
//                     formErrors: ['Registration failed. Please try again.'],
//                 }),
//             },
//             { status: 500 }
//         );
//     } catch (error) {
//         console.error('Registration error:', error);
//         return data(
//             {
//                 result: submission.reply({
//                     formErrors: ['An unexpected error occurred. Please try again.'],
//                 }),
//             },
//             { status: 500 }
//         );
//     }
// }

export default function RegisterPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, fields] = useForm({
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: RegisterSchema,
            });
        },
    });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const submission = parseWithZod(formData, {
            schema: RegisterSchema,
        });

        if (submission.status !== 'success') {
            setIsLoading(false);
            return;
        }

        try {
            const { data: authData, error: authError } = await signUp.email({
                email: submission.value.email,
                password: submission.value.password,
                name: submission.value.name,
            });

            if (authError) {
                setError(authError.message || 'Registration failed. Please try again.');
                setIsLoading(false);
                return;
            }

            console.log('Registration successful:', authData);

            if (authData?.token) {
                // Registration successful, redirect to home
                navigate('/');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <Card className='w-full max-w-md'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='text-2xl font-bold text-center'>
                        Create an account
                    </CardTitle>
                    <CardDescription className='text-center'>
                        Enter your details to register for an account
                    </CardDescription>
                </CardHeader>
                <Form {...getFormProps(form)} onSubmit={handleSubmit}>
                    <CardContent className='space-y-4'>
                        <ErrorList id={form.errorId} errors={form.errors} />

                        {error && (
                            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
                                {error}
                            </div>
                        )}

                        <Field
                            labelProps={{
                                children: 'Full Name',
                            }}
                            inputProps={{
                                ...getInputProps(fields.name, {
                                    type: 'text',
                                }),
                                autoComplete: 'name',
                                placeholder: 'John Doe',
                            }}
                            errors={fields.name.errors}
                        />

                        <Field
                            labelProps={{
                                children: 'Email',
                            }}
                            inputProps={{
                                ...getInputProps(fields.email, {
                                    type: 'email',
                                }),
                                autoComplete: 'email',
                                placeholder: 'john@example.com',
                            }}
                            errors={fields.email.errors}
                        />

                        <Field
                            labelProps={{
                                children: 'Password',
                            }}
                            inputProps={{
                                ...getInputProps(fields.password, {
                                    type: 'password',
                                }),
                                autoComplete: 'new-password',
                                placeholder: 'At least 8 characters',
                            }}
                            errors={fields.password.errors}
                        />

                        <Field
                            labelProps={{
                                children: 'Confirm Password',
                            }}
                            inputProps={{
                                ...getInputProps(fields.confirmPassword, {
                                    type: 'password',
                                }),
                                autoComplete: 'new-password',
                                placeholder: 'Confirm your password',
                            }}
                            errors={fields.confirmPassword.errors}
                        />
                    </CardContent>

                    <CardFooter className='flex flex-col space-y-4'>
                        <Button type='submit' className='w-full' disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>

                        <div className='text-center text-sm'>
                            <span className='text-muted-foreground'>
                                Already have an account?{' '}
                            </span>
                            <Link
                                to='/login'
                                className='text-primary hover:text-primary/80 font-medium'
                            >
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Form>
            </Card>
        </div>
    );
}
