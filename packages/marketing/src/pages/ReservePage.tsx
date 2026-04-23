import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { agents } from '@/data/agents';
import { useRoster } from '@/context/RosterContext';
import AgentIcon from '@/components/AgentIcon';
import PricingNote from '@/components/PricingNote';
import GatedPage from '@/components/GatedPage';

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:   z.string().min(1, 'Required'),
  lastName:    z.string().min(1, 'Required'),
  email:       z.string().email('Valid email required'),
  companyName: z.string().min(1, 'Required'),
  industry:    z.string().min(1, 'Select industry'),
});

type FormData = z.infer<typeof schema>;

// ── Static data ───────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Accounting & Finance', 'Construction & Real Estate', 'Consulting & Professional Services',
  'Education', 'Healthcare & Medical', 'Hospitality & Food Service', 'Insurance',
  'Legal', 'Manufacturing', 'Marketing & Advertising', 'Non-Profit',
  'Retail & E-Commerce', 'Software & Technology', 'Transportation & Logistics', 'Other',
];

const RESERVATION_FEE_CENTS = 10; // $10 per agent

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  error,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-navy-800">
        {label}{required && <span className="text-gold-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 ' +
  'placeholder:text-blue-gray focus:outline-none focus:ring-2 focus:ring-gold-500 ' +
  'focus:border-transparent transition';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReservePage() {
  const { selectedAgentIds, removeAgent } = useRoster();
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get('cancelled') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Scroll to top when cancelled banner appears
  useEffect(() => {
    if (cancelled) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [cancelled]);

  // Guard — redirect to agents if roster is empty
  if (selectedAgentIds.length === 0) {
    return <Navigate to="/agents" replace />;
  }

  const selectedAgents = agents.filter((a) => selectedAgentIds.includes(a.id));
  const reservationTotal = selectedAgents.length * RESERVATION_FEE_CENTS;
  const monthlyEstimate  = selectedAgents.length * 800;

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...data, agentIds: selectedAgentIds }),
      });

      if (!res.ok) throw new Error('Server error');

      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch {
      setError('root', { message: 'Something went wrong. Please try again.' });
    }
  }

  return (
    <GatedPage>
    <div className="bg-navy-50 min-h-screen">
      {/* ── Cancelled banner ────────────────────────────────────────────── */}
      {cancelled && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-center">
          <p className="text-sm text-red-700">
            Your reservation was not completed. Your roster has been saved — complete checkout
            whenever you're ready.
          </p>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-2">
            Reservation
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-navy-900">
            Reserve Your Agents
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* ── Left: form ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-navy-200 p-8">
            <h2 className="font-semibold text-navy-900 mb-6">Your details</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
              {errors.root && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors.root.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="First Name" error={errors.firstName?.message} required>
                  <input {...register('firstName')} className={inputClass} placeholder="Jane" />
                </Field>
                <Field label="Last Name" error={errors.lastName?.message} required>
                  <input {...register('lastName')} className={inputClass} placeholder="Smith" />
                </Field>
              </div>

              <Field label="Work Email" error={errors.email?.message} required>
                <input
                  {...register('email')}
                  type="email"
                  className={inputClass}
                  placeholder="jane@acme.com"
                />
              </Field>

              <Field label="Company Name" error={errors.companyName?.message} required>
                <input
                  {...register('companyName')}
                  className={inputClass}
                  placeholder="Acme Corp"
                />
              </Field>

              <Field label="Industry" error={errors.industry?.message} required>
                <select {...register('industry')} className={inputClass}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>

              {/* Audit check note */}
              <div className="rounded-lg bg-navy-50 border border-navy-200 px-4 py-4 text-sm text-navy-700 leading-relaxed">
                <p className="font-medium text-navy-900 mb-1">Haven't completed your ECS AI Audit yet?</p>
                Your agent will be configured using your ECS Cornerstone profile from your audit.
                If you haven't completed your audit yet, we'll reach out after your reservation
                to schedule it.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex items-center justify-center gap-2 px-8 py-4 rounded
                           bg-gold-500 text-navy-950 font-semibold hover:bg-gold-400
                           disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Redirecting to checkout…' : (
                  <>Complete Reservation <ArrowRight size={16} /></>
                )}
              </button>

              <p className="text-xs text-blue-gray text-center">
                You'll be redirected to Stripe's secure checkout to complete your $
                {reservationTotal} reservation.
              </p>
            </form>
          </div>

          {/* ── Right: order summary ─────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-navy-200 p-6">
              <h2 className="font-semibold text-navy-900 mb-5">Your roster</h2>

              <ul className="flex flex-col divide-y divide-navy-100">
                {selectedAgents.map((agent) => (
                  <li key={agent.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-navy-50 shrink-0">
                      <AgentIcon agentId={agent.id} size={16} className="text-navy-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-900 truncate">{agent.name}</p>
                      <p className="text-xs text-blue-gray truncate">{agent.role}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAgent(agent.id)}
                      className="shrink-0 text-navy-400 hover:text-navy-700 transition-colors p-1"
                      aria-label={`Remove ${agent.name}`}
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4 border-t border-navy-100 flex flex-col gap-2">
                <div className="flex justify-between text-sm text-navy-700">
                  <span>Reservation fee</span>
                  <span className="font-medium text-navy-900">
                    ${reservationTotal} <span className="font-normal text-blue-gray">({selectedAgents.length} × $10)</span>
                  </span>
                </div>
                <div className="flex justify-between text-sm text-navy-700">
                  <span>Monthly estimate</span>
                  <span className="font-medium text-navy-900">
                    Starting at ${monthlyEstimate.toLocaleString()}/mo
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <PricingNote variant="deposit" />
                <PricingNote variant="pause" />
              </div>
            </div>

            <p className="text-xs text-blue-gray text-center">
              Need more agents?{' '}
              <Link to="/agents" className="underline underline-offset-2 hover:text-navy-700">
                Back to agents
              </Link>
              {' · '}
              <Link to="/teams" className="underline underline-offset-2 hover:text-navy-700">
                Browse teams
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </GatedPage>
  );
}
