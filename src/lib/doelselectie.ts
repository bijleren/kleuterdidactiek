/*
  Eén lijst met doelen om aan inhoud te koppelen: de minimumdoelen én de
  leerplandoelen van een net.

  Waarom ze in hetzelfde veld passen: doelnummers van leerplandoelen zijn uniek
  over alle netten heen (3179 van 3179) en overlappen nergens met de codes van
  educational_goals ('1.1.1' tot '9.3.5' tegenover '1.2.GJK.1', 'WT.528'). Er is
  dus geen aparte kolom of koppeltabel nodig; goal_codes en goal_code kunnen
  allebei soorten dragen.
*/
import { supabase } from './supabase';
import {
  loadLeerplandoelen,
  NET_LABELS,
  type Leeftijd,
  type NetCode,
} from './leerplandoelen';

export type DoelSoort = 'minimumdoel' | 'leerplandoel';

export interface DoelOptie {
  /** De waarde die in goal_codes / goal_code terechtkomt. */
  code: string;
  soort: DoelSoort;
  omschrijving: string;
  /** Vak of domein, puur om de lijst leesbaar te houden. */
  context: string;
  /**
   * Minimumdoelen waar dit leerplandoel aan hangt. Leeg bij een minimumdoel
   * en bij een leerplandoel dat nergens aan gekoppeld is (de eigen laag).
   */
  minimumdoelen: string[];
  net?: NetCode;
}

/**
 * Wat er bij het aanvinken opgeslagen wordt.
 *
 * Bij een leerplandoel gaan de gekoppelde minimumdoelen mee. De voortgang in
 * deze app wordt per minimumdoelcode gemeten, dus zonder die codes zou werk aan
 * een leerplandoel nergens meetellen — en zou een KATH-klas en een GO!-klas die
 * hetzelfde onderliggende doel oefenen niet meer vergelijkbaar zijn.
 * Dit volgt de knop "+ Aan gewerkt" in het leerplandoelenoverzicht.
 */
export function codesVoorOpslag(optie: DoelOptie): string[] {
  return optie.soort === 'leerplandoel'
    ? [optie.code, ...optie.minimumdoelen]
    : [optie.code];
}

interface MinimumdoelRij {
  code: string;
  title: string | null;
  description: string | null;
  domain: string | null;
  subject: string | null;
}

export async function loadMinimumdoelOpties(): Promise<DoelOptie[]> {
  const { data, error } = await supabase
    .from('educational_goals')
    .select('code, title, description, domain, subject')
    .order('sort_order');
  if (error) throw error;
  return ((data ?? []) as unknown as MinimumdoelRij[]).map((r) => ({
    code: r.code,
    soort: 'minimumdoel' as const,
    omschrijving: r.description || r.title || r.code,
    context: r.subject || r.domain || 'Minimumdoelen',
    minimumdoelen: [],
  }));
}

export async function loadLeerplandoelOpties(
  net: NetCode,
  leeftijd: Leeftijd | 'all',
): Promise<DoelOptie[]> {
  const doelen = await loadLeerplandoelen(net, leeftijd);
  return doelen.map((d) => ({
    code: d.doelnummer,
    soort: 'leerplandoel' as const,
    omschrijving: d.omschrijving,
    context: d.pathLabels[0] || NET_LABELS[net],
    minimumdoelen: d.codes,
    net,
  }));
}

/**
 * De volledige keuzelijst voor de huidige filterstand.
 *
 * Zonder net (het filter staat open, of de school vulde niets in) zijn er geen
 * leerplandoelen om te tonen: een leerplandoel bestaat alleen binnen een net.
 * Dan blijven de minimumdoelen over, precies zoals voorheen.
 */
export async function loadDoelOpties(
  net: NetCode | 'all',
  leeftijd: Leeftijd | 'all',
): Promise<DoelOptie[]> {
  const minimum = await loadMinimumdoelOpties();
  if (net === 'all') return minimum;
  const leerplan = await loadLeerplandoelOpties(net, leeftijd);
  return [...minimum, ...leerplan];
}

/* ---------- labels voor reeds opgeslagen codes ---------- */

export interface DoelLabel {
  code: string;
  soort: DoelSoort;
  omschrijving: string;
  net?: NetCode;
}

/*
  Opgeslagen codes kunnen uit elk net komen, ook uit een net dat deze gebruiker
  niet gekozen heeft. De keuzelijst volstaat dus niet om ze te benoemen; we
  zoeken ze apart op. Wat we ophaalden blijft in deze module hangen, zodat
  hetzelfde doel niet per scherm opnieuw wordt bevraagd.
*/
const labelCache = new Map<string, DoelLabel>();

export async function loadDoelLabels(codes: string[]): Promise<Map<string, DoelLabel>> {
  const uniek = [...new Set(codes.filter(Boolean))];
  const ontbreekt = uniek.filter((c) => !labelCache.has(c));

  if (ontbreekt.length > 0) {
    const [minimumRes, leerplanRes] = await Promise.all([
      supabase
        .from('educational_goals')
        .select('code, title, description')
        .in('code', ontbreekt),
      supabase
        .from('leerplandoelen')
        .select('doelnummer, omschrijving, net_code')
        .in('doelnummer', ontbreekt),
    ]);

    for (const r of (minimumRes.data ?? []) as unknown as {
      code: string; title: string | null; description: string | null;
    }[]) {
      labelCache.set(r.code, {
        code: r.code,
        soort: 'minimumdoel',
        omschrijving: r.description || r.title || r.code,
      });
    }
    for (const r of (leerplanRes.data ?? []) as unknown as {
      doelnummer: string; omschrijving: string; net_code: NetCode;
    }[]) {
      labelCache.set(r.doelnummer, {
        code: r.doelnummer,
        soort: 'leerplandoel',
        omschrijving: r.omschrijving,
        net: r.net_code,
      });
    }
    // Codes die nergens (meer) bestaan: onthouden als onbekend, niet blijven zoeken.
    for (const c of ontbreekt) {
      if (!labelCache.has(c)) {
        labelCache.set(c, { code: c, soort: 'minimumdoel', omschrijving: c });
      }
    }
  }

  return new Map(uniek.map((c) => [c, labelCache.get(c)!]));
}
