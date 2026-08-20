import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NetLeeftijdFilter from './NetLeeftijdFilter';
import WeekBalk from './WeekBalk';
import { SCHOOLJAAR_EIND, SCHOOLJAAR_START } from '../utils/schooljaar';
import {
  NET_CODES,
  NET_LABELS,
  loadLeerplandoelen,
  type Leerplandoel,
  type NetCode,
} from '../lib/leerplandoelen';
import { useKlasFilter } from '../hooks/useKlasFilter';

interface Props {
  groupId: string;
}

interface Voortgang {
  sessies: number;
  laatst: string | null;
}

type Weergave = 'alle' | 'gewerkt' | 'niet' | 'geenoefenvorm';

/**
 * Overzicht op leerplandoelniveau: niet de 128 minimumdoelen van de app, maar
 * de doelen zoals het gekozen net ze formuleert (1.121 bij Op.stap, 993 bij GO!).
 *
 * Belangrijke nuance: de voortgang wordt in deze app gemeten per minimumdoelcode,
 * niet per leerplandoel. Een leerplandoel erft dus de teller van het minimumdoel
 * waaraan het hangt. Dat betekent dat meerdere leerplandoelen dezelfde teller
 * kunnen tonen. De interface zegt dat er ook bij.
 */
export default function LeerplandoelenOverzicht({ groupId }: Props) {
  const navigate = useNavigate();
  const {
    net: netFilter,
    leeftijd: leeftijdFilter,
    kiesNet,
    kiesLeeftijd,
    toonAlles,
    setToonAlles,
    klasFilterActief,
    klasOmschrijving,
  } = useKlasFilter();
  const [doelen, setDoelen] = useState<Leerplandoel[]>([]);
  const [voortgang, setVoortgang] = useState<Map<string, Voortgang>>(new Map());
  /** Per minimumdoelcode: in welke didactische weken er aan gewerkt is. */
  const [wekenPerCode, setWekenPerCode] = useState<Map<string, Set<number>>>(new Map());
  const [laden, setLaden] = useState(false);
  const [zoek, setZoek] = useState('');
  /** Id van het leerplandoel waarvoor een registratie loopt. */
  const [bezig, setBezig] = useState<string | null>(null);
  const [weergave, setWeergave] = useState<Weergave>('alle');
  /**
   * Vakken staan standaard dicht. Elk doel toont een weekbalk van 44 blokjes;
   * bij GO! 5-6 zijn dat bijna 800 doelen en dat wil je niet in één keer
   * renderen. De teller per vak staat wel meteen in de kop.
   */
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    let afgebroken = false;
    if (netFilter === 'all') {
      setDoelen([]);
      return;
    }
    setLaden(true);
    loadLeerplandoelen(netFilter, leeftijdFilter).then((d) => {
      if (!afgebroken) {
        setDoelen(d);
        setLaden(false);
      }
    });
    return () => {
      afgebroken = true;
    };
  }, [netFilter, leeftijdFilter]);

  const laadVoortgang = useCallback(async () => {
    const [{ data: prog, error: pErr }, { data: sess, error: sErr }] = await Promise.all([
      supabase
        .from('group_goal_progress')
        .select('goal_code, total_sessions, last_practiced_at')
        .eq('group_id', groupId),
      // Weken server-side samengevat per code: het aantal sessies groeit
      // onbeperkt, het aantal codes niet.
      supabase.rpc('doel_weken', {
        p_group_id: groupId,
        p_van: SCHOOLJAAR_START,
        p_tot: SCHOOLJAAR_EIND,
      } as never),
    ]);

    if (pErr) console.error('Voortgang laden mislukt:', pErr);
    else {
      const m = new Map<string, Voortgang>();
      for (const r of (prog ?? []) as unknown as {
        goal_code: string;
        total_sessions: number;
        last_practiced_at: string | null;
      }[]) {
        m.set(r.goal_code, { sessies: r.total_sessions, laatst: r.last_practiced_at });
      }
      setVoortgang(m);
    }

    if (sErr) console.error('Weekgegevens laden mislukt:', sErr);
    else {
      const m = new Map<string, Set<number>>();
      for (const r of (sess ?? []) as unknown as { code: string; weken: number[] }[]) {
        m.set(r.code, new Set(r.weken ?? []));
      }
      setWekenPerCode(m);
    }
  }, [groupId]);

  useEffect(() => {
    laadVoortgang();
  }, [laadVoortgang]);

  /**
   * Handmatig registreren dat er aan dit leerplandoel gewerkt is.
   *
   * We loggen het doelnummer van het leerplandoel zelf, plus de minimumdoelen
   * waaraan het hangt. Zo krijgt het leerplandoel een eigen, precieze teller
   * (ook als er geen minimumdoel aan hangt) en blijft het minimumdoel meelopen
   * in de bestaande rapportage.
   */
  const registreer = async (d: Leerplandoel) => {
    if (bezig) return;
    setBezig(d.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const sessie = {
        group_id: groupId,
        goal_codes: [d.doelnummer, ...d.codes],
        activity_type: 'general',
        activity_name: `Leerplandoel ${d.doelnummer} (${NET_LABELS[d.netCode]})`,
        repetitions: 1,
        created_by: user.id,
      };

      // De Database-types worden in dit project niet opgelost door de client
      // (zie de toelichting in lib/leerplandoelen.ts); zonder cast weigert hij
      // elke insert-payload.
      const { error } = await supabase
        .from('goal_tracking_sessions')
        .insert(sessie as never);
      if (error) throw error;

      await laadVoortgang();
    } catch (e) {
      console.error('Registreren mislukt:', e);
    } finally {
      setBezig(null);
    }
  };

  /**
   * Sessies van een leerplandoel: het hoogste aantal over zijn eigen
   * registraties en die van zijn minimumdoelen.
   */
  const sessiesVan = useCallback(
    (d: Leerplandoel): number =>
      [d.doelnummer, ...d.codes].reduce(
        (max, sleutel) => Math.max(max, voortgang.get(sleutel)?.sessies ?? 0),
        0
      ),
    [voortgang]
  );

  /**
   * Weken van een leerplandoel: zijn eigen handmatige registraties plus de
   * weken van de minimumdoelen waaraan het hangt.
   */
  const wekenVan = useCallback(
    (d: Leerplandoel): Set<number> => {
      const uit = new Set<number>();
      for (const sleutel of [d.doelnummer, ...d.codes])
        for (const w of wekenPerCode.get(sleutel) ?? []) uit.add(w);
      return uit;
    },
    [wekenPerCode]
  );

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return doelen.filter((d) => {
      const n = sessiesVan(d);
      const meetbaar = d.codes.length > 0;
      if (weergave === 'gewerkt' && n === 0) return false;
      if (weergave === 'niet' && n > 0) return false;
      if (weergave === 'geenoefenvorm' && meetbaar) return false;
      if (!q) return true;
      return (
        d.doelnummer.toLowerCase().includes(q) ||
        d.omschrijving.toLowerCase().includes(q) ||
        d.codes.some((c) => c.toLowerCase().includes(q)) ||
        d.path.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [doelen, zoek, weergave, sessiesVan]);

  /** Gegroepeerd op het bovenste niveau van de nethiërarchie (het vak). */
  const groepen = useMemo(() => {
    const m = new Map<string, Leerplandoel[]>();
    for (const d of zichtbaar) {
      const vak = d.path[0] || 'Overige';
      const lijst = m.get(vak) || [];
      lijst.push(d);
      m.set(vak, lijst);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [zichtbaar]);

  const aantalGewerkt = useMemo(
    () => doelen.filter((d) => sessiesVan(d) > 0).length,
    [doelen, sessiesVan]
  );

  /**
   * Doelen zonder gekoppeld minimumdoel krijgen geen voortgang uit de
   * oefenvormen van de app: er is geen minimumdoelcode die meeloopt. Handmatig
   * registreren kan wel, dus dit is geen onmeetbaarheid maar een gebrek aan
   * automatische oefenvorm.
   */
  const aantalZonderOefenvorm = useMemo(
    () => doelen.filter((d) => d.codes.length === 0).length,
    [doelen]
  );

  const toggle = (vak: string) =>
    setOpen((prev) => {
      const s = new Set(prev);
      if (s.has(vak)) s.delete(vak);
      else s.add(vak);
      return s;
    });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl">
        <h3 className="text-xl font-baloo text-deep-purple mb-1">Leerplandoelen</h3>
        <p className="text-sm text-gray-500 mb-4">
          De doelen zoals het net ze formuleert. Kies eerst een net.
        </p>

        <NetLeeftijdFilter
          netVerplicht
          toonAlles={toonAlles}
          onToonAllesChange={setToonAlles}
          klasFilterActief={klasFilterActief}
          klasOmschrijving={klasOmschrijving}
          net={netFilter}
          leeftijd={leeftijdFilter}
          onNetChange={kiesNet}
          onLeeftijdChange={kiesLeeftijd}
        />

        {netFilter !== 'all' && (
          <>
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                placeholder="Zoek op doelnummer, tekst, thema of minimumdoel..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {(
                [
                  ['alle', `Alle (${doelen.length})`],
                  ['gewerkt', `Aan gewerkt (${aantalGewerkt})`],
                  ['niet', `Nog niet (${doelen.length - aantalGewerkt})`],
                  ['geenoefenvorm', `Geen oefenvorm (${aantalZonderOefenvorm})`],
                ] as [Weergave, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setWeergave(id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    weergave === id
                      ? 'bg-deep-purple text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/*
        Een leerplandoel hoort altijd bij een net, dus zonder net valt er niets
        te tonen. Vandaar een keuze in plaats van een lege lijst. Heeft de
        school haar net ingevuld, dan staat die al klaar en zie je dit niet.
      */}
      {netFilter === 'all' && (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center space-y-4">
          <div>
            <h3 className="text-xl font-baloo text-deep-purple mb-1">Van welk net wil je de leerdoelen zien?</h3>
            <p className="text-sm text-gray-500">
              Elk net vult de minimumdoelen op zijn eigen manier in.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {NET_CODES.map((n: NetCode) => (
              <button
                key={n}
                onClick={() => kiesNet(n)}
                className="px-6 py-3 rounded-full font-baloo text-lg font-semibold shadow-lg bg-white text-gray-700 border-2 border-gray-200 hover:border-deep-purple hover:scale-105 transition-all"
              >
                {NET_LABELS[n]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Vul het net in bij de schoolgegevens en deze vraag verdwijnt.
          </p>
        </div>
      )}

      {netFilter !== 'all' && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Oefenvormen in de app tellen op het minimumdoel, dus leerplandoelen die naar hetzelfde
            minimumdoel verwijzen delen die teller. Met <span className="font-semibold">+ Aan gewerkt</span>{' '}
            registreer je een leerplandoel apart; dat telt alleen voor dat ene doel. Doelen met het
            label <span className="font-semibold">Geen oefenvorm</span> hebben geen minimumdoel en
            krijgen dus alleen een teller als je ze zelf registreert.
          </p>
        </div>
      )}

      {laden && (
        <div className="text-center py-10 text-lg font-baloo text-deep-purple">
          Leerplandoelen laden...
        </div>
      )}

      {!laden &&
        netFilter !== 'all' &&
        groepen.map(([vak, lijst]) => {
          const isOpen = open.has(vak);
          const gewerktInVak = lijst.filter((d) => sessiesVan(d) > 0).length;
          return (
            <div key={vak} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggle(vak)}
                className="w-full flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2 font-baloo text-lg text-deep-purple">
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  {vak}
                </span>
                <span className="text-xs text-gray-500">
                  {gewerktInVak > 0 && (
                    <span className="text-grass-green font-semibold">{gewerktInVak} aan gewerkt · </span>
                  )}
                  {lijst.length} doelen
                </span>
              </button>

              {isOpen && (
                <div className="divide-y divide-gray-100">
                  {lijst.map((d) => {
                    const n = sessiesVan(d);
                    return (
                      <div key={d.id} className="p-4 pl-6">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                          <span className="font-baloo text-sky-blue">
                            {d.doelnummer}
                            {/* Netten met een eigen, fijnere leeftijdsindeling
                                (OVSG) tonen die naast de gedeelde band. */}
                            {typeof d.extra?.leeftijdsgroep === 'string' && (
                              <span className="ml-2 text-xs font-normal text-gray-500">
                                {d.extra.leeftijdsgroep}
                              </span>
                            )}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {d.codes.map((c) => (
                              <span
                                key={c}
                                className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-semibold"
                                title="Gekoppeld minimumdoel"
                              >
                                {c}
                              </span>
                            ))}
                            {d.codes.length === 0 && (
                              <span
                                className="text-xs px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-800"
                                title="Voor dit doel is er geen oefenvorm in de app. Je kunt wel zelf registreren dat je eraan gewerkt hebt."
                              >
                                Geen oefenvorm
                              </span>
                            )}
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                n > 0
                                  ? 'bg-grass-green/15 text-grass-green'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {n > 0 ? `${n}x geoefend` : 'Nog niet'}
                            </span>
                            <button
                              onClick={() => registreer(d)}
                              disabled={bezig === d.id}
                              className="text-xs px-3 py-1 rounded-full font-semibold bg-deep-purple text-white hover:opacity-90 disabled:opacity-50 transition-all"
                              title="Registreer dat je vandaag aan dit leerplandoel gewerkt hebt"
                            >
                              {bezig === d.id ? '...' : '+ Aan gewerkt'}
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700">{d.omschrijving}</p>

                        {d.path.length > 1 && (
                          <p className="text-xs text-gray-400 mt-1">{d.path.slice(1).join(' › ')}</p>
                        )}

                        <div className="mt-2">
                          <WeekBalk
                            weken={wekenVan(d)}
                            toonKop={false}
                            onWeekClick={(startDatum, eindDatum) =>
                              navigate(
                                `/analytics?goal=${encodeURIComponent(
                                  d.codes[0] ?? d.doelnummer
                                )}&startDate=${startDatum}&endDate=${eindDatum}`
                              )
                            }
                          />
                        </div>

                        {d.doelnummers.length > 1 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Ook als {d.doelnummers.filter((x) => x !== d.doelnummer).join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      {!laden && netFilter !== 'all' && zichtbaar.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <p className="text-gray-500">Geen leerplandoelen gevonden met deze selectie.</p>
        </div>
      )}
    </div>
  );
}
