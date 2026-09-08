import LegalDocument from './LegalDocument';
import { DPA_INTRO, DPA_SECTIONS } from './content';

export default function DpaPage() {
  return (
    <LegalDocument
      title="Data Processing Agreement — ECS Cornerstone"
      intro={<p>{DPA_INTRO}</p>}
      sections={DPA_SECTIONS}
    />
  );
}
