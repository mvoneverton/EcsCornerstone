import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import PhaseCard from '@/components/PhaseCard';
import GatedPage from '@/components/GatedPage';
import { apiPost } from '@/lib/api';

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:     z.string().min(1, 'Required'),
  lastName:      z.string().min(1, 'Required'),
  companyName:   z.string().min(1, 'Required'),
  title:         z.string().min(1, 'Required'),
  email:         z.string().email('Valid email required'),
  phone:         z.string().min(1, 'Required'),
  companySize:   z.string().min(1, 'Select company size'),
  industry:      z.string().min(1, 'Select industry'),
  message:       z.string().min(10, 'Please tell us about your business'),
  referralSource: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Static data ───────────────────────────────────────────────────────────────

const COMPANY_SIZES = ['1–10', '11–25', '26–50', '51–150', '151–500', '500+'];

const INDUSTRIES = [
  'Accounting & Finance', 'Construction & Real Estate', 'Consulting & Professional Services',
  'Education', 'Healthcare & Medical', 'Hospitality & Food Service', 'Insurance',
  'Legal', 'Manufacturing', 'Marketing & Advertising', 'Non-Profit',
  'Retail & E-Commerce', 'Software & Technology', 'Transportation & Logistics', 'Other',
];

const REFERRAL_SOURCES = ['Referral', 'LinkedIn', 'Google Search', 'Other'];

const INCLUDED_ITEMS = [
  'In-person or virtual discovery and operations assessment',
  'Custom AI strategy and agent roadmap',
  'Full company ECS Cornerstone assessment — facilitated by ECS',
  'Custom agent team design and deployment',
  'Data infrastructure assessment — evaluating your current data structure for AI compatibility',
  'Staff training on AI integration and agent workflows',
  'Ongoing advisory access and consulting',
  'Agent refinement and optimization over time',
];

const PHASES = [
  {
    number:  1,
    heading: 'The ECS AI Full Assessment',
    body:    'Before the FCAIO engagement begins, every client completes the ECS AI Full Assessment. Discovery, Cornerstone assessment, team training, opportunity scoring, and roadmap. Priced separately — $1,500.',
    price:   '$1,500',
  },
  {
    number:  2,
    heading: 'Build & Deploy',
    body:    'We design and deploy your custom agent team based on audit findings. Every agent is configured to your team\'s Cornerstone profiles. Data infrastructure is assessed and prepared for AI integration.',
  },
  {
    number:  3,
    heading: 'Ongoing Advisory',
    body:    'We remain embedded in your organization — refining agents, training staff, advising on new AI opportunities, and building toward your long-term roadmap.',
    price:   '$10,000/month',
  },
];

