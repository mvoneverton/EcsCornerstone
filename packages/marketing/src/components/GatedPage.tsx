import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Wraps gated pages (/agents, /teams, /fcaio, /reserve, /confirmation).
 * If a valid `token` query param is present the page renders normally.
 * Otherwise a soft redirect message is shown pointing back to /assessment.
 */
export default function GatedPage({ children }: { children: React.ReactNode }) {
  const [params] = useSearchParams();
  const token = params.get('token');

  // Persist token in sessionStorage so navigating between gated pages works
  useEffect(() => {
    if (token) sessionStorage.setItem('ecs_path_token', token);
  }, [token]);

  const activeToken = token ?? sessionStorage.getItem('ecs_path_token');

  if (!activeToken) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl text-navy-900 mb-4">
            This page is available after your ECS assessment.
          </h1>
          <p className="text-navy-700 text-sm leading-relaxed mb-8">
            Book your ECS AI Scan or ECS AI Assessment to get started. After your findings
            meeting, ECS will send you a personalized link to access this page.
          </p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-gold-500 text-navy-950
                       font-semibold text-sm hover:bg-gold-400 transition-colors"
          >
            Book Your Assessment <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
