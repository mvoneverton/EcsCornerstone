export interface PCAWord {
  wordId: number;
  text:   string;
}

export interface PCAGroup {
  groupId: number;
  words:   PCAWord[];
}

// 96 words across 24 groups (4 words per group).
// Word IDs match exactly the backend PCA_WORD_MAP for scoring.
// IMPORTANT: These are placeholder words.
// Replace with the exact words from the ECS instrument before production.
const PCA_WORDS: Record<number, string> = {
  1: 'Patient',          2: 'Enthusiastic',     3: 'Cooperative',     4: 'Direct',
  5: 'Optimistic',       6: 'Analytical',        7: 'Assertive',       8: 'Supportive',
  9: 'Warm',             10: 'Decisive',         11: 'Agreeable',      12: 'Inspiring',
  13: 'Loyal',           14: 'Steady',           15: 'Competitive',    16: 'Persuasive',
  17: 'Animated',        18: 'Precise',          19: 'Bold',           20: 'Systematic',
  21: 'Results-driven',  22: 'Diplomatic',       23: 'Expressive',     24: 'Caring',
  25: 'Thorough',        26: 'Harmonious',       27: 'Determined',     28: 'Sociable',
  29: 'Goal-oriented',   30: 'Energetic',        31: 'Team-oriented',  32: 'Methodical',
  33: 'Outgoing',        34: 'Dependable',       35: 'Forceful',       36: 'Logical',
  37: 'Accommodating',   38: 'Action-oriented',  39: 'Empathetic',     40: 'Creative',
  41: 'Independent',     42: 'Nurturing',        43: 'Flexible',       44: 'Ambitious',
  45: 'Cautious',        46: 'Considerate',      47: 'Lively',         48: 'Commanding',
  49: 'Imaginative',     50: 'Gentle',           51: 'Peaceable',      52: 'Strong-willed',
  53: 'Thoughtful',      54: 'Driven',           55: 'Motivating',     56: 'Reliable',
  57: 'Firm',            58: 'Sympathetic',      59: 'Sharing',        60: 'Structured',
  61: 'Upbeat',          62: 'Accurate',         63: 'Quality-focused', 64: 'Confident',
  65: 'Communicative',   66: 'Outspoken',        67: 'Helpful',        68: 'Disciplined',
  69: 'Pioneering',      70: 'Charming',         71: 'Attentive',      72: 'Reserved',
  73: 'Data-driven',     74: 'Fearless',         75: 'Positive',       76: 'Accepting',
  77: 'Demanding',       78: 'Spontaneous',      79: 'Measured',       80: 'Friendly',
  81: 'Open-minded',     82: 'Conscientious',    83: 'Vibrant',        84: 'Trusting',
  85: 'Talkative',       86: 'Rigorous',         87: 'Resolute',       88: 'Peacemaking',
  89: 'Receptive',       90: 'Principled',       91: 'Fast-paced',     92: 'Formal',
  93: 'Dominant',        94: 'Giving',           95: 'Cheerful',       96: 'Objective',
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export const pcaGroups: PCAGroup[] = Array.from({ length: 24 }, (_, i) => {
  const groupId = i + 1;
  const base    = i * 4;
  return {
    groupId,
    words: [base + 1, base + 2, base + 3, base + 4].map((id) => ({
      wordId: id,
      text:   PCA_WORDS[id]!,
    })),
  };
});

export function buildShuffledGroups(): Record<number, PCAWord[]> {
  const result: Record<number, PCAWord[]> = {};
  for (const group of pcaGroups) {
    result[group.groupId] = shuffle(group.words);
  }
  return result;
}
