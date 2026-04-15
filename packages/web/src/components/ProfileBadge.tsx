type Profile = 'Catalyst' | 'Vanguard' | 'Cultivator' | 'Architect';

const profileStyles: Record<Profile, { bg: string; border: string; text: string; sub: string }> = {
  Catalyst:  { bg: 'bg-catalyst-bg',   border: 'border-catalyst-mid',   text: 'text-catalyst-text',   sub: 'text-amber-600' },
  Vanguard:  { bg: 'bg-vanguard-bg',   border: 'border-vanguard-mid',   text: 'text-vanguard-text',   sub: 'text-red-600' },
  Cultivator:{ bg: 'bg-cultivator-bg', border: 'border-cultivator-mid', text: 'text-cultivator-text', sub: 'text-emerald-700' },
  Architect: { bg: 'bg-architect-bg',  border: 'border-architect-mid',  text: 'text-architect-text',  sub: 'text-accent' },
};

function isProfile(p: string): p is Profile {
  return ['Catalyst', 'Vanguard', 'Cultivator', 'Architect'].includes(p);
}

interface ProfileBadgeProps {
  label?:           string;
  primaryProfile:   string;
  secondaryProfile?: string | null;
  /** Render as a compact inline chip instead of a card */
  compact?:         boolean;
}

export function ProfileBadge({ label, primaryProfile, secondaryProfile, compact }: ProfileBadgeProps) {
  const p = isProfile(primaryProfile) ? primaryProfile : 'Architect';
  const s = profileStyles[p];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>
        {primaryProfile}
        {secondaryProfile && <span className="opacity-60">/ {secondaryProfile}</span>}
      </span>
    );
  }

  return (
    <div className={`flex flex-col rounded-lg border-l-4 px-4 py-3 ${s.bg} ${s.border}`}>
      {label && <span className="text-xs font-medium uppercase tracking-wide opacity-60 mb-1">{label}</span>}
      <span className={`text-base font-semibold ${s.text}`}>{primaryProfile}</span>
      {secondaryProfile && (
        <span className={`text-sm ${s.sub} opacity-75`}>/ {secondaryProfile}</span>
      )}
    </div>
  );
}

interface ProfileScoreBarProps {
  profile: string;
  score:   number;
}

const barColors: Record<Profile, string> = {
  Catalyst:   'bg-amber-400',
  Vanguard:   'bg-red-500',
  Cultivator: 'bg-emerald-600',
  Architect:  'bg-accent',
};

export function ProfileScoreBar({ profile, score }: ProfileScoreBarProps) {
  const p = isProfile(profile) ? profile : 'Architect';
  const pct = Math.round((score / 800) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs font-medium text-gray-600 shrink-0">{profile}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColors[p]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-gray-700">{score}</span>
    </div>
  );
}
