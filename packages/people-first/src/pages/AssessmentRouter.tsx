import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadInvitation, type InvitationData, type PCAResponseData, type WSAResponseData, type SubmitResult, ApiError } from '../lib/api';
import WelcomePage     from './WelcomePage';
import PCAAssessment   from './PCAAssessment';
import WSAAssessment   from './WSAAssessment';
import ReviewStep      from './ReviewStep';

type Step = 'loading' | 'welcome' | 'pca' | 'wsa' | 'review';

export default function AssessmentRouter() {
  const { token }    = useParams<{ token: string }>();
  const navigate     = useNavigate();

  const [step, setStep]               = useState<Step>('loading');
  const [invitation, setInvitation]   = useState<InvitationData | null>(null);
  const [pcaResponses, setPCAResponses] = useState<PCAResponseData[]>([]);
  const [wsaResponses, setWSAResponses] = useState<WSAResponseData[]>([]);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/invalid', { replace: true });
      return;
    }

    loadInvitation(token)
      .then((inv) => {
        setInvitation(inv);

        // Resume from saved state
        if (inv.existingResponses.pca) {
          setPCAResponses(inv.existingResponses.pca as PCAResponseData[]);
        }
        if (inv.existingResponses.wsa) {
          setWSAResponses(inv.existingResponses.wsa as WSAResponseData[]);
        }

        // Determine starting step
        const hasPCA = inv.existingResponses.pca && inv.existingResponses.pca.length === 24;
        const hasWSA = inv.existingResponses.wsa && inv.existingResponses.wsa.length === 32;

        if (hasPCA && hasWSA) {
          setStep('review');
        } else if (hasPCA) {
          setStep('wsa');
        } else if (inv.status === 'in_progress') {
          setStep('pca');
        } else {
          setStep('welcome');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            navigate('/invalid', { replace: true });
          } else if (err.status === 410) {
            navigate('/completed', { replace: true });
          } else {
            setError('Unable to load your invitation. Please try again.');
            setStep('loading');
          }
        } else {
          setError('Unable to load your invitation. Please try again.');
          setStep('loading');
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handlePCAComplete(responses: PCAResponseData[]) {
    setPCAResponses(responses);
    setStep('wsa');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleWSAComplete(responses: WSAResponseData[]) {
    setWSAResponses(responses);
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmitComplete(result: SubmitResult) {
    navigate('/done', { state: result, replace: true });
  }

  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        {error
          ? (
            <div className="text-center px-6 max-w-md">
              <p className="text-slate-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 rounded-lg bg-navy text-white text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )
          : (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Loading your invitation…</p>
            </div>
          )}
      </div>
    );
  }

  if (!invitation) return null;

  if (step === 'welcome') {
    return (
      <WelcomePage
        invitation={invitation}
        onBegin={() => setStep('pca')}
      />
    );
  }

  if (step === 'pca') {
    return (
      <PCAAssessment
        token={token!}
        initialResponses={invitation.existingResponses.pca as PCAResponseData[] | null}
        onComplete={handlePCAComplete}
      />
    );
  }

  if (step === 'wsa') {
    return (
      <WSAAssessment
        token={token!}
        initialResponses={invitation.existingResponses.wsa as WSAResponseData[] | null}
        onComplete={handleWSAComplete}
      />
    );
  }

  return (
    <ReviewStep
      token={token!}
      pcaResponses={pcaResponses}
      wsaResponses={wsaResponses}
      onComplete={handleSubmitComplete}
    />
  );
}
