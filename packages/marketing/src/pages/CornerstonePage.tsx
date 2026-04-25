import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Zap, Shield } from 'lucide-react';
import ProfileQuadrant from '@/components/ProfileQuadrant';

const INSTRUMENTS = [
  {
    name:        'Job Assessment',
    abbr:        'JA',
    description: 'Maps what a role actually requires — how assertive, how relationship-focused. Creates a benchmark profile for any position so you can see how an individual fits the demands of their role.',
  },
  {
    name:        'Work Style Assessment',
    abbr:        'WSA',
    description: 'Profiles how each employee naturally works and communicates — their instinctive assertiveness and responsiveness when operating in their environment.',
  },
  {
    name:        'Personal Communication Assessment',
    abbr:        'PCA',
    description: 'Reveals how each person sees themselves, how others see them, and how they behave under pressure. Three perspectives, one complete picture.',
  },
];

const AGENT_CONNECTIONS = [
  {
    icon: Bot,
    heading: 'Tone calibration',
    body: 'A Vanguard wants directness and conclusions first. A Cultivator needs warmth and patience. Your agents know the difference — automatically.',
  },
  {
    icon: Zap,
    heading: 'Workflow adaptation',
    body: 'Agents adjust their pacing, escalation triggers, and communication frequency based on each person\'s profile.',
  },
  {
    icon: Shield,
    heading: 'Conflict reduction',
    body: 'Mismatched communication styles are a leading source of workplace friction. Cornerstone-enabled agents reduce that friction by default.',
  },
];

export default function CornerstonePage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            The Assessment Framework
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-6">
            ECS Cornerstone
          </h1>
          <p className="text-lg text-navy-100 leading-relaxed">
            The behavioral assessment that makes your AI agents human-aware.
          </p>
        </div>
      </section>

      {/* ── The problem ───────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-6">
          AI agents fail when they communicate the same way with everyone.
        </h2>
        <p className="text-navy-700 leading-relaxed text-lg">
          Every person on your team has a different working style — a different pace, a
          different need for detail, a different threshold for directness. Off-the-shelf AI
          agents ignore all of this. ECS agents don't.
        </p>
      </section>

      {/* ── What it is: three instruments ─────────────────────────────────── */}
      <section className="bg-navy-50 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              Three Instruments
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900">
              A complete picture of how your team works.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {INSTRUMENTS.map((inst) => (
              <div key={inst.abbr} className="rounded-lg border border-navy-200 bg-white p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-900 text-gold-400 text-xs font-bold tracking-wide shrink-0">
                    {inst.abbr}
                  </span>
                  <h3 className="font-semibold text-navy-900">{inst.name}</h3>
                </div>
                <p className="text-sm text-navy-700 leading-relaxed">{inst.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four profiles ─────────────────────────────────────────────────── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              The Four Profiles
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-5">
              Every person maps to a primary Cornerstone profile.
            </h2>
            <p className="text-navy-700 leading-relaxed mb-6">
              The Cornerstone framework places individuals on two axes: Assertiveness (A) and
              Responsiveness (R). The intersection of these axes produces four primary
              communication profiles — each with distinct strengths, preferences, and needs.
            </p>
            <p className="text-sm text-navy-700 leading-relaxed">
              Most people have a primary profile and a secondary — click a quadrant to explore.
            </p>
          </div>

          <ProfileQuadrant />
        </div>
      </section>

      {/* ── How it connects to agents ──────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-8xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-3">
              The Connection
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">
              Every ECS agent reads your team's Cornerstone profiles and adapts accordingly.
            </h2>
            <p className="text-navy-100 max-w-2xl mx-auto">
              This isn't a one-time configuration. Your agents use Cornerstone data on every
              interaction — dynamically adjusting their communication approach to the individual
              they're working with.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {AGENT_CONNECTIONS.map(({ icon: Icon, heading, body }) => (
              <div key={heading} className="rounded-lg bg-navy-800 border border-navy-700 p-6 flex flex-col gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-700">
                  <Icon size={20} className="text-gold-400" />
                </div>
                <h3 className="font-semibold text-white">{heading}</h3>
                <p className="text-sm text-navy-100 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── When it happens ───────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
          Timing
        </p>
        <h2 className="font-serif text-3xl text-navy-900 mb-5">
          Included in the ECS AI Full Assessment. No separate charge.
        </h2>
        <p className="text-navy-700 leading-relaxed mb-6">
          The Cornerstone assessment is conducted during the ECS AI Full Assessment. Every member of your
          team completes the Personal Assessment. The Job Assessment and Work Style Assessment are
          completed by select individuals depending on their role and responsibilities. The results
          inform your AI roadmap, configure your agents, and remain yours to use going forward.
        </p>
        <p className="text-sm text-navy-600 leading-relaxed bg-navy-50 rounded-lg p-4 text-left">
          Completing the ECS AI Scan first? ECS Cornerstone is the natural next step — either as
          part of a full Assessment or as a standalone add-on as you begin implementing AI agents.
        </p>
      </section>

      {/* ── Standalone SaaS teaser ────────────────────────────────────────── */}
      <section className="bg-navy-100 px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-navy-900 mb-4">
            Want Cornerstone without the full consulting engagement?
          </h2>
          <p className="text-navy-700 leading-relaxed mb-8">
            We're building ECS Cornerstone as a standalone SaaS platform — so any organization
            can run the assessment and access team communication profiles independently. No
            consulting engagement required.
          </p>
          <Link
            to="/cornerstone-saas#waitlist"
            className="inline-flex items-center gap-2 px-6 py-3 rounded border border-navy-900
                       text-navy-900 text-sm font-semibold hover:bg-navy-900 hover:text-white
                       transition-colors"
          >
            Join the waitlist <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl text-white mb-4">
            Ready to profile your team?
          </h2>
          <p className="text-navy-100 leading-relaxed mb-8">
            The Cornerstone assessment is included in every ECS AI Full Assessment. Book yours and your
            team completes all three instruments as part of the engagement.
          </p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 px-8 py-4 rounded bg-gold-500 text-navy-950
                       font-semibold hover:bg-gold-400 transition-colors"
          >
            Book Your ECS Assessment <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
