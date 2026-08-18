import { supabase } from './supabase';

/**
 * Leerplandoelen per onderwijsnet, gekoppeld aan de officiele minimumdoelen.
 *
 * De app kent drie lagen:
 *  - minimumdoelen        het officiele register (208 kleuterdoelen)
 *  - educational_goals    de gecureerde onderwijsversie van de app (128)
 *  - leerplandoelen       hoe elk net die doelen invult (2.114)
 *
 * Een doel zonder minimumdoel is een eigen doel van de app en komt in geen
 * van beide netten voor. Dat is bewust, geen ontbrekende data.
 */

export type NetCode = 'KATH' | 'GO' | 'OVSG';
export type Leeftijd = '2,5-4' | '4-5' | '5-6';
export type Precisie = 'direct' | 'afgeleid';

export const LEEFTIJDEN: Leeftijd[] = ['2,5-4', '4-5', '5-6'];
export const NET_CODES: NetCode[] = ['KATH', 'GO', 'OVSG'];

export const NET_LABELS: Record<NetCode, string> = {
  KATH: 'Katholiek Onderwijs',
  GO: 'GO!',
  OVSG: 'OVSG',
};

export const NET_KLEUREN: Record<NetCode, string> = {
  KATH: 'bg-purple-100 text-purple-800',
  GO: 'bg-teal-100 text-teal-800',
  OVSG: 'bg-orange-100 text-orange-800',
};

/** Per minimumdoelcode: wat de netten ermee doen, per leeftijdsgroep. */
export interface DoelNetInfo {
  code: string;
  vakdiscipline: string;
  onderwerp: string | null;
  doelzin: string;
  isTeBereiken: boolean;
  /** Per net de leeftijdsgroepen waarin eraan gewerkt wordt. */
  perNet: Partial<Record<NetCode, Leeftijd[]>>;
  /** Doelnummers van de leerplandoelen, per net. */
  doelnummers: Partial<Record<NetCode, string[]>>;
}

/** Per woord: bij welk net en welke leeftijd het hoort, en hoe hard die uitspraak is. */
export interface WoordNetInfo {
  word: string;
  perNet: Partial<Record<NetCode, { leeftijden: Leeftijd[]; precisie: Precisie }>>;
}

/**
 * De gegenereerde Database-types worden in dit project niet correct opgelost
 * door de supabase-client (elke rij komt binnen als `never`; zie de bestaande
 * typefouten elders). Daarom typeren we de rijen hier expliciet in plaats van
 * te leunen op de inferentie van de client.
 */
/**
 * De view herhaalt de doeltekst voor elke combinatie van net en leeftijd — tot
 * negen keer per code, samen ruim 400 kB aan dubbele tekst. We halen daarom
 * alleen de koppeling uit de view en de teksten eenmalig uit minimumdoelen.
 */
interface DoelRow {
  net_code: string;
  leeftijd: string;
  code: string;
  doelnummers: string[] | null;
}

interface MinimumdoelRow {
  code: string;
  vakdiscipline: string;
  onderwerp: string | null;
  doelzin: string;
  is_te_bereiken: boolean;
}

interface WoordRow {
  word: string;
  net_code: string;
  leeftijd_25_4: boolean;
  leeftijd_4_5: boolean;
  leeftijd_5_6: boolean;
  precisie: string;
}

/**
 * Haalt alle rijen op, ook boven de duizend.
 *
 * PostgREST levert standaard maximaal 1000 rijen en zegt daar niets over. Met
 * drie netten zitten zowel de woordview (1371) als de doelenview (1348) en de
 * leerplandoelen per net (tot 1121) daarboven; zonder paginering verdwijnt de
 * staart stilzwijgend en lijken woorden bij geen enkel net te horen.
 */
const PAGINA = 1000;

/**
 * Deze gegevens zijn referentiedata: voor elke gebruiker identiek en pas anders
 * wanneer wij een net herladen. Zonder cache haalt elke gebruiker ze bij elk
 * paginabezoek opnieuw op, wat bij honderden leerkrachten flink oploopt.
 *
 * Verhoog CACHE_VERSIE na het herladen van een net, dan halen alle browsers de
 * nieuwe gegevens op in plaats van te wachten tot de bewaartijd verstrijkt.
 */
