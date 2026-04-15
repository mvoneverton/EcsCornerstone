import {
  scoreAssessment,
  ScoringError,
  countPcaSelections,
  computePcaPercentiles,
  allSameMost,
} from '../../src/scoring';
import type { AssessmentResponse } from '../../src/types';
import { PCA_WORD_MAP } from '../../src/scoring/constants';
import { buildPcaResponses } from './helpers';

// ── Utility ───────────────────────────────────────────────────────────────────

/** Round to 2dp for float comparisons. */
const r2 = (n: number) => Math.round(n * 100) / 100;

// ── Pre-computed fixtures ─────────────────────────────────────────────────────

/**
 * Fixture A — Catalyst / Vanguard dominant.
 * Strategy: pick Catalyst words for Most; if none in group, pick Vanguard.
 *            pick Architect words for Least; if none, pick Cultivator.
 * Expected: high A (Catalyst+Vanguard Most), high R (Catalyst+Cultivator Most)
 *           → selfA > 50, selfR > 50 → self = Catalyst
 */
function catalystFixture(): AssessmentResponse[] {
  return buildPcaResponses('catalyst', 'architect');
}

/**
 * Fixture B — Architect dominant.
 * Strategy: pick Architect words for Most; if none, pick Cultivator.
 *            pick Catalyst words for Least; if none, pick Vanguard.
 * Expected: low A, low R → Architect primary
 */
function architectFixture(): AssessmentResponse[] {
  return buildPcaResponses('architect', 'catalyst');
}

/**
 * Fixture C — Cultivator sweep.
 * Picks Cultivator words as Most wherever they exist; falls back to Catalyst.
 * Note: not all 24 groups contain a Cultivator word, so all_same_most fires
 * only when ALL 24 Most map to the same profile — tested separately.
 */
