import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Button } from '../../components/ui/Button';

export default function CancelledPage() {
  return (
    <AuthLayout title="No worries">
      <div className="space-y-6 text-center">
        <p className="text-sm text-gray-600">
          Your account hasn't been charged. Ready to try again?
        </p>
        <Link to="/onboarding/register">
          <Button variant="gold" className="w-full">Back to Sign Up</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
