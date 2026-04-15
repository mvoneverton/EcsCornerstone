import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthLayout } from '../../components/AuthLayout';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post('/auth/forgot-password', data).then((r) => r.data),
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      const msg = err.response?.data?.error?.message ?? 'Something went wrong. Please try again.';
      setError('root', { message: msg });
    },
  });

  if (mutation.isSuccess) {
    return (
      <AuthLayout title="Check your email">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
            <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            If that email is registered, we've sent a password reset link. Check your inbox and
            follow the instructions — the link expires in one hour.
          </p>
          <Link
            to="/login"
            className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-5">

        <FormField label="Email address" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            error={!!errors.email}
            {...register('email')}
          />
        </FormField>

        {errors.root && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={mutation.isPending}
        >
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
