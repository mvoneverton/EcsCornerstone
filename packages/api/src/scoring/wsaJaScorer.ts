import type { AssessmentResponse, AssessmentType, ScoredPerspective } from '../types';
import { QUESTION_MAP, WSA_JA_QUESTION_COUNT, MAX_RAW } from './constants';
import { assignProfile, percentileTo800 } from './profileAssigner';
import { ScoringError } from './pcaScorer';

/**
 * Validates that all 32 WSA/JA questions have a response value in 1–5.
 */
function validateWsaJaResponses(responses: AssessmentResponse[]): void {
  for (let q = 1; q <= WSA_JA_QUESTION_COUNT; q++) {
    const r = responses.find((x) => x.questionNumber === q);
    if (r === undefined || r.responseValue === undefined) {
      throw new ScoringError(
        `Question ${q} is missing — all ${WSA_JA_QUESTION_COUNT} questions must be answered.`
      );
    }
    if (r.responseValue < 1 || r.responseValue > 5) {
      throw new ScoringError(
        `Question ${q}: responseValue ${r.responseValue} is out of range (1–5).`
      );
    }
  }
}

/**
 * Scores a WSA or JA response set. Returns a single 'single' perspective.
 *
 * Scoring steps:
 *  1. For each question, apply direction: Low-direction → adjustedValue = 6 − rawValue
 *  2. Accumulate A and R axis totals separately
 *  3. aPercentile = aTotal / MAX_RAW.A × 100
 *     rPercentile = rTotal / MAX_RAW.R × 100
 *  4. Convert to 0–800 and assign profile
 */
export function scoreWsaJa(
  responses: AssessmentResponse[],
  _type: AssessmentType  // 'wsa' | 'ja' — same logic, retained for future divergence
): ScoredPerspective {
  validateWsaJaResponses(responses);

  let aTotal = 0;
  let rTotal = 0;

  for (const r of responses) {
    const { axis, direction } = QUESTION_MAP[r.questionNumber]!;
    const raw = r.responseValue!;
    const adjusted = direction === 'L' ? 6 - raw : raw;

    if (axis === 'A') aTotal += adjusted;
    else              rTotal += adjusted;
  }

  const aPercentile = (aTotal / MAX_RAW.A) * 100;
  const rPercentile = (rTotal / MAX_RAW.R) * 100;

  const { primary, secondary } = assignProfile(aPercentile, rPercentile);

  return {
    perspective: 'single',
    aPercentile,
    rPercentile,
    aScore800: percentileTo800(aPercentile),
    rScore800: percentileTo800(rPercentile),
    primaryProfile: primary,
    secondaryProfile: secondary,
  };
}

export { validateWsaJaResponses };
