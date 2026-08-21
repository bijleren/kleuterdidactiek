import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Package, Search } from 'lucide-react';
import { useKlasFilter } from '../hooks/useKlasFilter';
import NetLeeftijdFilter from './NetLeeftijdFilter';
import { NET_LABELS, type NetCode } from '../lib/leerplandoelen';
import { loadLeermiddelen, type LeermiddelMetDoelen } from '../lib/leermiddelen';

const GROEP_LABELS: Record<string, string> = {
  meten: 'Meten en rekenen',
  ontdekken: 'Ontdekken en onderzoeken',
  creatief: 'Creatief werken',
  taal: 'Taal en verhalen',
  spel: 'Spel en beweging',
};

const NET_VOLGORDE: NetCode[] = ['KATH', 'GO', 'OVSG'];

/**
 * Leermiddelen die de leerplannen zelf benoemen, als afvinklijst.
 *
 * Dwars door alle vakken: een spiegel komt terug bij wetenschap én muzische
 * vorming. Per leermiddel staat waar het voor dient en in welke netten het
 * beschreven staat; opengeklapt zie je de doelen die het noemen.
 */
export default function Leermiddelen() {
  const filter = useKlasFilter();
  const [items, setItems] = useState<LeermiddelMetDoelen[]>([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [zoek, setZoek] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    let afgebroken = false;
    setLaden(true);
    setFout('');
    loadLeermiddelen(filter.net, filter.leeftijd, filter.ovsgGroep)
      .then((m) => {
        if (!afgebroken) setItems(m);
      })
      .catch((e) => {
        console.error('Leermiddelen laden mislukt', e);
        if (!afgebroken) setFout('De leermiddelen konden niet geladen worden.');
      })
      .finally(() => {
        if (!afgebroken) setLaden(false);
      });
    return () => {
      afgebroken = true;
    };
  }, [filter.net, filter.leeftijd, filter.ovsgGroep]);

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.leermiddel.naam.toLowerCase().includes(q) ||
        i.leermiddel.toelichting.toLowerCase().includes(q) ||
        NET_VOLGORDE.some((n) => i.perNet[n].some((d) => d.omschrijving.toLowerCase().includes(q))),
    );
  }, [items, zoek]);

  const perGroep = useMemo(() => {
    const map = new Map<string, LeermiddelMetDoelen[]>();
    for (const i of zichtbaar) {
      const g = i.leermiddel.groep;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(i);
    }
    return map;
  }, [zichtbaar]);

  const wissel = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-deep-purple flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 leading-relaxed">
            Materiaal dat de leerplannen zelf benoemen — een weegschaal, een spiegel, kralen om te
            rijgen. Handig om na te gaan wat er in de klas moet liggen. Klik een leermiddel open om
            te zien welke doelen het noemen.
          </p>
        </div>

        <NetLeeftijdFilter
          net={filter.net}
          leeftijd={filter.leeftijd}
          onNetChange={filter.kiesNet}
          onLeeftijdChange={filter.kiesLeeftijd}
          ovsgGroep={filter.ovsgGroep}
          onOvsgGroepChange={filter.kiesOvsgGroep}
          toonAlles={filter.toonAlles}
          onToonAllesChange={filter.setToonAlles}
          klasFilterActief={filter.klasFilterActief}
          klasOmschrijving={filter.klasOmschrijving}
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek een leermiddel..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
          />
        </div>

        <p className="text-sm text-gray-600">
          {zichtbaar.length} {zichtbaar.length === 1 ? 'leermiddel' : 'leermiddelen'}
        </p>
      </div>

      {fout && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {fout}
        </div>
      )}

      {laden && <p className="text-gray-500 px-4">Leermiddelen laden...</p>}

      {!laden &&
        [...perGroep.entries()].map(([groep, lijst]) => (
          <div key={groep} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <h4 className="px-5 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
              {GROEP_LABELS[groep] ?? groep}{' '}
              <span className="text-gray-500 font-normal">({lijst.length})</span>
            </h4>
            <ul className="divide-y divide-gray-100">
              {lijst.map((i) => {
                const uit = open.has(i.leermiddel.id);
                return (
                  <li key={i.leermiddel.id}>
                    <button
                      type="button"
                      onClick={() => wissel(i.leermiddel.id)}
                      className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3"
                    >
                      {uit ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-800">{i.leermiddel.naam}</span>
                        <span className="block text-sm text-gray-600">{i.leermiddel.toelichting}</span>
                      </span>
                      <span className="flex gap-1 flex-shrink-0">
                        {NET_VOLGORDE.filter((n) => i.perNet[n].length > 0).map((n) => (
                          <span
                            key={n}
                            title={`${NET_LABELS[n]}: ${i.perNet[n].length} doelen`}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-deep-purple/10 text-deep-purple"
                          >
                            {n === 'KATH' ? 'KATH' : n}
                          </span>
                        ))}
                      </span>
                    </button>

                    {uit && (
                      <div className="px-5 pb-4 pl-12 space-y-3">
                        {NET_VOLGORDE.filter((n) => i.perNet[n].length > 0).map((n) => (
                          <div key={n}>
                            <h5 className="text-xs font-semibold text-gray-700 mb-1">
                              {NET_LABELS[n]}{' '}
                              <span className="text-gray-400 font-normal">({i.perNet[n].length})</span>
                            </h5>
                            <ul className="space-y-1">
                              {i.perNet[n].map((d) => (
                                <li key={d.doelnummer} className="text-sm text-gray-600 flex gap-2">
                                  <span className="font-semibold text-deep-purple flex-shrink-0">
                                    {d.doelnummer}
                                  </span>
                                  <span>{d.omschrijving}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      {!laden && zichtbaar.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <p className="text-gray-500">Geen leermiddelen gevonden voor deze selectie.</p>
        </div>
      )}
    </div>
  );
}