const CACHE_VERSIE = 'v1-2026-08-17';
const CACHE_UREN = 24;

function uitCache<T>(sleutel: string): T | null {
  try {
    const ruw = localStorage.getItem(`kd.cache.${CACHE_VERSIE}.${sleutel}`);
    if (!ruw) return null;
    const { tijd, data } = JSON.parse(ruw) as { tijd: number; data: T };
    if (Date.now() - tijd > CACHE_UREN * 3600_000) return null;
    return data;
  } catch {
    return null; // beschadigde of geblokkeerde opslag: gewoon opnieuw ophalen
  }
}

function naarCache(sleutel: string, data: unknown): void {
  try {
    const volle = `kd.cache.${CACHE_VERSIE}.${sleutel}`;
    localStorage.setItem(volle, JSON.stringify({ tijd: Date.now(), data }));
    // oudere versies opruimen zodat de opslag niet volloopt
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('kd.cache.') && !k.startsWith(`kd.cache.${CACHE_VERSIE}.`)) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* opslag vol of geblokkeerd: cache is een gemak, geen vereiste */
  }
}

async function haalAlles<T>(
  bouw: () => { range: (van: number, tot: number) => PromiseLike<{ data: unknown; error: unknown }> }
): Promise<{ rijen: T[]; error: unknown }> {
  const alles: T[] = [];
  for (let van = 0; ; van += PAGINA) {
    const { data, error } = await bouw().range(van, van + PAGINA - 1);
    if (error) return { rijen: alles, error };
    const blok = (data ?? []) as T[];
    alles.push(...blok);
    if (blok.length < PAGINA) break;
  }
  return { rijen: alles, error: null };
}

const isNet = (v: string): v is NetCode =>
  v === 'KATH' || v === 'GO' || v === 'OVSG';
const isLeeftijd = (v: string): v is Leeftijd =>
  v === '2,5-4' || v === '4-5' || v === '5-6';

function leeftijdenVan(row: {
  leeftijd_25_4: boolean;
  leeftijd_4_5: boolean;
  leeftijd_5_6: boolean;
}): Leeftijd[] {
  const out: Leeftijd[] = [];
  if (row.leeftijd_25_4) out.push('2,5-4');
  if (row.leeftijd_4_5) out.push('4-5');
  if (row.leeftijd_5_6) out.push('5-6');
  return out;
}

/**
 * Laadt per minimumdoelcode wat beide netten ermee doen.
 * Sleutel van de map is de code, bv. '3.5.4'.
 */
export async function loadDoelNetInfo(): Promise<Map<string, DoelNetInfo>> {
  const map = new Map<string, DoelNetInfo>();

  const bewaard = uitCache<{ koppeling: DoelRow[]; tekst: MinimumdoelRow[] }>('doelen');
  let koppeling: DoelRow[];
  let tekst: MinimumdoelRow[];

  if (bewaard) {
    ({ koppeling, tekst } = bewaard);
  } else {
    const [k, t] = await Promise.all([
      haalAlles<DoelRow>(() =>
        supabase
          .from('v_doelen_per_leeftijd_en_net')
          .select('net_code, leeftijd, code, doelnummers')
          .order('code') as never
      ),
      haalAlles<MinimumdoelRow>(() =>
        supabase
          .from('minimumdoelen')
          .select('code, vakdiscipline, onderwerp, doelzin, is_te_bereiken')
          .order('code') as never
      ),
    ]);
    if (k.error || t.error) {
      console.error('Leerplandoelen laden mislukt:', k.error || t.error);
      return map;
    }
    koppeling = k.rijen;
    tekst = t.rijen;
    naarCache('doelen', { koppeling, tekst });
  }

  const teksten = new Map(tekst.map((m) => [m.code, m]));

  for (const row of koppeling) {
    if (!isNet(row.net_code) || !isLeeftijd(row.leeftijd)) continue;

    let info = map.get(row.code);
    if (!info) {
      const m = teksten.get(row.code);
      info = {
        code: row.code,
        vakdiscipline: m?.vakdiscipline ?? '',
        onderwerp: m?.onderwerp ?? null,
        doelzin: m?.doelzin ?? '',
        isTeBereiken: m?.is_te_bereiken ?? false,
        perNet: {},
        doelnummers: {},
      };
      map.set(row.code, info);
    }

    const leeftijden = info.perNet[row.net_code] || [];
    if (!leeftijden.includes(row.leeftijd)) leeftijden.push(row.leeftijd);
    leeftijden.sort((a, b) => LEEFTIJDEN.indexOf(a) - LEEFTIJDEN.indexOf(b));
    info.perNet[row.net_code] = leeftijden;

    const nrs = info.doelnummers[row.net_code] || [];
    for (const nr of row.doelnummers || []) if (!nrs.includes(nr)) nrs.push(nr);
    info.doelnummers[row.net_code] = nrs;
  }

  return map;
}

