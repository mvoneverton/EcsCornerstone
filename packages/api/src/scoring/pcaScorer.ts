import type { AssessmentResponse, ScoredPerspective } from '../types';
import { PCA_WORD_MAP, PCA_GROUP_COUNT } from './constants';
import { assignProfile, percentileTo800 } from './profileAssigner';

interface ProfileCounts {
  vanguard:  number;
  catalyst:  number;
  cultivator: number;
  architect: number;
}

/**
 * Validates that all 24 groups have a Most and Least selection.
 * Throws ScoringError if incomplete.
 */
function validatePcaResponses(responses: AssessmentResponse[]): void {
  for (let g = 1; g <= PCA_GROUP_COUNT; g++) {
    const r = responses.find((x) => x.questionNumber === g);
    if (
      r === undefined ||
      r.responseMost === undefined ||
      r.responseLeast === undefined
    ) {
      throw new ScoringError(
        `PCA group ${g} is incomplete — both Most and Least selections are required.`
      );
    }
    if (!(r.responseMost in PCA_WORD_MAP)) {
      throw new ScoringError(
        `PCA group ${g}: responseMost word ID ${r.responseMost} is not in the scoring key.`
      );
    }
    if (!(r.responseLeast in PCA_WORD_MAP)) {
      throw new ScoringError(
        `PCA group ${g}: responseLeast word ID ${r.responseLeast} is not in the scoring key.`
      );
    }
    if (r.responseMost === r.responseLeast) {
      throw new ScoringError(
        `PCA group ${g}: Most and Least selections cannot be the same word.`
      );
    }
  }
}

/**
 * Counts how many Most and Least selections map to each profile.
 */
export function countPcaSelections(responses: AssessmentResponse[]): {
  most: ProfileCounts;
  least: ProfileCounts;
} {
  const most:  ProfileCounts = { vanguard: 0, catalyst: 0, cultivator: 0, architect: 0 };
  const least: ProfileCounts = { vanguard: 0, catalyst: 0, cultivator: 0, architect: 0 };

  for (const r of responses) {
    if (r.responseMost  !== undefined) most[PCA_WORD_MAP[r.responseMost]]++;
    if (r.responseLeast !== undefined) least[PCA_WORD_MAP[r.responseLeast]]++;
  }

  return { most, least };
}

/**
 * Calculates the three PCA perspectives from the raw Most/Least counts.
 *
 * How You See Yourself (self — public self, Most selections only):
 *   A = (mostV + mostC)  / 24 × 100
 *   R = (mostC + mostCu) / 24 × 100
 *
 * How Others See You (others — perceived self, Least selections inverted):
 *   A = (leastCu + leastAr) / 24 × 100
 *   R = (leastV  + leastAr) / 24 × 100
 *
 * Behavior at Work (work — net signal, Most minus Least):
 *   A = ((mostV + mostC)  − (mostCu + mostAr) + 24) / 48 × 100
 *   R = ((mostC + mostCu) − (mostV  + mostAr) + 24) / 48 × 100
 */
export function computePcaPercentiles(
  most: ProfileCounts,
  least: ProfileCounts
): Array<{ perspective: 'self' | 'others' | 'work'; aPercentile: number; rPercentile: number }> {
  const selfA  = (most.vanguard + most.catalyst)   / PCA_GROUP_COUNT * 100;
  const selfR  = (most.catalyst + most.cultivator)  / PCA_GROUP_COUNT * 100;

  const othersA = (least.cultivator + least.architect) / PCA_GROUP_COUNT * 100;
  const othersR = (least.vanguard   + least.architect) / PCA_GROUP_COUNT * 100;

  const workA = (
    (most.vanguard + most.catalyst) - (most.cultivator + most.architect) + PCA_GROUP_COUNT
  ) / (PCA_GROUP_COUNT * 2) * 100;

  const workR = (
    (most.catalyst + most.cultivator) - (most.vanguard + most.architect) + PCA_GROUP_COUNT
  ) / (PCA_GROUP_COUNT * 2) * 100;

  return [
    { perspective: 'self',   aPercentile: selfA,   rPercentile: selfR   },
    { perspective: 'others', aPercentile: othersA, rPercentile: othersR },
    { perspective: 'work',   aPercentile: workA,   rPercentile: workR   },
  ];
}

/**
 * Full PCA scorer. Validates, counts, computes three perspectives, assigns profiles.
 */
export function scorePca(responses: AssessmentResponse[]): ScoredPerspective[] {
  validatePcaResponses(responses);

  const { most, least } = countPcaSelections(responses);
  const perspectives = computePcaPercentiles(most, least);

  return perspectives.map(({ perspective, aPercentile, rPercentile }) => {
    const { primary, secondary } = assignProfile(aPercentile, rPercentile);
    return {
      perspective,
      aPercentile,
      rPercentile,
      aScore800: percentileTo800(aPercentile),
      rScore800: percentileTo800(rPercentile),
      primaryProfile: primary,
      secondaryProfile: secondary,
    };
  });
}

// ── Exported for use in validator ────────────────────────────────────────────
export { validatePcaResponses };

// ── Local error type (re-exported from index) ─────────────────────────────────
export class ScoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScoringError';
  }
}
