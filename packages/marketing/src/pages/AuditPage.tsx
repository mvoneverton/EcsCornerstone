import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, FileSearch, Users, GraduationCap, Map } from 'lucide-react';
import PricingNote from '@/components/PricingNote';

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:       z.string().min(1, 'Required'),
  lastName:        z.string().min(1, 'Required'),
  companyName:     z.string().min(1, 'Required'),
  title:           z.string().min(1, 'Required'),
  email:           z.string().email('Valid email required'),
  phone:           z.string().min(1, 'Required'),
  companySize:     z.string().min(1, 'Select company size'),
  industry:        z.string().min(1, 'Select industry'),
  assessmentCount: z.string().min(1, 'Select a range'),
  message:         z.string().min(10, 'Please tell us more about your challenges'),
  referralSource:  z.string().optional(),
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

const ASSESSMENT_COUNTS = ['1–10', '11–25', '26–50', '51–100', '100+'];

const REFERRAL_SOURCES = ['Referral', 'LinkedIn', 'Google Search', 'Other'];

const VALUE_CARDS = [
  {
    icon: FileSearch,
    title: 'Full Discovery Session',
    body: "We map your operations, identify pain points, and score every AI opportunity by impact and effort. You'll know exactly where to start.",
  },
  {
    icon: Users,
    title: 'ECS Cornerstone Assessment',
    body: 'Your entire team completes all three Cornerstone instruments. You receive individual communication profiles and a team-wide behavioral map.',
  },
  {
    icon: GraduationCap,
    title: 'One-Day Team Training',
    body: 'We walk your team through their Cornerstone results — what the profiles mean, how to use them, and how to communicate more effectively across different working styles.',
  },
  {
    icon: Map,
    title: 'Custom AI Roadmap',
    body: 'You leave with a prioritized short and long-term implementation plan. What to automate first, what to build toward, and how to get there.',
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
  'placeholder:text-blue-gray focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition';

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
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
      const res = await fetch('/api/audit/inquiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Server error');
    } catch {
      setError('root', {
        message:
          'Something went wrong. Please email us directly at [UPDATE: support email].',
      });
    }
  }

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            The Starting Point
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-6">
            The ECS AI Audit
          </h1>
          <p className="text-lg text-navy-100 leading-relaxed mb-4">
            A full-day engagement that gives you a clear picture of where AI fits in your
            business — and exactly what to do about it.
          </p>
          <p className="text-sm text-blue-gray mb-8">
            Starting at $1,500 — pricing scales with company size.
          </p>
          <a
            href="#book"
            className="inline-flex items-center gap-2 px-8 py-4 rounded bg-gold-500 text-navy-950
                       font-semibold hover:bg-gold-400 transition-colors"
          >
            Schedule Your Audit <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* ── What you get ──────────────────────────────────────────────────── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
            What's Included
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy-900">
            Everything you need to move forward with confidence.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUE_CARDS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border border-navy-100 bg-navy-50 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-900">
                <Icon size={20} className="text-gold-400" />
              </div>
              <h3 className="font-semibold text-navy-900">{title}</h3>
              <p className="text-sm text-navy-700 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Honest pitch ──────────────────────────────────────────────────── */}
      <section className="bg-navy-100 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-6">
            Worth it — even if you stop here.
          </h2>
          <p className="text-navy-700 leading-relaxed">
            The ECS AI Audit is designed to deliver real value whether or not you engage ECS
            further. The Cornerstone training alone is something teams talk about for months.
            The roadmap is actionable regardless of who implements it. We built it this way
            intentionally — because the best way to earn a long-term client is to give them
            something genuinely useful first.
          </p>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              Investment
            </p>
            <h2 className="font-serif text-3xl text-navy-900">Audit Pricing</h2>
          </div>

          <div className="rounded-lg border border-navy-200 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-2 bg-navy-900 px-6 py-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-gray">
                Company Size
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-gray">
                Starting Price
              </span>
            </div>

            {/* Rows */}
            {[
              { size: 'Small Business (1–25 employees)',   price: 'Starting at $1,500' },
              { size: 'Mid-Size (26–150 employees)',        price: 'Custom quote' }, // [UPDATE] add price range
              { size: 'Enterprise (150+ employees)',        price: 'Custom quote' },
            ].map(({ size, price }, idx) => (
              <div
                key={size}
                className={`grid grid-cols-2 px-6 py-4 border-t border-navy-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-navy-50'
                }`}
              >
                <span className="text-sm text-navy-800">{size}</span>
                <span className="text-sm font-semibold text-navy-900">{price}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-blue-gray mt-4 leading-relaxed text-center">
            Pricing reflects the scope of the discovery session and the number of team members
            completing the Cornerstone assessment. Schedule your audit to receive a custom
            quote for your organization.
          </p>
        </div>
      </section>

      {/* ── What happens after ────────────────────────────────────────────── */}
      <section className="bg-navy-50 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              After the Audit
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900">
              Two paths forward — both start here.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Agent placement */}
            <div className="rounded-lg border border-navy-200 bg-white p-8 flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-gray">
                Short-term / Targeted
              </p>
              <h3 className="font-serif text-2xl text-navy-900">AI Agent Placement</h3>
              <p className="text-sm text-navy-700 leading-relaxed">
                Deploy one or more AI agents configured to your team's Cornerstone profiles.
                Starting at $800/month per agent. Bundle discounts available for 3–5 agents.{' '}
                {/* [UPDATE] add discount percentages once confirmed */}
                Pause any agent at any time.
              </p>
              <PricingNote variant="pause" />
              <Link
                to="/agents"
                className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded bg-navy-900
                           text-white text-sm font-semibold hover:bg-navy-800 transition-colors self-start"
              >
                Browse Agents <ArrowRight size={15} />
              </Link>
            </div>

            {/* FCAIO */}
            <div className="rounded-lg border border-gold-500/30 bg-navy-950 p-8 flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-gray">
                Long-term / Full Transformation
              </p>
              <h3 className="font-serif text-2xl text-white">Fractional Chief AI Officer</h3>
              <p className="text-sm text-navy-100 leading-relaxed">
                For organizations ready to transform how they operate at every level. Custom
                agent team, data infrastructure assessment, full implementation, training, and
                ongoing advisory. Flat $10,000/month.
              </p>
              <Link
                to="/fcaio"
                className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded border
                           border-gold-500 text-gold-500 text-sm font-semibold hover:bg-gold-500
                           hover:text-navy-950 transition-colors self-start"
              >
                Learn About FCAIO <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Booking form ──────────────────────────────────────────────────── */}
      <section id="book" className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              Get Started
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-3">
              Schedule Your ECS AI Audit
            </h2>
            <p className="text-navy-700">
              Fill out the form below and we'll be in touch within 1 business day to confirm
              your date and provide a custom quote.
            </p>
          </div>

          {isSubmitSuccessful ? (
            <div className="rounded-lg bg-navy-50 border border-navy-200 p-8 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gold-100 mx-auto mb-4">
                <Check size={22} className="text-gold-500" strokeWidth={3} />
              </div>
              <h3 className="font-serif text-2xl text-navy-900 mb-2">
                Thank you, {getValues('firstName')}.
              </h3>
              <p className="text-navy-700 text-sm leading-relaxed">
                We'll be in touch within 1 business day to confirm your audit date and
                provide a custom quote.
              </p>
              <button
                onClick={() => reset()}
                className="mt-6 text-sm text-blue-gray hover:text-navy-900 underline underline-offset-2 transition-colors"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
              {errors.root && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

              {/* Dropdowns row 1 */}
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

              {/* Assessment count */}
              <Field
                label="Approximate number of employees completing the Cornerstone assessment"
                error={errors.assessmentCount?.message}
                required
              >
                <select {...register('assessmentCount')} className={inputClass}>
                  <option value="">Select a range</option>
                  {ASSESSMENT_COUNTS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>

              {/* Message */}
              <Field
                label="What are the biggest operational challenges you're hoping AI can help with?"
                error={errors.message?.message}
                required
              >
                <textarea
                  {...register('message')}
                  rows={5}
                  className={inputClass}
                  placeholder="Tell us about your current operations, pain points, and goals..."
                />
              </Field>

              {/* Referral */}
              <Field label="How did you hear about us?" error={errors.referralSource?.message}>
                <select {...register('referralSource')} className={inputClass}>
                  <option value="">Select one (optional)</option>
                  {REFERRAL_SOURCES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded bg-gold-500 text-navy-950
                           font-semibold hover:bg-gold-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending…' : 'Request My Audit'}
              </button>

              <p className="text-xs text-blue-gray text-center">
                The ECS AI Audit is an in-person or virtual engagement. We work with businesses
                across [UPDATE: regions/countries].
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
