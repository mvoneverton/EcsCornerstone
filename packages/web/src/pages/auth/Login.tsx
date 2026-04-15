import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthLayout } from '../../components/AuthLayout';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth, type AuthUser } from '../../lib/auth';
import api from '../../lib/api';

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

interface LoginResponse {
  user:        AuthUser;
  accessToken: string;
}

export default function Login() {
  const { setAuth } = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      navigate(from, { replace: true });
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      const msg = err.response?.data?.error?.message ?? 'Login failed. Please try again.';
      setError('root', { message: msg });
    },
  });

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="ECS Cornerstone client portal"
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

        <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-accent hover:text-accent-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

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
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