// ── Shared field component ────────────────────────────────────────────────────

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
      <label className="text-sm font-medium text-navy-200">
        {label}{required && <span className="text-gold-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded border border-navy-700 bg-navy-800 px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-navy-500 focus:outline-none focus:ring-2 focus:ring-gold-500 ' +
  'focus:border-transparent transition';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FcaioPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    getValues,
    reset,
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await apiPost('/api/fcaio/inquiry', data);
    } catch {
      setError('root', {
        message: 'Something went wrong. Please try again.',
      });
    }
  }

  return (
    <GatedPage>
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-5">
            Fractional Chief AI Officer
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-gold-500 mb-7 leading-tight">
            A strategy partner, not just a tool.
          </h1>
          <p className="text-lg text-navy-100 leading-relaxed mb-10">
            The FCAIO engagement is for organizations ready to transform how they operate at
            every level — not just automate a task.
          </p>
          <a
            href="#inquiry"
            className="inline-flex items-center gap-2 px-8 py-4 rounded bg-gold-500 text-navy-950
                       font-semibold hover:bg-gold-400 transition-colors"
          >
            Start the Conversation <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* ── What is an FCAIO ──────────────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            The Engagement
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6">
            What is a Fractional Chief AI Officer?
          </h2>
          <p className="text-navy-100 leading-relaxed text-lg">
            Most organizations know AI can help. Few know exactly where, how, or in what order.
            A Fractional Chief AI Officer brings C-suite AI strategy without the full-time cost
            — embedded in your leadership team, moving from assessment to implementation to
            optimization.
          </p>
        </div>
      </section>

      {/* ── What's included ───────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
              What's Included
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              Everything. End to end.
            </h2>
          </div>

          <ul className="flex flex-col gap-4">
            {INCLUDED_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-gold-500">
                  <Check size={12} className="text-navy-950" strokeWidth={3} />
                </div>
                <span className="text-navy-100 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            Investment
          </p>
          <h2 className="font-serif text-5xl sm:text-6xl text-gold-500 mb-5">
            $10,000<span className="text-2xl text-navy-300 font-sans font-normal">/month</span>
          </h2>
          <p className="text-navy-100 leading-relaxed mb-6">
            Pricing reflects the scope of a full organizational engagement. Custom proposals
            available for enterprise organizations.
          </p>
          <p className="text-sm text-navy-300 mb-8">
            Every FCAIO client begins with the ECS AI Audit. The audit is priced separately
            based on company size — starting at $1,500.
          </p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold-400
                       hover:text-gold-300 transition-colors"
          >
            Book your audit first <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Three-phase timeline ──────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
              How It Works
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              A three-phase engagement.
            </h2>
          </div>

          <div className="flex flex-col">
            {PHASES.map((phase, idx) => (
              <PhaseCard
                key={phase.number}
                number={phase.number}
                heading={phase.heading}
                body={phase.body}
                price={phase.price}
                isLast={idx === PHASES.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Inquiry form ──────────────────────────────────────────────────── */}
      <section id="inquiry" className="bg-navy-900 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
              Get Started
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-3">
              Start the Conversation
            </h2>
            <p className="text-navy-200">
              Tell us about your organization. We'll be in touch within 1 business day.
            </p>
          </div>

          {isSubmitSuccessful ? (
            <div className="rounded-lg bg-navy-800 border border-navy-700 p-8 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gold-500 mx-auto mb-4">
                <Check size={22} className="text-navy-950" strokeWidth={3} />
              </div>
              <h3 className="font-serif text-2xl text-white mb-2">
                Thank you, {getValues('firstName')}.
              </h3>
              <p className="text-navy-200 text-sm leading-relaxed">
                We'll be in touch within 1 business day.
              </p>
              <button
                onClick={() => reset()}
                className="mt-6 text-sm text-blue-gray hover:text-white underline underline-offset-2 transition-colors"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
              {errors.root && (
                <div className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                  {errors.root.message}
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="First Name" error={errors.firstName?.message} required>
                  <input {...register('firstName')} className={inputClass} placeholder="Jane" />
                </Field>
                <Field label="Last Name" error={errors.lastName?.message} required>
                  <input {...register('lastName')} className={inputClass} placeholder="Smith" />
                </Field>
              </div>

              {/* Company + Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Company Name" error={errors.companyName?.message} required>
                  <input {...register('companyName')} className={inputClass} placeholder="Acme Corp" />
                </Field>
                <Field label="Your Title / Role" error={errors.title?.message} required>
                  <input {...register('title')} className={inputClass} placeholder="CEO" />
                </Field>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Email" error={errors.email?.message} required>
                  <input {...register('email')} type="email" className={inputClass} placeholder="jane@acme.com" />
                </Field>
                <Field label="Phone" error={errors.phone?.message} required>
                  <input {...register('phone')} type="tel" className={inputClass} placeholder="+1 (555) 000-0000" />
                </Field>
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Company Size" error={errors.companySize?.message} required>
                  <select {...register('companySize')} className={inputClass}>
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Industry" error={errors.industry?.message} required>
                  <select {...register('industry')} className={inputClass}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </Field>
              </div>

              {/* Message */}
              <Field
                label="Tell us about your business and what you're hoping to achieve"
                error={errors.message?.message}
                required
              >
                <textarea
                  {...register('message')}
                  rows={5}
                  className={inputClass}
                  placeholder="Describe your organization, current operations, and the outcomes you're looking for..."
                />
              </Field>

              {/* Referral */}
              <Field label="How did you hear about us?" error={errors.referralSource?.message}>
                <select {...register('referralSource')} className={inputClass}>
                  <option value="">Select one (optional)</option>
                  {REFERRAL_SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>

              {/* [UPDATE] add ECS notification email to FCAIO_NOTIFY_EMAIL env var */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex items-center justify-center gap-2 px-8 py-4 rounded
                           bg-gold-500 text-navy-950 font-semibold hover:bg-gold-400
                           disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Sending…' : (
                  <>Request a Discovery Call <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
    </GatedPage>
  );
}
