const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  const body = await res.json().catch(() => ({})) as Record<string, unknown>;

  if (!res.ok) {
    const code    = (body['error'] as string | undefined) ?? 'unknown';
    const message = (body['message'] as string | undefined) ?? res.statusText;
    throw new ApiError(code, message, res.status);
  }

  return body as T;
}

export interface InvitationData {
  invitationId:   string;
  firstName:      string | null;
  email:          string;
  eventName:      string;
  eventDate:      string | null;
  isFree:         boolean;
  status:         string;
  existingResponses: {
    pca: PCAResponseData[] | null;
    wsa: WSAResponseData[] | null;
  };
}

export interface PCAResponseData {
  questionNumber: number;
  responseMost:   number;
  responseLeast:  number;
}

export interface WSAResponseData {
  questionNumber: number;
  responseValue:  number;
}

export interface SubmitResult {
  primaryProfile:    string;
  profileDisplayName: string;
  tagline:           string;
  message:           string;
}

export function loadInvitation(token: string): Promise<InvitationData> {
  return request<InvitationData>(`/pf/assess/${token}`);
}

export function saveResponses(
  token: string,
  instrumentType: 'pca' | 'wsa',
  responses: unknown[],
  isPartial: boolean
): Promise<{ saved: boolean }> {
  return request<{ saved: boolean }>(`/pf/assess/${token}/save`, {
    method: 'POST',
    body: JSON.stringify({ instrumentType, responses, isPartial }),
  });
}

export function submitAssessment(token: string): Promise<SubmitResult> {
  return request<SubmitResult>(`/pf/assess/${token}/submit`, { method: 'POST' });
}
