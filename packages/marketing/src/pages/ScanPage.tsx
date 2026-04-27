import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import emailjs from '@emailjs/browser';
import { apiPost } from '@/lib/api';

const EJS_SERVICE  = (import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined) ?? 'service_njvhocw';
const EJS_TEMPLATE = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined) ?? 'template_2y1xge9';
const EJS_KEY      = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined) ?? '5Y8VEuPx96H8YmSpP';
import { Check, ArrowRight, PhoneCall, Search, FileText, AlertCircle } from 'lucide-react';
import StepIndicator from '@/components/StepIndicator';
import PrePaymentSummary, { type InquiryFormData } from '@/components/PrePaymentSummary';

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:      z.string().min(1, 'Required'),
  lastName:       z.string().min(1, 'Required'),
  companyName:    z.string().min(1, 'Required'),
  title:          z.string().min(1, 'Required'),
  email:          z.string().email('Valid email required'),
  phone:          z.string().min(1, 'Required'),
  companySize:    z.string().min(1, 'Select company size'),
  industry:       z.string().min(1, 'Select industry'),
  message:        z.string().min(10, 'Please tell us more about your challenges'),
  referralSource: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Static data ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Fill out the form' },
  { label: 'Complete payment ($1,000)' },
  { label: 'Book your Zoom call' },
  { label: 'We meet' },
];

const COMPANY_SIZES = ['1–10', '11–25', '26–50', '51–150', '151–500', '500+'];

const INDUSTRIES = [
  'Accounting & Finance', 'Construction & Real Estate', 'Consulting & Professional Services',
  'Education', 'Healthcare & Medical', 'Hospitality & Food Service', 'Insurance',
  'Legal', 'Manufacturing', 'Marketing & Advertising', 'Non-Profit',
  'Retail & E-Commerce', 'Software & Technology', 'Transportation & Logistics', 'Other',
];

const REFERRAL_SOURCES = ['Referral', 'LinkedIn', 'Google Search', 'Other'];

const VALUE_CARDS = [
  {
    icon: PhoneCall,
    title: 'Discovery Call',
    body: 'A focused Zoom session where we map your current operations, identify friction points, and explore where AI can create immediate value. No prep required — just show up and talk about your business.',
  },
  {
    icon: Search,
    title: 'AI Opportunity Analysis',
    body: 'We analyze your situation against the current AI tool landscape and identify the specific agents, automations, and workflows that fit your business — not a generic list, a targeted one.',
  },
  {
    icon: FileText,
    title: 'Custom Report (48-hour delivery)',
    body: 'You receive a professionally designed PowerPoint report within 48 hours of your call. It includes your current state, recommended AI tools and agents, and a prioritized starting point — ready to act on immediately.',
  },
];

// ── SessionStorage helpers ────────────────────────────────────────────────────

const SS_FORM_KEY    = 'ecs_scan_form_data';
const SS_INQUIRY_KEY = 'ecs_scan_inquiry_id';

function saveToSession(data: FormData, inquiryId: string): void {
  try {
    sessionStorage.setItem(SS_FORM_KEY,    JSON.stringify(data));
    sessionStorage.setItem(SS_INQUIRY_KEY, inquiryId);
  } catch { /* storage unavailable */ }
}

function loadFromSession(): { formData: Partial<FormData>; inquiryId: string | null } {
  try {
    const raw       = sessionStorage.getItem(SS_FORM_KEY);
    const inquiryId = sessionStorage.getItem(SS_INQUIRY_KEY);
    return {
      formData:  raw ? (JSON.parse(raw) as Partial<FormData>) : {},
      inquiryId: inquiryId ?? null,
    };
  } catch {
    return { formData: {}, inquiryId: null };
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SS_FORM_KEY);
    sessionStorage.removeItem(SS_INQUIRY_KEY);
  } catch { /* storage unavailable */ }
}

// ── Shared field component ────────────────────────────────────────────────────

