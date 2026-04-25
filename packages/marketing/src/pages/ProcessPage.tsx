import { Link } from 'react-router-dom';
import { Search, LayoutGrid, BarChart2, Map, Rocket, RefreshCw, ArrowRight } from 'lucide-react';
import ProcessTimeline, { type Stage } from '@/components/ProcessTimeline';

const STAGES: Stage[] = [
  {
    number:  1,
    icon:    <Search size={18} />,
    heading: 'Choose Your Starting Point',
    body:    'Begin with the ECS AI Scan for a fast, focused AI analysis — or go deeper with the full ECS AI Full Assessment for AI plus the human factor. Both lead to the same destination: a clear picture of what to do next.',
    badge:   'ECS AI Scan — $1,000  ·  ECS AI Full Assessment — $1,500',
    variant: 'audit',
  },
  {
    number:  2,
    icon:    <LayoutGrid size={18} />,
    heading: 'Team Assessment',
    body:    'Every member of your team completes the ECS Cornerstone assessment — three instruments that map how your people communicate, make decisions, and work under pressure. This data informs every agent we configure and every recommendation we make.',
    badge:   'Included in the ECS AI Full Assessment',
    variant: 'audit',
  },
  {
    number:  3,
    icon:    <BarChart2 size={18} />,
    heading: 'Findings & Opportunity Scoring',
    body:    'We present our findings — a prioritized list of AI opportunities ranked by impact and implementation complexity. You leave with a clear picture of what to do first, what to do next, and what to save for later.',
    badge:   'Included in the ECS AI Full Assessment',
    variant: 'audit',
  },
  {
    number:  4,
    icon:    <Map size={18} />,
    heading: 'Your Custom Roadmap',
    // [UPDATE] add more detail about roadmap deliverables once defined
    body:    'We build a short and long-term implementation roadmap specific to your organization. Short-term: targeted agent deployments that create immediate value. Long-term: a phased transformation plan that scales with your business.',
    badge:   'Included in the ECS AI Full Assessment',
    variant: 'audit',
  },
  {
    number:  5,
    icon:    <Rocket size={18} />,
    heading: 'Implementation',
    // [UPDATE] add implementation detail — agent deployment, training, onboarding process
    body:    'Your agents are deployed and configured to your team\'s Cornerstone profiles. Each agent is calibrated to your workflows, communication standards, and operational priorities before going live.',
    badge:   'Agent placement starting at $800/month · FCAIO starting at $10,000/month',
    variant: 'implementation',
  },
  {
    number:  6,
    icon:    <RefreshCw size={18} />,
    heading: 'Ongoing Support & Optimization',
    // [UPDATE] add ongoing support detail — what clients get after launch, how agents are refined, training cadence
    body:    'Your agents improve over time. We monitor performance, refine configurations, and advise on new AI opportunities as your business evolves. FCAIO clients receive embedded advisory access throughout.',
    variant: 'support',
  },
];

export default function ProcessPage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            How It Works
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-6">
            A process built around your business.
          </h1>
          <p className="text-lg text-navy-100 leading-relaxed">
            Every ECS engagement follows the same proven path — starting with understanding
            before we ever recommend a solution.
          </p>
        </div>
      </section>

      {/* ── Process timeline ──────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
            The Six Stages
          </p>
          <h2 className="font-serif text-3xl text-navy-900">
            From first conversation to ongoing results.
          </h2>
        </div>

        {/* Assessment legend */}
        <div className="flex flex-wrap gap-4 mb-10 text-xs">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-gold-500" />
            <span className="text-navy-700">Included in the ECS AI Full Assessment</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-navy-900" />
            <span className="text-navy-700">Implementation</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-navy-300" />
            <span className="text-navy-700">Ongoing support</span>
          </span>
        </div>

        <ProcessTimeline stages={STAGES} variant="vertical" />
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">
            Ready to see what's possible?
          </h2>
          <p className="text-navy-100 leading-relaxed mb-8">
            Every engagement starts with understanding your business. Book an ECS AI Scan for a
            fast start, or the full ECS AI Full Assessment for AI plus the human factor.
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
