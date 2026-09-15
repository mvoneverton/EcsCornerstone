import { useState } from 'react';
import { wsaQuestions } from '../lib/wsaQuestions';
import { saveResponses, type WSAResponseData } from '../lib/api';

interface Props {
  token:            string;
  initialResponses: WSAResponseData[] | null;
  onComplete:       (responses: WSAResponseData[]) => void;
}

const SCALE_LABELS: Record<number, string> = {
  1: 'Rarely',
  2: 'Sometimes',
  3: 'Often',
  4: 'Usually',
  5: 'Almost Always',
};

export default function WSAAssessment({ token, initialResponses, onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    if (initialResponses) {
      for (const r of initialResponses) init[r.questionNumber] = r.responseValue;
    }
    return init;
  });
  const [saving, setSaving] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered   = answeredCount === wsaQuestions.length;
  const progressPct   = Math.round((answeredCount / wsaQuestions.length) * 100);

  function handleSelect(questionId: number, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!allAnswered) return;

    const responses: WSAResponseData[] = wsaQuestions.map((q) => ({
      questionNumber: q.id,
      responseValue:  answers[q.id]!,
    }));

    setSaving(true);
    try {
      await saveResponses(token, 'wsa', responses, false);
      onComplete(responses);
    } catch (err) {
      console.error('[pf] wsa save failed:', err);
      // Still proceed — submit handler will re-read from DB
      onComplete(responses);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy uppercase tracking-widest">
              Relationship Styles
            </span>
            <span className="text-xs text-slate-500">
              {answeredCount} of {wsaQuestions.length}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-navy h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-navy mb-1">Part 2 of 2</h2>
          <p className="text-slate-500 text-sm">
            Rate how often each statement describes you using the scale below.
          </p>
        </div>

        {/* Scale legend */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Scale</p>
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            {[1, 2, 3, 4, 5].map((v) => (
              <div key={v} className="text-center">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center
                                font-bold text-navy mx-auto mb-0.5">
                  {v}
                </div>
                <span className="hidden sm:block">{SCALE_LABELS[v]}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1 sm:hidden">
            <span>{SCALE_LABELS[1]}</span>
            <span>{SCALE_LABELS[5]}</span>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {wsaQuestions.map((q) => {
            const selected = answers[q.id];
            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <p className="text-sm text-slate-700 font-medium mb-3 leading-snug">
                  <span className="text-slate-400 mr-1">{q.id}.</span>
                  {q.text}
                </p>
                <div className="flex gap-2 justify-between">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => handleSelect(q.id, v)}
                      title={SCALE_LABELS[v]}
                      className={`flex-1 h-11 rounded-lg text-sm font-bold transition-colors min-h-[44px]
                                  ${selected === v
                                    ? 'bg-navy text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-navy/10 hover:text-navy'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom submit */}
        <div className="pt-4 pb-8">
          {!allAnswered && (
            <p className="text-center text-xs text-amber-600 font-medium mb-3">
              {wsaQuestions.length - answeredCount} question
              {wsaQuestions.length - answeredCount !== 1 ? 's' : ''} remaining
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || saving}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-colors min-h-[48px]
                        ${allAnswered && !saving
                          ? 'bg-navy text-white hover:bg-navy/90 shadow-md'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {saving ? 'Saving…' : 'Review &amp; Submit'}
          </button>
        </div>
      </main>
    </div>
  );
}
