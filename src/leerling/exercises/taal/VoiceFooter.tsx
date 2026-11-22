/*
  Footer for the voice exercises of the "taal" batch: the shared MicPanel plus
  the iOS "Overslaan" pill (skip, or restart for Dagen). The iOS hint lamp
  lives in the ExerciseShell top bar.
*/
import { FastForward, RotateCcw } from 'lucide-react';
import { C, MicPanel } from '../../ui';
import { t } from '../../strings';

export function VoiceFooter({ hint, onSkip, restartIcon }: { hint: string; onSkip: () => void; restartIcon?: boolean }) {
  return (
    <div className="flex items-center gap-2 max-w-[44rem] mx-auto">
      <div className="flex-1 min-w-0"><MicPanel hint={hint} /></div>
      <button
        onClick={onSkip}
        className="h-14 px-4 rounded-2xl font-baloo font-bold text-white flex items-center gap-2 shrink-0 active:scale-95 transition"
        style={{ background: C.text + '8c' }}
        aria-label={t('common.skip')}
        title={t('common.skip')}
      >
        {restartIcon ? <RotateCcw size={20} /> : <FastForward size={20} />}
        <span className="hidden sm:inline">{t('common.skip')}</span>
      </button>
    </div>
  );
}
