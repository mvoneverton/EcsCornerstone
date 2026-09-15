import type { InvitationData } from '../lib/api';

interface Props {
  invitation: InvitationData;
  onBegin:    () => void;
}

export default function WelcomePage({ invitation, onBegin }: Props) {
  const name = invitation.firstName ?? 'there';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest font-semibold text-gold mb-2">
            People First
          </p>
          <h1 className="font-serif text-4xl font-bold text-navy mb-3">
            Welcome, {name}
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            You've been invited to complete the People First Assessment for{' '}
            <span className="font-semibold text-navy">{invitation.eventName}</span>.
          </p>
        </div>

        {/* What to expect */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-navy text-lg">What to expect</h2>

          <div className="space-y-4">
            <Step
              number="1"
              title="Word Selection (about 12 min)"
              description="You'll see groups of four words and select which word feels most like you and which feels least like you."
            />
            <Step
              number="2"
              title="Relationship Styles (about 5 min)"
              description="32 short statements about how you naturally connect with others. Rate each from Rarely to Almost Always."
            />
            <Step
              number="3"
              title="Review &amp; Submit"
              description="A quick look at your answers before you submit. Your profile will be emailed to you right away."
            />
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-navy text-base mb-3">A few tips</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-gold font-bold">·</span>
              <span>Go with your first instinct — there are no right or wrong answers.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold">·</span>
              <span>Think about how you are naturally, not how you think you should be.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold font-bold">·</span>
              <span>Your progress is saved automatically if you need a break.</span>
            </li>
            {!invitation.isFree && (
              <li className="flex gap-2">
                <span className="text-gold font-bold">·</span>
                <span>This assessment was made available to you as part of your event registration.</span>
              </li>
            )}
          </ul>
        </div>

        <button
          onClick={onBegin}
          className="w-full py-4 rounded-xl bg-navy text-white font-semibold text-base
                     hover:bg-navy/90 active:scale-[0.99] transition-all shadow-md
                     min-h-[48px]"
        >
          Begin Assessment
        </button>

        <p className="text-center text-xs text-slate-400">
          Powered by ECS Cornerstone Assessment
        </p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-navy text-white text-sm font-bold
                      flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="font-medium text-navy text-sm">{title}</p>
        <p className="text-slate-500 text-sm mt-0.5 leading-snug">{description}</p>
      </div>
    </div>
  );
}
