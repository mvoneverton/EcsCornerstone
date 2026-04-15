/**
 * Scoring engine — pure module.
 * No database calls, no HTTP calls, no side effects.
 * All exports are deterministic functions of their inputs.
 */
import type { AssessmentResponse, AssessmentType, ScoringResult } from '../types';
import { scorePca } from './pcaScorer';
import { scoreWsaJa } from './wsaJaScorer';
import { checkPcaValidity, checkWsaJaValidity } from './validator';

export { ScoringError } from './pcaScorer';
export { assignProfile, percentileTo800 } from './profileAssigner';
export { countPcaSelections, computePcaPercentiles } from './pcaScorer';
export { allSameMost } from './validator';
export type { ValidityResult } from './validator';

/**
 * Score a completed assessment.
 *
 * @param type       'pca' | 'wsa' | 'ja'
 * @param responses  Array of AssessmentResponse — must be complete for the type
 * @returns          ScoringResult with perspectives, isValid, and validityFlags
 * @throws           ScoringError if the response set is incomplete or malformed
 */
export function scoreAssessment(
  type: AssessmentType,
  responses: AssessmentResponse[]
): ScoringResult {
  if (type === 'pca') {
    const perspectives = scorePca(responses);
    const { isValid, validityFlags } = checkPcaValidity(perspectives, responses);
    return { perspectives, isValid, validityFlags };
  }

  // wsa or ja — identical scoring logic, single perspective
  const perspective = scoreWsaJa(responses, type);
  const { isValid, validityFlags } = checkWsaJaValidity(
    [perspective],
    responses,
    type
  );
  return { perspectives: [perspective], isValid, validityFlags };
}
