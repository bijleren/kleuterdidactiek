/*
  "Woordenschat" — port of iOS WoordenschatView/ViewModel.
  A live word wall: the recogniser listens continuously (onText, never
  "matches") and every kleuter vocabulary word (taal/woordenschatWords.ts)
  lights up as a chip the moment it is heard. One chip per word, newest first
  (gold), "×n" badge when said again; max 48 chips; "Wissen" clears the wall.
  No scoring — a tool for the coach while talking with the child (iOS only
  logs woordenschat_word events, no _shown/_correct, so no progress here).
*/
import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { C, ExerciseShell, MicPanel } from '../ui';
import { useListen, useMic, useSpeechState, useStopOnUnmount } from '../hooks';
import { fold, tokens } from '../lib/dutch';
import { t } from '../strings';
import { PHRASES, SINGLES, displayWord } from './taal/woordenschatWords';

interface RecognizedWord { display: string; count: number }
const MAX_SHOWN = 48;

export default function Woordenschat() {
  useStopOnUnmount();
  const mic = useMic();
  const st = useSpeechState();
  const [recognized, setRecognized] = useState<RecognizedWord[]>([]);
  const [latest, setLatest] = useState<string | null>(null);
  const matchedThisUtterance = useRef(new Set<string>());
  const prevTranscript = useRef('');

  // The recogniser clears its window after a pause → a new utterance.
  useEffect(() => {
    if (!st.transcript) {
      matchedThisUtterance.current = new Set();
      prevTranscript.current = '';
    }
  }, [st.transcript]);

  const scan = (text: string) => {
    const folded = fold(text);
    // Reset the per-utterance memory when the transcript restarts / rewrites.
    if (folded.length < prevTranscript.current.length || !folded.startsWith(prevTranscript.current)) {
      matchedThisUtterance.current = new Set();
    }
    prevTranscript.current = folded;

    const ordered: string[] = [];
    for (const ph of PHRASES) if (folded.includes(ph)) ordered.push(ph);
    for (const tk of tokens(folded)) if (SINGLES.has(tk)) ordered.push(tk);

    const fresh = ordered.filter((w) => {
      if (matchedThisUtterance.current.has(w)) return false;
      matchedThisUtterance.current.add(w);
      return true;
    });
    if (!fresh.length) return;

    setRecognized((prev) => {
      let list = prev;
      for (const w of fresh) {
        const display = displayWord(w);
        // One chip per word; saying it again bumps the counter and moves it to the front.
        const idx = list.findIndex((x) => x.display === display);
        if (idx >= 0) {
          const item = { ...list[idx], count: list[idx].count + 1 };
          list = [item, ...list.slice(0, idx), ...list.slice(idx + 1)];
        } else {
          list = [{ display, count: 1 }, ...list];
        }
      }
      return list.slice(0, MAX_SHOWN);
    });
    setLatest(displayWord(fresh[fresh.length - 1]));
  };

  useListen(mic.ready, 'woordenschat', () => ({
    stabilityMs: 0,
    onText: (text) => scan(text),
  }));

  const clear = () => {
    setRecognized([]);
    setLatest(null);
    matchedThisUtterance.current = new Set();
    prevTranscript.current = '';
  };

  return (
    <ExerciseShell mode="woordenschat" hideNiveau footer={<MicPanel hint={t('woordenschat.listening')} />}>
      <div className="w-full max-w-5xl flex flex-col gap-4 h-[62vh] min-h-[300px]">
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-sm px-5 py-3 border border-[#946B29]/15">
          <span
            key={latest ?? '-'}
            className="flex-1 min-w-0 truncate font-baloo font-bold kd-pop"
            style={latest
              ? { color: C.gold, fontSize: '2rem', lineHeight: 1.2 }
              : { color: C.text + '80', fontSize: '1.25rem' }}
          >
            {latest ?? t('woordenschat.listening')}
          </span>
          {recognized.length > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-baloo font-bold bg-white border border-[#946B29]/30"
              style={{ color: C.gold }}
            >
              <Trash2 size={18} /> {t('woordenschat.clear')}
            </button>
          )}
        </div>

        {recognized.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-lg px-6" style={{ color: C.text + '80' }}>
            {t('woordenschat.hint')}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pt-3 pr-2">
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {recognized.map((w, i) => {
                const newest = i === 0;
                return (
                  <div
                    key={w.display}
                    className="relative rounded-2xl px-3 py-3 text-center font-baloo font-bold border border-[#946B29]/25 transition-all"
                    style={newest
                      ? { background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})`, color: 'white', fontSize: '1.25rem' }
                      : { background: 'rgba(255,255,255,.8)', color: C.text, fontSize: '1.06rem' }}
                  >
                    <span className="block truncate">{w.display}</span>
                    {w.count > 1 && (
                      <span
                        className="absolute -top-2 -right-1.5 px-2 py-0.5 rounded-full text-xs text-white"
                        style={{ background: C.success }}
                      >
                        ×{w.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ExerciseShell>
  );
}
