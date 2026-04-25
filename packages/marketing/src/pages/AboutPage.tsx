import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import mikeHeadshot from '../assets/mike-everton.jpeg';

// ── Static structure — all content marked [UPDATE] ───────────────────────────

const SECTIONS = [
  {
    id:      'story',
    eyebrow: 'Our Story',
    heading: 'Why Everton Consulting Services exists.',
    body: [
      { type: 'subheading', text: 'Mike Everton: Founder & CEO' },
      { type: 'lead', text: 'Mike didn\'t start in AI—he started with people.' },
      { type: 'paragraph', text: 'Mike Everton has spent his career working with people across many different organizations. His passion has always been simple: how to make each individual feel important and valued. His motto has always been, "people are more important than processes."' },
      { type: 'paragraph', text: 'Over the last decade, while working in software engineering and building systems, applications, and solutions, a new perspective emerged—AI isn\'t here to replace human connection; it\'s a tool that allows people to focus more on what matters most: people. When used the right way, technology creates space for stronger relationships, better communication, and more meaningful interactions.' },
      { type: 'paragraph', text: 'That\'s where we come in.' },
      { type: 'paragraph', text: 'Everton Consulting Services was built on the principle that people come first. Every engagement begins with a deeper understanding of how your team communicates, collaborates, and builds relationships. As part of our initial assessment, we include a communication pattern evaluation and training session designed to strengthen internal communication and create healthier, more effective workplace dynamics.' },
      { type: 'paragraph', text: 'From there, we apply those same communication insights to the AI solutions we build. By designing AI agents around real human interaction patterns, we create systems that respond more naturally, operate more intelligently, and integrate more seamlessly into the way your business already works.' },
      { type: 'closing', text: 'This isn\'t just about building AI. It\'s about building AI that understands.' },
    ],
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
      {SECTIONS.map(({ id, eyebrow, heading, body }, idx) => (
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
            <div className="flex flex-col gap-5">
              {body ? body.map((block, i) => {
                if (block.type === 'subheading') {
                  return (
                    <p key={i} className="font-semibold text-navy-900 text-lg">
                      {block.text}
                    </p>
                  );
                }
                if (block.type === 'lead') {
                  return (
                    <p key={i} className="text-navy-700 text-xl font-medium italic">
                      {block.text}
                    </p>
                  );
                }
                if (block.type === 'closing') {
                  return (
                    <p key={i} className="text-navy-900 font-semibold text-base border-l-4 border-gold-400 pl-4 mt-2">
                      {block.text}
                    </p>
                  );
                }
                return (
                  <p key={i} className="text-navy-600 leading-relaxed">
                    {block.text}
                  </p>
                );
              }) : (
                <p className="text-navy-400 italic text-sm border-l-2 border-gold-300 pl-4">
                  [UPDATE] replace this placeholder with real content for the "{eyebrow}" section.
                </p>
              )}
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

          <div className="flex justify-center">
            <div className="rounded-lg bg-navy-800 border border-navy-700 p-6 flex flex-col items-center gap-3 w-72">
              <img
                src={mikeHeadshot}
                alt="Mike Everton"
                className="w-24 h-24 rounded-full object-cover border-2 border-gold-400 mb-1"
              />
              <p className="font-semibold text-white text-base">Mike Everton</p>
              <p className="text-xs text-gold-400 uppercase tracking-wide">Founder & CEO</p>
            </div>
          </div>
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
