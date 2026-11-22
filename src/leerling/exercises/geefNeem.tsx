/*
  "Geef en neem" — port of iOS GeefNeemView/ViewModel.
  NEEM: you start with some euros and drag the asked amount into "Weg".
  GEEF: drag the asked extra euros into "Jouw geld". The task is spoken
  ("geef 2 euro bij" / "neem 2 euro weg"). Once "Jouw geld" holds the new
  total, the child must SAY the total ("hoeveel heb je nu? zeg het totaal").
  Correct → "N euro" spoken, next round. Hint (only while saying) speaks the
  total. Analytics prefix: geefneem.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell, MicPanel, cx } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { randInt, spellInteger } from '../lib/dutch';
import { t } from '../strings';
import { CoinView, SkipButton, DragGhost } from './geld/common';
import { euroComps, playComponents, transcriptHasNumber, useAfterCorrect } from './geld/flow';
import { useDragDrop } from './geld/drag';

type Mode = 'geef' | 'neem';
type Loc = 'main' | 'side';
type Phase = 'acting' | 'saying' | 'correct';
interface Coin { id: string; loc: Loc }

const COIN = 54;

export default function GeefNeem() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const mic = useMic();
  const tracker = useExerciseTracker('geefneem');
  const cap = settings.maxNumber;
  const [mode, setMode] = useState<Mode>('neem');
  const [delta, setDelta] = useState(1);
  const [result, setResult] = useState(0);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [phase, setPhase] = useState<Phase>('acting');
  const [round, setRound] = useState(0);
  const roundRef = useRef(0);

  const startRound = useCallback(() => {
    let m: Mode, a: number, d: number, r: number, list: Coin[];
    const id = (i: number) => `${roundRef.current + 1}-${i}`;
    if (Math.random() < 0.5) {
      m = 'geef';
      a = randInt(1, Math.min(6, cap - 1));
      d = randInt(1, Math.min(4, cap - a));
      r = a + d;
      list = [
        ...Array.from({ length: a }, (_, i): Coin => ({ id: id(i), loc: 'main' })),
        ...Array.from({ length: d }, (_, i): Coin => ({ id: id(a + i), loc: 'side' })),
      ];
    } else {
      m = 'neem';
      a = randInt(3, Math.max(3, cap));
      d = randInt(1, Math.min(4, a - 1));
      r = a - d;
      list = Array.from({ length: a }, (_, i): Coin => ({ id: id(i), loc: 'main' }));
    }
    setMode(m);
    setDelta(d);
    setResult(r);
    setCoins(list);
    setPhase('acting');
    roundRef.current += 1;
    setRound(roundRef.current);
  }, [cap]);

  useEffect(() => { startRound(); }, [startRound]);

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    // "Geef 2 euro bij" / "Neem 2 euro weg" from clips.
    void playComponents([{ text: mode }, { number: delta }, { text: mode === 'geef' ? 'euro bij' : 'euro weg' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const mainCount = coins.filter((c) => c.loc === 'main').length;

  const move = (id: string, loc: Loc) => {
    if (phase !== 'acting') return;
    const idx = coins.findIndex((c) => c.id === id);
    if (idx < 0 || coins[idx].loc === loc) return;
    const nextCoins = coins.map((c) => (c.id === id ? { ...c, loc } : c));
    setCoins(nextCoins);
    if (nextCoins.filter((c) => c.loc === 'main').length === result) {
      setPhase('saying');
      void playComponents([{ text: 'hoeveel heb je nu zeg het totaal' }]);
    }
  };

  const dd = useDragDrop<Loc>({ enabled: phase === 'acting', onDrop: move });
  const afterCorrect = useAfterCorrect(roundRef, startRound);

  useListen(mic.ready && phase === 'saying', `geefneem-${round}`, () => ({
    stabilityMs: 0,
    near: spellInteger(result),
    match: (text, alts) => [text, ...alts].some((x) => transcriptHasNumber(x, result)),
    onMatch: () => {
      const r = result;
      setPhase('correct');
      void afterCorrect(roundRef.current, () => playComponents([euroComps(r)]), () => tracker.markCorrect(), 1100);
    },
  }));

  const hint = phase === 'saying' ? () => { void playComponents([euroComps(result)]); } : undefined;

  const instruction = phase === 'acting'
    ? t(mode === 'geef' ? 'geefNeem.givePrompt' : 'geefNeem.takePrompt', delta)
    : t('geefNeem.sayTotal');

  const container = (loc: Loc) => {
    const list = coins.filter((c) => c.loc === loc);
    const solved = loc === 'main' && phase === 'correct';
    const isAway = loc === 'side' && mode === 'neem';
    const over = dd.drag?.over === loc;
    const title = loc === 'main' ? t('geefNeem.mine') : t(mode === 'geef' ? 'geefNeem.extra' : 'geefNeem.away');
    return (
      <div
        ref={dd.zoneRef(loc)}
        className="flex-1 min-w-0 rounded-[1.25rem] p-3 flex flex-col items-center gap-2 transition"
        style={{
          background: isAway ? 'rgba(156,163,175,0.35)' : over ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
          border: `${solved ? 3 : 1.5}px solid ${solved ? C.success : over ? C.gold : C.gold + '4d'}`,
        }}
      >
        <div className="flex items-center gap-2 h-8">
          <span className="font-bold text-sm sm:text-base opacity-70">{title}</span>
          {loc === 'main' && (
            <span className="font-baloo font-extrabold text-2xl" style={{ color: solved ? C.success : C.gold }}>€{mainCount}</span>
          )}
        </div>
        <div className="flex flex-wrap justify-center content-start gap-2 p-2 w-full">
          {list.map((c) => (
            <div key={c.id} {...dd.bind(c.id)}>
              <CoinView value={1} size={COIN} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ExerciseShell
      mode="geefNeem"
      correct={tracker.correct}
      onHint={hint}
      hintLabel="Beluister het totaal"
      footer={phase === 'acting'
        ? (
          <p className="text-center opacity-55 h-[4.5rem] flex items-center justify-center">
            {t(mode === 'geef' ? 'geefNeem.giveHint' : 'geefNeem.takeHint')}
          </p>
        )
        : <MicPanel hint={t('geefNeem.sayHint')} />}
    >
      <div className="w-full max-w-5xl flex flex-col gap-4">
        <p
          className={cx('font-baloo font-extrabold text-2xl sm:text-3xl text-center')}
          style={{ color: phase === 'acting' ? C.text : C.gold }}
        >
          {instruction}
        </p>
        <div className="flex gap-3 h-[min(52vh,440px)]">
          {container('main')}
          {container('side')}
        </div>
        <div className="flex justify-end">
          <SkipButton onClick={startRound} />
        </div>
      </div>
      <DragGhost drag={dd.drag}><CoinView value={1} size={COIN} /></DragGhost>
    </ExerciseShell>
  );
}
