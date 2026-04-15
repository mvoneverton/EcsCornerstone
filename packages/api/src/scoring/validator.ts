import type {
  AssessmentResponse,
  AssessmentType,
  ScoredPerspective,
  ValidityFlag,
} from '../types';
import { countPcaSelections } from './pcaScorer';

export interface ValidityResult {
  isValid: boolean;
  validityFlags: ValidityFlag[];
}

// ── Shared checks ─────────────────────────────────────────────────────────────

/**
 * Flag 3 — Extreme score: any axis score ≤ 50 or ≥ 750 on the 0–800 scale.
 */
function hasExtremeScore(perspectives: ScoredPerspective[]): boolean {
  return perspectives.some(
    (p) =>
      p.aScore800 <= 50 || p.aScore800 >= 750 ||
      p.rScore800 <= 50 || p.rScore800 >= 750
  );
}

// ── PCA-specific checks ───────────────────────────────────────────────────────

/**
 * Flag 1 — All 24 Most selections map to the same profile.
 * Statistically improbable; indicates possible misunderstanding or gaming.
 */
export function allSameMost(responses: AssessmentResponse[]): boolean {
  const { most } = countPcaSelections(responses);
  return (
    most.vanguard  === 24 ||
    most.catalyst  === 24 ||
    most.cultivator === 24 ||
    most.architect === 24
  );
}

/**
 * Flag 2 — Three-perspective divergence > 200 points on any axis.
 * Compares every pair of perspectives on each axis (0–800 scale).
 */
function hasPerspectiveGap(perspectives: ScoredPerspective[]): boolean {
  for (let i = 0; i < perspectives.length; i++) {
    for (let j = i + 1; j < perspectives.length; j++) {
      const pi = perspectives[i]!;
      const pj = perspectives[j]!;
      if (
        Math.abs(pi.aScore800 - pj.aScore800) > 200 ||
        Math.abs(pi.rScore800 - pj.rScore800) > 200
      ) {
        return true;
      }
    }
  }
  return false;
}

// ── Public validators ─────────────────────────────────────────────────────────

export function checkPcaValidity(
  perspectives: ScoredPerspective[],
  responses: AssessmentResponse[]
): ValidityResult {
  const flags: ValidityFlag[] = [];

  if (allSameMost(responses))          flags.push('all_same_most');
  if (hasPerspectiveGap(perspectives))  flags.push('large_perspective_gap');
  if (hasExtremeScore(perspectives))    flags.push('extreme_score');

  return { isValid: flags.length === 0, validityFlags: flags };
}

export function checkWsaJaValidity(
  perspectives: ScoredPerspective[],
  _responses: AssessmentResponse[],
  _type: AssessmentType
): ValidityResult {
  const flags: ValidityFlag[] = [];

  if (hasExtremeScore(perspectives)) flags.push('extreme_score');

  return { isValid: flags.length === 0, validityFlags: flags };
}
