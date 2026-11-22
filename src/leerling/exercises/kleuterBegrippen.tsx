/*
  "Meer of minder" (kleuterBegrippen) — port of iOS CompareView(mode: .compare).
  Two dot groups; "Welke groep heeft meer/minder?" → tap the right group.
  The game itself lives in ./kleuter/CompareGame.tsx (shared with kleuterBehoud).
*/
import { CompareGame } from './kleuter/CompareGame';

export default function KleuterBegrippen() {
  return <CompareGame mode="compare" />;
}
