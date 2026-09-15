import type { PFProfile } from './profileMapping';

export const pfProfileTextMap: Record<PFProfile, {
  tagline:          string;
  briefDescription: string;
  howOthersSeeYou:  string;
  eventTeaser:      string;
}> = {
  driver: {
    tagline:          'Purposeful. Direct. Action-oriented.',
    briefDescription: '[CONTENT PLACEHOLDER — Driver brief description in relational/family context]',
    howOthersSeeYou:  '[CONTENT PLACEHOLDER — How others see a Driver in relationships]',
    eventTeaser:      "At your People First session, you'll discover how your natural drive shapes your closest relationships — and how to channel it for deeper connection.",
  },
  artist: {
    tagline:          'Expressive. Energetic. Inspiring.',
    briefDescription: '[CONTENT PLACEHOLDER — Artist brief description in relational/family context]',
    howOthersSeeYou:  '[CONTENT PLACEHOLDER — How others see an Artist in relationships]',
    eventTeaser:      "At your People First session, you'll explore how your expressive nature lights up the people around you — and where it sometimes creates static.",
  },
  investigator: {
    tagline:          'Thoughtful. Precise. Steady.',
    briefDescription: '[CONTENT PLACEHOLDER — Investigator brief description in relational/family context]',
    howOthersSeeYou:  '[CONTENT PLACEHOLDER — How others see an Investigator in relationships]',
    eventTeaser:      "At your People First session, you'll uncover how your careful, analytical nature is experienced by the people who love you most.",
  },
  mediator: {
    tagline:          'Warm. Loyal. Harmonizing.',
    briefDescription: '[CONTENT PLACEHOLDER — Mediator brief description in relational/family context]',
    howOthersSeeYou:  '[CONTENT PLACEHOLDER — How others see a Mediator in relationships]',
    eventTeaser:      "At your People First session, you'll learn how your gift for harmony and connection shapes every relationship in your life.",
  },
};
