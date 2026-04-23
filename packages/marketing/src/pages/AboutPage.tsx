import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// ── Static structure — all content marked [UPDATE] ───────────────────────────

const SECTIONS = [
  {
    id:      'story',
    eyebrow: 'Our Story',
    heading: 'Why Everton Consulting Services exists.',
    // [UPDATE] founder background and why ECS was founded — 2–3 paragraphs
    body: null,
  },
  {
    id:      'approach',
    eyebrow: 'Our Approach',
    heading: 'AI implementation built around people, not just processes.',
    // [UPDATE] philosophy on AI implementation and the human factor — 2–3 paragraphs
    body: null,
  },
  {
    id:      'assessment-first',
    eyebrow: 'Why the Assessment First',
    heading: 'We understand your business before we recommend anything.',
    // [UPDATE] explain the reasoning behind making the assessment the mandatory entry point — 1–2 paragraphs
    body: null,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            About ECS
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-6">
            About Everton Consulting Services
          </h1>
          {/* [UPDATE] founder tagline or mission statement */}
          <p className="text-lg text-navy-300 italic">
            [UPDATE] founder tagline or mission statement
          </p>
        </div>
      </section>

      {/* ── Story / Approach / Audit-first ────────────────────────────────── */}
      {SECTIONS.map(({ id, eyebrow, heading }, idx) => (
        <section
          key={id}
          className={`px-4 sm:px-6 lg:px-8 py-20 ${idx % 2 === 0 ? 'bg-white' : 'bg-navy-50'}`}
        >
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
              {eyebrow}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-6">
              {heading}
            </h2>
            {/* [UPDATE] replace with real copy for this section */}
            <div className="flex flex-col gap-4">
              <p className="text-navy-400 italic text-sm border-l-2 border-gold-300 pl-4">
                [UPDATE] replace this placeholder with real content for the "{eyebrow}" section.
              </p>
            </div>
          </div>
        </section>
      ))}

      {/* ── The Team ──────────────────────────────────────────────────────── */}
      <section className="bg-navy-900 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-3">
              The Team
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              The people behind ECS.
            </h2>
          </div>

          {/* [UPDATE] replace with real team cards — headshots, bios, roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-lg bg-navy-800 border border-navy-700 p-6 flex flex-col gap-3"
              >
                {/* [UPDATE] headshot */}
                <div className="w-16 h-16 rounded-full bg-navy-700 border border-navy-600 mb-1" />
                {/* [UPDATE] name */}
                <p className="font-semibold text-white italic text-sm text-navy-400">
                  [UPDATE] Team member name
                </p>
                {/* [UPDATE] role/title */}
                <p className="text-xs text-blue-gray uppercase tracking-wide">
                  [UPDATE] Role / Title
                </p>
                {/* [UPDATE] short bio */}
                <p className="text-sm text-navy-300 leading-relaxed italic">
                  [UPDATE] 2–3 sentence bio.
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-navy-500 mt-8 italic">
            [UPDATE] adjust the number of team cards to match actual team size
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-navy-100 leading-relaxed mb-8">
            Every ECS engagement begins with the AI Assessment — a structured discovery session
            that tells you exactly where AI creates leverage in your business.
          </p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 px-8 py-4 rounded bg-gold-500
                       text-navy-950 font-semibold hover:bg-gold-400 transition-colors"
          >
            Book Your ECS Assessment <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
