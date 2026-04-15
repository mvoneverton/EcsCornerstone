// ── PCA word list ─────────────────────────────────────────────────────────────
// 96 words, grouped 4 per group (24 groups × 4 words).
// Each word ID maps to its Cornerstone profile in PCA_WORD_MAP on the backend.
// IMPORTANT: These are placeholder words. Replace with the exact words from the
// ECS_Cornerstone_Personal_Communication_Assessment.docx instrument before
// deploying to production.
//
// Profile key: C = Catalyst, V = Vanguard, Cv = Cultivator, A = Architect

export const PCA_WORDS: Record<number, string> = {
  // Group 1 — Cv, C, Cv, V
  1:  'Patient',        2:  'Enthusiastic',  3:  'Cooperative',  4:  'Direct',
  // Group 2 — C, A, V, Cv
  5:  'Optimistic',     6:  'Analytical',    7:  'Assertive',     8:  'Supportive',
  // Group 3 — Cv, V, Cv, C
  9:  'Warm',           10: 'Decisive',      11: 'Agreeable',     12: 'Inspiring',
  // Group 4 — Cv, Cv, V, C
  13: 'Loyal',          14: 'Steady',        15: 'Competitive',   16: 'Persuasive',
  // Group 5 — C, A, V, A
  17: 'Animated',       18: 'Precise',       19: 'Bold',          20: 'Systematic',
  // Group 6 — V, Cv, C, Cv
  21: 'Results-driven', 22: 'Diplomatic',    23: 'Expressive',    24: 'Caring',
  // Group 7 — A, Cv, V, C
  25: 'Thorough',       26: 'Harmonious',    27: 'Determined',    28: 'Sociable',
  // Group 8 — V, C, Cv, A
  29: 'Goal-oriented',  30: 'Energetic',     31: 'Team-oriented', 32: 'Methodical',
  // Group 9 — C, Cv, V, A
  33: 'Outgoing',       34: 'Dependable',    35: 'Forceful',      36: 'Logical',
  // Group 10 — Cv, V, Cv, C
  37: 'Accommodating',  38: 'Action-oriented', 39: 'Empathetic',  40: 'Creative',
  // Group 11 — V, Cv, Cv, V
  41: 'Independent',    42: 'Nurturing',     43: 'Flexible',      44: 'Ambitious',
  // Group 12 — A, Cv, C, V
  45: 'Cautious',       46: 'Considerate',   47: 'Lively',        48: 'Commanding',
  // Group 13 — C, Cv, Cv, V
  49: 'Imaginative',    50: 'Gentle',        51: 'Peaceable',     52: 'Strong-willed',
  // Group 14 — Cv, V, C, Cv
  53: 'Thoughtful',     54: 'Driven',        55: 'Motivating',    56: 'Reliable',
  // Group 15 — V, Cv, Cv, A
  57: 'Firm',           58: 'Sympathetic',   59: 'Sharing',       60: 'Structured',
  // Group 16 — C, A, A, V
  61: 'Upbeat',         62: 'Accurate',      63: 'Quality-focused', 64: 'Confident',
  // Group 17 — C, V, Cv, A
  65: 'Communicative',  66: 'Outspoken',     67: 'Helpful',       68: 'Disciplined',
  // Group 18 — V, C, Cv, A
  69: 'Pioneering',     70: 'Charming',      71: 'Attentive',     72: 'Reserved',
  // Group 19 — A, V, C, Cv
  73: 'Data-driven',    74: 'Fearless',      75: 'Positive',      76: 'Accepting',
  // Group 20 — V, C, A, C
  77: 'Demanding',      78: 'Spontaneous',   79: 'Measured',      80: 'Friendly',
  // Group 21 — Cv, A, C, Cv
  81: 'Open-minded',    82: 'Conscientious', 83: 'Vibrant',       84: 'Trusting',
  // Group 22 — C, A, V, Cv
  85: 'Talkative',      86: 'Rigorous',      87: 'Resolute',      88: 'Peacemaking',
  // Group 23 — Cv, A, V, A
  89: 'Receptive',      90: 'Principled',    91: 'Fast-paced',    92: 'Formal',
  // Group 24 — V, Cv, C, A
  93: 'Dominant',       94: 'Giving',        95: 'Cheerful',      96: 'Objective',
};

