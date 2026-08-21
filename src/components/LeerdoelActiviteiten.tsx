import { useEffect, useMemo, useState } from 'react';
import { compareGoalCodes } from '../utils/goalSort';
import { Search, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import {
  LEEFTIJDEN,
  NET_CODES,
  NET_LABELS,
  standaardFilter,
  type Leeftijd,
  type NetCode,
} from '../lib/leerplandoelen';

interface ActiviteitRij {
  minimumdoel: string;
  net_code: NetCode;
  activiteit: string;
  doelnummers: string[];
  leeftijd_25_4: boolean;
  leeftijd_4_5: boolean;
  leeftijd_5_6: boolean;
}

interface DoelRij {
  code: string;
  vakdiscipline: string;
  doelzin: string;
}

interface Cluster {
  minimumdoel: string;
  vak: string;
  doelzin: string;
  perNet: Record<NetCode, ActiviteitRij[]>;
  netten: number;
}

/**
 * Concrete doe-activiteiten uit de leerplannen van de drie netten, gebundeld
 * per minimumdoel.
 *
 * Twee activiteiten onder hetzelfde minimumdoel mikken op hetzelfde. Een
 * leerkracht ziet hier dus hoe een ander net dat doel aanpakt — vandaar dat
 * hier bewust niet op een net gefilterd wordt: het naast elkaar zetten is het
 * hele punt. Het eigen net wordt wel gemarkeerd.
 */
export default function LeerdoelActiviteiten() {
  const { selectedSchool, selectedGroup } = useSchool();
  const eigenNet = standaardFilter(selectedSchool?.net_code, selectedGroup?.leeftijdsgroep).net;

  const [rijen, setRijen] = useState<ActiviteitRij[]>([]);
  const [doelen, setDoelen] = useState<Map<string, DoelRij>>(new Map());
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [zoek, setZoek] = useState('');
  const [leeftijd, setLeeftijd] = useState<Leeftijd | 'all'>('all');
  const [alleenMeerdere, setAlleenMeerdere] = useState(false);

  useEffect(() => {
    let afgebroken = false;
    setLaden(true);
    Promise.all([
      supabase.from('v_leerdoelactiviteiten').select('*'),
      supabase.from('minimumdoelen').select('code, vakdiscipline, doelzin'),
    ])
      .then(([actRes, doelRes]) => {
        if (afgebroken) return;
        if (actRes.error) throw actRes.error;
        if (doelRes.error) throw doelRes.error;
        setRijen((actRes.data ?? []) as unknown as ActiviteitRij[]);
        setDoelen(
          new Map(
            ((doelRes.data ?? []) as unknown as DoelRij[]).map((d) => [d.code, d]),
          ),
        );
      })
      .catch((e) => {
        console.error('Leerdoelactiviteiten laden mislukt', e);
        if (!afgebroken) setFout('De activiteiten konden niet geladen worden.');
      })
      .finally(() => {
        if (!afgebroken) setLaden(false);
      });
    return () => {
      afgebroken = true;
    };
  }, []);

  const past = (r: ActiviteitRij) => {
    if (leeftijd === '2,5-4') return r.leeftijd_25_4;
    if (leeftijd === '4-5') return r.leeftijd_4_5;
    if (leeftijd === '5-6') return r.leeftijd_5_6;
    return true;
  };

  const clusters = useMemo<Cluster[]>(() => {
    const q = zoek.trim().toLowerCase();
    const map = new Map<string, Cluster>();

    for (const r of rijen) {
      if (!past(r)) continue;
      const doel = doelen.get(r.minimumdoel);
      if (
        q &&
        !r.activiteit.toLowerCase().includes(q) &&
        !r.minimumdoel.toLowerCase().includes(q) &&
        !(doel?.doelzin ?? '').toLowerCase().includes(q) &&
        !(doel?.vakdiscipline ?? '').toLowerCase().includes(q)
      ) {
        continue;
      }
      let c = map.get(r.minimumdoel);
      if (!c) {
        c = {
          minimumdoel: r.minimumdoel,
          vak: doel?.vakdiscipline ?? '',
          doelzin: doel?.doelzin ?? '',
          perNet: { KATH: [], GO: [], OVSG: [] },
          netten: 0,
        };
        map.set(r.minimumdoel, c);
      }
      c.perNet[r.net_code]?.push(r);
    }

    const uit = [...map.values()];
    for (const c of uit) {
      c.netten = NET_CODES.filter((n) => c.perNet[n].length > 0).length;
      for (const n of NET_CODES) {
        c.perNet[n].sort((a, b) => a.activiteit.localeCompare(b.activiteit, 'nl'));
      }
    }
    return uit
      .filter((c) => !alleenMeerdere || c.netten > 1)
      .sort((a, b) => b.netten - a.netten || compareGoalCodes(a.minimumdoel, b.minimumdoel));
  }, [rijen, doelen, zoek, leeftijd, alleenMeerdere]);

  const totaal = clusters.reduce(
    (n, c) => n + NET_CODES.reduce((m, net) => m + c.perNet[net].length, 0),
    0,
  );

  const leeftijdBadge = (r: ActiviteitRij) => {
    const banden = [
      r.leeftijd_25_4 ? '2,5-4' : null,
      r.leeftijd_4_5 ? '4-5' : null,
      r.leeftijd_5_6 ? '5-6' : null,
    ].filter(Boolean);
    return banden.length === 3 ? 'alle leeftijden' : banden.join(' · ');
  };

  if (laden) return <p className="text-gray-500 px-4">Activiteiten laden...</p>;
  if (fout) {
    return (
      <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl">{fout}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-deep-purple flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 leading-relaxed">
            Doelen uit verschillende netten die aan hetzelfde minimumdoel hangen, mikken op
            hetzelfde. Hieronder staan de doelen die een <span className="font-semibold">concrete
            handeling</span> beschrijven, per minimumdoel naast elkaar — zo zie je hoe een ander net
            hetzelfde doel aanpakt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek op activiteit, vak of doelcode..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={alleenMeerdere}
              onChange={(e) => setAlleenMeerdere(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-deep-purple focus:ring-deep-purple"
            />
            Alleen doelen met meerdere netten
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 w-20">Leeftijd</span>
          {(['all', ...LEEFTIJDEN] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLeeftijd(l as Leeftijd | 'all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                leeftijd === l
                  ? 'bg-deep-purple text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {l === 'all' ? 'Alle' : `${l} jaar`}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-600">
          {clusters.length} {clusters.length === 1 ? 'doel' : 'doelen'}, {totaal} activiteiten
        </p>
      </div>

      {clusters.map((c) => (
        <div key={c.minimumdoel} className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="mb-3">
            <span className="text-sky-blue font-baloo text-lg">{c.minimumdoel}</span>
            {c.vak && <span className="ml-2 text-xs text-gray-500">{c.vak}</span>}
            {c.netten > 1 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-deep-purple/10 text-deep-purple font-semibold">
                {c.netten} netten
              </span>
            )}
            <p className="text-sm text-gray-600 mt-1">{c.doelzin}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {NET_CODES.map((net) => (
              <div
                key={net}
                className={`rounded-xl border p-3 ${
                  net === eigenNet ? 'border-deep-purple bg-deep-purple/5' : 'border-gray-200'
                }`}
              >
                <h5 className="text-xs font-semibold text-gray-700 mb-2">
                  {NET_LABELS[net]}
                  {net === eigenNet && <span className="ml-1 text-deep-purple">· jouw net</span>}
                </h5>
                {c.perNet[net].length === 0 ? (
                  <p className="text-xs text-gray-400">Geen concrete activiteit.</p>
                ) : (
                  <ul className="space-y-2">
                    {c.perNet[net].map((r) => (
                      <li key={r.activiteit} className="text-sm text-gray-700">
                        <span>{r.activiteit}</span>
                        <span className="block text-[11px] text-gray-400 mt-0.5">
                          {r.doelnummers.join(', ')} · {leeftijdBadge(r)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {clusters.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <p className="text-gray-500">Geen activiteiten gevonden voor deze selectie.</p>
        </div>
      )}
    </div>
  );
}
