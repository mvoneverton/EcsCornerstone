import { useLocation, useNavigate } from 'react-router-dom';
import type { SubmitResult } from '../lib/api';

const PROFILE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  driver:       { bg: 'bg-[#1A3A5C]',  text: 'text-white',          border: 'border-[#1A3A5C]' },
  artist:       { bg: 'bg-[#D4AF37]',  text: 'text-[#1A3A5C]',      border: 'border-[#D4AF37]' },
  investigator: { bg: 'bg-[#8B9DB8]',  text: 'text-[#1A3A5C]',      border: 'border-[#8B9DB8]' },
  mediator:     { bg: 'bg-[#4A7C59]',  text: 'text-white',          border: 'border-[#4A7C59]' },
};

export default function CompletionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result   = location.state as SubmitResult | null;

  if (!result) {
    navigate('/', { replace: true });
    return null;
  }

  const colors = PROFILE_COLORS[result.primaryProfile] ?? PROFILE_COLORS['driver']!;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full space-y-6">

        {/* Profile hero */}
        <div className={`rounded-2xl p-8 text-center shadow-lg ${colors.bg} ${colors.text}`}>
          <p className="text-sm uppercase tracking-widest font-medium opacity-80 mb-2">
            Your People First Profile
          </p>
          <h1 className="font-serif text-5xl font-bold mb-4">
            {result.profileDisplayName}
          </h1>
          <p className="text-lg font-medium opacity-90 leading-snug">
            {result.tagline}
          </p>
        </div>

        {/* Email notice */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="font-semibold text-navy text-lg mb-1">Check your inbox</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            {result.message}
          </p>
        </div>

        {/* What's next */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-navy text-base mb-3">What's next</h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text}`}>1</span>
              <span>Review your full profile description in the email you'll receive.</span>
            </li>
            <li className="flex gap-3">
              <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text}`}>2</span>
              <span>Bring your insights to your upcoming People First event.</span>
            </li>
            <li className="flex gap-3">
              <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text}`}>3</span>
              <span>Discover how your profile interacts with those closest to you.</span>
            </li>
          </ul>
        </div>

        <p className="text-center text-xs text-slate-400">
          Powered by ECS Cornerstone Assessment
        </p>
      </div>
    </div>
  );
}
