import { LegalLayout } from './LegalLayout';
import { DPA_INTRO, DPA_SECTIONS } from './content';

export default function DataProcessingAgreementPage() {
  return (
    <LegalLayout
      title="Data Processing Agreement — ECS Cornerstone"
      intro={<p>{DPA_INTRO}</p>}
      sections={DPA_SECTIONS}
    />
  );
}
