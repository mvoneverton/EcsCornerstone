import type { ReactNode } from 'react';

type Variant = 'audit' | 'implementation' | 'support';

interface Props {
  number: number;
  icon: ReactNode;
  heading: string;
  body: string;
  badge?: string;
  variant: Variant;
  isLast?: boolean;
}

const VARIANT_STYLES: Record<Variant, { wrapper: string; badge: string }> = {
  audit: {
    wrapper: 'bg-navy-50 border-l-4 border-gold-500',
    badge:   'bg-gold-100 text-gold-500 border border-gold-500/30',
  },
  implementation: {
    wrapper: 'bg-navy-900 border-l-4 border-gold-500',
    badge:   'bg-navy-800 text-gold-400 border border-gold-500/30',
  },
  support: {
    wrapper: 'bg-navy-100 border-l-4 border-navy-300',
    badge:   'bg-white text-navy-700 border border-navy-200',
  },
};

const TEXT_STYLES: Record<Variant, { heading: string; body: string }> = {
  audit:          { heading: 'text-navy-900', body: 'text-navy-700' },
  implementation: { heading: 'text-white',    body: 'text-navy-100' },
  support:        { heading: 'text-navy-900', body: 'text-navy-700' },
};

export default function ProcessStage({ number, icon, heading, body, badge, variant, isLast = false }: Props) {
  const vs = VARIANT_STYLES[variant];
  const ts = TEXT_STYLES[variant];

  return (
    <div className="relative flex gap-6">
      {/* Connecting line between stages */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-navy-200 z-0" />
      )}

      {/* Number + icon stack */}
      <div className="shrink-0 flex flex-col items-center gap-1 z-10">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-navy-900 text-white text-sm font-semibold">
          {number}
        </div>
        <div className="text-navy-400">{icon}</div>
      </div>

      {/* Card */}
      <div className={`flex-1 rounded-lg p-6 mb-6 ${vs.wrapper}`}>
        <h3 className={`font-serif text-xl mb-2 ${ts.heading}`}>{heading}</h3>
        <p className={`text-sm leading-relaxed ${ts.body}`}>{body}</p>

        {badge && (
          <span className={`inline-block mt-4 text-xs font-medium px-3 py-1 rounded-full ${vs.badge}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
