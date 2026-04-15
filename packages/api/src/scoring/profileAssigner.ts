import type { Profile } from '../types';

export interface ProfileAssignment {
  primary: Profile;
  secondary: Profile | null;
}

/**
 * Assigns primary and secondary Cornerstone profiles from A/R percentiles.
 * Applied independently to each perspective.
 */
export function assignProfile(
  aPercentile: number,
  rPercentile: number
): ProfileAssignment {
  const highA = aPercentile >= 50;
  const highR = rPercentile >= 50;

  // Primary quadrant
  let primary: Profile;
  if (highA && highR)   primary = 'catalyst';
  else if (highA && !highR) primary = 'vanguard';
  else if (!highA && highR) primary = 'cultivator';
  else                      primary = 'architect';

  // Distance from midpoint on each axis
  const aDistance = Math.abs(aPercentile - 50);
  const rDistance = Math.abs(rPercentile - 50);

  // Near-midpoint on BOTH axes — no meaningful secondary
  if (aDistance <= 6 && rDistance <= 6) {
    return { primary, secondary: null };
  }

  // The WEAKER axis (closer to 50) determines which adjacent quadrant
  // the respondent leans toward for the secondary profile.
  let secondary: Profile;
  if (aDistance > rDistance) {
    // A axis is dominant — secondary comes from R axis lean
    secondary = highR
      ? (highA ? 'cultivator' : 'catalyst')
      : (highA ? 'architect'  : 'vanguard');
  } else {
    // R axis is dominant — secondary comes from A axis lean
    secondary = highA
      ? (highR ? 'vanguard'  : 'catalyst')
      : (highR ? 'architect' : 'cultivator');
  }

  // Secondary must differ from primary
  if (secondary === primary) return { primary, secondary: null };

  return { primary, secondary };
}

/** Convert a 0–100 percentile to the 0–800 display scale. */
export function percentileTo800(percentile: number): number {
  return Math.round(percentile * 8);
}
