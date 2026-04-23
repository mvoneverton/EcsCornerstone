import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { LayoutGrid, User, BarChart2, ArrowRight, Check } from 'lucide-react';

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  email:     z.string().email('Valid email required'),
});

type FormData = z.infer<typeof schema>;

// ── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: LayoutGrid,
    title: 'All three Cornerstone assessments',
    body: 'Self-administered online. Job Assessment, Work Style Assessment, and Personal Communication Assessment — the full framework, available independently.',
  },
  {
    icon: User,
    title: 'Individual profile reports',
    body: 'Every team member receives a detailed profile — their Cornerstone type, communication preferences, and guidance on working across different styles.',
  },
  {
    icon: BarChart2,
    title: 'Team dashboard',
    body: 'A full organizational view. See your team\'s complete communication profile map — where people cluster, where gaps exist, and how to bridge them.',
  },
];

const FOR_WHOM = [
  {
    heading: 'HR and People Operations teams',
    body: 'Who want communication profile data for hiring, onboarding, or team development — without a full consulting engagement.',
  },
  {
    heading: 'Team coaches and facilitators',
    body: 'Who want a structured, validated behavioral assessment framework to bring into workshops and leadership development programs.',
  },
  {
    heading: 'Organizations already using AI',
    body: 'Who want their team\'s communication data to inform agent configuration — and want to run the assessment on their own timeline.',
  },
];

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CornerstoneSaasPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Request failed');
      setSubmittedName(data.firstName);
      setSubmitted(true);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            Coming Soon
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-gold-500 mb-6">
            ECS Cornerstone — Standalone Platform
          </h1>
          <p className="text-lg text-navy-100 leading-relaxed">
            Give your team the behavioral assessment framework used in AI-powered organizations.
            No consulting engagement required.
          </p>
        </div>
      </section>

      {/* ── What it will include ──────────────────────────────────────────── */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              What's included
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900">
              Everything you need to profile your team.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-lg border border-navy-200 bg-navy-50 p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-900">
                  <Icon size={20} className="text-gold-400" />
                </div>
                <h3 className="font-semibold text-navy-900">{title}</h3>
                <p className="text-sm text-navy-700 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ──────────────────────────────────────────────────── */}
      <section className="bg-navy-50 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              Who it's for
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900">
              Built for teams who want the data — on their own terms.
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {FOR_WHOM.map(({ heading, body }) => (
              <div key={heading} className="flex gap-4 items-start">
                <div className="shrink-0 mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-navy-900">
                  <Check size={13} className="text-gold-400" strokeWidth={3} />
                </div>
                <div>
                  <p className="font-semibold text-navy-900 mb-1">{heading}</p>
                  <p className="text-sm text-navy-700 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Email capture ─────────────────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-lg mx-auto">
          {submitted ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-500 mb-6">
                <Check size={28} className="text-navy-950" strokeWidth={2.5} />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4">
                You're on the list, {submittedName}.
              </h2>
              <p className="text-navy-100 leading-relaxed">
                We'll reach out as soon as ECS Cornerstone is available as a standalone platform.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="font-serif text-2xl sm:text-3xl text-white mb-3">
                  Be the first to know when we launch.
                </h2>
                <p className="text-navy-100 text-sm leading-relaxed">
                  We're in active development. Join the waitlist and we'll notify you at launch.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <Field label="First Name" error={errors.firstName?.message} required>
                  <input
                    {...register('firstName')}
                    placeholder="Jane"
                    className="rounded border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm
                               text-white placeholder-navy-400 focus:outline-none focus:border-gold-500
                               focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                </Field>

                <Field label="Work Email" error={errors.email?.message} required>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="jane@company.com"
                    className="rounded border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm
                               text-white placeholder-navy-400 focus:outline-none focus:border-gold-500
                               focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                </Field>

                {serverError && (
                  <p className="text-sm text-red-400">{serverError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded
                             bg-gold-500 text-navy-950 font-semibold text-sm
                             hover:bg-gold-400 disabled:opacity-60 disabled:cursor-not-allowed
                             transition-colors"
                >
                  {isSubmitting ? 'Joining…' : (
                    <>Join the Waitlist <ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ── Already available note ────────────────────────────────────────── */}
      <section className="bg-navy-100 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-navy-700">
            ECS Cornerstone is currently available as part of the{' '}
            <Link
              to="/assessment"
              className="font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700"
            >
              ECS AI Assessment
            </Link>
            .{' '}
            <Link
              to="/cornerstone"
              className="font-semibold text-navy-900 underline underline-offset-2 hover:text-navy-700"
            >
              Learn more about the framework →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