// Word IDs for each PCA group (group 1 = IDs 1-4, group 2 = IDs 5-8, etc.)
export function pcaGroupWordIds(group: number): [number, number, number, number] {
  const base = (group - 1) * 4;
  return [base + 1, base + 2, base + 3, base + 4];
}

// ── WSA / JA question text ────────────────────────────────────────────────────
// 32 behavioral statements rated on a 1–5 scale (Never → Always).
// Questions match the axis/direction mapping in QUESTION_MAP on the backend:
//   Q1  A/L, Q2  A/H, Q3  A/H, Q4  R/H, Q5  A/L, Q6  A/H, Q7  R/L, Q8  A/L
//   Q9  A/H, Q10 R/H, Q11 A/L, Q12 A/H, Q13 R/H, Q14 A/L, Q15 A/H, Q16 R/L
//   Q17 A/L, Q18 A/H, Q19 R/H, Q20 A/L, Q21 A/H, Q22 R/L, Q23 A/L, Q24 A/H
//   Q25 R/H, Q26 A/L, Q27 A/H, Q28 R/L, Q29 R/H, Q30 A/L, Q31 A/H, Q32 A/H
//
// IMPORTANT: Replace with exact statements from ECS_Cornerstone_Work_Style_Assessment.docx
// before production deployment.

export const WSA_JA_QUESTIONS: Record<number, string> = {
  1:  'I prefer to let others take the lead in group settings.',
  2:  'I speak up and share my opinions even when others disagree.',
  3:  'I take charge of projects and situations when needed.',
  4:  'I enjoy building strong personal relationships with my colleagues.',
  5:  'I prefer a measured, thoughtful approach over quick action.',
  6:  'I am comfortable making decisions quickly and confidently.',
  7:  'I focus on completing tasks efficiently rather than socializing at work.',
  8:  'I find it easy to step back and let others have the spotlight.',
  9:  'I enjoy setting the direction and pace for my team.',
  10: 'I pay close attention to how people around me are feeling.',
  11: 'I listen more than I talk in most group discussions.',
  12: 'I naturally gravitate toward leadership opportunities.',
  13: 'I value creating a warm, collaborative atmosphere at work.',
  14: 'I am comfortable taking a supporting role in most situations.',
  15: 'I have no trouble confronting difficult issues directly.',
  16: 'I maintain professional distance rather than personal closeness at work.',
  17: 'I avoid drawing attention to myself when possible.',
  18: 'I tend to be direct and straightforward in my communication.',
  19: 'I go out of my way to make new people feel welcome.',
  20: 'I prefer group consensus over acting on my own judgment.',
  21: 'I am assertive about pursuing my goals at work.',
  22: 'I prefer to keep professional and personal matters clearly separate.',
  23: 'I rarely push back when others disagree with my ideas.',
  24: 'I initiate conversations and introduce new ideas frequently.',
  25: 'I find it energizing to connect with people on a personal level.',
  26: 'I wait to be asked before sharing my perspective.',
  27: 'I set clear expectations and hold people accountable to them.',
  28: 'I keep interactions tightly focused on the task at hand.',
  29: 'I invest time in getting to know my coworkers personally.',
  30: 'I tend to defer to others\' judgment in uncertain situations.',
  31: 'I am comfortable with conflict when it leads to better outcomes.',
  32: 'I pursue my objectives with consistent energy and determination.',
};

export const WSA_JA_SCALE_LABELS: Record<number, string> = {
  1: 'Never',
  2: 'Rarely',
  3: 'Sometimes',
  4: 'Often',
  5: 'Always',
};

// Questions for a given page (8 per page, pages 1–4)
export function wsaJaPageQuestions(page: number): number[] {
  const start = (page - 1) * 8 + 1;
  return Array.from({ length: 8 }, (_, i) => start + i);
}

export const WSA_JA_PAGE_COUNT = 4;
export const PCA_PAGE_COUNT    = 24;
