import { GatedPageWrapper } from './GatedPageWrapper';
import {
  CONTACT_EMAIL,
  CtaButton,
  GatedFooter,
  GatedHeader,
  GatedSection,
  GatedShell,
  PricingCard,
} from './_shared';

const CONSULT_MAILTO =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent('FCAIO Consultation Request')}`;

export default function FcaioPage() {
  return (
    <GatedPageWrapper expectedPathType="fcaio">
      <GatedShell>
        <GatedHeader
          title="Fractional Chief AI Officer"
          subtitle="Executive AI leadership, without the executive overhead"
        />

        <GatedSection heading="What is a Fractional CAIO?">
          <p>
            ECS embeds as your organization's senior AI strategist on a part-time
            basis. You get boardroom-level AI leadership — roadmap, governance,
            vendor evaluation, team training — at a fraction of a full-time hire.
          </p>
        </GatedSection>

        <GatedSection heading="What's included">
          <ul className="list-disc space-y-2 pl-5">
            <li>Monthly AI strategy sessions with your leadership team</li>
            <li>AI vendor and tool evaluation and recommendations</li>
            <li>Internal AI policy and governance framework</li>
            <li>Hands-on oversight of AI implementations and agent deployments</li>
          </ul>
        </GatedSection>

        <GatedSection heading="Investment">
          <PricingCard
            price="$10,000/month"
            lines={[
              'Engagement minimum: 3 months',
              'Includes up to 20 hours/month of direct ECS involvement',
            ]}
          />
        </GatedSection>

        <GatedSection heading="Is this right for you?">
          <p>This service is designed for organizations that:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Are serious about AI adoption but don't know where to start</li>
            <li>Have made AI investments that aren't delivering ROI</li>
            <li>
              Need credible AI leadership for board, investor, or regulatory
              conversations
            </li>
            <li>Want a trusted advisor, not just a vendor</li>
          </ul>
        </GatedSection>

        <GatedSection heading="Ready to Talk?">
          <div className="pt-1">
            <CtaButton href={CONSULT_MAILTO}>Request a FCAIO Consultation</CtaButton>
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
