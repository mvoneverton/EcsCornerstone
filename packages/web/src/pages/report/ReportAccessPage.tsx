import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/AuthLayout';
import api from '../../lib/api';

const MAX_ATTEMPTS  = 6;
const POLL_INTERVAL = 10_000;

type Status = 'checking' | 'missing-params' | 'generating' | 'ready' | 'error';

export default function ReportAccessPage() {
  const [searchParams] = useSearchParams();
  const token    = searchParams.get('token');
  // The report-ready email link must include both — see note in App.tsx wiring.
  const resultId = searchParams.get('resultId');

  const [status, setStatus] = useState<Status>('checking');
  const attempts = useRef(0);

  useEffect(() => {
    if (!token || !resultId) {
      setStatus('missing-params');
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const { data } = await api.get<{ url?: string; status?: string }>(
          `/reports/${resultId}/url/respondent`,
          { params: { token } }
        );
        if (cancelled) return;

        if (data.url) {
          setStatus('ready');
          window.location.href = data.url;
          return;
        }

        attempts.current += 1;
        if (attempts.current >= MAX_ATTEMPTS) {
          setStatus('error');
          return;
        }
        setStatus('generating');
        setTimeout(poll, POLL_INTERVAL);
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [token, resultId]);

  if (status === 'missing-params') {
    return (
      <AuthLayout title="Check your email">
        <p className="text-sm text-gray-600">
          We sent you a link when your report was ready. Please use that link to view your report.
        </p>
      </AuthLayout>
    );
  }

  if (status === 'error') {
    return (
      <AuthLayout title="Link expired">
        <p className="text-sm text-gray-600">
          This report link has expired. Please contact your administrator to request a new link.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Preparing your report">
      <p className="text-sm text-gray-600">
        {status === 'generating'
          ? 'Your report is being prepared. This usually takes less than a minute.'
          : 'Checking your report…'}
      </p>
    </AuthLayout>
  );
}
