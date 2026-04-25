import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProcessTimeline, { type Stage } from '@/components/ProcessTimeline';
import { FileSearch, BarChart2, Map, Rocket, RefreshCw } from 'lucide-react';

// ── Process stages ────────────────────────────────────────────────────────────

const PROCESS_STAGES: Stage[] = [
  {
    number:  1,
    icon:    <FileSearch size={16} />,
    heading: 'Choose Your Starting Point',
    body:    'Begin with the ECS AI Scan for a fast, focused AI analysis — or go deeper with the full ECS AI Full Assessment for AI plus the human factor. Both lead to the same destination: a clear picture of what to do next.',
    variant: 'audit',
  },
  {
    number:  2,
    icon:    <BarChart2 size={16} />,
    heading: 'Discovery',
    body:    'We learn your business, your team, and your goals. No assumptions — just a clear understanding of where you are before we recommend anything.',
    variant: 'audit',
  },
  {
    number:  3,
    icon:    <Map size={16} />,
    heading: 'Findings & Roadmap',
    body:    'Clear recommendations, prioritized by impact. You leave knowing exactly what to do first, what to do next, and what to save for later.',
    variant: 'audit',
  },
  {
    number:  4,
    icon:    <Rocket size={16} />,
    heading: 'Implementation',
    body:    'Agents, workflows, or full transformation — based on your findings, not a catalog. Every recommendation is specific to your situation.',
    variant: 'implementation',
  },
  {
    number:  5,
    icon:    <RefreshCw size={16} />,
    heading: 'Ongoing Support',
    body:    'Refinement, training, and advisory as you scale. Your AI capabilities grow with your business.',
    variant: 'support',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-5">
            Everton Consulting Services
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-7 leading-tight">
            <span className="text-white">Automate the ordinary.</span><br />
            <span className="text-gold-500">Honour the individual.</span>
          </h1>
          <p className="text-lg text-navy-100 leading-relaxed mb-10 max-w-2xl mx-auto">
            We help businesses identify where AI creates real leverage — and implement it the right
            way. Every engagement starts with understanding your business before we recommend a
            single solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/assessment#book"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded
                         bg-gold-500 text-navy-950 font-semibold hover:bg-gold-400 transition-colors"
            >
              Book Your ECS Assessment <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-5 text-sm text-navy-400">
            Want a faster start?{' '}
            <Link to="/scan" className="text-navy-200 hover:text-gold-400 transition-colors underline underline-offset-2">
              See the ECS AI Scan →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Two offerings ─────────────────────────────────────────────────── */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900">
              Where would you like to start?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ECS AI Scan */}
            <div className="rounded-lg border border-navy-200 bg-navy-50 p-8 flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-gray">
                Fast &amp; Focused
              </p>
              <h3 className="font-serif text-2xl text-navy-900">ECS AI Scan</h3>
              <p className="text-sm text-navy-700 leading-relaxed">
                A Zoom-based discovery session and a custom AI recommendation report delivered
                within 48 hours. The fastest way to find out where AI can help your business —
                and where to start.
              </p>
              <p className="text-xl font-semibold text-navy-900">$1,000</p>
              <Link
                to="/scan"
                className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded border
                           border-navy-900 text-navy-900 text-sm font-semibold
                           hover:bg-navy-900 hover:text-white transition-colors self-start"
              >
                Learn More <ArrowRight size={15} />
              </Link>
            </div>

            {/* ECS AI Full Assessment */}
            <div className="rounded-lg border border-gold-500/40 bg-navy-950 p-8 flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                Deep &amp; Complete
              </p>
              <h3 className="font-serif text-2xl text-white">ECS AI Full Assessment</h3>
              <p className="text-sm text-navy-100 leading-relaxed">
                A full company engagement that maps your operations, profiles your team using ECS
                Cornerstone, and delivers a custom AI roadmap. The most complete picture of where
                AI fits in your organization.
              </p>
              <p className="text-xl font-semibold text-white">$1,500</p>
              <Link
                to="/assessment"
                className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded
                           bg-gold-500 text-navy-950 text-sm font-semibold
                           hover:bg-gold-400 transition-colors self-start"
              >
                Learn More <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="bg-navy-50 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              The Process
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-3">
              How It Works
            </h2>
          </div>

          <ProcessTimeline stages={PROCESS_STAGES} variant="horizontal" />

          <p className="text-xs text-blue-gray text-center mt-8 leading-relaxed max-w-xl mx-auto">
            Implementation options are discussed after your assessment findings — every
            recommendation is based on your specific situation, not a catalog.
          </p>

          <div className="text-center mt-8">
            <Link
              to="/process"
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800
                         hover:text-gold-500 transition-colors underline underline-offset-2"
            >
              See the full process <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ECS Cornerstone teaser ────────────────────────────────────────── */}
      <section className="bg-navy-100 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-4">
            ECS Cornerstone
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-6">
            The human factor in AI implementation.
          </h2>
          <p className="text-navy-700 leading-relaxed mb-8">
            ECS Cornerstone is our behavioral assessment framework — it profiles how your team
            communicates, makes decisions, and works under pressure. Included in the ECS AI
            Assessment. Used to configure every agent we deploy.
          </p>
          <Link
            to="/cornerstone"
            className="inline-flex items-center gap-2 px-6 py-3 rounded border border-navy-900
                       text-navy-900 text-sm font-semibold hover:bg-navy-900 hover:text-white
                       transition-colors"
          >
            Learn About Cornerstone <ArrowRight size={15} />
          </Link>
        </div>
      </section>


    </div>
  );
}