/**
 * Laadt per woord bij welk net en welke leeftijd het hoort.
 * Sleutel van de map is het woord in kleine letters.
 *
 * De view kiest zelf al de scherpste bron: bestaat er een directe treffer voor
 * een woord/net-combinatie, dan wordt de afgeleide onderdrukt.
 */
export async function loadWoordNetInfo(): Promise<Map<string, WoordNetInfo>> {
  const map = new Map<string, WoordNetInfo>();

  let rijen = uitCache<WoordRow[]>('woorden');
  if (!rijen) {
    const uit = await haalAlles<WoordRow>(() =>
      supabase
        .from('v_woord_per_net_en_leeftijd')
        .select('word, net_code, leeftijd_25_4, leeftijd_4_5, leeftijd_5_6, precisie')
        .order('word') as never
    );
    if (uit.error) {
      console.error('Woordkoppeling laden mislukt:', uit.error);
      return map;
    }
    rijen = uit.rijen;
    naarCache('woorden', rijen);
  }

  for (const row of rijen) {
    if (!isNet(row.net_code)) continue;
    const key = row.word.toLowerCase();
    let info = map.get(key);
    if (!info) {
      info = { word: row.word, perNet: {} };
      map.set(key, info);
    }
    info.perNet[row.net_code] = {
      leeftijden: leeftijdenVan(row),
      precisie: row.precisie === 'direct' ? 'direct' : 'afgeleid',
    };
  }

  return map;
}

/** Eén leerplandoel van een net, met de minimumdoelen waaraan het hangt. */
export interface Leerplandoel {
  id: string;
  netCode: NetCode;
  doelnummer: string;
  doelnummers: string[];
  omschrijving: string;
  /** Hiërarchie van het net: vak › domein › subdomein › cluster (Op.stap) of
   *  vak › onderwerp › subthema › rubriek (GO!). Lege niveaus zijn weggelaten. */
  path: string[];
  pathLabels: string[];
  leeftijden: Leeftijd[];
  /** Codes van de officiele minimumdoelen waaraan dit doel gekoppeld is. */
  codes: string[];
  /**
   * Netspecifieke velden. OVSG zet hier zijn eigen leeftijdsgroep in
   * ('3de kleuterklas (5)'), Op.stap de routedoelenset ('G' of '+').
   */
  extra: Record<string, unknown>;
}

interface LeerplandoelRow {
  id: string;
  doelnummer: string;
  doelnummers: string[] | null;
  omschrijving: string;
  path: string[] | null;
  path_labels: string[] | null;
  leeftijd_25_4: boolean;
  leeftijd_4_5: boolean;
  leeftijd_5_6: boolean;
  bron_volgorde: number | null;
  extra: Record<string, unknown> | null;
}

/**
 * Laadt de leerplandoelen van één net, eventueel beperkt tot één leeftijdsgroep.
 *
 * Dit is een andere laag dan `educational_goals`: daar staan de minimumdoelen,
 * hier staat hoe een net die invult. Eén minimumdoel kan door tientallen
 * leerplandoelen bediend worden.
 */
