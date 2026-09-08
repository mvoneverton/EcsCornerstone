import LegalDocument from './LegalDocument';
import { TERMS_SECTIONS } from './content';

export default function TermsPage() {
  return <LegalDocument title="Terms of Service — ECS Cornerstone" sections={TERMS_SECTIONS} />;
}
