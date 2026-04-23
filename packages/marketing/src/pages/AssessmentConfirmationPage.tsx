import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Check, Home, Mail } from 'lucide-react';
import StepIndicator from '@/components/StepIndicator';
import CalendlyEmbed, { type CalendlyScheduledEvent } from '@/components/CalendlyEmbed';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InquiryData {
  inquiryId:       string;
  customerName:    string;
  firstName:       string;
  email:           string;
  companyName:     string;
  stripeSessionId: string;
  amountPaid:      number; // cents
}

// ── Static data ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Fill out the form' },
  { label: 'Complete payment ($1,500)' },
  { label: 'Book your onsite visit' },
  { label: 'We come to you' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

type View = 'loading' | 'error' | 'scheduling' | 'booked';

export default function AssessmentConfirmationPage() {
  const [searchParams] = useSearchParams();
  const sessionId      = searchParams.get('session_id');

  const [view,    setView]    = useState<View>('loading');
  const [inquiry, setInquiry] = useState<InquiryData | null>(null);

  if (!sessionId) return <Navigate to="/assessment" replace />;

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch(
          `/api/assessment/verify-session?session_id=${encodeURIComponent(sessionId!)}`
        );
        if (!res.ok) throw new Error('Verification failed');
        const data = await res.json() as InquiryData;
        if (!cancelled) {
          setInquiry(data);
          setView('scheduling');
          try {
            sessionStorage.removeItem('ecs_assessment_form_data');
            sessionStorage.removeItem('ecs_assessment_inquiry_id');
          } catch { /* storage unavailable */ }
        }
      } catch {
        if (!cancelled) setView('error');
      }
    }

    void verify();
    return () => { cancelled = true; };
  }, [sessionId]);

  function handleEventScheduled(_event: CalendlyScheduledEvent) {
    setView('booked');
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-navy-200 border-t-gold-500
                          rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-navy-700">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (view === 'error' || !inquiry) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl text-navy-900 mb-3">
            We couldn't confirm your payment.
          </h1>
          <p className="text-sm text-navy-700 mb-2 leading-relaxed">
            If your card was charged, your assessment is confirmed and a receipt is on its way.
          </p>
          {/* [UPDATE] replace with real support email before launch */}
          <p className="text-sm text-navy-700 mb-6">
            Need help? Email{' '}
            <span className="font-medium text-navy-900">support@ecscornerstone.com</span>
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-navy-900
                       text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            <Home size={15} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived step indicator state ───────────────────────────────────────────

  const currentStep    = view === 'booked' ? 4 : 3;
  const completedSteps = view === 'booked' ? [1, 2, 3] : [1, 2];

  const shortConfirmation = inquiry.stripeSessionId.slice(-12).toUpperCase();

  // ── Scheduling + Booked ────────────────────────────────────────────────────

  return (
    <div className="bg-navy-50 min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Step indicator */}
        <div className="mb-10">
          <StepIndicator
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Payment confirmed header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 flex items-center justify-center
                          w-9 h-9 rounded-full bg-gold-500">
            <Check size={18} className="text-navy-950" strokeWidth={2.5} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-navy-900">
            Payment confirmed — your assessment is booked.
          </h1>
        </div>

        {/* Receipt */}
        <div className="rounded-lg border border-navy-200 bg-white overflow-hidden mb-8">
          <div className="px-5 py-3 bg-navy-950">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">
              Receipt
            </p>
          </div>
          <div className="px-5 py-5 flex flex-col gap-1 text-sm">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-navy-900">ECS AI Assessment</span>
              <span className="font-semibold text-navy-900">
                ${(inquiry.amountPaid / 100).toLocaleString()}
              </span>
            </div>
            <p className="text-navy-600">{inquiry.companyName}</p>
            <p className="text-blue-gray text-xs mt-1">
              Confirmation #{shortConfirmation}
            </p>
            <p className="text-blue-gray text-xs">
              Receipt sent to {inquiry.email}
            </p>
          </div>
        </div>

        {/* ── Scheduling view ──────────────────────────────────────────────── */}
        {view === 'scheduling' && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-2">
                Now: Choose your visit date
              </p>
              <h2 className="font-serif text-2xl text-navy-900 mb-1">
                Select your preferred date below.
              </h2>
              {/* [UPDATE] confirm availability before launch — Mon–Sat, no Sundays */}
              <p className="text-sm text-navy-700">
                Available Monday–Saturday. Dates book quickly — we recommend choosing now.
              </p>
            </div>

            <CalendlyEmbed
              url={import.meta.env.VITE_CALENDLY_ASSESSMENT_URL as string ?? ''}
              prefill={{ name: inquiry.customerName, email: inquiry.email }}
              onEventScheduled={handleEventScheduled}
            />
          </>
        )}

        {/* ── Booked view ──────────────────────────────────────────────────── */}
        {view === 'booked' && (
          <div className="rounded-lg border border-navy-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-shrink-0 flex items-center justify-center
                              w-8 h-8 rounded-full bg-gold-100">
                <Check size={16} className="text-gold-500" strokeWidth={2.5} />
              </div>
              <h2 className="font-serif text-xl text-navy-900">
                Visit scheduled.
              </h2>
            </div>

            <p className="text-sm text-navy-700 leading-relaxed mb-6">
              A calendar invitation will be sent to{' '}
              <span className="font-medium text-navy-900">{inquiry.email}</span>{' '}
              by Calendly.
            </p>

            <div className="rounded bg-navy-50 border border-navy-100 px-5 py-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Mail size={15} className="text-gold-500 flex-shrink-0" />
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-500">
                  Check your email
                </p>
              </div>
              <p className="text-sm text-navy-700 leading-relaxed mb-3">
                We've sent a full pre-visit overview to{' '}
                <span className="font-medium text-navy-900">{inquiry.email}</span> including:
              </p>
              <ul className="space-y-2">
                {[
                  'Everything about the ECS Cornerstone assessment',
                  'What the visit day looks like',
                  'One quick question about your team',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-navy-700">
                    <Check size={13} className="text-gold-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-navy-900
                         text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
            >
              <Home size={15} /> Back to Home
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