export async function loadLeerplandoelen(
  net: NetCode,
  leeftijd: Leeftijd | 'all'
): Promise<Leerplandoel[]> {
  const bouw = () => {
    let q = supabase
      .from('leerplandoelen')
      .select(
        'id, doelnummer, doelnummers, omschrijving, path, path_labels, leeftijd_25_4, leeftijd_4_5, leeftijd_5_6, bron_volgorde, extra'
      )
      .eq('net_code', net);
    if (leeftijd === '2,5-4') q = q.eq('leeftijd_25_4', true);
    else if (leeftijd === '4-5') q = q.eq('leeftijd_4_5', true);
    else if (leeftijd === '5-6') q = q.eq('leeftijd_5_6', true);
    return q.order('bron_volgorde', { ascending: true }) as never;
  };

  const { rijen: rows, error } = await haalAlles<LeerplandoelRow>(bouw);
  if (error) {
    console.error('Leerplandoelen laden mislukt:', error);
    return [];
  }
  if (rows.length === 0) return [];

  // Koppelingen apart ophalen: een embedded select zou bij deze aantallen een
  // fors zwaardere query worden, en we hebben alleen de codes nodig.
  const codesPerDoel = new Map<string, string[]>();
  const ids = rows.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 500) {
    const groep = ids.slice(i, i + 500);
    // Ook hier pagineren: een doel kan meerdere minimumdoelen hebben, dus
    // 500 id's kunnen ruim meer dan 1000 koppelingen opleveren.
    const { rijen: koppelingen, error: kErr } = await haalAlles<{
      leerplandoel_id: string;
      code: string;
    }>(() =>
      supabase
        .from('leerplandoel_minimumdoelen')
        .select('leerplandoel_id, code')
        .in('leerplandoel_id', groep)
        .order('leerplandoel_id') as never
    );
    if (kErr) {
      console.error('Koppelingen laden mislukt:', kErr);
      break;
    }
    for (const k of koppelingen) {
      const lijst = codesPerDoel.get(k.leerplandoel_id) || [];
      if (!lijst.includes(k.code)) lijst.push(k.code);
      codesPerDoel.set(k.leerplandoel_id, lijst);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    netCode: net,
    doelnummer: r.doelnummer,
    doelnummers: r.doelnummers ?? [r.doelnummer],
    omschrijving: r.omschrijving,
    path: (r.path ?? []).filter((p) => p && p.trim() !== ''),
    pathLabels: r.path_labels ?? [],
    leeftijden: leeftijdenVan(r),
    codes: (codesPerDoel.get(r.id) || []).sort(),
    extra: r.extra ?? {},
  }));
}

/**
 * Voldoet dit doel aan het gekozen net- en leeftijdsfilter?
 *
 * Een doel zonder netinformatie (eigen doel van de app) valt weg zodra er op
 * net of leeftijd gefilterd wordt: die doelen komen in geen van beide netten
 * voor, dus ze horen niet in zo'n selectie thuis.
 */
export function voldoetAanNetLeeftijd(
  info: DoelNetInfo | undefined,
  net: NetCode | 'all',
  leeftijd: Leeftijd | 'all'
): boolean {
  if (net === 'all' && leeftijd === 'all') return true;
  if (!info) return false;

  const netten: NetCode[] = net === 'all' ? NET_CODES : [net];
  return netten.some((n) => {
    const l = info.perNet[n];
    if (!l || l.length === 0) return false;
    return leeftijd === 'all' || l.includes(leeftijd);
  });
}

/** Leest een bewaarde filterkeuze uit localStorage, met terugval op een standaard. */
export function leesFilter<T extends string>(sleutel: string, geldig: readonly T[], standaard: T | 'all'): T | 'all' {
  try {
    const v = localStorage.getItem(sleutel);
    if (v === 'all') return 'all';
    if (v && (geldig as readonly string[]).includes(v)) return v as T;
  } catch {
    /* localStorage kan geblokkeerd zijn; standaard volstaat dan */
  }
  return standaard;
}

/**
 * Leest de bewaarde filterkeuze van net en leeftijd samen.
 *
 * Een leeftijdsgroep hoort bij een leerplan, niet bij de minimumdoelen. Staat
 * het net op 'all', dan wordt een bewaarde leeftijd genegeerd: anders zou er
 * een filter actief zijn dat nergens in de interface zichtbaar is.
 */
export function leesNetEnLeeftijd(): { net: NetCode | 'all'; leeftijd: Leeftijd | 'all' } {
  const net = leesFilter<NetCode>('kd.netFilter', NET_CODES, 'all');
  const leeftijd =
    net === 'all' ? 'all' : leesFilter<Leeftijd>('kd.leeftijdFilter', LEEFTIJDEN, 'all');
  return { net, leeftijd };
}

export function bewaarFilter(sleutel: string, waarde: string): void {
  try {
    localStorage.setItem(sleutel, waarde);
  } catch {
    /* bewaren is een gemak, geen vereiste */
  }
}
