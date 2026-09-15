import { useState, useEffect, useCallback, useRef } from 'react';
import { buildShuffledGroups, type PCAWord } from '../lib/pcaWords';
import { saveResponses, type PCAResponseData } from '../lib/api';

interface Props {
  token:            string;
  initialResponses: PCAResponseData[] | null;
  onComplete:       (responses: PCAResponseData[]) => void;
}

type GroupSelections = Record<number, { most: number | null; least: number | null }>;

function responsesToSelections(responses: PCAResponseData[]): GroupSelections {
  const sel: GroupSelections = {};
  for (const r of responses) {
    sel[r.questionNumber] = { most: r.responseMost, least: r.responseLeast };
  }
  return sel;
}

function selectionsToResponses(sel: GroupSelections): PCAResponseData[] {
  const out: PCAResponseData[] = [];
  for (const [groupId, v] of Object.entries(sel)) {
    if (v.most !== null && v.least !== null) {
      out.push({ questionNumber: Number(groupId), responseMost: v.most, responseLeast: v.least });
    }
  }
  return out.sort((a, b) => a.questionNumber - b.questionNumber);
}

function countComplete(sel: GroupSelections): number {
  return Object.values(sel).filter((v) => v.most !== null && v.least !== null).length;
}

export default function PCAAssessment({ token, initialResponses, onComplete }: Props) {
  // Shuffle once per session and lock
  const shuffledRef = useRef<Record<number, PCAWord[]> | null>(null);
  if (!shuffledRef.current) {
    shuffledRef.current = buildShuffledGroups();
  }
  const shuffled = shuffledRef.current;

  const [currentGroup, setCurrentGroup] = useState<number>(1);
  const [selections, setSelections]     = useState<GroupSelections>(() =>
    initialResponses ? responsesToSelections(initialResponses) : {}
  );
  const [saving, setSaving] = useState(false);

  // On initial load, jump to first unanswered group
  useEffect(() => {
    if (initialResponses && initialResponses.length > 0) {
      for (let g = 1; g <= 24; g++) {
        const s = selections[g];
        if (!s || s.most === null || s.least === null) {
          setCurrentGroup(g);
          return;
        }
      }
      // All done — jump to last group
      setCurrentGroup(24);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(
    (wordId: number, type: 'most' | 'least') => {
      setSelections((prev) => {
        const existing = prev[currentGroup] ?? { most: null, least: null };
        let { most, least } = existing;

        if (type === 'most') {
          if (most === wordId) {
            most = null; // deselect
          } else {
            most = wordId;
            if (least === wordId) least = null; // can't be both
          }
        } else {
          if (least === wordId) {
            least = null;
          } else {
            least = wordId;
            if (most === wordId) most = null;
          }
        }
        return { ...prev, [currentGroup]: { most, least } };
      });
    },
    [currentGroup]
  );

  const currentSel   = selections[currentGroup] ?? { most: null, least: null };
  const groupDone    = currentSel.most !== null && currentSel.least !== null;
  const totalDone    = countComplete(selections);
  const progressPct  = Math.round((totalDone / 24) * 100);
  const words        = shuffled[currentGroup]!;

  const handleNext = useCallback(async () => {
    if (!groupDone) return;

    const responses = selectionsToResponses({ ...selections });
    // Save async; don't block UI
    setSaving(true);
    saveResponses(token, 'pca', responses, totalDone < 24)
      .catch((err: unknown) => console.error('[pf] pca save failed:', err))
      .finally(() => setSaving(false));

    if (currentGroup < 24) {
      setCurrentGroup((g) => g + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete(responses);
    }
  }, [groupDone, selections, totalDone, currentGroup, token, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentGroup > 1) {
      setCurrentGroup((g) => g - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentGroup]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Fixed header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-navy uppercase tracking-widest">
              Word Selection
            </span>
            <span className="text-xs text-slate-500">
              Group {currentGroup} of 24
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
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="max-w-lg w-full space-y-6">

          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold text-navy mb-1">
              Group {currentGroup}
            </h2>
            <p className="text-slate-500 text-sm">
              Select the word that is <span className="font-semibold text-navy">most</span> like you
              and the word that is <span className="font-semibold text-navy">least</span> like you.
            </p>
          </div>

          <div className="space-y-3">
            {words.map((word) => {
              const isMost  = currentSel.most  === word.wordId;
              const isLeast = currentSel.least === word.wordId;

              return (
                <div
                  key={word.wordId}
                  className={`bg-white rounded-xl border p-4 shadow-sm transition-colors
                              ${isMost ? 'border-navy' : isLeast ? 'border-red-300' : 'border-slate-200'}`}
                >
                  <p className={`font-semibold text-center text-base mb-3
                                  ${isMost ? 'text-navy' : isLeast ? 'text-red-700' : 'text-slate-800'}`}>
                    {word.text}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelect(word.wordId, 'most')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                                  ${isMost
                                    ? 'bg-navy text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-navy/10'}`}
                    >
                      Most like me
                    </button>
                    <button
                      onClick={() => handleSelect(word.wordId, 'least')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                                  ${isLeast
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-red-50'}`}
                    >
                      Least like me
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation hint */}
          {!groupDone && (currentSel.most !== null || currentSel.least !== null) && (
            <p className="text-center text-xs text-amber-600 font-medium">
              {currentSel.most === null
                ? 'Please also select the word that is most like you.'
                : 'Please also select the word that is least like you.'}
            </p>
          )}
        </div>
      </main>

      {/* Sticky nav */}
      <footer className="sticky bottom-0 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          {currentGroup > 1 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700
                         font-medium text-sm hover:bg-slate-50 min-h-[48px]"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!groupDone || saving}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors min-h-[48px]
                        ${groupDone && !saving
                          ? 'bg-navy text-white hover:bg-navy/90'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {saving
              ? 'Saving…'
              : currentGroup === 24
                ? 'Continue to Part 2'
                : 'Next Group'}
          </button>
        </div>
      </footer>
    </div>
  );
}
