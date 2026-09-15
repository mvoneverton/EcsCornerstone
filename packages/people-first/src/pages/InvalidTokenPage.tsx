export default function InvalidTokenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0L3.25 16.04A2 2 0 005.07 19z" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy mb-3">Invalid Invitation Link</h1>
        <p className="text-slate-600 text-base leading-relaxed mb-6">
          This link doesn't appear to be valid. It may have been mistyped or the invitation
          may no longer exist.
        </p>
        <p className="text-slate-500 text-sm">
          If you believe this is an error, please contact your event facilitator for
          a new invitation link.
        </p>
      </div>
    </div>
  );
}
