export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  monthlyStartingAt: number;
  reservationFee: number;
  cornerstoneEnabled: boolean;
  useCases: string[];
}

export const agents: Agent[] = [
  {
    id: 'callguard',
    name: 'CallGuard',
    role: 'Call Screening & Qualification Agent',
    description:
      'Screens inbound calls, qualifies leads against your criteria, and routes priority callers to the right person. Never waste time on unqualified calls again.',
    capabilities: [
      'Live call screening',
      'Lead qualification scoring',
      'Spam & robocall filtering',
      'Call summary reporting',
    ],
    monthlyStartingAt: 800, // [UPDATE] confirm final pricing
    reservationFee: 10,
    cornerstoneEnabled: true,
    useCases: [
      'A financial advisor eliminates 40% of unqualified inbound calls — spending time only with serious prospects.',
      'A medical practice filters robocalls and routes urgent patient callbacks to the on-call clinician immediately.',
      'A law firm ensures VIP client calls reach the right attorney without going to voicemail.',
    ],
  },
  {
    id: 'bookit',
    name: 'BookIt',
    role: 'Appointment Scheduling Agent',
    description:
      'Manages your calendar, books appointments, sends confirmations, and handles rescheduling — 24/7 without human intervention.',
    capabilities: [
      'Calendar sync & booking',
      'Automated reminders',
      'Rescheduling handling',
      'Timezone management',
    ],
    monthlyStartingAt: 800, // [UPDATE] confirm final pricing
    reservationFee: 10,
    cornerstoneEnabled: true,
    useCases: [
      'A consulting firm fills its calendar without a human coordinator — clients self-book around real-time availability.',
      'A salon eliminates no-shows with automated reminders sent 48 and 2 hours before each appointment.',
      'A regional sales team books discovery calls across five time zones without scheduling conflicts.',
    ],
  },
  {
    id: 'supportdesk',
    name: 'SupportDesk',
    role: 'Customer Support Agent',
    description:
      'Handles common customer inquiries, resolves issues, escalates complex cases, and maintains brand-consistent communication around the clock.',
    capabilities: [
      'FAQ resolution',
      'Ticket routing & escalation',
      'Multi-channel support (email/chat)',
      'Sentiment detection',
    ],
    monthlyStartingAt: 800, // [UPDATE] confirm final pricing
    reservationFee: 10,
    cornerstoneEnabled: true,
    useCases: [
      'An e-commerce brand handles 300+ support tickets per week — resolution time drops from 48 hours to under 4.',
      'A SaaS company escalates only the highest-severity tickets to human agents, with full context already attached.',
      'A property management firm answers tenant inquiries 24/7 — maintenance, lease questions, and payments — without night staff.',
    ],
  },
  {
    id: 'invoiceiq',
    name: 'InvoiceIQ',
    role: 'Invoice Creation & Accounts Receivable Agent',
    description:
      'Generates professional invoices, tracks payment status, sends reminders, and keeps your receivables organized automatically.',
    capabilities: [
      'Invoice generation',
      'Payment tracking',
      'Automated follow-ups',
      'Export to PDF/CSV',
    ],
    monthlyStartingAt: 800, // [UPDATE] confirm final pricing
    reservationFee: 10,
    cornerstoneEnabled: false,
    useCases: [
      'A marketing agency eliminates late payments — automated reminders go out at 7, 14, and 30 days past due.',
      'A contractor generates itemized invoices from project notes in under a minute across 20 active clients.',
      'A consulting firm exports monthly receivables reports automatically for its bookkeeper.',
    ],
  },
  {
    id: 'docupro',
    name: 'DocuPro',
    role: 'Document Summarization & Creation Agent',
    description:
      'Reads, summarizes, and drafts business documents — from contracts to reports — saving your team hours of reading and writing time.',
    capabilities: [
      'Document summarization',
      'Report drafting',
      'Contract review highlights',
      'Template-based document creation',
    ],
    monthlyStartingAt: 800, // [UPDATE] confirm final pricing
    reservationFee: 10,
    cornerstoneEnabled: false,
    useCases: [
      'A real estate firm summarizes 30-page purchase agreements into a one-page brief before client meetings.',
      'An HR team generates offer letters, performance reviews, and policy documents in minutes.',
      'A consulting firm produces weekly client summary reports automatically from raw project notes.',
    ],
  },
  {
    id: 'socialpulse',
    name: 'SocialPulse',
    role: 'Social Media & Content Marketing Agent',
    description:
      'Plans, drafts, and schedules social media content across platforms, monitors engagement, and helps maintain a consistent brand presence.',
    capabilities: [
      'Content calendar creation',
      'Post drafting & scheduling',
      'Hashtag & trend research',
      'Engagement monitoring & response drafting',
    ],
    monthlyStartingAt: 800, // [UPDATE] confirm final pricing
    reservationFee: 10,
    cornerstoneEnabled: false,
    useCases: [
      'A boutique law firm maintains a consistent LinkedIn presence — thought leadership posts go out three times per week.',
      'A restaurant group plans a month of Instagram content and schedules it across four locations automatically.',
      'A B2B software company responds to LinkedIn comments and DMs within the hour, any time of day.',
    ],
  },
];