function Field({
  label, error, required = false, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-navy-800">
        {label}{required && <span className="text-gold-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 ' +
  'placeholder:text-blue-gray focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition';

// ── Page ─────────────────────────────────────────────────────────────────────

type View = 'form' | 'summary';

export default function ScanPage() {
  const [searchParams] = useSearchParams();
  const isCancelled    = searchParams.get('cancelled') === 'true';

  // Restore any previously saved state (supports cancel-and-retry flow)
  const { formData: storedFormData, inquiryId: storedInquiryId } = loadFromSession();

  const [view,              setView]              = useState<View>('form');
  const [inquiryId,         setInquiryId]         = useState<string | null>(storedInquiryId);
  const [summaryData,       setSummaryData]       = useState<InquiryFormData | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError,      setSessionError]      = useState<string | null>(null);
  const [showSuccess,       setShowSuccess]       = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: storedFormData,
  });

  // When returning from a Stripe cancellation, scroll straight to the booking section
  useEffect(() => {
    if (isCancelled) {
      setTimeout(() => {
        document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isCancelled]);

  // ── Form submission ─────────────────────────────────────────────────────────
  // If a stored inquiryId exists (user returning after Stripe cancel), skip
  // inquiry creation and go straight to the summary with the existing ID.

  async function onSubmit(data: FormData): Promise<void> {
    setSessionError(null);

    let id = inquiryId;

    if (!id) {
      try {
        const json = await apiPost('/api/scan/inquiry', data) as { inquiryId: string };
        id = json.inquiryId;
      } catch {
        setError('root', {
          message: 'Something went wrong. Please try again or email support@ecscornerstone.com.',
        });
        return;
      }
    }

    emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
      service_type:    'ECS AI Scan',
      inquiry_id:      id,
      from_name:       `${data.firstName} ${data.lastName}`,
      reply_to:        data.email,
      company_name:    data.companyName,
      title:           data.title,
      phone:           data.phone,
      company_size:    data.companySize,
      industry:        data.industry,
      referral_source: data.referralSource ?? 'not specified',
      message:         data.message,
    }, EJS_KEY).catch((err: unknown) => console.error('[emailjs] scan notify failed', err));

    setShowSuccess(true);
    saveToSession(data, id);
    setInquiryId(id);
    setSummaryData(data as InquiryFormData);
    setView('summary');
  }

  // ── Proceed to Stripe ───────────────────────────────────────────────────────

  async function handleProceedToPayment(): Promise<void> {
    if (!inquiryId) return;
    setIsCreatingSession(true);
    setSessionError(null);

    try {
      const { url } = await apiPost('/api/scan/create-checkout-session', { inquiryId }) as { url: string };
      window.location.href = url;
    } catch {
      setSessionError('Payment could not be started. Please try again.');
      setIsCreatingSession(false);
    }
  }

  // ── Back from summary ───────────────────────────────────────────────────────

  function handleBack(): void {
    setSessionError(null);
    setView('form');
  }

  // ── Derived step indicator state ────────────────────────────────────────────

  const currentStep    = view === 'summary' ? 2 : 1;
  const completedSteps = view === 'summary' ? [1] : [];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
            Fast &amp; Focused
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-6">
            The ECS AI Scan
          </h1>
          <p className="text-lg text-navy-100 leading-relaxed mb-4">
            A Zoom-based discovery session and a custom AI recommendation report —
            delivered within 48 hours.
          </p>
          <p className="text-sm text-blue-gray mb-8">
            $1,000 — flat rate
          </p>
          <a
            href="#book"
            className="inline-flex items-center gap-2 px-8 py-4 rounded bg-gold-500 text-navy-950
                       font-semibold hover:bg-gold-400 transition-colors"
          >
            Book Your Scan <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* ── What you get ──────────────────────────────────────────────────── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
            What's Included
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy-900">
            Everything you need to know where to start.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {VALUE_CARDS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border border-navy-100 bg-navy-50 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-navy-900">
                <Icon size={20} className="text-gold-400" />
              </div>
              <h3 className="font-semibold text-navy-900">{title}</h3>
              <p className="text-sm text-navy-700 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who this is for ───────────────────────────────────────────────── */}
      <section className="bg-navy-100 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-navy-900">
              Who the ECS AI Scan is for.
            </h2>
          </div>
          <ul className="space-y-4 max-w-xl mx-auto">
            {[
              'Business owners who want clarity before committing to a larger engagement',
              'Companies exploring AI for the first time',
              'Organizations that need a fast decision-making tool for leadership',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-gold-500 text-navy-950">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-navy-700 text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── What happens after ────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
          After Your Scan
        </p>
        <h2 className="font-serif text-3xl text-navy-900 mb-5">
          A clear picture of where AI fits.
        </h2>
        <p className="text-navy-700 leading-relaxed">
          After your Scan, you'll have a clear picture of where AI fits in your business. If you
          want to go deeper — adding the human factor, profiling your team, and building a full
          implementation roadmap — the ECS AI Full Assessment is the natural next step. We'll discuss
          that option after your findings call.
        </p>
      </section>

      {/* ── Booking section ───────────────────────────────────────────────── */}
      <section id="book" className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto">

          {/* Step indicator */}
          <div className="mb-10">
            <StepIndicator
              steps={STEPS}
              currentStep={currentStep}
              completedSteps={completedSteps}
            />
          </div>

          {/* Section heading — only shown on form view */}
          {view === 'form' && (
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-3">
                Get Started
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy-900 mb-3">
                Book Your ECS AI Scan
              </h2>
              <p className="text-navy-700">
                Fill out the form below. You'll review your details before payment.
              </p>
            </div>
          )}

          {/* Stripe cancellation banner */}
          {isCancelled && view === 'form' && (
            <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50
                            px-4 py-3 mb-6 text-sm text-amber-800">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Payment was not completed.</p>
                <p className="mt-0.5">
                  Your details have been saved — review them below and click{' '}
                  <strong>Book My ECS AI Scan</strong> to try again.
                </p>
              </div>
            </div>
          )}

          {/* Session/payment error */}
          {sessionError && (
            <div className="flex items-start gap-3 rounded border border-red-200 bg-red-50
                            px-4 py-3 mb-6 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {sessionError}
            </div>
          )}

          {/* ── Summary view ─────────────────────────────────────────────── */}
          {view === 'summary' && summaryData && (
            <>
              {showSuccess && (
                <div className="flex items-start gap-3 rounded border border-green-200 bg-green-50
                                px-4 py-3 mb-6 text-sm text-green-800">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium">Your inquiry has been received.</p>
                    <p className="mt-0.5">
                      We'll be in touch within 1 business day. Review your details below and
                      proceed to payment when you're ready.
                    </p>
                  </div>
                </div>
              )}
              <PrePaymentSummary
                type="scan"
                formData={summaryData}
                amount={1000}
                onBack={handleBack}
                onProceed={() => { void handleProceedToPayment(); }}
                isLoading={isCreatingSession}
              />
            </>
          )}

          {/* ── Form view ────────────────────────────────────────────────── */}
          {view === 'form' && (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
              {errors.root && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors.root.message}
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="First Name" error={errors.firstName?.message} required>
                  <input {...register('firstName')} className={inputClass} placeholder="Jane" />
                </Field>
                <Field label="Last Name" error={errors.lastName?.message} required>
                  <input {...register('lastName')} className={inputClass} placeholder="Smith" />
                </Field>
              </div>

              {/* Company + Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Company Name" error={errors.companyName?.message} required>
                  <input {...register('companyName')} className={inputClass} placeholder="Acme Corp" />
                </Field>
                <Field label="Your Title / Role" error={errors.title?.message} required>
                  <input {...register('title')} className={inputClass} placeholder="CEO" />
                </Field>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Email" error={errors.email?.message} required>
                  <input {...register('email')} type="email" className={inputClass} placeholder="jane@acme.com" />
                </Field>
                <Field label="Phone" error={errors.phone?.message} required>
                  <input {...register('phone')} type="tel" className={inputClass} placeholder="+1 (555) 000-0000" />
                </Field>
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Company Size" error={errors.companySize?.message} required>
                  <select {...register('companySize')} className={inputClass}>
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Industry" error={errors.industry?.message} required>
                  <select {...register('industry')} className={inputClass}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </Field>
              </div>

              {/* Message */}
              <Field
                label="What are the biggest operational challenges you're hoping AI can help with?"
                error={errors.message?.message}
                required
              >
                <textarea
                  {...register('message')}
                  rows={5}
                  className={inputClass}
                  placeholder="Tell us about your current operations, pain points, and goals..."
                />
              </Field>

              {/* Referral */}
              <Field label="How did you hear about us?" error={errors.referralSource?.message}>
                <select {...register('referralSource')} className={inputClass}>
                  <option value="">Select one (optional)</option>
                  {REFERRAL_SOURCES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded bg-gold-500
                           text-navy-950 font-semibold hover:bg-gold-400 transition-colors
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving…' : 'Book My ECS AI Scan'}
              </button>

              <p className="text-xs text-blue-gray text-center">
                You'll review your booking details before entering any payment information.
              </p>
            </form>
          )}

          {/* Clear stored data — shown only to returning cancelled users in summary */}
          {view === 'summary' && (
            <button
              onClick={() => {
                clearSession();
                setInquiryId(null);
                setSummaryData(null);
                setView('form');
              }}
              className="mt-4 w-full text-xs text-blue-gray hover:text-navy-700
                         underline underline-offset-2 transition-colors text-center block"
            >
              Start over with different details
            </button>
          )}

        </div>
      </section>
    </div>
  );
}
