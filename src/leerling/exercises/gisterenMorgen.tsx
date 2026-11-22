/*
  "Gisteren en morgen" — port of iOS GisterenMorgenView/ViewModel.
  Today's day is stated ("Vandaag is het dinsdag."), then we ask for
  yesterday or tomorrow; the child says the answer day. The situation is
  spoken from stitched clips (vandaag is het · <dag> · gisteren was het /
  morgen is het), like iOS. Correct → the day appears in green, next round
  after 1.2 s. Hint (lamp) says the answer day. Analytics prefix: gisterenmorgen.
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { C, ExerciseShell } from '../ui';
import { useExerciseTracker, useListen, useMic, useStopOnUnmount, useTimer } from '../hooks';
import { voice } from '../lib/audio';
import { tokenMatchesTarget, tokens, randInt } from '../lib/dutch';
import { t } from '../strings';
import { dayLabel, dayWord, nextDay, previousDay } from './taal/weekdays';
import type { WeekDay } from './taal/weekdays';
import { VoiceFooter } from './taal/VoiceFooter';

interface Round { today: WeekDay; askYesterday: boolean }
const answerOf = (r: Round) => (r.askYesterday ? previousDay(r.today) : nextDay(r.today));

/** Token match on the answer day (VoiceTarget.containsToken + recogniser target rules). */
function saysDay(text: string, day: WeekDay): boolean {
  const target = dayWord(day);
  return tokens(text).some((tok) => tokenMatchesTarget(tok, target));
}

export default function GisterenMorgen() {
  useStopOnUnmount();
  const mic = useMic();
  const tracker = useExerciseTracker('gisterenmorgen');
  const later = useTimer();
  const [round, setRound] = useState<Round | null>(null);
  const [solved, setSolved] = useState(false);
  const [n, setN] = useState(0);
  const lastToday = useRef<WeekDay | null>(null);

  const nextRound = useCallback(() => {
    let today = randInt(0, 6);
    if (lastToday.current === today) today = nextDay(today);
    lastToday.current = today;
    setRound({ today, askYesterday: Math.random() < 0.5 });
    setSolved(false);
    setN((x) => x + 1);
  }, []);

  useEffect(() => { nextRound(); }, [nextRound]);

  useEffect(() => {
    if (!round) return;
    tracker.shown();
    // The question itself is always spoken (iOS plays these clips regardless
    // of the "instructies voorlezen" setting; the speaker button still mutes).
    void voice.playParts([
      { text: 'vandaag is het' },
      { text: dayWord(round.today) },
      { text: round.askYesterday ? 'gisteren was het' : 'morgen is het' },
    ], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useListen(mic.ready && !!round && !solved, `gm-${n}`, () => ({
    stabilityMs: 0,
    near: round ? dayWord(answerOf(round)) : undefined,
    match: (text, alts) => !!round && [text, ...alts].some((x) => saysDay(x, answerOf(round))),
    onMatch: () => {
      if (!round) return;
      setSolved(true);
      tracker.markCorrect(dayLabel(answerOf(round)));
      later(async () => {
        await voice.waitUntilQuiet();
        nextRound();
      }, 1200);
    },
  }));

  const hint = () => {
    if (!round || solved) return;
    void voice.playInstruction(dayWord(answerOf(round)), true);
  };

  return (
    <ExerciseShell
      mode="gisterenMorgen"
      correct={tracker.correct}
      highlights={tracker.highlights}
      metrics={[{ label: 'Juist', value: tracker.correct }]}
      onHint={hint}
      hintLabel="Welke dag is het?"
      hideNiveau
      footer={<VoiceFooter hint={t('gisterenMorgen.listening')} onSkip={nextRound} />}
    >
      {round && (
        <div className="w-full max-w-3xl min-h-[50vh] bg-white rounded-[2rem] shadow-md p-6 sm:p-10 flex flex-col items-center justify-center gap-5 text-center">
          <p className="font-baloo font-bold text-3xl sm:text-4xl" style={{ color: C.text }}>
            {t('gisterenMorgen.today', dayLabel(round.today))}
          </p>
          <p className="font-baloo font-semibold text-2xl sm:text-3xl" style={{ color: C.gold }}>
            {t(round.askYesterday ? 'gisterenMorgen.askYesterday' : 'gisterenMorgen.askTomorrow')}
          </p>
          <p
            key={solved ? 'a' : 'q'}
            className="font-baloo font-bold text-6xl sm:text-7xl kd-pop"
            style={{ color: solved ? C.success : C.gold }}
          >
            {solved ? dayLabel(answerOf(round)) : '?'}
          </p>
          <div className="h-16">
            {solved && <BadgeCheck size={60} className="kd-pop" style={{ color: C.success }} />}
          </div>
        </div>
      )}
    </ExerciseShell>
  );
}
