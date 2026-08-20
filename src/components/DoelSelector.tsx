import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useKlasFilter } from '../hooks/useKlasFilter';
import {
  codesVoorOpslag,
  loadDoelLabels,
  loadDoelOpties,
  type DoelLabel,
  type DoelOptie,
} from '../lib/doelselectie';
import { NET_LABELS } from '../lib/leerplandoelen';
import NetLeeftijdFilter from './NetLeeftijdFilter';

interface Props {
  /** De opgeslagen codes: minimumdoelen en leerplandoelen door elkaar. */
  waarde: string[];
  onChange: (codes: string[]) => void;
  label?: string;
}

/** Hoeveel resultaten we tonen; er zijn er bijna 800 per net per leeftijd. */
const MAX_ZICHTBAAR = 40;

/**
 * Doelenkiezer voor alles waar inhoud aan doelen hangt: video's, materialen,
 * lessen, activiteiten, routines, woordenschat, spelletjes.
 *
 * Standaard staat de lijst op het net en de leeftijd van de klas. Het filter
 * blijft bedienbaar, zodat je ook een ander net kan koppelen — nodig voor
 * platforminhoud, die door scholen van alle netten gebruikt wordt.
 */
export default function DoelSelector({ waarde, onChange, label = 'Doelen' }: Props) {
  const filter = useKlasFilter();
  const [opties, setOpties] = useState<DoelOptie[]>([]);
  const [labels, setLabels] = useState<Map<string, DoelLabel>>(new Map());
  const [zoek, setZoek] = useState('');
  const [laden, setLaden] = useState(false);

  useEffect(() => {
    let afgebroken = false;
    setLaden(true);
    loadDoelOpties(filter.net, filter.leeftijd)
      .then((o) => {
        if (!afgebroken) setOpties(o);
      })
      .catch((e) => console.error('Doelen laden mislukt', e))
      .finally(() => {
        if (!afgebroken) setLaden(false);
      });
    return () => {
      afgebroken = true;
    };
  }, [filter.net, filter.leeftijd]);

  // Namen bij de al opgeslagen codes, die uit een ander net kunnen komen.
  useEffect(() => {
    if (waarde.length === 0) {
      setLabels(new Map());
      return;
    }
    let afgebroken = false;
    loadDoelLabels(waarde)
      .then((m) => {
        if (!afgebroken) setLabels(m);
      })
      .catch((e) => console.error('Doellabels laden mislukt', e));
    return () => {
      afgebroken = true;
    };
  }, [waarde.join('|')]);

  const gekozen = useMemo(() => new Set(waarde), [waarde]);

  const resultaten = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return opties
      .filter((o) => !gekozen.has(o.code))
      .filter(
        (o) =>
          q === '' ||
          o.code.toLowerCase().includes(q) ||
          o.omschrijving.toLowerCase().includes(q) ||
          o.context.toLowerCase().includes(q),
      );
  }, [opties, gekozen, zoek]);

  const voegToe = (o: DoelOptie) => {
    const nieuw = codesVoorOpslag(o).filter((c) => !gekozen.has(c));
    if (nieuw.length > 0) onChange([...waarde, ...nieuw]);
    setZoek('');
  };

  /*
    Een leerplandoel weghalen neemt zijn minimumdoelen mee, behalve die welke
    een ander gekozen leerplandoel ook nodig heeft. Had je zo'n minimumdoel
    daarnaast los aangevinkt, dan verdwijnt het mee; opnieuw aanvinken kan.
  */
  const verwijder = (code: string) => {
    const optie = opties.find((o) => o.code === code);
    if (!optie || optie.soort !== 'leerplandoel') {
      onChange(waarde.filter((c) => c !== code));
      return;
    }
    const restLeerplan = opties.filter(
      (o) => o.soort === 'leerplandoel' && o.code !== code && gekozen.has(o.code),
    );
    const nogNodig = new Set(restLeerplan.flatMap((o) => o.minimumdoelen));
    const weg = new Set([code, ...optie.minimumdoelen.filter((c) => !nogNodig.has(c))]);
    onChange(waarde.filter((c) => !weg.has(c)));
  };

  const chip = (code: string) => {
    const l = labels.get(code);
    const leerplan = l?.soort === 'leerplandoel';
    return (
      <span
        key={code}
        title={l?.omschrijving ?? code}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          leerplan ? 'bg-deep-purple text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <span className="font-semibold">{code}</span>
        {l && l.omschrijving !== code && (
          <span className={`max-w-[16rem] truncate ${leerplan ? 'text-white/80' : 'text-gray-500'}`}>
            {l.omschrijving}
          </span>
        )}
        {leerplan && l?.net && (
          <span className="text-[10px] uppercase tracking-wide text-white/70">
            {NET_LABELS[l.net]}
          </span>
        )}
        <button
          type="button"
          onClick={() => verwijder(code)}
          className={leerplan ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'}
          aria-label={`${code} verwijderen`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>

      <NetLeeftijdFilter
        net={filter.net}
        leeftijd={filter.leeftijd}
        onNetChange={filter.kiesNet}
        onLeeftijdChange={filter.kiesLeeftijd}
        toonAlles={filter.toonAlles}
        onToonAllesChange={filter.setToonAlles}
        klasFilterActief={filter.klasFilterActief}
        klasOmschrijving={filter.klasOmschrijving}
      />

      {waarde.length > 0 && <div className="flex flex-wrap gap-2">{waarde.map(chip)}</div>}

      <input
        type="text"
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        placeholder={
          filter.net === 'all'
            ? 'Zoek een minimumdoel...'
            : `Zoek een minimum- of leerplandoel (${NET_LABELS[filter.net]})...`
        }
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
      />

      <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
        {laden && <p className="px-4 py-3 text-sm text-gray-500">Doelen laden...</p>}
        {!laden && resultaten.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-500">Geen doelen gevonden.</p>
        )}
        {!laden &&
          resultaten.slice(0, MAX_ZICHTBAAR).map((o) => (
            <button
              key={`${o.soort}-${o.code}`}
              type="button"
              onClick={() => voegToe(o)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
            >
              <span
                className={`font-semibold ${
                  o.soort === 'leerplandoel' ? 'text-deep-purple' : 'text-gray-700'
                }`}
              >
                {o.code}
              </span>
              <span className="text-gray-600 ml-2">{o.omschrijving}</span>
              {o.soort === 'leerplandoel' && o.minimumdoelen.length > 0 && (
                <span className="block text-xs text-gray-400 mt-0.5">
                  telt mee voor {o.minimumdoelen.join(', ')}
                </span>
              )}
            </button>
          ))}
        {!laden && resultaten.length > MAX_ZICHTBAAR && (
          <p className="px-4 py-2 text-xs text-gray-500">
            Nog {resultaten.length - MAX_ZICHTBAAR} andere doelen. Verfijn je zoekterm.
          </p>
        )}
      </div>
    </div>
  );
}
