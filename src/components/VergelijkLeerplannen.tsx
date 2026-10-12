import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Scale, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  loadDoelNetInfo,
  loadLeerplandoelenVoorCodes,
  NET_CODES,
  NET_KLEUREN,
  NET_LABELS,
  type DoelNetInfo,
  type LeerplandoelVoorExport,
  type NetCode,
} from '../lib/leerplandoelen';
import { compareGoalCodes } from '../utils/goalSort';

/**
 * Vergelijk: wat doen de netten met hetzelfde minimumdoel?
 *
 * Twee manieren om te kijken. Zonder zoekterm blader je door de minimumdoelen
 * en klap je er één open: de leerplandoelen van elk net naast elkaar. Met een
 * zoekterm draait het om: alle leerplandoelen waarin dat woord voorkomt, over
 * de netten heen, telkens met het minimumdoel erbij.
 *
 * De leerplandoelen worden pas opgehaald wanneer je ze nodig hebt. Alles van
 * de drie netten tegelijk is ruim tweeduizend rijen; dat hoort niet bij het
 * openen van een tabblad.
 */

interface Zoektreffer extends LeerplandoelVoorExport {
  id: string;
  pathLabels: string[];
}

const MAX_TREFFERS = 300;

export default function VergelijkLeerplannen() {
  const [doelen, setDoelen] = useState<DoelNetInfo[]>([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');

  const [zoek, setZoek] = useState('');
  const [zoekterm, setZoekterm] = useState('');
  const [zoeken, setZoeken] = useState(false);
  const [treffers, setTreffers] = useState<Zoektreffer[]>([]);
  const [afgekapt, setAfgekapt] = useState(false);

  const [netten, setNetten] = useState<NetCode[]>([...NET_CODES]);
  const [vak, setVak] = useState('all');
  const [alleToelichting, setAlleToelichting] = useState(false);

  const [open, setOpen] = useState<string | null>(null);
  const [perDoel, setPerDoel] = useState<Map<string, LeerplandoelVoorExport[]>>(new Map());
  const [doelLaden, setDoelLaden] = useState<string | null>(null);

  useEffect(() => {
    let afgebroken = false;
    loadDoelNetInfo()
      .then((map) => {
        if (afgebroken) return;
        setDoelen([...map.values()].sort((a, b) => compareGoalCodes(a.code, b.code)));
      })
      .catch((e) => {
        console.error('Doelen laden mislukt', e);
        if (!afgebroken) setFout('De doelen konden niet geladen worden.');
      })
      .finally(() => !afgebroken && setLaden(false));
    return () => {
      afgebroken = true;
    };
  }, []);

  // Tikken is sneller dan de databank; pas zoeken als iemand even stopt.
  useEffect(() => {
    const t = setTimeout(() => setZoekterm(zoek.trim()), 350);
    return () => clearTimeout(t);
  }, [zoek]);

  useEffect(() => {
    if (zoekterm.length < 2) {
      setTreffers([]);
      setAfgekapt(false);
      return;
    }
    let afgebroken = false;
    setZoeken(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('leerplandoelen')
          .select('id, net_code, doelnummer, omschrijving, path_labels, toelichting')
          /*
            Ook in de toelichting zoeken: woorden als "drukletters" staan niet in
            de doelzin maar in de ondersteunende tekst van het net. De komma en
            de haakjes zijn scheidingstekens in deze filter, dus die vallen weg.
          */
          .or(
            ['omschrijving', 'doelnummer', 'toelichting_tekst']
              .map((kolom) => `${kolom}.ilike.%${zoekterm.replace(/[,()]/g, ' ')}%`)
              .join(',')
          )
          .order('net_code')
          .limit(MAX_TREFFERS + 1);
        if (error) throw error;

        const rijen = (data ?? []) as unknown as {
          id: string;
          net_code: string;
          doelnummer: string;
          omschrijving: string;
          path_labels: string[] | null;
          toelichting: Record<string, string> | null;
        }[];

        const teveel = rijen.length > MAX_TREFFERS;
        const beperkt = rijen.slice(0, MAX_TREFFERS);

        // De minimumdoelen erbij: zonder die koppeling zegt een leerplandoel weinig.
        const { data: koppelingen } = await supabase
          .from('leerplandoel_minimumdoelen')
          .select('leerplandoel_id, code')
          .in('leerplandoel_id', beperkt.map((r) => r.id));

        const codesPerDoel = new Map<string, string[]>();
        for (const k of (koppelingen ?? []) as unknown as { leerplandoel_id: string; code: string }[]) {
          codesPerDoel.set(k.leerplandoel_id, [...(codesPerDoel.get(k.leerplandoel_id) ?? []), k.code]);
        }

        if (afgebroken) return;
        setAfgekapt(teveel);
        setTreffers(
          beperkt
            .filter((r) => (NET_CODES as readonly string[]).includes(r.net_code))
            .map((r) => ({
              id: r.id,
              netCode: r.net_code as NetCode,
              doelnummer: r.doelnummer,
              omschrijving: r.omschrijving,
              pathLabels: r.path_labels ?? [],
              toelichting: r.toelichting ?? undefined,
              codes: (codesPerDoel.get(r.id) ?? []).sort(compareGoalCodes),
            }))
        );
      } catch (e) {
        console.error('Zoeken mislukt', e);
        if (!afgebroken) setFout('Het zoeken is mislukt.');
      } finally {
        if (!afgebroken) setZoeken(false);
      }
    })();

    return () => {
      afgebroken = true;
    };
  }, [zoekterm]);

  const klapOpen = useCallback(
    async (code: string) => {
      if (open === code) {
        setOpen(null);
        return;
      }
      setOpen(code);
      if (perDoel.has(code)) return;

      setDoelLaden(code);
      try {
        const doelen = await loadLeerplandoelenVoorCodes([code], { net: 'all', leeftijd: 'all' });
        setPerDoel((m) => new Map(m).set(code, doelen));
      } catch (e) {
        console.error('Leerplandoelen laden mislukt', e);
      } finally {
        setDoelLaden(null);
      }
    },
    [open, perDoel]
  );

  const vakken = useMemo(
    () => [...new Set(doelen.map((d) => d.vakdiscipline).filter(Boolean))].sort(),
    [doelen]
  );

  const zichtbareDoelen = useMemo(
    () => doelen.filter((d) => vak === 'all' || d.vakdiscipline === vak),
    [doelen, vak]
  );

  const trefferGroepen = useMemo(() => {
    const groepen = new Map<NetCode, Zoektreffer[]>();
    for (const t of treffers) {
      if (!netten.includes(t.netCode)) continue;
      groepen.set(t.netCode, [...(groepen.get(t.netCode) ?? []), t]);
    }
    return groepen;
  }, [treffers, netten]);

  /** Minimumdoelen waarin het woord zelf voorkomt. */
  const doelTreffers = useMemo(() => {
    if (zoekterm.length < 2) return [];
    const q = zoekterm.toLowerCase();
    return zichtbareDoelen.filter(
      (d) => d.doelzin.toLowerCase().includes(q) || d.code.includes(q)
    );
  }, [zichtbareDoelen, zoekterm]);

  const zetNet = (n: NetCode) =>
    setNetten((huidig) =>
      huidig.includes(n) ? (huidig.length === 1 ? huidig : huidig.filter((x) => x !== n)) : [...huidig, n]
    );

  if (laden) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-2xl font-baloo text-deep-purple">Doelen laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-2xl font-baloo text-deep-purple flex items-center gap-2">
            <Scale className="w-6 h-6" />
            Vergelijk de leerplannen
          </h3>
          <p className="text-gray-600 mt-1">
            Zie per minimumdoel wat Katholiek Onderwijs, GO! en OVSG ermee doen. Of zoek op een woord
            en vind alle leerplandoelen waarin het voorkomt, met hun minimumdoel erbij.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op inhoud, bijvoorbeeld: rijm, meten, gevoelens..."
            className="w-full pl-12 pr-10 py-3 rounded-full border-2 border-gray-200 focus:border-deep-purple focus:outline-none transition-colors"
          />
          {zoek && (
            <button
              onClick={() => setZoek('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Zoekterm wissen"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {NET_CODES.map((n) => (
            <button
              key={n}
              onClick={() => zetNet(n)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
                netten.includes(n)
                  ? 'bg-deep-purple text-white border-deep-purple'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-deep-purple'
              }`}
            >
              {NET_LABELS[n]}
            </button>
          ))}
          <button
            onClick={() => setAlleToelichting((a) => !a)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${
              alleToelichting
                ? 'bg-grass-green text-white border-grass-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-grass-green'
            }`}
          >
            {alleToelichting ? 'Toelichtingen verbergen' : 'Alle toelichtingen tonen'}
          </button>
          <select
            value={vak}
            onChange={(e) => setVak(e.target.value)}
            className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm focus:border-deep-purple focus:outline-none"
          >
            <option value="all">Alle vakken</option>
            {vakken.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {fout && <p className="text-sm text-red-600">{fout}</p>}
      </div>

      {zoekterm.length >= 2 ? (
        <div className="space-y-6">
          {zoeken && (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-deep-purple" />
            </div>
          )}

          {!zoeken && (
            <>
              <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
                <h4 className="font-baloo text-xl text-deep-purple">
                  Leerplandoelen met "{zoekterm}" ({[...trefferGroepen.values()].flat().length})
                </h4>
                {afgekapt && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Er zijn meer dan {MAX_TREFFERS} treffers; verfijn je zoekterm om ze allemaal te zien.
                  </p>
                )}

                {[...trefferGroepen.values()].flat().length === 0 ? (
                  <p className="text-sm text-gray-500">Geen leerplandoelen gevonden met dit woord.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {NET_CODES.filter((n) => netten.includes(n)).map((n) => (
                      <div key={n} className="space-y-2">
                        <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${NET_KLEUREN[n]}`}>
                          {NET_LABELS[n]} ({(trefferGroepen.get(n) ?? []).length})
                        </div>
                        {(trefferGroepen.get(n) ?? []).map((t) => (
                          <div key={t.id} className="bg-cream rounded-2xl p-3">
                            <div className="font-semibold text-sm text-deep-purple">{t.doelnummer}</div>
                            <div className="text-sm text-gray-700">{t.omschrijving}</div>
                            {t.pathLabels.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">{t.pathLabels.join(' › ')}</div>
                            )}
                            <Toelichting toelichting={t.toelichting} standaardOpen={alleToelichting} />
                            <div className="text-xs text-gray-500 mt-1">
                              {t.codes.length > 0
                                ? `Bij minimumdoel ${t.codes.join(', ')}`
                                : 'Geen minimumdoel gekoppeld'}
                            </div>
                          </div>
                        ))}
                        {(trefferGroepen.get(n) ?? []).length === 0 && (
                          <p className="text-xs text-gray-400">Geen treffers bij dit net.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {doelTreffers.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-xl space-y-3">
                  <h4 className="font-baloo text-xl text-deep-purple">
                    Minimumdoelen met "{zoekterm}" ({doelTreffers.length})
                  </h4>
                  <p className="text-sm text-gray-500">
                    Klap een doel open om te zien hoe elk net het invult.
                  </p>
                  {doelTreffers.map((d) => (
                    <DoelRij
                      key={d.code}
                      doel={d}
                      netten={netten}
                      alleToelichting={alleToelichting}
                      open={open === d.code}
                      laden={doelLaden === d.code}
                      leerplandoelen={perDoel.get(d.code) ?? []}
                      onToggle={() => klapOpen(d.code)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-xl space-y-3">
          <h4 className="font-baloo text-xl text-deep-purple">
            Minimumdoelen ({zichtbareDoelen.length})
          </h4>
          <p className="text-sm text-gray-500">
            Klap een doel open om de leerplandoelen van elk net naast elkaar te zien.
          </p>
          {zichtbareDoelen.map((d) => (
            <DoelRij
              key={d.code}
              doel={d}
              netten={netten}
              alleToelichting={alleToelichting}
              open={open === d.code}
              laden={doelLaden === d.code}
              leerplandoelen={perDoel.get(d.code) ?? []}
              onToggle={() => klapOpen(d.code)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** De ondersteunende tekst van het net, ingeklapt: ze is vaak lang. */
function Toelichting({
  toelichting,
  standaardOpen,
}: {
  toelichting?: Record<string, string>;
  standaardOpen: boolean;
}) {
  const [open, setOpen] = useState(standaardOpen);

  // De knop bovenaan zet ze allemaal open of dicht; daarna kan je ze apart bijsturen.
  useEffect(() => {
    setOpen(standaardOpen);
  }, [standaardOpen]);
  const delen = Object.entries(toelichting ?? {});
  if (delen.length === 0) return null;

  return (
    <div className="mt-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="text-xs font-semibold text-deep-purple hover:underline"
      >
        {open ? 'Toelichting verbergen' : 'Toelichting tonen'}
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {delen.map(([label, tekst]) => (
            <div key={label} className="text-xs text-gray-600">
              <span className="font-semibold">{label}: </span>
              {tekst}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DoelRij({
  doel,
  netten,
  open,
  laden,
  leerplandoelen,
  alleToelichting,
  onToggle,
}: {
  doel: DoelNetInfo;
  netten: NetCode[];
  open: boolean;
  laden: boolean;
  leerplandoelen: LeerplandoelVoorExport[];
  alleToelichting: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-cream transition-colors"
      >
        {open ? (
          <ChevronDown className="w-5 h-5 text-deep-purple flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-baloo text-lg text-deep-purple">{doel.code}</span>
            {doel.vakdiscipline && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                {doel.vakdiscipline}
              </span>
            )}
            {/* Per net hoeveel leerplandoelen eraan hangen; 0 zegt evenveel als een getal. */}
            {NET_CODES.filter((n) => netten.includes(n)).map((n) => (
              <span key={n} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${NET_KLEUREN[n]}`}>
                {NET_LABELS[n]}: {(doel.doelnummers[n] ?? []).length}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-700 mt-1">{doel.doelzin}</p>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 bg-gradient-to-br from-cream to-white">
          {laden ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-deep-purple" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {NET_CODES.filter((n) => netten.includes(n)).map((n) => {
                const vanNet = leerplandoelen.filter((l) => l.netCode === n);
                return (
                  <div key={n} className="space-y-2">
                    <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${NET_KLEUREN[n]}`}>
                      {NET_LABELS[n]} ({vanNet.length})
                    </div>
                    {vanNet.map((l) => (
                      <div key={`${l.netCode}-${l.doelnummer}`} className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="font-semibold text-sm text-deep-purple">{l.doelnummer}</div>
                        <div className="text-sm text-gray-700">{l.omschrijving}</div>
                        <Toelichting toelichting={l.toelichting} standaardOpen={alleToelichting} />
                        {l.codes.length > 1 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Ook bij {l.codes.filter((c) => c !== doel.code).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    {vanNet.length === 0 && (
                      <p className="text-xs text-gray-400">
                        {NET_LABELS[n]} heeft geen leerplandoel bij dit minimumdoel.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
