import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';

export interface InquiryFormData {
  firstName:       string;
  lastName:        string;
  companyName:     string;
  title:           string;
  email:           string;
  phone:           string;
  companySize:     string;
  industry:        string;
  // assessment-only
  assessmentCount?: string;
  // optional on both
  message?:        string;
  referralSource?: string;
}

interface Props {
  type:       'scan' | 'assessment';
  formData:   InquiryFormData;
  amount:     number;           // dollars (e.g. 1000)
  onBack:     () => void;
  onProceed:  () => void;
  isLoading:  boolean;
}

const WHAT_NEXT: Record<'scan' | 'assessment', string> = {
  scan:       'After payment you will see a confirmation page. We will be in touch within 1 business day to schedule your Zoom discovery call.',
  assessment: 'After payment you will see a confirmation page. We will be in touch within 1 business day to confirm your onsite visit date and walk you through the next steps.',
};

export default function PrePaymentSummary({
  type,
  formData,
  amount,
  onBack,
  onProceed,
  isLoading,
}: Props) {
  const productName     = type === 'scan' ? 'ECS AI Scan' : 'ECS AI Full Assessment';
  const amountFormatted = `$${amount.toLocaleString()}`;
  const whatNext        = WHAT_NEXT[type];

  return (
    <div className="rounded-lg border border-navy-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-navy-950 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-1">
          Review Your Booking
        </p>
        <h2 className="font-serif text-2xl text-white">{productName}</h2>
      </div>

      {/* Booking details */}
      <div className="px-6 py-6 space-y-1 border-b border-navy-100">
        <p className="text-sm text-navy-900 font-medium">
          {formData.firstName} {formData.lastName}
          <span className="text-navy-400 mx-1.5">·</span>
          {formData.companyName}
        </p>
        <p className="text-sm text-navy-700">
          {formData.email}
          <span className="text-navy-400 mx-1.5">·</span>
          {formData.phone}
        </p>
        {type === 'assessment' && (
          <p className="text-sm text-navy-700">
            {formData.companySize}
            {formData.industry && (
              <>
                <span className="text-navy-400 mx-1.5">·</span>
                {formData.industry}
              </>
            )}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="px-6 py-5 border-b border-navy-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-navy-700">Amount due today</span>
          <span className="text-xl font-semibold text-navy-950 font-serif">
            {amountFormatted}
          </span>
        </div>
      </div>

      {/* What happens next */}
      <div className="px-6 py-5 bg-navy-50 border-b border-navy-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-500 mb-2">
          What happens next
        </p>
        <p className="text-sm text-navy-700 leading-relaxed">{whatNext}</p>
      </div>

      {/* Actions */}
      <div className="px-6 py-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded border border-navy-200
                     text-sm font-medium text-navy-700 hover:bg-navy-50 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={15} />
          Back — Edit my details
        </button>

        <button
          type="button"
          onClick={onProceed}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded bg-gold-500
                     text-navy-950 text-sm font-semibold hover:bg-gold-400 transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed sm:ml-auto"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Redirecting to payment…
            </>
          ) : (
            <>
              <CreditCard size={15} />
              Proceed to Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
}
