import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  getSchoolYearWeeks,
  huidigSchooljaar,
  schooljaarEindTekst,
  schooljaarLabel,
  schooljaarStartTekst,
} from '../utils/schooljaar';

/*
  Welk schooljaar de cijfers tonen. Standaard het lopende jaar: een leerkracht
  kijkt naar wat ze dit jaar deed, niet naar wat er vorig jaar gebeurde.

  De keuze is persoonlijk en blijft in deze browser staan; ze verandert niets
  aan de gegevens en hoeft dus niet naar de databank. Bij een nieuw schooljaar
  valt een oude keuze vanzelf weg, zodat niemand ongemerkt naar vorig jaar
  blijft kijken.
*/
const OPSLAG = 'kd.schooljaar';

interface SchooljaarWaarde {
  /** Startjaar: 2026 staat voor 2026-2027. */
  startjaar: number;
  kies: (startjaar: number) => void;
  /** 'YYYY-MM-DD' van 1 september. */
  start: string;
  /** 'YYYY-MM-DD' van 30 juni. */
  eind: string;
  /** '2026-2027' */
  label: string;
  isHuidig: boolean;
  /** Startdatums van alle weken, voor de weekbalk. */
  weken: Date[];
  /** 1 september als Date, om weeknummers mee te berekenen. */
  startDatum: Date;
  /** De jaren die te kiezen vallen, nieuwste eerst. */
  keuzes: number[];
}

const Context = createContext<SchooljaarWaarde | null>(null);

const AANTAL_JAREN_TERUG = 4;

export function SchooljaarProvider({ children }: { children: ReactNode }) {
  const huidig = huidigSchooljaar();

  const [startjaar, setStartjaar] = useState(() => {
    try {
      const bewaard = Number(localStorage.getItem(OPSLAG));
      // Alleen een jaar binnen de keuzelijst; anders het lopende jaar.
      if (bewaard >= huidig - AANTAL_JAREN_TERUG && bewaard <= huidig) return bewaard;
    } catch {
      /* geblokkeerde opslag: gewoon het lopende jaar */
    }
    return huidig;
  });

  const kies = useCallback((jaar: number) => {
    setStartjaar(jaar);
    try {
      localStorage.setItem(OPSLAG, String(jaar));
    } catch {
      /* de keuze geldt dan alleen voor dit bezoek */
    }
  }, []);

  const waarde = useMemo<SchooljaarWaarde>(() => {
    const { start: startDatum, weeks } = getSchoolYearWeeks(startjaar);
    return {
      startjaar,
      kies,
      start: schooljaarStartTekst(startjaar),
      eind: schooljaarEindTekst(startjaar),
      label: schooljaarLabel(startjaar),
      isHuidig: startjaar === huidig,
      weken: weeks,
      startDatum,
      keuzes: Array.from({ length: AANTAL_JAREN_TERUG + 1 }, (_, i) => huidig - i),
    };
  }, [startjaar, kies, huidig]);

  return <Context.Provider value={waarde}>{children}</Context.Provider>;
}

export function useSchooljaar(): SchooljaarWaarde {
  const waarde = useContext(Context);
  if (!waarde) throw new Error('useSchooljaar hoort binnen SchooljaarProvider');
  return waarde;
}
