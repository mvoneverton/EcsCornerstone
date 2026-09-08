import type { ReactNode } from 'react';

export const CONTACT_EMAIL = 'michael@evertonconsultingservices.org';
export const TAGLINE = 'Automate the ordinary. Honor the individual.';

// ── Page frame ───────────────────────────────────────────────────────────────

export function GatedShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">{children}</div>
    </div>
  );
}

export function GatedHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="border-b border-gray-100 pb-10 text-center">
      <img src="/ecs-logo.svg" alt="ECS Cornerstone" className="mx-auto mb-8 h-12 w-auto" />
      <h1 className="font-serif text-3xl leading-tight text-navy sm:text-4xl">{title}</h1>
      <p className="mt-3 text-lg text-blue-gray">{subtitle}</p>
    </header>
  );
}

export function GatedSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-serif text-2xl text-navy">{heading}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

export function PricingCard({
  price,
  lines,
  note,
}: {
  price: string;
  lines: string[];
  note?: string;
}) {
  return (
    <div className="mt-4 rounded-xl border-2 border-navy-100 bg-navy-50 p-8 text-center">
      <div className="font-serif text-3xl text-navy">{price}</div>
      <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {note && <p className="mt-4 text-xs italic text-gray-500">{note}</p>}
    </div>
  );
}

export function StepList({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="mt-4 space-y-6">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
            {i + 1}
          </span>
          <div>
            <div className="font-semibold text-navy">{s.title}</div>
            <p className="mt-1 text-[15px] leading-relaxed text-gray-700">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function CtaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-block rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-gold-400"
    >
      {children}
    </a>
  );
}

export function GatedFooter() {
  return (
    <footer className="mt-16 border-t border-gray-100 pt-10 text-center">
      <img src="/ecs-logo.svg" alt="ECS Cornerstone" className="mx-auto h-9 w-auto opacity-80" />
      <p className="mt-3 font-serif text-sm italic text-blue-gray">{TAGLINE}</p>
    </footer>
  );
}
