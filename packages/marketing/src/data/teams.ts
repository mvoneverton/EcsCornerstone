export interface Team {
  id: string;
  name: string;
  tagline: string;
  description: string;
  agentIds: string[];
  monthlyStartingAt: number;
  discountPercent: number | null; // [UPDATE] confirm discount percentages
  reservationFeePerAgent: number;
  pauseAvailable: boolean;
}

export const teams: Team[] = [
  {
    id: 'front-desk',
    name: 'The Front Desk Team',
    tagline: 'Your entire client-facing operation — covered.',
    description:
      'Handle inbound calls, book appointments, and support customers around the clock.',
    agentIds: ['callguard', 'bookit', 'supportdesk'],
    monthlyStartingAt: 800, // [UPDATE] apply bundle discount once percentages confirmed
    discountPercent: null,  // [UPDATE] e.g. 15 for 15% off
    reservationFeePerAgent: 10,
    pauseAvailable: true,
  },
  {
    id: 'back-office',
    name: 'The Back Office Team',
    tagline: 'Keep your finances and documents running automatically.',
    description:
      'Invoice clients, track payments, and generate documents without lifting a finger.',
    agentIds: ['invoiceiq', 'docupro'],
    monthlyStartingAt: 800, // [UPDATE] apply bundle discount once percentages confirmed
    discountPercent: null,  // [UPDATE]
    reservationFeePerAgent: 10,
    pauseAvailable: true,
  },
  {
    id: 'growth',
    name: 'The Growth Team',
    tagline: 'Book more meetings. Support more customers. Stay visible online.',
    description:
      'The three levers every growing business needs — scheduling, support, and marketing.',
    agentIds: ['bookit', 'supportdesk', 'socialpulse'],
    monthlyStartingAt: 800, // [UPDATE] apply bundle discount once percentages confirmed
    discountPercent: null,  // [UPDATE]
    reservationFeePerAgent: 10,
    pauseAvailable: true,
  },
  {
    id: 'full-suite',
    name: 'The Full Suite',
    tagline: 'Every agent. Every function. Your entire operation — automated.',
    description:
      'All six agents working together. The most comprehensive way to run an AI-staffed business.',
    agentIds: ['callguard', 'bookit', 'supportdesk', 'invoiceiq', 'docupro', 'socialpulse'],
    monthlyStartingAt: 800, // [UPDATE] apply bundle discount once percentages confirmed
    discountPercent: null,  // [UPDATE]
    reservationFeePerAgent: 10,
    pauseAvailable: true,
  },
];
