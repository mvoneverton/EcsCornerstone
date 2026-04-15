import type { Profile } from '../types';

// ── PCA word map ──────────────────────────────────────────────────────────────
// 24 groups × 4 words = 96 word IDs. Each word maps to one Cornerstone profile.
// respondent selects one Most and one Least per group (groups = question numbers 1-24).
export const PCA_WORD_MAP: Readonly<Record<number, Profile>> = {
  // Group 1
  1: 'cultivator', 2: 'catalyst',   3: 'cultivator', 4: 'vanguard',
  // Group 2
  5: 'catalyst',   6: 'architect',  7: 'vanguard',   8: 'cultivator',
  // Group 3
  9: 'cultivator', 10: 'vanguard',  11: 'cultivator', 12: 'catalyst',
  // Group 4
  13: 'cultivator', 14: 'cultivator', 15: 'vanguard', 16: 'catalyst',
  // Group 5
  17: 'catalyst',  18: 'architect',  19: 'vanguard',  20: 'architect',
  // Group 6
  21: 'vanguard',  22: 'cultivator', 23: 'catalyst',  24: 'cultivator',
  // Group 7
  25: 'architect', 26: 'cultivator', 27: 'vanguard',  28: 'catalyst',
  // Group 8
  29: 'vanguard',  30: 'catalyst',   31: 'cultivator', 32: 'architect',
  // Group 9
  33: 'catalyst',  34: 'cultivator', 35: 'vanguard',  36: 'architect',
  // Group 10
  37: 'cultivator', 38: 'vanguard',  39: 'cultivator', 40: 'catalyst',
  // Group 11
  41: 'vanguard',  42: 'cultivator', 43: 'cultivator', 44: 'vanguard',
  // Group 12
  45: 'architect', 46: 'cultivator', 47: 'catalyst',  48: 'vanguard',
  // Group 13
  49: 'catalyst',  50: 'cultivator', 51: 'cultivator', 52: 'vanguard',
  // Group 14
  53: 'cultivator', 54: 'vanguard',  55: 'catalyst',  56: 'cultivator',
  // Group 15
  57: 'vanguard',  58: 'cultivator', 59: 'cultivator', 60: 'architect',
  // Group 16
  61: 'catalyst',  62: 'architect',  63: 'architect',  64: 'vanguard',
  // Group 17
  65: 'catalyst',  66: 'vanguard',   67: 'cultivator', 68: 'architect',
  // Group 18
  69: 'vanguard',  70: 'catalyst',   71: 'cultivator', 72: 'architect',
  // Group 19
  73: 'architect', 74: 'vanguard',   75: 'catalyst',  76: 'cultivator',
  // Group 20
  77: 'vanguard',  78: 'catalyst',   79: 'architect',  80: 'catalyst',
  // Group 21
  81: 'cultivator', 82: 'architect', 83: 'catalyst',  84: 'cultivator',
  // Group 22
  85: 'catalyst',  86: 'architect',  87: 'vanguard',  88: 'cultivator',
  // Group 23
  89: 'cultivator', 90: 'architect', 91: 'vanguard',  92: 'architect',
  // Group 24
  93: 'vanguard',  94: 'cultivator', 95: 'catalyst',  96: 'architect',
} as const;

export const PCA_GROUP_COUNT = 24;

// ── WSA / JA question map ─────────────────────────────────────────────────────
// 32 questions. Each maps to an axis (A or R) and a direction (H = high, L = low).
// Low-direction questions are inverted: adjustedValue = 6 − rawValue.
// NOTE: The specification comments indicate "24 A / 8 R" but the authoritative
// question map below yields 22 A questions and 10 R questions. maxRaw values
// are derived dynamically from this map.
export const QUESTION_MAP: Readonly<
  Record<number, { axis: 'A' | 'R'; direction: 'H' | 'L' }>
> = {
  1:  { axis: 'A', direction: 'L' },  2:  { axis: 'A', direction: 'H' },
  3:  { axis: 'A', direction: 'H' },  4:  { axis: 'R', direction: 'H' },
  5:  { axis: 'A', direction: 'L' },  6:  { axis: 'A', direction: 'H' },
  7:  { axis: 'R', direction: 'L' },  8:  { axis: 'A', direction: 'L' },
  9:  { axis: 'A', direction: 'H' },  10: { axis: 'R', direction: 'H' },
  11: { axis: 'A', direction: 'L' },  12: { axis: 'A', direction: 'H' },
  13: { axis: 'R', direction: 'H' },  14: { axis: 'A', direction: 'L' },
  15: { axis: 'A', direction: 'H' },  16: { axis: 'R', direction: 'L' },
  17: { axis: 'A', direction: 'L' },  18: { axis: 'A', direction: 'H' },
  19: { axis: 'R', direction: 'H' },  20: { axis: 'A', direction: 'L' },
  21: { axis: 'A', direction: 'H' },  22: { axis: 'R', direction: 'L' },
  23: { axis: 'A', direction: 'L' },  24: { axis: 'A', direction: 'H' },
  25: { axis: 'R', direction: 'H' },  26: { axis: 'A', direction: 'L' },
  27: { axis: 'A', direction: 'H' },  28: { axis: 'R', direction: 'L' },
  29: { axis: 'R', direction: 'H' },  30: { axis: 'A', direction: 'L' },
  31: { axis: 'A', direction: 'H' },  32: { axis: 'A', direction: 'H' },
} as const;

export const WSA_JA_QUESTION_COUNT = 32;

// Pre-computed max raw scores (derived from QUESTION_MAP so they stay in sync)
export const MAX_RAW: { A: number; R: number } = (() => {
  let a = 0;
  let r = 0;
  for (const { axis } of Object.values(QUESTION_MAP)) {
    if (axis === 'A') a += 5;
    else r += 5;
  }
  return { A: a, R: r };
})();
