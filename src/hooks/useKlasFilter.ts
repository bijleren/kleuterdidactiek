import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSchool } from '../contexts/SchoolContext';
import {
  heeftKlasFilter,
  omschrijfKlasFilter,
  standaardFilter,
  type Leeftijd,
  type NetCode,
} from '../lib/leerplandoelen';

/*
  Het filter op net en leeftijd start bij de klas: het net staat op de school,
  de leeftijdsband op de groep. Vulde niemand ze in, dan staat alles open.

  Bewust geen localStorage meer. Die keuze gold voor de hele browser, niet per
  klas, dus een leerkracht met een K1 en een K3 kreeg voor allebei hetzelfde
  filter. Je begint nu altijd bij de klas waar je in staat; wil je vergelijken,
  dan zet je het filter met de hand om of vink je "alle doelen" aan.
*/
export function useKlasFilter() {
  const { selectedSchool, selectedGroup } = useSchool();

  const klas = useMemo(
    () => standaardFilter(selectedSchool?.net_code, selectedGroup?.leeftijdsgroep),
    [selectedSchool?.net_code, selectedGroup?.leeftijdsgroep],
  );

  const [net, setNet] = useState<NetCode | 'all'>(klas.net);
  const [leeftijd, setLeeftijd] = useState<Leeftijd | 'all'>(klas.leeftijd);
  const [toonAlles, setToonAlles] = useState(false);

  // Van klas wisselen betekent terug naar het filter van die klas.
  useEffect(() => {
    setNet(klas.net);
    setLeeftijd(klas.leeftijd);
    setToonAlles(false);
  }, [klas.net, klas.leeftijd]);

  const kiesNet = useCallback((n: NetCode | 'all') => {
    setToonAlles(false);
    setNet(n);
    // Een leeftijdsband hoort bij een leerplan; zonder net vervalt hij.
    if (n === 'all') setLeeftijd('all');
  }, []);

  const kiesLeeftijd = useCallback((l: Leeftijd | 'all') => {
    setToonAlles(false);
    setLeeftijd(l);
  }, []);

  // Terug naar de klasinstelling zodra het vinkje weer uit gaat.
  const wijzigToonAlles = useCallback(
    (aan: boolean) => {
      setToonAlles(aan);
      if (!aan) {
        setNet(klas.net);
        setLeeftijd(klas.leeftijd);
      }
    },
    [klas.net, klas.leeftijd],
  );

  return {
    /** Effectief filter, inclusief het vinkje "alle doelen". */
    net: toonAlles ? ('all' as const) : net,
    leeftijd: toonAlles ? ('all' as const) : leeftijd,
    kiesNet,
    kiesLeeftijd,
    toonAlles,
    setToonAlles: wijzigToonAlles,
    /** Levert de klas zelf een filter op? Zo niet, valt er niets open te zetten. */
    klasFilterActief: heeftKlasFilter(klas),
    klasOmschrijving: omschrijfKlasFilter(klas),
  };
}
