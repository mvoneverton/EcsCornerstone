import { LegalLayout } from './LegalLayout';
import { PRIVACY_SECTIONS } from './content';

export default function PrivacyPolicyPage() {
  return <LegalLayout title="Privacy Policy — ECS Cornerstone" sections={PRIVACY_SECTIONS} />;
}
