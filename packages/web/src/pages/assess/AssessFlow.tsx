import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  PCA_WORDS, pcaGroupWordIds,
  WSA_JA_QUESTIONS, WSA_JA_SCALE_LABELS,
  wsaJaPageQuestions, WSA_JA_PAGE_COUNT, PCA_PAGE_COUNT,
} from '../../lib/assessmentContent';
import api from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssessmentData {
  invitationId:   string;
  assessmentType: 'pca' | 'wsa' | 'ja';
  expiresAt:      string;
  companyName:    string;
  respondent:     { firstName: string; lastName: string };
  position:       { id: string; title: string } | null;
  totalQuestions: number;
  answeredCount:  number;
  responses: Array<{
    questionNumber: number;
    responseMost?:  number;
    responseLeast?: number;
    responseValue?: number;
  }>;
}

interface ScoredPerspective {
  perspective:      string;
  aPercentile:      number;
  rPercentile:      number;
  aScore800:        number;
  rScore800:        number;
  primaryProfile:   string;
  secondaryProfile: string | null;
}

interface SubmitResult {
  invitationId:   string;
  assessmentType: string;
  isValid:        boolean;
  validityFlags:  string[];
  results:        ScoredPerspective[];
}

type FlowStep = 'landing' | 'instructions' | 'questions' | 'review' | 'complete';

// ── Shell layout ──────────────────────────────────────────────────────────────

