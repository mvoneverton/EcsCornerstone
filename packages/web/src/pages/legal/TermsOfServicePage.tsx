import { LegalLayout } from './LegalLayout';
import { TERMS_SECTIONS } from './content';

export default function TermsOfServicePage() {
  return <LegalLayout title="Terms of Service — ECS Cornerstone" sections={TERMS_SECTIONS} />;
}
