import { GatedPageWrapper } from './GatedPageWrapper';
import {
  CONTACT_EMAIL,
  CtaButton,
  GatedFooter,
  GatedHeader,
  GatedSection,
  GatedShell,
  PricingCard,
  StepList,
} from './_shared';

const DISCOVERY_MAILTO =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent('Agent Placement Discovery Call Request')}` +
  `&body=${encodeURIComponent(
    "I'm interested in learning more about AI Agent Placement for [Company Name].",
  )}`;

export default function AgentPlacementPage() {
  return (
    <GatedPageWrapper expectedPathType="agent_placement">
      <GatedShell>
        <GatedHeader
          title="AI Agent Placement"
          subtitle="Intelligent automation, built for your business"
        />

        <GatedSection heading="What is Agent Placement?">
          <p>
            ECS designs, builds, and places custom AI agents directly into your
            workflows. Agents handle repetitive, rule-based tasks so your team can
            focus on what humans do best — judgment, relationships, and strategy.
          </p>
        </GatedSection>

        <GatedSection heading="How it works">
          <StepList
            steps={[
              {
                title: 'Discovery',
                body: 'We audit your current workflows and identify the highest-ROI automation opportunities.',
              },
              {
                title: 'Build',
                body: 'ECS engineers build and test custom agents tailored to your specific tools and processes.',
              },
              {
                title: 'Placement',
                body: 'Agents are deployed into your environment with full documentation and a 30-day optimization window.',
              },
            ]}
          />
        </GatedSection>

        <GatedSection heading="Investment">
          <PricingCard
            price="Starting at $800/month per agent"
            lines={['Bundle pricing available for 3+ agents — contact us to discuss.']}
            note="Pricing confirmed during discovery call."
          />
        </GatedSection>

        <GatedSection heading="Ready to Start?">
          <div className="pt-1">
            <CtaButton href={DISCOVERY_MAILTO}>Schedule Your Discovery Call</CtaButton>
          </div>
          <p className="text-sm text-gray-500">
            Questions? Reply to your invitation email or contact{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </GatedSection>

        <GatedFooter />
      </GatedShell>
    </GatedPageWrapper>
  );
}
