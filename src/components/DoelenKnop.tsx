import { useState } from 'react';
import { Target } from 'lucide-react';
import DoelenPerNetModal from './DoelenPerNetModal';

interface Props {
  /** Minimumdoelcodes van dit item. */
  codes: string[];
  /** Naam van het item, voor in de kop van het venster. */
  naam: string;
}

/**
 * Knopje "Doelen per net" bij platforminhoud: spelletjes, bewegingstaken,
 * schrijfoefeningen.
 *
 * Die inhoud is van het platform en wordt door scholen van alle netten
 * gebruikt, dus er hangt geen net aan vast. De leerplandoelen worden afgeleid
 * uit de minimumdoelen die er al aan hangen — zo klopt de lijst vanzelf voor
 * elk net, zonder dat iemand 575 rijen per net moet natrekken.
 */
export default function DoelenKnop({ codes, naam }: Props) {
  const [open, setOpen] = useState(false);
  if (codes.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 text-deep-purple border border-deep-purple/20 hover:bg-white transition-colors"
      >
        <Target className="w-3.5 h-3.5" />
        Doelen per net
      </button>

      <DoelenPerNetModal
        isOpen={open}
        onClose={() => setOpen(false)}
        codes={codes}
        herkomst={`"${naam}"`}
        titel={`Doelen bij ${naam}`}
      />
    </>
  );
}
