export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        <h1 className="font-serif text-5xl font-bold text-navy">
          People First
        </h1>

        <p className="text-lg text-gold font-semibold">
          Better relationships start with understanding.
        </p>

        <p className="text-slate-600 text-base leading-relaxed">
          This platform is for event attendees. Please use the link from
          your invitation email to access your assessment.
        </p>
      </div>

      <p className="mt-16 text-center text-xs text-slate-400">
        Powered by the ECS Cornerstone Assessment
      </p>
    </div>
  );
}
