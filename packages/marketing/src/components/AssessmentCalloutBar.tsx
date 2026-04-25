import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function AssessmentCalloutBar() {
  return (
    <div className="bg-gold-500 text-navy-950">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm font-medium">
        <span>
          New to ECS? Every engagement starts with an{' '}
          <strong>ECS AI Full Assessment</strong> — where we understand your business before
          recommending a single solution.
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
