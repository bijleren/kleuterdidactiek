/*
  Shared UI for the "kleuter" batch: the DotPattern (iOS KleuterComponents),
  the voice-choice chrome (mic toggle + "Wat kan je zeggen?" info button,
  iOS VoiceChoiceModifier) and the mic footer shown while voice answers are on.
*/
import { useState } from 'react';
import { Info } from 'lucide-react';
import { C, MicPanel, Overlay, VoiceToggleButton } from '../../ui';
import { useSettings } from '../../settings';
import { ordinalWord } from '../../lib/dutch';
import { t } from '../../strings';
import { dotRows, spokenHint } from './logic';
import type { VoiceOption } from './logic';

/** A cluster of `count` dots (≤5 per row, leading-aligned like a five-frame). */
export function DotPattern({ count, color = C.gold, dot = 34 }: { count: number; color?: string; dot?: number }) {
  const gap = dot * 0.42;
  return (
    <div role="img" aria-label={String(count)} className="flex flex-col items-start" style={{ gap }}>
      {dotRows(count).map((n, r) => (
        <div key={r} className="flex" style={{ gap }}>
          {Array.from({ length: n }, (_, i) => (
            <span
              key={i}
              className="rounded-full transition-colors duration-200"
              style={{ width: dot, height: dot, background: color, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.55)' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Mic toggle (bottom right) + info button (bottom left) for voice choices. */
export function VoiceChoiceChrome({ options }: { options: VoiceOption[] }) {
  const { settings } = useSettings();
  const [info, setInfo] = useState(false);
  return (
    <>
      <VoiceToggleButton />
      {settings.voiceAnswers && (
        <button
          onClick={() => setInfo(true)}
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center z-10"
          style={{ color: C.gold }}
          aria-label={t('voice.info.title')}
          title={t('voice.info.title')}
        >
          <Info size={24} />
        </button>
      )}
      {info && (
        <Overlay onClose={() => setInfo(false)}>
          <h2 className="font-baloo font-bold text-2xl mb-3" style={{ color: C.gold }}>{t('voice.info.title')}</h2>
          <div className="font-semibold mb-2 opacity-70">{t('voice.info.say')}</div>
          <ul className="rounded-2xl bg-white divide-y divide-[#946B29]/10 mb-4">
            {options.map((o, i) => (
              <li key={i} className="flex justify-between gap-4 px-4 py-2.5">
                <span className="font-bold" style={{ color: C.gold }}>{ordinalWord(i + 1) ?? i + 1}</span>
                <span className="font-semibold">{spokenHint(o.target)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm opacity-70">{t('voice.info.tip')}</p>
        </Overlay>
      )}
    </>
  );
}

/** Footer with the mic status while voice answers are on (else nothing). */
export function VoiceFooter() {
  const { settings } = useSettings();
  if (!settings.voiceAnswers) return null;
  return (
    <div className="max-w-[34rem] mx-auto">
      <MicPanel hint={t('voice.info.say')} />
    </div>
  );
}
