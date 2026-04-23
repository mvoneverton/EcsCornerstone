import { useState } from 'react';

interface Profile {
  id:          string;
  label:       string;
  axis:        string;
  description: string;
  bg:          string;
  border:      string;
  accent:      string;
  text:        string;
}

const PROFILES: Profile[] = [
  {
    id:          'vanguard',
    label:       'Vanguard',
    axis:        'High A · Low R',
    description: 'Direct, decisive, results-driven. Vanguards move fast, cut through ambiguity, and expect the same from others. They lead by doing and measure success in outcomes.',
    bg:          'bg-red-50',
    border:      'border-red-200',
    accent:      'bg-[#C0392B]',
    text:        'text-[#7B1D12]',
  },
  {
    id:          'catalyst',
    label:       'Catalyst',
    axis:        'High A · High R',
    description: 'Energetic, persuasive, people-focused. Catalysts bring enthusiasm to every room they enter. They build coalitions, drive momentum, and thrive when they can bring others along.',
    bg:          'bg-amber-50',
    border:      'border-amber-200',
    accent:      'bg-[#B7770D]',
    text:        'text-[#7A4F06]',
  },
  {
    id:          'cultivator',
    label:       'Cultivator',
    axis:        'Low A · High R',
    description: 'Patient, warm, relationship-oriented. Cultivators are the glue of any team. They listen deeply, build trust steadily, and create the psychological safety that allows others to do their best work.',
    bg:          'bg-teal-50',
    border:      'border-teal-200',
    accent:      'bg-[#1F6B5A]',
    text:        'text-[#0F3D2E]',
  },
  {
    id:          'architect',
    label:       'Architect',
    axis:        'Low A · Low R',
    description: 'Precise, analytical, detail-driven. Architects think before they speak and plan before they act. They bring rigor and structure that turns good ideas into reliable systems.',
    bg:          'bg-navy-100',
    border:      'border-navy-200',
    accent:      'bg-[#2E6DA4]',
    text:        'text-navy-900',
  },
];

export default function ProfileQuadrant() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = PROFILES.find((p) => p.id === activeId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
        {PROFILES.map((profile) => (
          <button
            key={profile.id}
            onClick={() => setActiveId(activeId === profile.id ? null : profile.id)}
            className={`flex flex-col gap-2 rounded-lg border-2 p-5 text-left transition-all
              ${profile.bg} ${profile.border}
              ${activeId === profile.id ? 'ring-2 ring-offset-2 ring-navy-900' : 'hover:shadow-sm'}`}
          >
            <div className={`w-3 h-3 rounded-full ${profile.accent}`} />
            <span className={`font-semibold text-sm ${profile.text}`}>{profile.label}</span>
            <span className="text-xs text-navy-700 font-mono">{profile.axis}</span>
          </button>
        ))}
      </div>

      {/* Expanded description */}
      {active && (
        <div className={`rounded-lg border-2 p-6 ${active.bg} ${active.border}`}>
          <p className={`font-semibold mb-2 ${active.text}`}>{active.label}</p>
          <p className="text-sm text-navy-800 leading-relaxed">{active.description}</p>
        </div>
      )}

      {!active && (
        <p className="text-center text-sm text-blue-gray">
          Click a profile to learn more.
        </p>
      )}
    </div>
  );
}
