import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const LAST_UPDATED = 'September 8, 2026';
export const LEGAL_CONTACT = 'michael@evertonconsultingservices.org';

export interface LegalSection {
  heading: string;
  /** One or more paragraphs. Strings render as <p>; arrays render as a <ul>. */
  body: (string | string[])[];
}

export function LegalLayout({
  title,
  intro,
  sections,
  showLastUpdated = true,
}: {
  title: string;
  intro?: ReactNode;
  sections: LegalSection[];
  showLastUpdated?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="inline-block">
          <img src="/ecs-logo.svg" alt="ECS Cornerstone" className="h-10 w-auto" />
        </Link>

        <h1 className="mt-8 font-serif text-3xl text-navy sm:text-4xl">{title}</h1>
        {showLastUpdated && (
          <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
        )}

        {intro && (
          <div className="mt-6 text-[15px] leading-relaxed text-gray-700">{intro}</div>
        )}

        <div className="mt-8 space-y-8">
          {sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="font-serif text-xl text-navy">
                {i + 1}. {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-gray-700">
                {section.body.map((block, j) =>
                  Array.isArray(block) ? (
                    <ul key={j} className="list-disc space-y-1.5 pl-5">
                      {block.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j}>{block}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 border-t border-gray-100 pt-6 text-sm text-gray-500">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/legal/terms" className="hover:text-accent hover:underline">
              Terms of Service
            </Link>
            <Link to="/legal/privacy" className="hover:text-accent hover:underline">
              Privacy Policy
            </Link>
            <Link to="/legal/dpa" className="hover:text-accent hover:underline">
              Data Processing Agreement
            </Link>
          </div>
          <p className="mt-4">
            © {new Date().getFullYear()} Everton Consulting Services.
          </p>
        </footer>
      </div>
    </div>
  );
}
