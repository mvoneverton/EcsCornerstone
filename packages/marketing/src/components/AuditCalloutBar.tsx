import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function AuditCalloutBar() {
  return (
    <div className="bg-gold-500 text-navy-950">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm font-medium">
        <span>
          New to ECS? Every agent deployment starts with the{' '}
          <strong>ECS AI Audit</strong> — where your agents get configured to your team.
          Starting at $1,500.
        </span>
        <Link
          to="/assessment"
          className="flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-navy-800 transition-colors whitespace-nowrap"
        >
          Learn more <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
