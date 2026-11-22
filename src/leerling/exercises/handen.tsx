/*
  "Handen" — port of iOS HandenView/ViewModel.
  A number 1–10 (capped at the niveau) is shown with hand photos (one hand
  for 1–5; a full hand plus a mirrored hand for 6–10); the child counts the
  fingers and answers by microphone and/or keypad (settings.handen).
  Analytics prefix: handen. The iOS camera/draw inputs are not ported.
*/
import { CountAnswerExercise } from './tellen2/CountAnswerExercise';
import { HandsFace } from './tellen2/faces';

const noExtra = () => null;
const label = (v: number) => String(v);
const face = (v: number) => <HandsFace value={v} className="h-[min(38vh,280px)] w-[min(100%,36rem)]" />;

export default function Handen() {
  return (
    <CountAnswerExercise<null>
      mode="handen"
      prefix="handen"
      maxValue={10}
      promptKey="handen.prompt"
      maxTyped={2}
      makeExtra={noExtra}
      label={label}
      renderFace={face}
    />
  );
}
