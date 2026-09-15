export type PFProfile = 'driver' | 'artist' | 'investigator' | 'mediator';

export const cornerstoneToPathProfile: Record<string, PFProfile> = {
  vanguard:   'driver',
  catalyst:   'artist',
  architect:  'investigator',
  cultivator: 'mediator',
};

export const pfProfileDisplayName: Record<PFProfile, string> = {
  driver:       'Driver',
  artist:       'Artist',
  investigator: 'Investigator',
  mediator:     'Mediator',
};

export function mapToPFProfile(cornerstoneProfile: string): PFProfile {
  const mapped = cornerstoneToPathProfile[cornerstoneProfile.toLowerCase()];
  if (!mapped) throw new Error(`Unknown profile: ${cornerstoneProfile}`);
  return mapped;
}
