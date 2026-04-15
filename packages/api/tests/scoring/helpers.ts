/**
 * Test helpers for constructing PCA and WSA/JA response fixtures.
 */
import type { AssessmentResponse } from '../../src/types';
import { PCA_WORD_MAP } from '../../src/scoring/constants';

// ── PCA helpers ───────────────────────────────────────────────────────────────

/**
 * Word IDs grouped by profile, indexed by group number (1–24).
 * Picks the FIRST word of the requested profile in each group (4 words = IDs
 * (group−1)*4+1 through group*4).  Returns null when no word of that profile
 * exists in the group.
 */
type Profile = 'vanguard' | 'catalyst' | 'cultivator' | 'architect';

function firstWordOfProfileInGroup(group: number, profile: Profile): number | null {
  const base = (group - 1) * 4 + 1;
  for (let id = base; id <= base + 3; id++) {
    if (PCA_WORD_MAP[id] === profile) return id;
  }
  return null;
}

function firstWordNotOfProfileInGroup(group: number, profile: Profile): number {
  const base = (group - 1) * 4 + 1;
  for (let id = base; id <= base + 3; id++) {
    if (PCA_WORD_MAP[id] !== profile) return id;
  }
  // Should never happen — every group has at least 2 different profiles
  throw new Error(`Group ${group} is all ${profile}?`);
}

/**
 * Builds 24 PCA responses where:
 *   - Most = requested mostProfile wherever available, fallback to fallbackProfile
 *   - Least = a word that is NOT the Most word
 */
export function buildPcaResponses(
  mostProfile: Profile,
  leastProfile: Profile
): AssessmentResponse[] {
  const responses: AssessmentResponse[] = [];

  for (let g = 1; g <= 24; g++) {
    const mostId =
      firstWordOfProfileInGroup(g, mostProfile) ??
      firstWordOfProfileInGroup(g, 'vanguard')  ??
      firstWordOfProfileInGroup(g, 'catalyst')  ??
      firstWordOfProfileInGroup(g, 'cultivator') ??
      (g * 4);  // last-resort: any word

    // Least must be a different word
    let leastId =
      firstWordOfProfileInGroup(g, leastProfile) ??
      firstWordNotOfProfileInGroup(g, PCA_WORD_MAP[mostId]!);
    if (leastId === mostId) {
      leastId = firstWordNotOfProfileInGroup(g, PCA_WORD_MAP[mostId]!);
    }

    responses.push({ questionNumber: g, responseMost: mostId, responseLeast: leastId });
  }

  return responses;
}

/**
 * Builds PCA responses with explicit Most and Least word IDs per group.
 * mostIds / leastIds arrays are indexed 0–23 (group 1–24).
 */
export function buildPcaFromIds(
  mostIds: number[],
  leastIds: number[]
): AssessmentResponse[] {
  return Array.from({ length: 24 }, (_, i) => ({
    questionNumber: i + 1,
    responseMost:  mostIds[i],
    responseLeast: leastIds[i],
  }));
}

// ── WSA / JA helpers ──────────────────────────────────────────────────────────

/** All 32 questions with the same response value. */
export function uniformWsaResponses(value: number): AssessmentResponse[] {
  return Array.from({ length: 32 }, (_, i) => ({
    questionNumber: i + 1,
    responseValue: value,
  }));
}

/** 32 responses with specific values per question number. */
export function buildWsaResponses(
  valueMap: Record<number, number>
): AssessmentResponse[] {
  return Array.from({ length: 32 }, (_, i) => ({
    questionNumber: i + 1,
    responseValue: valueMap[i + 1] ?? 3,
  }));
}
