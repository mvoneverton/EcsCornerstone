import { Link } from 'react-router-dom';
import { LayoutGrid, User, BarChart2, ArrowRight, Check } from 'lucide-react';

// Platform onboarding lives on the app, not the marketing site.
const PLATFORM_URL =
  (import.meta.env.VITE_PLATFORM_URL as string | undefined) ??
  'https://ecscornerstone-production.up.railway.app';

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CornerstoneSaasPage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            Now available
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

      {/* ── What it includes ──────────────────────────────────────────────── */}
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

      {/* ── Get started ───────────────────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-white mb-8">
            Start today.
          </h2>
          <a
            href={`${PLATFORM_URL}/onboarding/register`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded
                       bg-gold-500 text-navy-900 font-semibold text-sm
                       hover:bg-gold-400 transition-colors"
          >
            Get Started <ArrowRight size={15} />
          </a>
          <p className="mt-4 text-sm text-navy-100">
            Already on our waitlist? Use your same email — we'll recognize you.
          </p>
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
              ECS AI Full Assessment
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
