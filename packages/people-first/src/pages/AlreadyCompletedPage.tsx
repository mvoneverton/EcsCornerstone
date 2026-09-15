export default function AlreadyCompletedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy mb-3">Assessment Already Completed</h1>
        <p className="text-slate-600 text-base leading-relaxed mb-6">
          You've already completed this assessment. Your results were sent to your email
          shortly after you finished.
        </p>
        <p className="text-slate-500 text-sm">
          Can't find the email? Check your spam or junk folder, or reach out to your
          event facilitator.
        </p>
      </div>
    </div>
  );
}
