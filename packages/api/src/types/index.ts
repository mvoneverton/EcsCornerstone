// ── Assessment domain ─────────────────────────────────────────────────────────

export type Profile = 'vanguard' | 'catalyst' | 'cultivator' | 'architect';
export type AssessmentType = 'pca' | 'wsa' | 'ja';
export type Perspective = 'self' | 'others' | 'work' | 'single';
export type ValidityFlag =
  | 'all_same_most'
  | 'large_perspective_gap'
  | 'extreme_score'
  | 'incomplete';

export interface AssessmentResponse {
  questionNumber: number;
  responseValue?: number;   // WSA/JA: 1–5
  responseMost?: number;    // PCA: word ID of Most selection
  responseLeast?: number;   // PCA: word ID of Least selection
}

export interface ScoredPerspective {
  perspective: Perspective;
  aPercentile: number;      // 0.00 to 100.00
  rPercentile: number;
  aScore800: number;        // 0 to 800
  rScore800: number;
  primaryProfile: Profile;
  secondaryProfile: Profile | null;
}

export interface ScoringResult {
  perspectives: ScoredPerspective[];
  isValid: boolean;
  validityFlags: ValidityFlag[];
}

// ── User / Auth ───────────────────────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'company_admin'
  | 'facilitator'
  | 'respondent';

export interface JwtPayload {
  sub: string;          // user id
  email: string;
  role: UserRole;
  companyId: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Request augmentation ──────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
