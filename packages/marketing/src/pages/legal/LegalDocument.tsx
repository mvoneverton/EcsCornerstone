import type { ReactNode } from 'react';
import type { LegalSection } from './content';

export const LAST_UPDATED = 'September 8, 2026';

export default function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="font-serif text-3xl sm:text-4xl text-navy-900">{title}</h1>
      <p className="mt-2 text-sm text-blue-gray">Last updated: {LAST_UPDATED}</p>

      {intro && (
        <div className="mt-6 text-[15px] leading-relaxed text-gray-700">{intro}</div>
      )}

      <div className="mt-8 space-y-8">
        {sections.map((section, i) => (
          <section key={section.heading}>
            <h2 className="font-serif text-xl text-navy-900">
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
    </div>
  );
}
