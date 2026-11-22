/*
  "Behoud van aantal" (kleuterBehoud) — port of iOS CompareView(mode: .conservation).
  Two groups laid out differently (different dot sizes): "Evenveel?" → Ja / Nee.
  The game itself lives in ./kleuter/CompareGame.tsx (shared with kleuterBegrippen).
*/
import { CompareGame } from './kleuter/CompareGame';

export default function KleuterBehoud() {
  return <CompareGame mode="conservation" />;
}
