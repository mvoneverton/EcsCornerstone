import { useState } from 'react';
import { pcaGroups } from '../lib/pcaWords';
import { wsaQuestions } from '../lib/wsaQuestions';
import { submitAssessment, type PCAResponseData, type WSAResponseData, type SubmitResult } from '../lib/api';

interface Props {
  token:        string;
  pcaResponses: PCAResponseData[];
  wsaResponses: WSAResponseData[];
  onComplete:   (result: SubmitResult) => void;
}

const SCALE_LABELS: Record<number, string> = {
  1: 'Rarely', 2: 'Sometimes', 3: 'Often', 4: 'Usually', 5: 'Almost Always',
};

function getWordText(groupId: number, wordId: number): string {
  const group = pcaGroups.find((g) => g.groupId === groupId);
  return group?.words.find((w) => w.wordId === wordId)?.text ?? `Word ${wordId}`;
}

export default function ReviewStep({ token, pcaResponses, wsaResponses, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitAssessment(token);
      onComplete(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-navy uppercase tracking-widest">
            Review &amp; Submit
          </span>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
            Almost done!
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-navy mb-1">Review your answers</h2>
          <p className="text-slate-500 text-sm">
            Take a moment to confirm everything looks right before submitting.
          </p>
        </div>

        {/* PCA summary */}
        <section>
          <h3 className="font-semibold text-navy text-base mb-3">
            Part 1 — Word Selection
            <span className="ml-2 text-xs text-slate-400 font-normal">
              ({pcaResponses.length} / 24 groups)
            </span>
          </h3>
          <div className="space-y-2">
            {pcaResponses.map((r) => (
              <div
                key={r.questionNumber}
                className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-4 text-sm"
              >
                <span className="text-slate-400 w-8 shrink-0 text-xs">G{r.questionNumber}</span>
                <div className="flex-1 flex gap-4">
                  <span className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-navy shrink-0" />
                    <span className="text-slate-700">{getWordText(r.questionNumber, r.responseMost)}</span>
                  </span>
                  <span className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <span className="text-slate-500">{getWordText(r.questionNumber, r.responseLeast)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WSA summary */}
        <section>
          <h3 className="font-semibold text-navy text-base mb-3">
            Part 2 — Relationship Styles
            <span className="ml-2 text-xs text-slate-400 font-normal">
              ({wsaResponses.length} / 32 questions)
            </span>
          </h3>
          <div className="space-y-2">
            {wsaResponses.map((r) => {
              const q = wsaQuestions.find((q) => q.id === r.questionNumber);
              return (
                <div
                  key={r.questionNumber}
                  className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-start gap-3 text-sm"
                >
                  <span className="text-slate-400 w-6 shrink-0 text-xs pt-0.5">{r.questionNumber}.</span>
                  <span className="flex-1 text-slate-700 leading-snug">{q?.text}</span>
                  <span className="shrink-0 text-xs font-semibold text-navy bg-navy/10 rounded px-2 py-0.5">
                    {r.responseValue} — {SCALE_LABELS[r.responseValue]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="pt-2 pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-colors min-h-[48px]
                        ${submitting
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-navy text-white hover:bg-navy/90 shadow-md'}`}
          >
            {submitting ? 'Submitting…' : 'Submit Assessment'}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            Once submitted, your results will be emailed to you immediately.
          </p>
        </div>
      </main>
    </div>
  );
}
