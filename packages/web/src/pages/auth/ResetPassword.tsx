import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthLayout } from '../../components/AuthLayout';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm:  z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: ({ password }: FormValues) =>
      api.post('/auth/reset-password', { token, password }).then((r) => r.data),
    onSuccess: () => {
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    },
    onError: (err: AxiosError<{ error: { message: string; code?: string } }>) => {
      const { message, code } = err.response?.data?.error ?? {};
      if (code === 'INVALID_RESET_TOKEN') {
        setError('root', { message: 'This reset link is invalid or has expired. Please request a new one.' });
      } else {
        setError('root', { message: message ?? 'Password reset failed. Please try again.' });
      }
    },
  });

  if (!token) {
    return (
      <AuthLayout title="Invalid link">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            This reset link is missing a token. Please use the link from your email exactly as sent.
          </p>
          <Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline">
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (mutation.isSuccess) {
    return (
      <AuthLayout title="Password updated">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">
            Your password has been updated. Redirecting you to sign in…
          </p>
          <Link to="/login" className="text-sm font-medium text-accent hover:underline">
            Sign in now
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password for your account"
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-5">

        <FormField
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters"
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            error={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <FormField label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message} required>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirm}
            {...register('confirm')}
          />
        </FormField>

        {errors.root && (
          <div className="rounded-lg bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{errors.root.message}</p>
            {errors.root.message?.includes('invalid or has expired') && (
              <Link
                to="/forgot-password"
                className="mt-1 block text-sm font-medium text-red-700 underline"
              >
                Request a new link →
              </Link>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={mutation.isPending}
        >
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
