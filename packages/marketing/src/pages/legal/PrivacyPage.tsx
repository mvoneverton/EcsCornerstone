import LegalDocument from './LegalDocument';
import { PRIVACY_SECTIONS } from './content';

export default function PrivacyPage() {
  return <LegalDocument title="Privacy Policy — ECS Cornerstone" sections={PRIVACY_SECTIONS} />;
}
