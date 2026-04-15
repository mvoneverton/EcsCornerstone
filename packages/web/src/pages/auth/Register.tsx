import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthLayout } from '../../components/AuthLayout';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth, type AuthUser } from '../../lib/auth';
import api from '../../lib/api';

const schema = z
  .object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    firstName:   z.string().min(1, 'First name is required'),
    lastName:    z.string().min(1, 'Last name is required'),
    email:       z.string().email('Enter a valid email address'),
    password:    z.string().min(8, 'Password must be at least 8 characters'),
    confirm:     z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

interface RegisterResponse {
  user:        AuthUser;
  accessToken: string;
}

export default function Register() {
  const { setAuth } = useAuth();
  const navigate    = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: ({ confirm: _confirm, ...data }: FormValues) =>
      api.post<RegisterResponse>('/auth/register', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      navigate('/admin', { replace: true });
    },
    onError: (err: AxiosError<{ error: { message: string; code?: string } }>) => {
      const { message, code } = err.response?.data?.error ?? {};
      if (code === 'EMAIL_TAKEN') {
        setError('email', { message: 'That email is already registered' });
      } else {
        setError('root', { message: message ?? 'Registration failed. Please try again.' });
      }
    },
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your company's ECS Cornerstone workspace"
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-5">

        <FormField label="Company name" htmlFor="companyName" error={errors.companyName?.message} required>
          <Input
            id="companyName"
            type="text"
            autoComplete="organization"
            autoFocus
            error={!!errors.companyName}
            {...register('companyName')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="First name" htmlFor="firstName" error={errors.firstName?.message} required>
            <Input
              id="firstName"
              type="text"
              autoComplete="given-name"
              error={!!errors.firstName}
              {...register('firstName')}
            />
          </FormField>
          <FormField label="Last name" htmlFor="lastName" error={errors.lastName?.message} required>
            <Input
              id="lastName"
              type="text"
              autoComplete="family-name"
              error={!!errors.lastName}
              {...register('lastName')}
            />
          </FormField>
        </div>

        <FormField label="Work email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters"
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <FormField label="Confirm password" htmlFor="confirm" error={errors.confirm?.message} required>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirm}
            {...register('confirm')}
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
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
