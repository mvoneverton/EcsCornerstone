import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { AuthLayout } from '../../components/AuthLayout';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

const CONTACT_EMAIL = 'michael@evertonconsultingservices.org';

type BillingCycle = 'monthly' | 'annually';

interface Plan {
  id:                     string;
  name:                   string;
  priceMonthlyCents:      number;
  priceAnnuallyCents:     number;
  assessmentLimitMonthly: number | null;
  features:               string[];
}

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

function formatPrice(cents: number, cycle: BillingCycle): string {
  const amount = cents / 100;
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}/${cycle === 'monthly' ? 'mo' : 'yr'}`;
}

export default function RegisterPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle]     = useState<BillingCycle>('monthly');
  const [planError, setPlanError]           = useState<string | null>(null);
  const [waitlistName, setWaitlistName]     = useState<string | null>(null);

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['onboarding-plans'],
    queryFn: () => api.get<{ plans: Plan[] }>('/onboarding/plans').then((r) => r.data.plans),
  });

  const selfServePlans = (plansData ?? []).filter((p) => p.name !== 'Enterprise');
  const enterprisePlan = (plansData ?? []).find((p) => p.name === 'Enterprise');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues & { planId: string; billingCycle: BillingCycle }) =>
      api.post<{ checkoutUrl: string }>('/onboarding/register', {
        companyName:    data.companyName,
        adminFirstName: data.firstName,
        adminLastName:  data.lastName,
        email:          data.email,
        password:       data.password,
        planId:         data.planId,
        billingCycle:   data.billingCycle,
      }).then((r) => r.data),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
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

  // Greet visitors already on the Cornerstone early-access waitlist.
  const checkWaitlist = async (email: string) => {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setWaitlistName(null);
      return;
    }
    try {
      const { data } = await api.post<{ onWaitlist: boolean; firstName?: string }>(
        '/marketing/waitlist-convert',
        { email },
      );
      setWaitlistName(data.onWaitlist ? data.firstName ?? '' : null);
    } catch {
      setWaitlistName(null);
    }
  };

  const emailField = register('email');

  const onSubmit = (data: FormValues) => {
    if (!selectedPlanId) {
      setPlanError('Select a plan to continue');
      return;
    }
    setPlanError(null);
    mutation.mutate({ ...data, planId: selectedPlanId, billingCycle });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your company's ECS Cornerstone workspace"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* ── Plan selection ──────────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Choose a plan</span>
            <div className="inline-flex rounded-lg border border-navy-100 bg-navy-50 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  billingCycle === 'monthly' ? 'bg-white text-navy shadow-sm' : 'text-navy-300'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annually')}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  billingCycle === 'annually' ? 'bg-white text-navy shadow-sm' : 'text-navy-300'
                }`}
              >
                Annual · save 20%
              </button>
            </div>
          </div>

          {plansLoading ? (
            <p className="text-sm text-gray-400">Loading plans…</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {selfServePlans.map((plan) => {
                const cents = billingCycle === 'monthly' ? plan.priceMonthlyCents : plan.priceAnnuallyCents;
                const selected = selectedPlanId === plan.id;
                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => { setSelectedPlanId(plan.id); setPlanError(null); }}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      selected ? 'border-gold bg-navy-50' : 'border-gray-200 hover:border-navy-100'
                    }`}
                  >
                    <div className="font-serif text-lg text-navy">{plan.name}</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">
                      {formatPrice(cents, billingCycle)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {plan.assessmentLimitMonthly
                        ? `${plan.assessmentLimitMonthly} assessments/mo`
                        : 'Unlimited assessments'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {enterprisePlan && (
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 block rounded-lg border border-dashed border-navy-100 p-3 text-center text-sm text-navy-300 transition-colors hover:border-navy-200 hover:text-navy"
            >
              Need more? <span className="font-medium text-navy">Contact us</span> about Enterprise.
            </a>
          )}

          {planError && <p className="mt-2 text-xs text-red-600">{planError}</p>}
        </div>

        {/* ── Account details ─────────────────────────────────────────── */}
        <FormField label="Company name" htmlFor="companyName" error={errors.companyName?.message} required>
          <Input
            id="companyName"
            type="text"
            autoComplete="organization"
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
            {...emailField}
            onBlur={(e) => {
              emailField.onBlur(e);
              void checkWaitlist(e.target.value.trim());
            }}
          />
          {waitlistName !== null && (
            <div className="mt-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-navy">
              <span className="font-semibold">
                {waitlistName ? `Welcome, ${waitlistName} — ` : 'Welcome — '}
              </span>
              you're on our early access list. You'll get priority onboarding support.
            </div>
          )}
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

        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}

        <Button
          type="submit"
          variant="gold"
          loading={mutation.isPending}
          className="w-full"
        >
          Continue to payment
        </Button>
      </form>
    </AuthLayout>
  );
}
