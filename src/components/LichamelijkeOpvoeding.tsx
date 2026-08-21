import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useKlasFilter } from '../hooks/useKlasFilter';
import NetLeeftijdFilter from './NetLeeftijdFilter';
import {
  NET_CODES,
  NET_KLEUREN,
  NET_LABELS,
  type NetCode,
} from '../lib/leerplandoelen';
import { loadBewegingen, type BewegingMetDoelen } from '../lib/lichamelijkeOpvoeding';

interface Props {
  groupId: string;
}

const GROEP_LABELS: Record<string, string> = {
  verplaatsen: 'Zich verplaatsen',
  evenwicht: 'Evenwicht en hangen',
  materiaal: 'Met materiaal',
  samen: 'Samen bewegen',
};

/**
 * Bewegingen uit de leerplannen als afvinklijst.
 *
 * De drie netten beschrijven dezelfde beweging heel verschillend. Hier staat de
 * beweging voorop met onze uitleg erbij; de doelzinnen van de netten staan
 * eronder, uitklapbaar, zodat je altijd het origineel kan nalezen. Achteraan
 * elke regel zie je in welke netten de beweging beschreven staat.
 */
export default function LichamelijkeOpvoeding({ groupId }: Props) {
  const filter = useKlasFilter();
  const [items, setItems] = useState<BewegingMetDoelen[]>([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [zoek, setZoek] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [bezig, setBezig] = useState<string | null>(null);
  const [gedaan, setGedaan] = useState<Set<string>>(new Set());

  useEffect(() => {
    let afgebroken = false;
    setLaden(true);
    setFout('');
    loadBewegingen(filter.net, filter.leeftijd, filter.ovsgGroep)
      .then((b) => {
        if (!afgebroken) setItems(b);
      })
      .catch((e) => {
        console.error('Bewegingen laden mislukt', e);
        if (!afgebroken) setFout('De bewegingen konden niet geladen worden.');
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
        i.beweging.beweging.toLowerCase().includes(q) ||
        i.beweging.interpretatie.toLowerCase().includes(q) ||
        NET_CODES.some((n) => i.perNet[n].some((d) => d.omschrijving.toLowerCase().includes(q))),
    );
  }, [items, zoek]);

  const perGroep = useMemo(() => {
    const map = new Map<string, BewegingMetDoelen[]>();
    for (const i of zichtbaar) {
      const g = i.beweging.groep;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(i);
    }
    return map;
  }, [zichtbaar]);

  /* Registreert de beweging als geoefend, op alle doelen die eronder hangen. */
  const registreer = async (item: BewegingMetDoelen) => {
    if (bezig) return;
    setBezig(item.beweging.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const codes = new Set<string>();
      for (const n of NET_CODES) {
        for (const d of item.perNet[n]) {
          codes.add(d.doelnummer);
          d.minimumdoelen.forEach((c) => codes.add(c));
        }
      }

      const sessie = {
        group_id: groupId,
        goal_codes: [...codes],
        activity_type: 'general',
        activity_name: `Beweging: ${item.beweging.beweging}`,
        repetitions: 1,
        created_by: user.id,
      };
      // Zie de toelichting in lib/leerplandoelen.ts: de types lossen op naar never.
      const { error } = await supabase.from('goal_tracking_sessions').insert(sessie as never);
      if (error) throw error;
      setGedaan((s) => new Set(s).add(item.beweging.id));
    } catch (e) {
      console.error('Registreren mislukt', e);
      setFout('Registreren is niet gelukt.');
    } finally {
      setBezig(null);
    }
  };

  const netStip = (n: NetCode, aan: boolean) => (
    <span
      key={n}
      title={aan ? `Beschreven in ${NET_LABELS[n]}` : `Niet beschreven in ${NET_LABELS[n]}`}
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
        aan ? 'text-white' : 'bg-gray-100 text-gray-300'
      }`}
      style={aan ? { backgroundColor: NET_KLEUREN[n] } : undefined}
    >
      {n === 'KATH' ? 'KATH' : n}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-lg space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          Elk net beschrijft dezelfde beweging op zijn eigen manier. Hier staat de beweging voorop,
          met de doelzinnen van de netten eronder. Achteraan zie je in welke netten ze beschreven
          staat; klap een regel open om de doelen zelf te lezen.
        </p>

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
            placeholder="Zoek een beweging of doel..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
          />
        </div>

        <p className="text-sm text-gray-600">
          {zichtbaar.length} {zichtbaar.length === 1 ? 'beweging' : 'bewegingen'}
        </p>
      </div>

      {fout && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {fout}
        </div>
      )}

      {laden && <p className="text-gray-500 px-4">Bewegingen laden...</p>}

      {!laden &&
        [...perGroep.entries()].map(([groep, lijst]) => (
          <div key={groep} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <h3 className="px-5 py-3 bg-gray-50 border-b border-gray-200 font-baloo text-deep-purple">
              {GROEP_LABELS[groep] ?? groep}
              <span className="ml-2 text-xs text-gray-500 font-normal">({lijst.length})</span>
            </h3>

            <ul className="divide-y divide-gray-100">
              {lijst.map((item) => {
                const id = item.beweging.id;
                const uit = open.has(id);
                const afgevinkt = gedaan.has(id);
                return (
                  <li key={id}>
                    <div className="flex items-start gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => registreer(item)}
                        disabled={bezig === id}
                        title="Registreer als geoefend"
                        className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          afgevinkt
                            ? 'bg-grass-green border-grass-green text-white'
                            : 'border-gray-300 hover:border-deep-purple'
                        }`}
                      >
                        {afgevinkt && <Check className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOpen((s) => {
                            const n = new Set(s);
                            if (n.has(id)) n.delete(id);
                            else n.add(id);
                            return n;
                          })
                        }
                        className="flex-1 text-left"
                      >
                        <span className="font-semibold text-gray-800">{item.beweging.beweging}</span>
                        <span className="block text-sm text-gray-600">
                          {item.beweging.interpretatie}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                        {NET_CODES.map((n) => netStip(n, item.netten.includes(n)))}
                        {uit ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 ml-1" />
                        )}
                      </div>
                    </div>

                    {uit && (
                      <div className="px-4 pb-4 pl-13 space-y-3 bg-gray-50/60">
                        {NET_CODES.filter((n) => item.perNet[n].length > 0).map((n) => (
                          <div key={n}>
                            <h5 className="text-xs font-semibold text-gray-700 mb-1">
                              {NET_LABELS[n]}{' '}
                              <span className="text-gray-400 font-normal">
                                ({item.perNet[n].length})
                              </span>
                            </h5>
                            <ul className="space-y-1">
                              {item.perNet[n].map((d) => (
                                <li key={d.doelnummer} className="text-sm text-gray-600">
                                  <span className="font-semibold text-deep-purple">
                                    {d.doelnummer}
                                  </span>{' '}
                                  {d.omschrijving}
                                  {d.minimumdoelen.length > 0 && (
                                    <span className="text-[11px] text-gray-400">
                                      {' '}
                                      · telt voor {d.minimumdoelen.join(', ')}
                                    </span>
                                  )}
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
          <p className="text-gray-500">Geen bewegingen gevonden voor deze selectie.</p>
        </div>
      )}
    </div>
  );
}
