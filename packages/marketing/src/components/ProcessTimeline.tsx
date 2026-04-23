import type { ReactNode } from 'react';
import { useState } from 'react';

export interface Stage {
  number:   number;
  icon:     ReactNode;
  heading:  string;
  body:     string;
  badge?:   string;
  variant:  'audit' | 'implementation' | 'support';
}

interface Props {
  stages:  Stage[];
  variant: 'horizontal' | 'vertical';
}

// ── Horizontal (compact, homepage) ───────────────────────────────────────────

function HorizontalTimeline({ stages }: { stages: Stage[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Step row */}
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {stages.map((stage, idx) => (
          <div key={stage.number} className="flex items-center flex-1 min-w-0">
            {/* Step pill */}
            <button
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
              className={`group flex flex-col items-center gap-2 flex-1 min-w-0 transition-all ${
                activeIdx === idx ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-semibold transition-colors ${
                  activeIdx === idx
                    ? 'border-gold-500 bg-gold-500 text-navy-950'
                    : 'border-navy-200 bg-white text-navy-700 group-hover:border-navy-400'
                }`}
              >
                {stage.number}
              </div>
              <p className="text-xs font-medium text-navy-800 text-center leading-tight px-1">
                {stage.heading}
              </p>
            </button>

            {/* Connector */}
            {idx < stages.length - 1 && (
              <div className="w-full max-w-[40px] h-px bg-navy-200 shrink-0 mb-7" />
            )}
          </div>
        ))}
      </div>

      {/* Expanded detail card */}
      {activeIdx !== null && (
        <div className="rounded-lg border border-navy-100 bg-navy-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-gray mb-1">
            Step {stages[activeIdx].number}
          </p>
          <h4 className="font-serif text-lg text-navy-900 mb-2">{stages[activeIdx].heading}</h4>
          <p className="text-sm text-navy-700 leading-relaxed">{stages[activeIdx].body}</p>
          {stages[activeIdx].badge && (
            <span className="inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full bg-gold-100 text-gold-500 border border-gold-500/30">
              {stages[activeIdx].badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Vertical (expanded, /process page) ───────────────────────────────────────

function VerticalTimeline({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex flex-col">
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;

        const wrapperStyles = {
          audit:          'bg-navy-50 border-l-4 border-gold-500',
          implementation: 'bg-navy-900 border-l-4 border-gold-500',
          support:        'bg-navy-100 border-l-4 border-navy-300',
        }[stage.variant];

        const headingColor = stage.variant === 'implementation' ? 'text-white' : 'text-navy-900';
        const bodyColor    = stage.variant === 'implementation' ? 'text-navy-100' : 'text-navy-700';
        const badgeStyles  = {
          audit:          'bg-gold-100 text-gold-500 border border-gold-500/30',
          implementation: 'bg-navy-800 text-gold-400 border border-gold-500/30',
          support:        'bg-white text-navy-700 border border-navy-200',
        }[stage.variant];

        return (
          <div key={stage.number} className="relative flex gap-6">
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-navy-200 z-0" />
            )}

            {/* Number badge */}
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-navy-900 text-white text-sm font-semibold z-10">
              {stage.number}
            </div>

            {/* Card */}
            <div className={`flex-1 rounded-lg p-6 mb-6 ${wrapperStyles}`}>
              <div className="flex items-center gap-2 mb-2 text-navy-400">
                {stage.icon}
                <h3 className={`font-serif text-xl ${headingColor}`}>{stage.heading}</h3>
              </div>
              <p className={`text-sm leading-relaxed ${bodyColor}`}>{stage.body}</p>
              {stage.badge && (
                <span className={`inline-block mt-4 text-xs font-medium px-3 py-1 rounded-full ${badgeStyles}`}>
                  {stage.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function ProcessTimeline({ stages, variant }: Props) {
  return variant === 'horizontal'
    ? <HorizontalTimeline stages={stages} />
    : <VerticalTimeline stages={stages} />;
}
