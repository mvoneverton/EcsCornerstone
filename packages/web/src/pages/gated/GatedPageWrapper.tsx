import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

const CONTACT_EMAIL = 'michael@evertonconsultingservices.org';
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

type ValidationState =
  | { status: 'validating' }
  | { status: 'valid'; pathType: string; companyId: string | null; expiresAt: string }
  | { status: 'expired' }
  | { status: 'invalid' };

interface GatedPageWrapperProps {
  /** Restrict the page to a single pathType — an otherwise valid token for a
   *  different service is treated as invalid. */
  expectedPathType?: 'agent_placement' | 'fcaio';
  children: ReactNode;
}

/**
 * Shared gate for the Agent Placement and FCAIO landing pages.
 *
 * Reads ?token=xxx from the URL, validates it against
 * GET /api/admin/validate-path-token, and only renders `children` once the
 * token is confirmed valid. Deliberately uses fetch (not the shared axios
 * client) so the 401 → refresh → /login interceptor never fires here.
 */
export function GatedPageWrapper({ expectedPathType, children }: GatedPageWrapperProps) {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<ValidationState>({ status: 'validating' });

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setState({ status: 'invalid' });
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/admin/validate-path-token?token=${encodeURIComponent(token)}`,
          { headers: { Accept: 'application/json' } },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && data?.valid) {
          if (expectedPathType && data.pathType !== expectedPathType) {
            setState({ status: 'invalid' });
            return;
          }
          setState({
            status: 'valid',
            pathType: data.pathType,
            companyId: data.companyId ?? null,
            expiresAt: data.expiresAt,
          });
        } else if (data?.reason === 'expired') {
          setState({ status: 'expired' });
        } else {
          setState({ status: 'invalid' });
        }
      } catch {
        if (!cancelled) setState({ status: 'invalid' });
      }
    })();

    return () => { cancelled = true; };
  }, [token, expectedPathType]);

  if (state.status === 'validating') return <GateLoading />;
  if (state.status === 'expired')    return <GateExpired />;
  if (state.status === 'invalid')    return <GateInvalid />;

  return <>{children}</>;
}

// ── Branded states ───────────────────────────────────────────────────────────

function GateShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 px-6 py-16">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white px-8 py-12 text-center shadow-lg">
        <img src="/ecs-logo.svg" alt="ECS Cornerstone" className="mx-auto mb-8 h-12 w-auto" />
        {children}
      </div>
    </div>
  );
}

function GateLoading() {
  return (
    <GateShell>
      <div
        className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-navy-100 border-t-gold"
        role="status"
        aria-label="Validating your access link"
      />
      <p className="mt-6 text-sm text-gray-500">Validating your access link…</p>
    </GateShell>
  );
}

function GateExpired() {
  return (
    <GateShell>
      <h1 className="font-serif text-2xl text-navy">Your access link has expired</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        Please contact your ECS consultant to request a new one.
      </p>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-6 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-gold-400"
      >
        Contact ECS
      </a>
    </GateShell>
  );
}

function GateInvalid() {
  return (
    <GateShell>
      <div className="text-5xl font-bold text-navy-200">404</div>
      <h1 className="mt-3 font-serif text-2xl text-navy">This link is not valid</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        Please use the link from your invitation email.
      </p>
    </GateShell>
  );
}
