/*
  "Gelijk maken" — port of iOS GelijkMakenView/ViewModel.
  Two groups start with different amounts (even total, 2 × half within the
  niveau). The child drags tokens from one side to the other until both
  sides are equal; the middle shows > / < / =. Solved as soon as they match,
  next round after 1.1 s. Prompt spoken once per session.
  Analytics prefix: gelijk.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, BadgeCheck } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useExerciseTracker, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt } from '../lib/dutch';
import { t } from '../strings';
import { GoldToken, SkipButton, DragGhost } from './geld/common';
import { useAfterCorrect } from './geld/flow';
import { useDragDrop } from './geld/drag';

type Side = 'left' | 'right';
interface Token { id: string; side: Side }

const TOKEN = 52;

export default function GelijkMaken() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useExerciseTracker('gelijk');
  const cap = settings.maxNumber;
  const [tokens, setTokens] = useState<Token[]>([]);
  const [solved, setSolved] = useState(false);
  const [round, setRound] = useState(0);
  const roundRef = useRef(0);
  const prompted = useRef(false);

  const next = useCallback(() => {
    const maxHalf = Math.max(2, Math.floor(cap / 2));
    const half = randInt(2, Math.min(6, maxHalf));
    const total = half * 2;
    let left = randInt(1, total - 1);
    while (left === half) left = randInt(1, total - 1);
    const r = roundRef.current + 1;
    setTokens(Array.from({ length: total }, (_, i) => ({ id: `${r}-${i}`, side: i < left ? 'left' : 'right' })));
    setSolved(false);
    roundRef.current = r;
    setRound(r);
  }, [cap]);

  useEffect(() => { next(); }, [next]);

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    if (!prompted.current) {
      prompted.current = true;
      void voice.playInstruction(t('gelijkMaken.prompt'), settings.spokenInstructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const afterCorrect = useAfterCorrect(roundRef, next);

  const move = (id: string, side: Side) => {
    if (solved) return;
    const tok = tokens.find((x) => x.id === id);
    if (!tok || tok.side === side) return;
    const nextTokens = tokens.map((x) => (x.id === id ? { ...x, side } : x));
    setTokens(nextTokens);
    const l = nextTokens.filter((x) => x.side === 'left').length;
    if (l * 2 === nextTokens.length) {
      setSolved(true);
      void afterCorrect(roundRef.current, null, () => tracker.markCorrect(), 1100);
    }
  };

  const dd = useDragDrop<Side>({ enabled: !solved, onDrop: move });
  const leftCount = tokens.filter((x) => x.side === 'left').length;
  const rightCount = tokens.length - leftCount;
  const symbol = solved ? '=' : leftCount > rightCount ? '>' : leftCount < rightCount ? '<' : '=';

  const zone = (side: Side) => {
    const count = side === 'left' ? leftCount : rightCount;
    const over = dd.drag?.over === side;
    return (
      <div
        ref={dd.zoneRef(side)}
        className="flex-1 min-w-0 rounded-[1.25rem] p-3 flex flex-col items-center gap-3 transition"
        style={{
          background: solved || over ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)',
          border: `${solved ? 3 : 1.5}px solid ${solved ? C.success : over ? C.gold : C.gold + '4d'}`,
        }}
      >
        <div className="font-baloo font-extrabold text-5xl leading-none pt-1" style={{ color: solved ? C.success : C.gold }}>
          {count}
        </div>
        <div className="flex flex-wrap justify-center content-start gap-2 p-2 w-full">
          {tokens.filter((x) => x.side === side).map((x) => (
            <div key={x.id} {...dd.bind(x.id)}>
              <GoldToken size={TOKEN} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ExerciseShell mode="gelijkMaken" correct={tracker.correct}>
      <div className="w-full max-w-5xl flex flex-col gap-4">
        <p className="font-baloo font-extrabold text-2xl sm:text-3xl text-center" style={{ color: C.text }}>
          {t('gelijkMaken.prompt')}
        </p>
        <div className="flex gap-3 items-stretch h-[min(56vh,460px)]">
          {zone('left')}
          <div className="w-14 shrink-0 flex flex-col items-center justify-center gap-2">
            <span className="font-baloo font-extrabold text-5xl" style={{ color: solved ? C.success : 'rgba(31,41,55,0.6)' }}>
              {symbol}
            </span>
            {solved
              ? <BadgeCheck size={40} strokeWidth={2.5} style={{ color: C.success }} className="kd-pop" />
              : <ArrowLeftRight size={20} strokeWidth={2.5} style={{ color: C.gold + '99' }} />}
          </div>
          {zone('right')}
        </div>
        <div className="flex justify-end">
          <SkipButton onClick={next} />
        </div>
      </div>
      <DragGhost drag={dd.drag}><GoldToken size={TOKEN} /></DragGhost>
    </ExerciseShell>
  );
}