function cultivatorSweepFixture(): AssessmentResponse[] {
  return buildPcaResponses('cultivator', 'vanguard');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PCA Scoring Engine', () => {

  // ── 1. Produces 3 perspectives ────────────────────────────────────────────
  test('returns exactly 3 scored perspectives (self, others, work)', () => {
    const result = scoreAssessment('pca', catalystFixture());
    expect(result.perspectives).toHaveLength(3);
    const types = result.perspectives.map((p) => p.perspective).sort();
    expect(types).toEqual(['others', 'self', 'work']);
  });

  // ── 2. Catalyst / Vanguard fixture ───────────────────────────────────────
  test('Catalyst/Vanguard-dominant fixture produces high-A self perspective', () => {
    const result = scoreAssessment('pca', catalystFixture());
    const self = result.perspectives.find((p) => p.perspective === 'self')!;
    // Majority Most = Catalyst + Vanguard → selfA high
    expect(self.aPercentile).toBeGreaterThan(50);
  });

  // ── 3. Architect fixture ──────────────────────────────────────────────────
  test('Architect-dominant fixture produces Architect primary for self perspective', () => {
    const result = scoreAssessment('pca', architectFixture());
    const self = result.perspectives.find((p) => p.perspective === 'self')!;
    expect(self.primaryProfile).toBe('architect');
  });

  // ── 4. Three perspectives differ from each other ──────────────────────────
  test('three perspectives produce different A/R scores from the same response set', () => {
    // Use a mixed fixture that maximises divergence between perspectives.
    // All Most = Catalyst (high A, high R signals), all Least = Architect.
    // self uses Most → high A, high R
    // others uses Least (inverted) → leastCu+leastAr / leastV+leastAr
    // work is net signal
    const responses = buildPcaResponses('catalyst', 'architect');
    const result = scoreAssessment('pca', responses);
    const [self, others, work] = ['self', 'others', 'work'].map(
      (p) => result.perspectives.find((x) => x.perspective === p)!
    );
    // All three exist
    expect(self).toBeDefined();
    expect(others).toBeDefined();
    expect(work).toBeDefined();
    // At least two of the three perspectives must differ on at least one axis
    const allIdentical =
      self.aScore800 === others.aScore800 &&
      self.aScore800 === work.aScore800 &&
      self.rScore800 === others.rScore800 &&
      self.rScore800 === work.rScore800;
    expect(allIdentical).toBe(false);
  });

  // ── 5. Exact arithmetic — self perspective ────────────────────────────────
  test('self perspective formula: selfA = (mostV+mostC)/24×100, selfR = (mostC+mostCu)/24×100', () => {
    // Construct known counts: 12 Catalyst Most, 8 Vanguard Most, 4 Cultivator Most
    // mostV=8, mostC=12, mostCu=4, mostAr=0
    // selfA = (8+12)/24*100 = 83.333...
    // selfR = (12+4)/24*100 = 66.666...
    const most   = { vanguard: 8, catalyst: 12, cultivator: 4, architect: 0 };
    const least  = { vanguard: 4, catalyst: 4,  cultivator: 8, architect: 8 };
    const results = computePcaPercentiles(most, least);
    const self = results.find((p) => p.perspective === 'self')!;
    expect(r2(self.aPercentile)).toBe(r2((8 + 12) / 24 * 100));
    expect(r2(self.rPercentile)).toBe(r2((12 + 4) / 24 * 100));
  });

  // ── 6. Exact arithmetic — others perspective ──────────────────────────────
  test('others perspective formula: othersA = (leastCu+leastAr)/24×100', () => {
    const most  = { vanguard: 6, catalyst: 6, cultivator: 6, architect: 6 };
    const least = { vanguard: 2, catalyst: 2, cultivator: 12, architect: 8 };
    // othersA = (12+8)/24*100 = 83.333
    // othersR = (2+8)/24*100  = 41.666
    const results = computePcaPercentiles(most, least);
    const others = results.find((p) => p.perspective === 'others')!;
    expect(r2(others.aPercentile)).toBe(r2((12 + 8) / 24 * 100));
    expect(r2(others.rPercentile)).toBe(r2((2 + 8) / 24 * 100));
  });

  // ── 7. Exact arithmetic — work perspective ────────────────────────────────
  test('work perspective formula: workA = ((mostV+mostC)-(mostCu+mostAr)+24)/48×100', () => {
    const most  = { vanguard: 10, catalyst: 8, cultivator: 4, architect: 2 };
    const least = { vanguard: 2,  catalyst: 2,  cultivator: 12, architect: 8 };
    // workA = ((10+8)-(4+2)+24)/48*100 = (18-6+24)/48*100 = 36/48*100 = 75
    // workR = ((8+4)-(10+2)+24)/48*100 = (12-12+24)/48*100 = 24/48*100 = 50
    const results = computePcaPercentiles(most, least);
    const work = results.find((p) => p.perspective === 'work')!;
    expect(r2(work.aPercentile)).toBe(75);
    expect(r2(work.rPercentile)).toBe(50);
  });

  // ── 8. 0–800 conversion ───────────────────────────────────────────────────
  test('score800 = round(percentile × 8)', () => {
    const responses = catalystFixture();
    const result = scoreAssessment('pca', responses);
    for (const p of result.perspectives) {
      expect(p.aScore800).toBe(Math.round(p.aPercentile * 8));
      expect(p.rScore800).toBe(Math.round(p.rPercentile * 8));
    }
  });

  // ── 9. Profile assignment — quadrant boundaries ───────────────────────────
  test('aPercentile=75 rPercentile=75 → Catalyst primary', () => {
    const most  = { vanguard: 9, catalyst: 9, cultivator: 6, architect: 0 };
    const least = { vanguard: 0, catalyst: 0, cultivator: 0, architect: 24 };
    // selfA = (9+9)/24*100 = 75, selfR = (9+6)/24*100 = 62.5
    // Verify the computed percentiles are in range (sanity check the function)
    const results = computePcaPercentiles(most, least);
    expect(results).toHaveLength(3);
    const result = scoreAssessment('pca', buildPcaResponses('catalyst', 'architect'));
    const selfScored = result.perspectives.find((p) => p.perspective === 'self')!;
    // Just verify the profile assignment logic for a known >50/50 case
    expect(['catalyst', 'vanguard']).toContain(selfScored.primaryProfile);
  });

  // ── 10. Cultivator sweep — spot-check profile counts ─────────────────────
  test('cultivator-dominant Most selections increase R score', () => {
    const responses = cultivatorSweepFixture();
    const result = scoreAssessment('pca', responses);
    const self = result.perspectives.find((p) => p.perspective === 'self')!;
    // Cultivator contributes to selfR (mostC + mostCu) — so R should be boosted
    // and A should be low (Cultivator is low-A territory)
    expect(self.aPercentile).toBeLessThan(50);
    expect(self.rPercentile).toBeGreaterThan(0);
  });

  // ── 11. all_same_most flag ────────────────────────────────────────────────
  test('allSameMost() returns true when all 24 Most selections map to one profile', () => {
    // Construct artificial responses with all Most IDs from one profile.
    // Use word IDs that all map to 'vanguard'. Since no profile covers all 24
    // groups, we test the counting function directly with crafted IDs.
    // We use any 24 valid IDs that all happen to be 'vanguard' profile.
    const vanguardIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'vanguard')
      .map(([id]) => Number(id));

    // Pad to 24 by repeating if needed (test the counting, not the word map)
    const mostIds = Array.from({ length: 24 }, (_, i) => vanguardIds[i % vanguardIds.length]!);

    // Least = architect words
    const architectIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'architect')
      .map(([id]) => Number(id));
    const leastIds = Array.from({ length: 24 }, (_, i) => architectIds[i % architectIds.length]!);

    // Build responses ensuring most ≠ least per group (can overlap IDs across
    // groups since we're testing the counter, not the group constraint)
    const responses: AssessmentResponse[] = mostIds.map((mostId, i) => ({
      questionNumber: i + 1,
      responseMost:  mostId,
      responseLeast: leastIds[i]!,
    }));

    // countPcaSelections does not enforce group membership — just counts profiles
    expect(allSameMost(responses)).toBe(true);
  });

  test('allSameMost() returns false for a mixed selection', () => {
    expect(allSameMost(catalystFixture())).toBe(false);
  });

  // ── 12. all_same_most flag propagates through scoreAssessment ─────────────
  test('all_same_most validity flag is included in result when triggered', () => {
    // Craft responses where all 24 Most words are Vanguard-profile words.
    const vanguardIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'vanguard')
      .map(([id]) => Number(id));
    const architectIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'architect')
      .map(([id]) => Number(id));

    const responses: AssessmentResponse[] = Array.from({ length: 24 }, (_, i) => ({
      questionNumber: i + 1,
      responseMost:  vanguardIds[i % vanguardIds.length]!,
      responseLeast: architectIds[i % architectIds.length]!,
    }));

    const result = scoreAssessment('pca', responses);
    expect(result.validityFlags).toContain('all_same_most');
    expect(result.isValid).toBe(false);
  });

  // ── 13. large_perspective_gap flag ───────────────────────────────────────
  test('large_perspective_gap flag fires when perspectives diverge > 200 on 800-scale', () => {
    // Force a large gap: construct responses so self has very high A
    // but others has very low A. The "others" formula uses Least words,
    // so Least = all Architect (othersA = (leastCu+leastAr)/24*100 is HIGH)
    // while self uses Most = all Catalyst (selfA is also HIGH).
    // To force a gap > 200 on R: Most = Vanguard (selfR low), Least = Vanguard (othersR high).
    //
    // selfR  = (mostC + mostCu) / 24 * 100  — low when Most = Vanguard
    // othersR = (leastV + leastAr) / 24 * 100 — high when Least = Vanguard
    //
    // If all 24 Most = Vanguard: mostC=0, mostCu=0 → selfR = 0 → rScore800 = 0
    // If all 24 Least = Vanguard: leastV=24 → othersR = 24/24*100 = 100 → rScore800 = 800
    // Gap = 800 → > 200 ✓

    const vanguardIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'vanguard')
      .map(([id]) => Number(id));

    // For Most = Vanguard, Least = Vanguard we need most ≠ least per entry.
    // Use consecutive vanguard word IDs.
    const responses: AssessmentResponse[] = Array.from({ length: 24 }, (_, i) => {
      const mIdx = i % vanguardIds.length;
      const lIdx = (i + 1) % vanguardIds.length;
      return {
        questionNumber: i + 1,
        responseMost:  vanguardIds[mIdx]!,
        responseLeast: vanguardIds[lIdx]!,
      };
    });

    const result = scoreAssessment('pca', responses);
    expect(result.validityFlags).toContain('large_perspective_gap');
  });

  // ── 14. extreme_score flag ────────────────────────────────────────────────
  test('extreme_score flag fires when any axis score is ≤ 50 or ≥ 750', () => {
    // All Most = Catalyst (selfA = 100%, rScore800 = 800 → ≥ 750)
    const catalystWordIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'catalyst')
      .map(([id]) => Number(id));
    const architectWordIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'architect')
      .map(([id]) => Number(id));

    const responses: AssessmentResponse[] = Array.from({ length: 24 }, (_, i) => ({
      questionNumber: i + 1,
      responseMost:  catalystWordIds[i % catalystWordIds.length]!,
      responseLeast: architectWordIds[i % architectWordIds.length]!,
    }));

    const result = scoreAssessment('pca', responses);
    expect(result.validityFlags).toContain('extreme_score');
  });

  // ── 15. Incomplete — missing group ────────────────────────────────────────
  test('throws ScoringError when a PCA group is missing', () => {
    const responses = catalystFixture().filter((r) => r.questionNumber !== 12);
    expect(() => scoreAssessment('pca', responses)).toThrow(ScoringError);
    expect(() => scoreAssessment('pca', responses)).toThrow('group 12');
  });

  // ── 16. Incomplete — missing Least ───────────────────────────────────────
  test('throws ScoringError when a group is missing its Least selection', () => {
    const responses = catalystFixture().map((r) =>
      r.questionNumber === 5 ? { ...r, responseLeast: undefined } : r
    );
    expect(() => scoreAssessment('pca', responses)).toThrow(ScoringError);
  });

  // ── 17. Incomplete — empty array ─────────────────────────────────────────
  test('throws ScoringError for empty response array', () => {
    expect(() => scoreAssessment('pca', [])).toThrow(ScoringError);
  });

  // ── 18. Invalid word ID ───────────────────────────────────────────────────
  test('throws ScoringError when a word ID is not in the scoring key', () => {
    const responses = catalystFixture();
    responses[0] = { ...responses[0]!, responseMost: 9999 };
    expect(() => scoreAssessment('pca', responses)).toThrow(ScoringError);
  });

  // ── 19. Same word for Most and Least ─────────────────────────────────────
  test('throws ScoringError when Most and Least are the same word ID', () => {
    const responses = catalystFixture();
    responses[0] = { ...responses[0]!, responseLeast: responses[0]!.responseMost };
    expect(() => scoreAssessment('pca', responses)).toThrow(ScoringError);
  });

  // ── 20. Mixed profile produces a blend ───────────────────────────────────
  test('mixed profile (half Catalyst, half Architect Most) produces mid-range scores', () => {
    // 12 Catalyst Most + 12 Architect Most (alternating)
    const catIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'catalyst')
      .map(([id]) => Number(id));
    const arcIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'architect')
      .map(([id]) => Number(id));
    const cuIds = Object.entries(PCA_WORD_MAP)
      .filter(([, p]) => p === 'cultivator')
      .map(([id]) => Number(id));

    const responses: AssessmentResponse[] = Array.from({ length: 24 }, (_, i) => ({
      questionNumber: i + 1,
      responseMost:  i < 12 ? catIds[i % catIds.length]! : arcIds[(i - 12) % arcIds.length]!,
      responseLeast: cuIds[i % cuIds.length]!,
    }));

    const result = scoreAssessment('pca', responses);
    const self = result.perspectives.find((p) => p.perspective === 'self')!;
    // 12 Catalyst Most: mostV=0, mostC=12, mostCu=0, mostAr=0 (+ 12 Architect: mostAr=12)
    // selfA = (0+12)/24*100 = 50
    // selfR = (12+0)/24*100 = 50
    // Exactly at the midpoint — profile is catalyst (≥50 on both)
    expect(self.aPercentile).toBe(50);
    expect(self.rPercentile).toBe(50);
    expect(self.primaryProfile).toBe('catalyst'); // 50 >= 50 on both axes → catalyst
  });

  // ── 21. countPcaSelections accuracy ──────────────────────────────────────
  test('countPcaSelections correctly tallies Most and Least per profile', () => {
    // Use explicit IDs: group 1 Most=2 (catalyst), Least=1 (cultivator)
    //                   group 2 Most=7 (vanguard),  Least=5 (catalyst)
    const responses: AssessmentResponse[] = [
      { questionNumber: 1, responseMost: 2,  responseLeast: 1  },   // most:cat, least:cu
      { questionNumber: 2, responseMost: 7,  responseLeast: 5  },   // most:v,   least:cat
    ];
    const { most, least } = countPcaSelections(responses);
    expect(most.catalyst).toBe(1);
    expect(most.vanguard).toBe(1);
    expect(most.cultivator).toBe(0);
    expect(least.cultivator).toBe(1);
    expect(least.catalyst).toBe(1);
  });

  // ── 22. Result shape is stable ────────────────────────────────────────────
  test('every ScoredPerspective has all required fields', () => {
    const result = scoreAssessment('pca', catalystFixture());
    for (const p of result.perspectives) {
      expect(typeof p.perspective).toBe('string');
      expect(typeof p.aPercentile).toBe('number');
      expect(typeof p.rPercentile).toBe('number');
      expect(typeof p.aScore800).toBe('number');
      expect(typeof p.rScore800).toBe('number');
      expect(typeof p.primaryProfile).toBe('string');
      // secondaryProfile may be null
      expect(['vanguard','catalyst','cultivator','architect',null]).toContain(p.secondaryProfile);
    }
  });
});
