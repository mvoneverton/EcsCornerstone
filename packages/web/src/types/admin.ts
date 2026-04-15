export interface Person {
  id:                  string;
  email:               string;
  firstName:           string;
  lastName:            string;
  role:                string;
  currentPosition:     string | null;
  lastLoginAt:         string | null;
  createdAt:           string;
  completedAssessments: number;
  facilitatorNotes?:   string | null;
}

export interface AssessmentResult {
  perspective:      string;
  aPercentile:      number;
  rPercentile:      number;
  aScore800:        number;
  rScore800:        number;
  primaryProfile:   string;
  secondaryProfile: string | null;
  reportS3Key:      string | null;
  isValid:          boolean;
  validityFlags:    string[];
}

export interface Assessment {
  id:             string;
  assessmentType: string;
  sentAt:         string;
  expiresAt:      string;
  openedAt:       string | null;
  completedAt:    string | null;
  positionId:     string | null;
  results:        AssessmentResult[];
}

export interface Pagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export type AssessmentStatus = 'completed' | 'opened' | 'pending' | 'expired';

export function invitationStatus(a: Assessment): AssessmentStatus {
  if (a.completedAt) return 'completed';
  if (a.openedAt)    return 'opened';
  if (new Date(a.expiresAt) <= new Date()) return 'expired';
  return 'pending';
}

export function assessmentLabel(type: string): string {
  return type === 'pca' ? 'PCA' : type === 'wsa' ? 'WSA' : type === 'ja' ? 'JA' : type.toUpperCase();
}

export function assessmentFullName(type: string): string {
  return type === 'pca'
    ? 'Personal Communication Assessment'
    : type === 'wsa'
    ? 'Work Style Assessment'
    : type === 'ja'
    ? 'Job Assessment'
    : type.toUpperCase();
}
