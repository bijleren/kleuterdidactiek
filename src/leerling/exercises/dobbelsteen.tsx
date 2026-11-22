/*
  "Dobbelsteen" — port of iOS DobbelsteenView/ViewModel.
  A die face (1–6, capped at the niveau) is shown; the child counts the pips
  and answers by microphone and/or keypad (settings.dobbelsteen). Analytics
  prefix: dobbelsteen. The iOS camera/draw inputs are not ported.
*/
import { CountAnswerExercise } from './tellen2/CountAnswerExercise';
import { DiceFace } from './tellen2/faces';

const noExtra = () => null;
const label = (v: number) => String(v);
const face = (v: number) => <DiceFace value={v} className="h-[min(40vh,280px)] w-auto max-w-full" />;

export default function Dobbelsteen() {
  return (
    <CountAnswerExercise<null>
      mode="dobbelsteen"
      prefix="dobbelsteen"
      maxValue={6}
      promptKey="dobbelsteen.prompt"
      maxTyped={1}
      makeExtra={noExtra}
      label={label}
      renderFace={face}
    />
  );
}