function AssessShell({
  companyName,
  assessmentType,
  step,
  currentPage,
  totalPages,
  children,
}: {
  companyName:    string;
  assessmentType: string;
  step:           FlowStep;
  currentPage:    number;
  totalPages:     number;
  children:       React.ReactNode;
}) {
  const typeLabel =
    assessmentType === 'pca' ? 'Personal Communication Assessment' :
    assessmentType === 'wsa' ? 'Work Style Assessment' :
    'Job Assessment';

  const progress =
    step === 'landing'      ? 0 :
    step === 'instructions' ? 5 :
    step === 'questions'    ? Math.round((currentPage / totalPages) * 85) + 5 :
    step === 'review'       ? 95 :
    100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy border-b border-navy-600 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-white">ECS</span>
            <span className="text-base font-light text-navy-200">Cornerstone</span>
          </div>
          <div className="text-xs text-navy-300">{companyName} · {typeLabel}</div>
        </div>
        {/* Progress bar */}
        {step !== 'complete' && (
          <div className="h-1 bg-navy-600">
            <div
              className="h-full bg-accent-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}

// ── Landing step ──────────────────────────────────────────────────────────────

function StepLanding({
  data,
  onStart,
}: {
  data:    AssessmentData;
  onStart: () => void;
}) {
  const typeLabel =
    data.assessmentType === 'pca' ? 'Personal Communication Assessment' :
    data.assessmentType === 'wsa' ? 'Work Style Assessment' :
    'Job Assessment';

  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-navy mb-6">
        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold text-navy mb-2">{typeLabel}</h1>
      <p className="text-gray-500 mb-1">Prepared for</p>
      <p className="text-xl font-medium text-gray-800 mb-1">
        {data.respondent.firstName} {data.respondent.lastName}
      </p>
      {data.position && (
        <p className="text-sm text-gray-500 mb-6">Position: {data.position.title}</p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 text-left mb-8 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Assessment</span>
          <span className="font-medium text-gray-800">{typeLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Questions</span>
          <span className="font-medium text-gray-800">{data.totalQuestions}</span>
        </div>
        {data.answeredCount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-accent">{data.answeredCount} of {data.totalQuestions} saved</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Expires</span>
          <span className="font-medium text-gray-800">
            {new Date(data.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-xl bg-navy px-8 py-3.5 text-base font-semibold text-white hover:bg-navy-600 transition-colors"
      >
        {data.answeredCount > 0 ? 'Continue assessment' : 'Begin assessment'}
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>

      <p className="mt-6 text-xs text-gray-400">
        There are no right or wrong answers. Choose what feels most natural to you.
      </p>
    </div>
  );
}

// ── Instructions step ─────────────────────────────────────────────────────────

function StepInstructions({
  assessmentType,
  onContinue,
}: {
  assessmentType: string;
  onContinue:     () => void;
}) {
  const isPca = assessmentType === 'pca';

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-navy mb-6">Instructions</h2>

      {isPca ? (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            This assessment presents <strong>24 groups of four words</strong>. For each group, you
            will select the word that is <em>most</em> like you and the word that is <em>least</em>
            like you in the way you typically communicate and relate to others.
          </p>
          <div className="rounded-lg bg-navy-50 border border-navy-100 p-4">
            <p className="font-semibold text-navy mb-2">How to respond:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Read all four words before selecting.</li>
              <li>Choose the word that is <strong>most</strong> like how you naturally behave.</li>
              <li>Choose the word that is <strong>least</strong> like how you naturally behave.</li>
              <li>You must select a different word for Most and Least.</li>
            </ul>
          </div>
          <p>
            There are no right or wrong answers. Answer based on your natural tendencies — not
            how you think you should behave or how you behave in a single specific situation.
          </p>
          <p>
            This assessment takes approximately <strong>10–15 minutes</strong>. Your answers are
            saved automatically as you go.
          </p>
        </div>
      ) : (
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            This assessment presents <strong>32 behavioral statements</strong>. For each statement,
            rate how accurately it describes you at work using a 5-point scale.
          </p>
          <div className="rounded-lg bg-navy-50 border border-navy-100 p-4">
            <p className="font-semibold text-navy mb-3">Rating scale:</p>
            <div className="space-y-1.5">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy text-white text-xs font-bold flex-shrink-0">{n}</span>
                  <span><strong>{WSA_JA_SCALE_LABELS[n]}</strong> — {
                    n === 1 ? 'This almost never describes me.' :
                    n === 2 ? 'This rarely describes me.' :
                    n === 3 ? 'This sometimes describes me.' :
                    n === 4 ? 'This often describes me.' :
                    'This almost always describes me.'
                  }</span>
                </div>
              ))}
            </div>
          </div>
          <p>
            Answer based on how you actually behave at work — not how you think you should behave.
            This assessment takes approximately <strong>8–12 minutes</strong>.
          </p>
        </div>
      )}

      <button
        onClick={onContinue}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-8 py-3.5 text-base font-semibold text-white hover:bg-navy-600 transition-colors"
      >
        Start questions
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );
}

// ── PCA question page ─────────────────────────────────────────────────────────

function PcaQuestionPage({
  group,
  savedMost,
  savedLeast,
  onAnswer,
  onNext,
  onPrev,
  isFirst,
  isSaving,
}: {
  group:    number;
  savedMost:  number | null;
  savedLeast: number | null;
  onAnswer:   (most: number, least: number) => void;
  onNext:     () => void;
  onPrev:     () => void;
  isFirst:    boolean;
  isSaving:   boolean;
}) {
  const [most,  setMost]  = useState<number | null>(savedMost);
  const [least, setLeast] = useState<number | null>(savedLeast);

  const wordIds = pcaGroupWordIds(group);
  const bothSelected = most !== null && least !== null;

  function selectMost(id: number) {
    const newMost = id;
    setMost(newMost);
    if (least !== null && newMost !== least) {
      onAnswer(newMost, least);
    } else if (least === id) {
      setLeast(null);
    }
  }

  function selectLeast(id: number) {
    const newLeast = id;
    setLeast(newLeast);
    if (most !== null && most !== newLeast) {
      onAnswer(most, newLeast);
    } else if (most === id) {
      setMost(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Group {group} of {PCA_PAGE_COUNT}
        </span>
        {isSaving && (
          <span className="text-xs text-accent animate-pulse">Saving…</span>
        )}
        {bothSelected && !isSaving && (
          <span className="text-xs text-green-600">✓ Saved</span>
        )}
      </div>

      <h2 className="text-lg font-semibold text-navy mb-6">
        Select the word that is <em>most</em> like you and the word that is <em>least</em> like you.
      </h2>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-3 px-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Most like me</span>
        <span className="w-48 text-center" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Least like me</span>
      </div>

      <div className="space-y-3">
        {wordIds.map((id) => {
          const isMost  = most  === id;
          const isLeast = least === id;

          return (
            <div
              key={id}
              className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border p-4 transition-colors ${
                isMost || isLeast
                  ? 'border-navy-200 bg-navy-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Most radio */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => selectMost(id)}
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isMost
                      ? 'border-navy bg-navy'
                      : 'border-gray-300 hover:border-navy'
                  }`}
                  aria-label={`Select "${PCA_WORDS[id]}" as most like me`}
                >
                  {isMost && <span className="h-2.5 w-2.5 rounded-full bg-white block" />}
                </button>
              </div>

              {/* Word */}
              <div className="w-48 text-center">
                <span className={`text-base font-medium ${isMost || isLeast ? 'text-navy' : 'text-gray-700'}`}>
                  {PCA_WORDS[id]}
                </span>
              </div>

              {/* Least radio */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => selectLeast(id)}
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isLeast
                      ? 'border-accent bg-accent'
                      : 'border-gray-300 hover:border-accent'
                  }`}
                  aria-label={`Select "${PCA_WORDS[id]}" as least like me`}
                >
                  {isLeast && <span className="h-2.5 w-2.5 rounded-full bg-white block" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-4">
        {!isFirst && (
          <button
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Previous
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!bothSelected}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {group === PCA_PAGE_COUNT ? 'Review answers' : 'Next group'}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── WSA/JA question page ──────────────────────────────────────────────────────

function WsaJaQuestionPage({
  page,
  savedValues,
  onAnswer,
  onNext,
  onPrev,
  isFirst,
  isSaving,
}: {
  page:        number;
  savedValues: Map<number, number>;
  onAnswer:    (qNum: number, value: number) => void;
  onNext:      () => void;
  onPrev:      () => void;
  isFirst:     boolean;
  isSaving:    boolean;
}) {
  const questionNums = wsaJaPageQuestions(page);
  const allAnswered  = questionNums.every((n) => savedValues.has(n));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Page {page} of {WSA_JA_PAGE_COUNT}
        </span>
        {isSaving && (
          <span className="text-xs text-accent animate-pulse">Saving…</span>
        )}
      </div>

      {/* Scale header */}
      <div className="hidden sm:grid grid-cols-[1fr_repeat(5,44px)] items-center gap-2 px-4 mb-2">
        <span />
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <div key={n} className="text-center">
            <div className="text-xs font-semibold text-gray-500">{n}</div>
            <div className="text-xs text-gray-400 whitespace-nowrap">{WSA_JA_SCALE_LABELS[n]}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {questionNums.map((qNum) => {
          const selected = savedValues.get(qNum) ?? null;

          return (
            <div
              key={qNum}
              className={`rounded-xl border p-4 transition-colors ${
                selected !== null ? 'border-navy-200 bg-navy-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="sm:grid sm:grid-cols-[1fr_repeat(5,44px)] sm:items-center sm:gap-2">
                <p className="text-sm text-gray-800 mb-3 sm:mb-0 pr-2">
                  <span className="font-medium text-gray-400 mr-2">{qNum}.</span>
                  {WSA_JA_QUESTIONS[qNum]}
                </p>

                {/* Mobile: horizontal scale */}
                <div className="sm:hidden flex justify-between gap-1">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onAnswer(qNum, n)}
                      className={`flex-1 flex flex-col items-center py-2 rounded-lg border text-xs transition-colors ${
                        selected === n
                          ? 'border-navy bg-navy text-white font-semibold'
                          : 'border-gray-200 text-gray-500 hover:border-navy hover:text-navy'
                      }`}
                    >
                      <span className="font-bold">{n}</span>
                      <span className="text-[10px] mt-0.5">{WSA_JA_SCALE_LABELS[n]}</span>
                    </button>
                  ))}
                </div>

                {/* Desktop: radio buttons */}
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <div key={n} className="hidden sm:flex justify-center">
                    <button
                      type="button"
                      onClick={() => onAnswer(qNum, n)}
                      className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selected === n
                          ? 'border-navy bg-navy'
                          : 'border-gray-300 hover:border-navy'
                      }`}
                      aria-label={`Rate "${WSA_JA_SCALE_LABELS[n]}" for question ${qNum}`}
                    >
                      {selected === n && <span className="h-2.5 w-2.5 rounded-full bg-white block" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-4">
        {!isFirst && (
          <button
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Previous
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!allAnswered}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {page === WSA_JA_PAGE_COUNT ? 'Review answers' : 'Next page'}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Review step ───────────────────────────────────────────────────────────────

function StepReview({
  assessmentType,
  pcaResponses,
  wsaJaResponses,
  onEdit,
  onSubmit,
  isSubmitting,
}: {
  assessmentType: string;
  pcaResponses:   Map<number, { most: number; least: number }>;
  wsaJaResponses: Map<number, number>;
  onEdit:         (page: number) => void;
  onSubmit:       () => void;
  isSubmitting:   boolean;
}) {
  const isPca        = assessmentType === 'pca';
  const totalAnswered = isPca ? pcaResponses.size : wsaJaResponses.size;
  const total         = isPca ? PCA_PAGE_COUNT : 32;
  const isComplete    = totalAnswered === total;

  return (
    <div>
      <h2 className="text-xl font-semibold text-navy mb-2">Review your answers</h2>
      <p className="text-sm text-gray-500 mb-6">
        {isComplete
          ? 'All questions answered. You can edit any answer before submitting.'
          : `${total - totalAnswered} question${total - totalAnswered !== 1 ? 's' : ''} remaining.`}
      </p>

      {isPca ? (
        <div className="space-y-2">
          {Array.from({ length: PCA_PAGE_COUNT }, (_, i) => i + 1).map((group) => {
            const ans = pcaResponses.get(group);
            return (
              <div
                key={group}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-400 w-16">Group {group}</span>
                  {ans ? (
                    <div className="text-sm text-gray-700 flex gap-6">
                      <span>Most: <strong className="text-navy">{PCA_WORDS[ans.most]}</strong></span>
                      <span>Least: <strong className="text-gray-500">{PCA_WORDS[ans.least]}</strong></span>
                    </div>
                  ) : (
                    <span className="text-sm text-amber-600">Not answered</span>
                  )}
                </div>
                <button
                  onClick={() => onEdit(group)}
                  className="text-xs text-accent hover:underline ml-4"
                >
                  Edit
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: 32 }, (_, i) => i + 1).map((qNum) => {
            const val = wsaJaResponses.get(qNum);
            return (
              <div
                key={qNum}
                className="flex items-start justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-400 w-6 flex-shrink-0 mt-0.5">{qNum}.</span>
                  <p className="text-sm text-gray-700 truncate flex-1">{WSA_JA_QUESTIONS[qNum]}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  {val !== undefined ? (
                    <span className="text-sm font-semibold text-navy">{val} — {WSA_JA_SCALE_LABELS[val]}</span>
                  ) : (
                    <span className="text-sm text-amber-600">Not answered</span>
                  )}
                  <button
                    onClick={() => onEdit(Math.ceil(qNum / 8))}
                    className="text-xs text-accent hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={onSubmit}
          disabled={!isComplete || isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-navy px-8 py-3.5 text-base font-semibold text-white hover:bg-navy-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Submitting…
            </>
          ) : (
            <>
              Submit assessment
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
        {!isComplete && (
          <p className="text-sm text-amber-600">Please answer all questions before submitting.</p>
        )}
      </div>
    </div>
  );
}

// ── Complete step ─────────────────────────────────────────────────────────────

const profileDescriptions: Record<string, string> = {
  Catalyst:   'High Assertiveness · High Responsiveness — Energetic, persuasive, and people-focused. Natural motivators who are simultaneously action-oriented and relationship-driven.',
  Vanguard:   'High Assertiveness · Low Responsiveness — Direct, decisive, and results-driven. Task-focused and time-conscious. Leads through clarity and outcomes.',
  Cultivator: 'Low Assertiveness · High Responsiveness — Warm, patient, and people-oriented. Builds trust steadily and creates harmony. Listens before acting.',
  Architect:  'Low Assertiveness · Low Responsiveness — Precise, systematic, and thorough. Detail-oriented and disciplined. Motivated by accuracy and defined standards.',
};

const profileColors: Record<string, string> = {
  Catalyst:   'bg-catalyst-bg border-catalyst-mid text-catalyst-text',
  Vanguard:   'bg-vanguard-bg border-vanguard-mid text-vanguard-text',
  Cultivator: 'bg-cultivator-bg border-cultivator-mid text-cultivator-text',
  Architect:  'bg-architect-bg border-architect-mid text-architect-text',
};

function StepComplete({
  result,
  token,
}: {
  result: SubmitResult;
  token:  string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Primary profile: work perspective for PCA, first result for WSA/JA
  const primary = result.results.find((r) => r.perspective === 'work') ?? result.results[0];

  async function downloadReport() {
    setDownloading(true);
    setDownloadError('');
    try {
      const { data } = await api.get<{ url: string }>(`/assess/${token}/report`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      setDownloadError('Your report is being generated — please try again in a moment.');
    } finally {
      setDownloading(false);
    }
  }

  const profile      = primary?.primaryProfile ?? 'Catalyst';
  const secondary    = primary?.secondaryProfile;
  const colorClasses = profileColors[profile] ?? profileColors['Architect'];

  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-50 border border-green-200 mb-6">
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold text-navy mb-2">Assessment complete</h1>
      <p className="text-gray-500 mb-8">Thank you for completing this assessment.</p>

      {primary && (
        <div className={`rounded-xl border-l-4 px-6 py-5 mb-8 text-left ${colorClasses}`}>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">
            Your Cornerstone profile
          </div>
          <div className="text-2xl font-semibold mb-0.5">
            {profile}
            {secondary && <span className="text-lg font-normal opacity-70"> / {secondary}</span>}
          </div>
          <p className="text-sm mt-2 opacity-80">
            {profileDescriptions[profile] ?? ''}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={downloadReport}
          disabled={downloading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-navy px-6 py-3.5 text-base font-semibold text-navy hover:bg-navy-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {downloading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading report…
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download my profile report (PDF)
            </>
          )}
        </button>

        {downloadError && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">{downloadError}</p>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Your facilitator will also receive a copy of your results. You can close this window.
      </p>
    </div>
  );
}

// ── Error states ──────────────────────────────────────────────────────────────

function AssessError({ code, message }: { code?: string; message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-50 border border-red-100 mb-5">
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          {code === 'EXPIRED'            ? 'Link expired'            :
           code === 'ALREADY_COMPLETED'  ? 'Already submitted'       :
           'Assessment not found'}
        </h1>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        {code === 'ALREADY_COMPLETED' && (
          <p className="text-sm text-gray-400">
            This assessment has already been submitted. Contact your facilitator if you have questions.
          </p>
        )}
        {code === 'EXPIRED' && (
          <p className="text-sm text-gray-400">
            This link has expired. Contact your facilitator to request a new invitation.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main flow component ───────────────────────────────────────────────────────

export default function AssessFlow() {
  const { token } = useParams<{ token: string }>();

  const [step, setStep]           = useState<FlowStep>('landing');
  const [currentPage, setCurrentPage] = useState(1);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  // Separate state for PCA (group → {most, least}) and WSA/JA (qNum → value)
  const [pcaResponses,   setPcaResponses]   = useState<Map<number, { most: number; least: number }>>(new Map());
  const [wsaJaResponses, setWsaJaResponses] = useState<Map<number, number>>(new Map());
  const [savingSet, setSavingSet]           = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery<AssessmentData>({
    queryKey: ['assess', token],
    queryFn: () => api.get<AssessmentData>(`/assess/${token}`).then((r) => r.data),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  // Restore saved responses on first load
  const [restored, setRestored] = useState(false);
  if (data && !restored) {
    setRestored(true);
    if (data.assessmentType === 'pca') {
      const map = new Map<number, { most: number; least: number }>();
      for (const r of data.responses) {
        if (r.responseMost !== undefined && r.responseLeast !== undefined) {
          map.set(r.questionNumber, { most: r.responseMost, least: r.responseLeast });
        }
      }
      setPcaResponses(map);
    } else {
      const map = new Map<number, number>();
      for (const r of data.responses) {
        if (r.responseValue !== undefined) {
          map.set(r.questionNumber, r.responseValue);
        }
      }
      setWsaJaResponses(map);
    }
  }

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/assess/${token}/response`, body).then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post<SubmitResult>(`/assess/${token}/submit`).then((r) => r.data),
    onSuccess: (res) => {
      setSubmitResult(res);
      setStep('complete');
    },
  });

  const handlePcaAnswer = useCallback((group: number, most: number, least: number) => {
    setPcaResponses((prev) => new Map(prev).set(group, { most, least }));
    const key = `pca-${group}`;
    setSavingSet((s) => new Set(s).add(key));
    saveMutation.mutate(
      { questionNumber: group, responseMost: most, responseLeast: least },
      { onSettled: () => setSavingSet((s) => { const n = new Set(s); n.delete(key); return n; }) }
    );
  }, [saveMutation]);

  const handleWsaJaAnswer = useCallback((qNum: number, value: number) => {
    setWsaJaResponses((prev) => new Map(prev).set(qNum, value));
    const key = `wsa-${qNum}`;
    setSavingSet((s) => new Set(s).add(key));
    saveMutation.mutate(
      { questionNumber: qNum, responseValue: value },
      { onSettled: () => setSavingSet((s) => { const n = new Set(s); n.delete(key); return n; }) }
    );
  }, [saveMutation]);

  // ── Error / loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-navy" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading your assessment…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const axiosErr = error as { response?: { data?: { error?: { message?: string; code?: string } } } } | null;
    return (
      <AssessError
        code={axiosErr?.response?.data?.error?.code}
        message={axiosErr?.response?.data?.error?.message ?? 'This assessment link is invalid.'}
      />
    );
  }

  if (step === 'complete' && submitResult) {
    return (
      <AssessShell
        companyName={data.companyName}
        assessmentType={data.assessmentType}
        step="complete"
        currentPage={1}
        totalPages={1}
      >
        <StepComplete result={submitResult} token={token ?? ''} />
      </AssessShell>
    );
  }

  const isPca      = data.assessmentType === 'pca';
  const totalPages = isPca ? PCA_PAGE_COUNT : WSA_JA_PAGE_COUNT;

  return (
    <AssessShell
      companyName={data.companyName}
      assessmentType={data.assessmentType}
      step={step}
      currentPage={currentPage}
      totalPages={totalPages}
    >
      {step === 'landing' && (
        <StepLanding
          data={data}
          onStart={() => setStep('instructions')}
        />
      )}

      {step === 'instructions' && (
        <StepInstructions
          assessmentType={data.assessmentType}
          onContinue={() => { setCurrentPage(1); setStep('questions'); }}
        />
      )}

      {step === 'questions' && isPca && (
        <PcaQuestionPage
          key={currentPage}
          group={currentPage}
          savedMost={pcaResponses.get(currentPage)?.most ?? null}
          savedLeast={pcaResponses.get(currentPage)?.least ?? null}
          onAnswer={(most, least) => handlePcaAnswer(currentPage, most, least)}
          onNext={() => {
            if (currentPage === PCA_PAGE_COUNT) setStep('review');
            else setCurrentPage((p) => p + 1);
          }}
          onPrev={() => {
            if (currentPage === 1) setStep('instructions');
            else setCurrentPage((p) => p - 1);
          }}
          isFirst={currentPage === 1}
          isSaving={savingSet.has(`pca-${currentPage}`)}
        />
      )}

      {step === 'questions' && !isPca && (
        <WsaJaQuestionPage
          key={currentPage}
          page={currentPage}
          savedValues={wsaJaResponses}
          onAnswer={handleWsaJaAnswer}
          onNext={() => {
            if (currentPage === WSA_JA_PAGE_COUNT) setStep('review');
            else setCurrentPage((p) => p + 1);
          }}
          onPrev={() => {
            if (currentPage === 1) setStep('instructions');
            else setCurrentPage((p) => p - 1);
          }}
          isFirst={currentPage === 1}
          isSaving={wsaJaPageQuestions(currentPage).some((n) => savingSet.has(`wsa-${n}`))}
        />
      )}

      {step === 'review' && (
        <StepReview
          assessmentType={data.assessmentType}
          pcaResponses={pcaResponses}
          wsaJaResponses={wsaJaResponses}
          onEdit={(page) => { setCurrentPage(page); setStep('questions'); }}
          onSubmit={() => submitMutation.mutate()}
          isSubmitting={submitMutation.isPending}
        />
      )}
    </AssessShell>
  );
}
