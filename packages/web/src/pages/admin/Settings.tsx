import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';

// ── Company name form ─────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(120),
});
type CompanyForm = z.infer<typeof companySchema>;

interface CompanyInfo {
  id:   string;
  name: string;
  slug: string;
  subscriptionStatus: string;
  plan: { name: string; assessmentLimit: number | null };
}

function CompanyNameSection() {
  const [saved, setSaved] = useState(false);

  const { data } = useQuery<CompanyInfo>({
    queryKey: ['company'],
    queryFn: () => api.get<CompanyInfo>('/admin/company').then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    values: data ? { name: data.name } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (form: CompanyForm) =>
      api.patch('/admin/company', form).then((r) => r.data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-navy mb-4">Company</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="max-w-sm">
        <FormField label="Company name" htmlFor="company-name" error={errors.name?.message}>
          <Input id="company-name" {...register('name')} error={!!errors.name} />
        </FormField>

        {mutation.isError && (
          <p className="mt-2 text-sm text-red-600">Failed to save. Please try again.</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" size="md" loading={mutation.isPending}>Save</Button>
          {saved && <span className="text-sm text-emerald-600">Saved!</span>}
        </div>
      </form>
    </section>
  );
}

// ── Password change form ──────────────────────────────────────────────────────

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });
type PwForm = z.infer<typeof pwSchema>;

function PasswordSection() {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  const mutation = useMutation({
    mutationFn: (form: PwForm) =>
      api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      }).then((r) => r.data),
    onSuccess: () => {
      reset();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-navy mb-4">Change Password</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="max-w-sm space-y-4">
        <FormField label="Current password" htmlFor="cur-pw" error={errors.currentPassword?.message}>
          <Input id="cur-pw" type="password" {...register('currentPassword')} error={!!errors.currentPassword} />
        </FormField>
        <FormField label="New password" htmlFor="new-pw" error={errors.newPassword?.message}>
          <Input id="new-pw" type="password" {...register('newPassword')} error={!!errors.newPassword} />
        </FormField>
        <FormField label="Confirm new password" htmlFor="confirm-pw" error={errors.confirmPassword?.message}>
          <Input id="confirm-pw" type="password" {...register('confirmPassword')} error={!!errors.confirmPassword} />
        </FormField>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {(mutation.error as { response?: { data?: { error?: { message?: string } } } })
              ?.response?.data?.error?.message ?? 'Failed to update password.'}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="md" loading={mutation.isPending}>Update password</Button>
          {saved && <span className="text-sm text-emerald-600">Password updated!</span>}
        </div>
      </form>
    </section>
  );
}

// ── Profile section ───────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName:  z.string().min(1, 'Last name is required').max(60),
});
type ProfileForm = z.infer<typeof profileSchema>;

function ProfileSection() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName  ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (form: ProfileForm) =>
      api.patch(`/admin/people/${user?.id}`, form).then((r) => r.data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-navy mb-4">Your Profile</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="max-w-sm">
        <div className="space-y-4">
          <FormField label="First name" htmlFor="first-name" error={errors.firstName?.message}>
            <Input id="first-name" {...register('firstName')} error={!!errors.firstName} />
          </FormField>
          <FormField label="Last name" htmlFor="last-name" error={errors.lastName?.message}>
            <Input id="last-name" {...register('lastName')} error={!!errors.lastName} />
          </FormField>
        </div>

        {mutation.isError && (
          <p className="mt-2 text-sm text-red-600">Failed to save. Please try again.</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" size="md" loading={mutation.isPending}>Save profile</Button>
          {saved && <span className="text-sm text-emerald-600">Saved!</span>}
        </div>
      </form>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'company_admin';

  return (
    <div className="px-8 py-8">
      <PageHeader title="Settings" />
      <div className="max-w-2xl space-y-6">
        {isAdmin && <CompanyNameSection />}
        <ProfileSection />
        <PasswordSection />
      </div>
    </div>
  );
}
