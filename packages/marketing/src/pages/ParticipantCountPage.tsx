import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Check, AlertCircle, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageData {
  inquiryId:        string;
  firstName:        string;
  companyName:      string;
  visitDate:        string | null;
  alreadySubmitted: boolean;
  currentCount:     number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatVisitDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

type View = 'loading' | 'invalid' | 'ready' | 'submitting' | 'submitted';

export default function ParticipantCountPage() {
  const [searchParams] = useSearchParams();
  const id    = searchParams.get('id')    ?? '';
  const token = searchParams.get('token') ?? '';

  const [view,       setView]       = useState<View>('loading');
  const [pageData,   setPageData]   = useState<PageData | null>(null);
  const [count,      setCount]      = useState('');
  const [countError, setCountError] = useState('');
  const [submitted,  setSubmitted]  = useState<{ count: number; alreadyExisted: boolean } | null>(null);

  // ── Validate token on mount ─────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !token) {
      setView('invalid');
      return;
    }

    let cancelled = false;

    async function validate() {
      try {
        const res = await fetch(
          `/api/assessment/participant-count?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
        );
        if (!res.ok) {
          if (!cancelled) setView('invalid');
          return;
        }
        const data = await res.json() as PageData;
        if (!cancelled) {
          setPageData(data);
          // Skip straight to submitted state if already answered
          if (data.alreadySubmitted && data.currentCount !== null) {
            setSubmitted({ count: data.currentCount, alreadyExisted: true });
            setView('submitted');
          } else {
            setView('ready');
          }
        }
      } catch {
        if (!cancelled) setView('invalid');
      }
    }

    void validate();
    return () => { cancelled = true; };
  }, [id, token]);

  // ── Submit handler ──────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCountError('');

    const parsed = parseInt(count, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 500) {
      setCountError('Please enter a number between 1 and 500.');
      return;
    }

    setView('submitting');

    try {
      const res = await fetch('/api/assessment/participant-count', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ inquiryId: id, token, count: parsed }),
      });

      if (!res.ok) throw new Error('Server error');

      const json = await res.json() as { success: boolean; alreadySubmitted?: boolean; count?: number };

      setSubmitted({
        count:           json.alreadySubmitted ? (json.count ?? parsed) : parsed,
        alreadyExisted:  json.alreadySubmitted ?? false,
      });
      setView('submitted');
    } catch {
      // Return to ready so user can retry
      setView('ready');
      setCountError('Something went wrong. Please try again.');
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-navy-200 border-t-gold-500
                          rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-navy-700">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Invalid token ──────────────────────────────────────────────────────────

  if (view === 'invalid') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full
                          bg-red-50 border border-red-200 mx-auto mb-4">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <h1 className="font-serif text-2xl text-navy-900 mb-3">
            This link is not valid.
          </h1>
          <p className="text-sm text-navy-700 leading-relaxed">
            The link may have expired or already been used. If you need to update
            your participant count, please reply to your pre-visit email or contact us at{' '}
            {/* [UPDATE] replace with real support email before launch */}
            <span className="font-medium text-navy-900">support@ecscornerstone.com</span>.
          </p>
        </div>
      </div>
    );
  }

  // ── Submitted ─────────────────────────────────────────────────────────────

  if (view === 'submitted' && submitted && pageData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="rounded-lg border border-navy-200 bg-white p-8 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full
                            bg-gold-100 mx-auto mb-4">
              <Check size={22} className="text-gold-500" strokeWidth={2.5} />
            </div>

            {submitted.alreadyExisted ? (
              <>
                <h1 className="font-serif text-2xl text-navy-900 mb-2">
                  Already submitted.
                </h1>
                <p className="text-sm text-navy-700 leading-relaxed mb-4">
                  We already have your participant count on file for{' '}
                  <span className="font-medium text-navy-900">{pageData.companyName}</span>.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-serif text-2xl text-navy-900 mb-2">
                  Thank you, {pageData.firstName}.
                </h1>
                <p className="text-sm text-navy-700 leading-relaxed mb-4">
                  We've got your count for{' '}
                  <span className="font-medium text-navy-900">{pageData.companyName}</span>.
                  We'll have the right number of assessment links ready before we arrive.
                </p>
              </>
            )}

            <div className="inline-flex items-center gap-2 bg-navy-50 border border-navy-100
                            rounded px-4 py-2 text-sm text-navy-900 mb-5">
              <Users size={15} className="text-gold-500" />
              <span className="font-semibold">{submitted.count}</span>
              <span className="text-navy-600">
                participant{submitted.count === 1 ? '' : 's'}
              </span>
            </div>

            {pageData.visitDate && (
              <p className="text-xs text-blue-gray">
                Visit date: {formatVisitDate(pageData.visitDate)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Ready / Submitting ─────────────────────────────────────────────────────

  if (!pageData) return null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="rounded-lg border border-navy-200 bg-white overflow-hidden">

          {/* Header */}
          <div className="bg-navy-950 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-1">
              ECS AI Assessment
            </p>
            <h1 className="font-serif text-xl text-white">
              {pageData.companyName}
            </h1>
            {pageData.visitDate && (
              <p className="text-sm text-navy-300 mt-1">
                Visit date: {formatVisitDate(pageData.visitDate)}
              </p>
            )}
          </div>

          {/* Form */}
          <div className="px-6 py-7">
            <p className="text-sm text-navy-700 leading-relaxed mb-6">
              Hi {pageData.firstName} — how many team members will be completing the
              Cornerstone assessment on the day of your visit?{' '}
              <span className="text-navy-500">(Include yourself in the count.)</span>
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-1.5 mb-5">
                <label className="text-sm font-medium text-navy-800">
                  Number of participants
                  <span className="text-gold-500 ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) => {
                    setCount(e.target.value);
                    setCountError('');
                  }}
                  placeholder="e.g. 12"
                  disabled={view === 'submitting'}
                  className="w-full rounded border border-navy-200 bg-white px-3 py-2.5
                             text-sm text-navy-900 placeholder:text-blue-gray
                             focus:outline-none focus:ring-2 focus:ring-gold-500
                             focus:border-transparent transition
                             disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {countError && (
                  <p className="text-xs text-red-600">{countError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={view === 'submitting' || !count}
                className="w-full flex items-center justify-center gap-2 px-6 py-3
                           rounded bg-gold-500 text-navy-950 font-semibold
                           hover:bg-gold-400 transition-colors
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {view === 'submitting' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Users size={15} />
                    Submit
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
