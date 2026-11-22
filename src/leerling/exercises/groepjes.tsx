/*
  "Groepjes" — port of iOS GroepjesView/ViewModel.
  A tray of blocks at the bottom and 2–4 empty groups above (groups × size
  stays within the niveau). The child drags the blocks so every group holds
  the same amount; blocks can go back to the tray. Solved when the tray is
  empty and all groups are equal; next round after 1.2 s. The task is spoken
  per round ("verdeel in" + N + "gelijke groepjes"). Analytics prefix: groepjes.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { C, ExerciseShell } from '../ui';
import { useExerciseTracker, useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { t } from '../strings';
import { GoldToken, SkipButton, DragGhost } from './geld/common';
import { playComponents, useAfterCorrect } from './geld/flow';
import { useDragDrop } from './geld/drag';

/** Zone id: group index 0…3, or -1 for the tray. */
const TRAY = -1;
interface Block { id: string; group: number }

const BLOCK = 48;

export default function Groepjes() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const tracker = useExerciseTracker('groepjes');
  const cap = settings.maxNumber;
  const [groupCount, setGroupCount] = useState(2);
  const [perGroup, setPerGroup] = useState(2);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [solved, setSolved] = useState(false);
  const [round, setRound] = useState(0);
  const roundRef = useRef(0);

  const next = useCallback(() => {
    const combos: [number, number][] = [];
    for (let g = 2; g <= 4; g++) for (let k = 2; k <= 5; k++) if (g * k <= cap) combos.push([g, k]);
    const [g, k] = combos.length ? combos[Math.floor(Math.random() * combos.length)] : [2, 2];
    const r = roundRef.current + 1;
    setGroupCount(g);
    setPerGroup(k);
    setBlocks(Array.from({ length: g * k }, (_, i) => ({ id: `${r}-${i}`, group: TRAY })));
    setSolved(false);
    roundRef.current = r;
    setRound(r);
  }, [cap]);

  useEffect(() => { next(); }, [next]);

  useEffect(() => {
    if (round === 0) return;
    tracker.shown();
    void playComponents([{ text: 'verdeel in' }, { number: groupCount }, { text: 'gelijke groepjes' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const afterCorrect = useAfterCorrect(roundRef, next);

  const move = (id: string, group: number) => {
    if (solved) return;
    const b = blocks.find((x) => x.id === id);
    if (!b || b.group === group) return;
    const nextBlocks = blocks.map((x) => (x.id === id ? { ...x, group } : x));
    setBlocks(nextBlocks);
    const trayEmpty = nextBlocks.every((x) => x.group !== TRAY);
    const equal = Array.from({ length: groupCount }, (_, g) => nextBlocks.filter((x) => x.group === g).length)
      .every((n) => n === perGroup);
    if (trayEmpty && equal) {
      setSolved(true);
      void afterCorrect(roundRef.current, null, () => tracker.markCorrect(), 1200);
    }
  };

  const dd = useDragDrop<number>({ enabled: !solved, onDrop: move });

  const blockList = (g: number) => blocks.filter((x) => x.group === g).map((x) => (
    <div key={x.id} {...dd.bind(x.id)}>
      <GoldToken size={BLOCK} square />
    </div>
  ));

  return (
    <ExerciseShell mode="groepjes" correct={tracker.correct}>
      <div className="w-full max-w-5xl flex flex-col gap-3">
        <p className="font-baloo font-extrabold text-2xl sm:text-3xl text-center" style={{ color: C.text }}>
          {t('groepjes.prompt', groupCount)}
        </p>
        <div className="flex gap-2.5 h-[min(44vh,380px)]">
          {Array.from({ length: groupCount }, (_, g) => {
            const over = dd.drag?.over === g;
            return (
              <div
                key={g}
                ref={dd.zoneRef(g)}
                className="flex-1 min-w-0 rounded-[1.1rem] p-2.5 flex flex-col items-center gap-2 transition"
                style={{
                  background: solved || over ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                  border: `${solved ? 3 : 1.5}px solid ${solved ? C.success : over ? C.gold : C.gold + '4d'}`,
                }}
              >
                <div className="font-baloo font-extrabold text-2xl" style={{ color: solved ? C.success : C.gold }}>
                  {blocks.filter((x) => x.group === g).length}
                </div>
                <div className="flex flex-wrap justify-center content-start gap-1.5 p-1.5 w-full">{blockList(g)}</div>
              </div>
            );
          })}
        </div>
        <div
          ref={dd.zoneRef(TRAY)}
          className="rounded-2xl p-2 flex flex-col items-center gap-1.5 transition"
          style={{
            background: dd.drag?.over === TRAY ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
            border: `1.5px solid ${dd.drag?.over === TRAY ? C.gold : C.gold + '40'}`,
          }}
        >
          <div className="text-sm font-semibold opacity-55">{t('groepjes.tray')}</div>
          <div className="flex flex-wrap justify-center gap-2 p-1.5 w-full" style={{ minHeight: BLOCK + 12 }}>
            {blockList(TRAY)}
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
