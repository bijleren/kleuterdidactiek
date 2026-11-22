/*
  "Keer nemen" — port of iOS KeerNemenView/ViewModel.
  A basket and a supply of blocks (always more than asked, within the
  niveau). The instruction is "Neem 4 blokjes" or "Neem 3 keer 2 blokjes"
  (read aloud every round). The child drags blocks into the basket (and back);
  solved the moment the basket holds exactly the asked amount → the number
  is spoken, next round after 1.2 s. Analytics prefix: keernemen.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ShoppingBasket } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useExerciseTracker, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { randInt } from '../lib/dutch';
import { t } from '../strings';
import { GoldToken, SkipButton, DragGhost } from './geld/common';
import { useAfterCorrect } from './geld/flow';
import { useDragDrop } from './geld/drag';

type Loc = 'supply' | 'basket';
interface Block { id: string; loc: Loc }

const BLOCK = 52;

export default function KeerNemen() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useExerciseTracker('keernemen');
  const cap = settings.maxNumber;
  const [target, setTarget] = useState(0);
  const [instruction, setInstruction] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [solved, setSolved] = useState(false);
  const [round, setRound] = useState(0);
  const roundRef = useRef(0);

  const next = useCallback(() => {
    // The supply (target + extras) must stay within the niveau.
    const combos: [number, number][] = [];
    for (let ti = 2; ti <= 3; ti++) for (let p = 2; p <= 4; p++) if (ti * p < cap) combos.push([ti, p]);
    let tgt: number, text: string;
    if (combos.length && Math.random() < 0.5) {
      const [times, per] = combos[Math.floor(Math.random() * combos.length)];
      tgt = times * per;
      text = t('keerNemen.prompt.keer', times, per);
    } else {
      tgt = randInt(3, Math.max(3, Math.min(8, cap - 1)));
      text = t('keerNemen.prompt.simple', tgt);
    }
    const supply = Math.min(tgt + randInt(2, 4), cap);
    const r = roundRef.current + 1;
    setTarget(tgt);
    setInstruction(text);
    setBlocks(Array.from({ length: supply }, (_, i) => ({ id: `${r}-${i}`, loc: 'supply' })));
    setSolved(false);
    roundRef.current = r;
    setRound(r);
  }, [cap]);

  useEffect(() => { next(); }, [next]);

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    void voice.playInstruction(instruction, settings.spokenInstructions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const afterCorrect = useAfterCorrect(roundRef, next);

  const move = (id: string, loc: Loc) => {
    if (solved) return;
    const b = blocks.find((x) => x.id === id);
    if (!b || b.loc === loc) return;
    const nextBlocks = blocks.map((x) => (x.id === id ? { ...x, loc } : x));
    setBlocks(nextBlocks);
    if (nextBlocks.filter((x) => x.loc === 'basket').length === target) {
      setSolved(true);
      const n = target;
      void afterCorrect(roundRef.current, () => voice.playNumber(n), () => tracker.markCorrect(), 1200);
    }
  };

  const dd = useDragDrop<Loc>({ enabled: !solved, onDrop: move });
  const basketCount = blocks.filter((x) => x.loc === 'basket').length;
  const list = (loc: Loc) => blocks.filter((x) => x.loc === loc).map((x) => (
    <div key={x.id} {...dd.bind(x.id)}>
      <GoldToken size={BLOCK} square />
    </div>
  ));
  const overBasket = dd.drag?.over === 'basket';
  const overSupply = dd.drag?.over === 'supply';

  return (
    <ExerciseShell
      mode="keerNemen"
      correct={tracker.correct}
      onHint={() => !solved && void voice.playInstruction(instruction, true)}
      hintLabel="Beluister de opdracht"
    >
      <div className="w-full max-w-5xl flex flex-col gap-3">
        <p className="font-baloo font-extrabold text-2xl sm:text-3xl text-center" style={{ color: C.text }}>
          {instruction}
        </p>
        <div
          ref={dd.zoneRef('basket')}
          className="rounded-[1.25rem] p-3 flex flex-col items-center gap-2 h-[min(44vh,380px)] transition"
          style={{
            background: solved || overBasket ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
            border: `${solved ? 3 : 1.5}px solid ${solved ? C.success : overBasket ? C.gold : C.gold + '59'}`,
          }}
        >
          <div className="flex items-center gap-2" style={{ color: solved ? C.success : C.gold }}>
            <ShoppingBasket size={22} strokeWidth={2.5} />
            <span className="font-baloo font-extrabold text-2xl">{basketCount}</span>
          </div>
          <div className="flex flex-wrap justify-center content-start gap-2 p-2 w-full">{list('basket')}</div>
        </div>
        <div
          ref={dd.zoneRef('supply')}
          className="rounded-2xl p-2 flex flex-col items-center gap-1.5 transition"
          style={{
            background: overSupply ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
            border: `1.5px solid ${overSupply ? C.gold : C.gold + '40'}`,
          }}
        >
          <div className="text-sm font-semibold opacity-55">{t('keerNemen.supply')}</div>
          <div className="flex flex-wrap justify-center gap-2 p-1.5 w-full" style={{ minHeight: BLOCK + 12 }}>
            {list('supply')}
          </div>
        </div>
        <div className="flex justify-end">
          <SkipButton onClick={next} />
        </div>
      </div>
      <DragGhost drag={dd.drag}><GoldToken size={BLOCK} square /></DragGhost>
    </ExerciseShell>
  );
}
