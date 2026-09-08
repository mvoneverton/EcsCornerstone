import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import { Button } from '../../components/ui/Button';

export default function SuccessPage() {
  return (
    <AuthLayout title="You're in">
      <div className="space-y-6 text-center">
        <p className="text-sm text-gray-600">
          Your account is being activated — you'll receive a welcome email with your login link
          within a few minutes.
        </p>
        <Link to="/login">
          <Button variant="gold" className="w-full">Go to Login</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
