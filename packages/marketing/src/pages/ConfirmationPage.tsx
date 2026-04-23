import { useEffect, useState } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { agents } from '@/data/agents';
import { useRoster } from '@/context/RosterContext';
import AgentIcon from '@/components/AgentIcon';
import GatedPage from '@/components/GatedPage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionData {
  agentIds:     string[];
  customerName: string;
  companyName:  string;
  amountPaid:   number; // cents
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearRoster } = useRoster();

  const [session, setSession]   = useState<SessionData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Guard — no session_id means this page was reached directly, not via Stripe
  if (!sessionId) return <Navigate to="/" replace />;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/stripe/session/${encodeURIComponent(sessionId!)}`);
        if (!res.ok) throw new Error('Session not found or payment incomplete');
        const data = await res.json() as SessionData;
        if (!cancelled) {
          setSession(data);
          // Clear roster now that payment is confirmed
          clearRoster();
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  // clearRoster is stable (dispatch-based) — safe to exclude from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-navy-200 border-t-gold-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-navy-700">Confirming your reservation…</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (fetchError || !session) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl text-navy-900 mb-3">
            We couldn't verify your reservation.
          </h1>
          <p className="text-sm text-navy-700 mb-6">
            If payment was taken, your reservation is confirmed and we'll be in touch shortly.
            {/* [UPDATE: support email] */}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-navy-900
                       text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────

  const reservedAgents = agents.filter((a) => session.agentIds.includes(a.id));
  const firstName = session.customerName.split(' ')[0] ?? 'there';

  return (
    <GatedPage>
    <div className="bg-navy-50 min-h-screen px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500 mb-6">
            <Check size={30} className="text-navy-950" strokeWidth={2.5} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-3">
            You're reserved, {firstName}.
          </h1>
          <p className="text-navy-700">
            Your agent reservation is confirmed. Here's what happens next.
          </p>
        </div>

        {/* ── Reservation summary ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-navy-200 p-6 mb-6">
          <h2 className="font-semibold text-navy-900 mb-4">Reservation summary</h2>

          <ul className="flex flex-col divide-y divide-navy-100 mb-5">
            {reservedAgents.map((agent) => (
              <li key={agent.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-navy-50 shrink-0">
                  <AgentIcon agentId={agent.id} size={16} className="text-navy-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900">{agent.name}</p>
                  <p className="text-xs text-blue-gray">{agent.role}</p>
                </div>
                <span className="text-xs font-semibold text-navy-700">
                  Starting at ${agent.monthlyStartingAt}/mo
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1.5 pt-4 border-t border-navy-100 text-sm">
            {session.companyName && (
              <div className="flex justify-between text-navy-700">
                <span>Company</span>
                <span className="font-medium text-navy-900">{session.companyName}</span>
              </div>
            )}
            <div className="flex justify-between text-navy-700">
              <span>Reservation paid</span>
              <span className="font-medium text-navy-900">
                ${(session.amountPaid / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-navy-700">
              <span>Applied to first month</span>
              <span className="font-medium text-green-700">Yes</span>
            </div>
          </div>
        </div>

        {/* ── Next steps ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-navy-200 p-6 mb-6">
          <h2 className="font-semibold text-navy-900 mb-5">What happens next</h2>

          <ol className="flex flex-col gap-5">
            {[
              {
                n: '1',
                heading: 'Check your inbox',
                body: "You'll receive a confirmation email shortly with your reservation details.",
              },
              {
                n: '2',
                heading: "We'll be in touch about your ECS AI Audit",
                body: "If you haven't completed your audit yet, we'll reach out within 1 business day to schedule it. The audit is where your agents get configured to your team's communication profiles.",
              },
              {
                n: '3',
                heading: 'Agents deployed within 24\u201348 hours of audit completion',
                body: "You'll receive login details for the ECS Cornerstone platform to track your agents and manage your subscription. Once your audit is complete, your agents are configured and deployed.",
              },
            ].map(({ n, heading, body }) => (
              <li key={n} className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-navy-900 text-white text-xs font-semibold">
                  {n}
                </div>
                <div>
                  <p className="font-medium text-navy-900 mb-1">{heading}</p>
                  <p className="text-sm text-navy-700 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Platform note ────────────────────────────────────────────── */}
        <div className="rounded-lg bg-navy-100 border border-navy-200 px-5 py-4 mb-8 text-sm text-navy-700 leading-relaxed">
          You'll receive a login to the ECS Cornerstone platform to track your agents, view
          team communication profiles, and manage your subscription.
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-navy-900
                       text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            Back to Home <ArrowRight size={15} />
          </Link>

          {/* [UPDATE: support email] */}
          <p className="text-xs text-blue-gray">
            Questions?{' '}
            <span className="underline underline-offset-2">
              [UPDATE: support email]
            </span>
          </p>
        </div>

      </div>
    </div>
    </GatedPage>
  );
}
