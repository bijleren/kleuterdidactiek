/*
  "Speelkaarten" — port of iOS PlayingCardView/ViewModel.
  A number playing card (rank 1–10, capped at the niveau) is drawn with its
  pips but no digit; the child counts the symbols and answers how many there
  are by microphone and/or keypad (settings.playingCard). Analytics prefix:
  playingcard. The iOS camera/draw inputs are not ported (web: mic + keypad).
*/
import { CountAnswerExercise } from './tellen2/CountAnswerExercise';
import { PlayingCardFace } from './tellen2/faces';
import { SUIT_GLYPH, randomSuit } from './tellen2/logic';
import type { Suit } from './tellen2/logic';

const label = (rank: number, suit: Suit) => `${rank} ${SUIT_GLYPH[suit]}`;
const face = (rank: number, suit: Suit) => (
  <PlayingCardFace rank={rank} suit={suit} className="h-[min(46vh,370px)] w-auto max-w-full" />
);

export default function PlayingCard() {
  return (
    <CountAnswerExercise<Suit>
      mode="playingCard"
      prefix="playingcard"
      maxValue={10}
      promptKey="playingCard.prompt"
      maxTyped={2}
      makeExtra={randomSuit}
      label={label}
      renderFace={face}
    />
  );
}
