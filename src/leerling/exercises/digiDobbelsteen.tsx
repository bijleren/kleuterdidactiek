/*
  Digitool "Dobbelstenen" — port of iOS Features/Digitool/DigiDobbelsteenView.swift.
  One or two dice; the highest face is 3, 6 (standard) or 10. Click / tap
  the dice (or press space) to roll them with a short shuffle. A tool, not
  a scored exercise.
*/
import { useEffect, useRef, useState } from 'react';
import { ExerciseShell } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { randInt } from '../lib/dutch';
import { t } from '../strings';
import { Card, PillGroup, ToolFrame, ToolHint, useElementSize } from './digitool/kit';
import { DiceFace } from './digitool/DiceFace';

export default function DigiDobbelsteen() {
  useStopOnUnmount();
  const [diceCount, setDiceCount] = useState<1 | 2>(1);
  const [maxFace, setMaxFace] = useState<3 | 6 | 10>(6);
  const [values, setValues] = useState([5, 3]);
  const [rolling, setRolling] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const panel = useElementSize(panelRef);
  const rollingRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const roll = () => {
    if (rollingRef.current) return;
    rollingRef.current = true;
    setRolling(true);
    // A short shuffle: flash a few intermediate faces, then settle.
    for (let k = 0; k <= 5; k++) {
      timers.current.push(setTimeout(() => {
        setValues([randInt(1, maxFace), randInt(1, maxFace)]);
        if (k === 5) { rollingRef.current = false; setRolling(false); }
      }, k * 70));
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); roll(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // iOS: 320 pt for one die, 250 pt for two (regular width); scale down to fit.
  const wanted = diceCount === 1 ? 320 : 250;
  const fit = diceCount === 1
    ? Math.min(panel.width - 48, panel.height - 48)
    : Math.min((panel.width - 48 - 28) / 2, panel.height - 48);
  const side = Math.max(90, Math.min(wanted, fit || wanted));

  return (
    <ExerciseShell mode="digiDobbelsteen" hideNiveau>
      <ToolFrame>
        <div className="flex flex-col items-center gap-2">
          <PillGroup
            options={[{ value: 1 as const, label: t('digiDobbelsteen.one') }, { value: 2 as const, label: t('digiDobbelsteen.two') }]}
            value={diceCount}
            onChange={setDiceCount}
          />
          <PillGroup
            options={([3, 6, 10] as const).map((m) => ({ value: m, label: t(`digiDobbelsteen.upto${m}`) }))}
            value={maxFace}
            onChange={(m) => { setMaxFace(m); setValues((v) => v.map((x) => Math.min(x, m))); }}
          />
        </div>
        <Card innerRef={panelRef} className="flex-1 min-h-0 flex items-center justify-center">
          <button
            onClick={roll}
            className="flex items-center justify-center gap-7 p-4 rounded-3xl outline-none"
            aria-label={t('digiDobbelsteen.hint')}
          >
            {Array.from({ length: diceCount }, (_, i) => (
              <span
                key={i}
                className="block"
                style={{
                  transform: `rotate(${rolling ? (i + 1) * 6 : 0}deg)`,
                  transition: 'transform 0.25s cubic-bezier(.34,1.8,.64,1)',
                }}
              >
                <DiceFace value={values[i]} size={side} />
              </span>
            ))}
          </button>
        </Card>
        <ToolHint k="digiDobbelsteen.hint" />
      </ToolFrame>
    </ExerciseShell>
  );
}
