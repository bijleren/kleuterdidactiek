/*
  Bewegingen uit de leerplandoelen lichamelijke opvoeding (minimumdoelen 7.x).

  De drie netten beschrijven dezelfde bewegingen in een heel andere stijl. GO!
  is kort en werkwoordelijk ("Verplaatsen zich door te springen."), Katholiek
  Onderwijs beschrijvend en met context ("springen van lage hoogte (lage blok,
  mat) en gecontroleerd landen op beide voeten"). Wie wil weten wat een kleuter
  moet kunnen, moet dus door drie verschillende formuleringen heen.

  Deze lijst draait het om: de beweging staat centraal, de leerplandoelen
  hangen eronder. De werkwoorden komen uit de data zelf — een telling over alle
  doelen onder 7.x — niet uit een aanname. De meeste bewegingen komen in alle
  drie de netten voor.

  De interpretatie is onze eigen omschrijving in gewone taal; de doelzin van het
  net staat er in het scherm naast, zodat je altijd het origineel ziet.
*/
import { supabase } from './supabase';
import { NET_CODES, type Leeftijd, type NetCode, type OvsgGroep } from './leerplandoelen';

/*
  Woordgrens die ook met accenten overweg kan. \b in JavaScript kijkt alleen
  naar ASCII, dus /\béén/ matcht nooit — precies het geval "op één voet".
*/
const G = String.raw`(?<![\p{L}])`;
const E = String.raw`(?![\p{L}])`;

export interface Beweging {
  id: string;
  beweging: string;
  interpretatie: string;
  /** Waar in de doeltekst deze beweging aan te herkennen is. */
  patroon: RegExp;
  groep: 'verplaatsen' | 'evenwicht' | 'materiaal' | 'samen';
}

export const BEWEGINGEN: Beweging[] = [
  // verplaatsen
  { id: 'stappen', beweging: 'Stappen en lopen', groep: 'verplaatsen',
    interpretatie: 'Vrij en doelgericht stappen en lopen, van richting veranderen en hindernissen ontwijken.',
    patroon: new RegExp(`${G}(stapp|lopen|lopend|wandel)`, 'iu') },
  { id: 'sluipen', beweging: 'Sluipen en kruipen', groep: 'verplaatsen',
    interpretatie: 'Laag bij de grond bewegen op handen en voeten, door en onder hindernissen.',
    patroon: new RegExp(`${G}(sluip|kruip)`, 'iu') },
  { id: 'klauteren', beweging: 'Klauteren', groep: 'verplaatsen',
    interpretatie: 'Over en op lage, brede toestellen gaan waarbij handen en voeten samenwerken.',
    patroon: new RegExp(`${G}klauter`, 'iu') },
  { id: 'klimmen', beweging: 'Klimmen', groep: 'verplaatsen',
    interpretatie: 'Omhoog gaan aan een klimrek of ladder, met aandacht voor veilig afdalen.',
    patroon: new RegExp(`${G}klim(?!rek)`, 'iu') },
  { id: 'springen', beweging: 'Springen en landen', groep: 'verplaatsen',
    interpretatie: 'Ter plaatse en van lage hoogte springen, en gecontroleerd landen op twee voeten.',
    patroon: new RegExp(`${G}(spring|sprong)`, 'iu') },
  { id: 'huppelen', beweging: 'Huppelen en hinkelen', groep: 'verplaatsen',
    interpretatie: 'Op één been hinken en huppelend voortbewegen; vraagt al meer coördinatie dan springen.',
    patroon: new RegExp(`${G}(huppel|huppen|hinkel|hinken)`, 'iu') },
  { id: 'rollen', beweging: 'Rollen en draaien', groep: 'verplaatsen',
    interpretatie: 'Om de lengteas rollen, op een mat of een hellend vlak.',
    patroon: new RegExp(`${G}(rollen|rolt|roteer|rotatie|draai)`, 'iu') },
  { id: 'glijden', beweging: 'Glijden', groep: 'verplaatsen',
    interpretatie: 'Over een glijbaan of schuin vlak naar beneden glijden.',
    patroon: new RegExp(`${G}glij`, 'iu') },
  { id: 'rijden', beweging: 'Rijden op materiaal', groep: 'verplaatsen',
    interpretatie: 'Zich voortbewegen op loopfiets, step of ander rijdend materiaal.',
    patroon: new RegExp(`${G}(rijden|rijdend|fiets|step)`, 'iu') },

  // evenwicht
  { id: 'balanceren', beweging: 'Balanceren', groep: 'evenwicht',
    interpretatie: 'Evenwicht bewaren op een bank, lijn of smal vlak, eerst breed en laag, daarna smaller en hoger.',
    patroon: new RegExp(`${G}(balanceer|balanceren|evenwicht)`, 'iu') },
  { id: 'eenbeen', beweging: 'Op één voet staan', groep: 'evenwicht',
    interpretatie: 'Even stil blijven staan op één voet, met of zonder steun.',
    patroon: new RegExp(`${G}(\u00e9\u00e9n voet|een voet|eenbenig)`, 'iu') },
  { id: 'hangen', beweging: 'Hangen aan een toestel', groep: 'evenwicht',
    interpretatie: 'Het eigen lichaamsgewicht kort dragen aan een rekstok of klimrek.',
    patroon: new RegExp(`${G}hang`, 'iu') },
  { id: 'schommelen', beweging: 'Schommelen', groep: 'evenwicht',
    interpretatie: 'Zittend of hangend schommelen en de beweging op gang houden.',
    patroon: new RegExp(`${G}schommel`, 'iu') },

  // materiaal
  { id: 'werpen', beweging: 'Werpen en gooien', groep: 'materiaal',
    interpretatie: 'Een bal of voorwerp wegwerpen, met en zonder doel om op te mikken.',
    patroon: new RegExp(`${G}(werp|gooi)`, 'iu') },
  { id: 'vangen', beweging: 'Vangen', groep: 'materiaal',
    interpretatie: 'Een traag aangegooid voorwerp opvangen, eerst met het hele lichaam, later met de handen.',
    patroon: new RegExp(`${G}vang`, 'iu') },
  { id: 'trappen', beweging: 'Trappen tegen een bal', groep: 'materiaal',
    interpretatie: 'Vanuit stilstand tegen een bal trappen, later ook in beweging.',
    patroon: new RegExp(`${G}trap`, 'iu') },
  { id: 'dragen', beweging: 'Heffen en dragen', groep: 'materiaal',
    interpretatie: 'Licht materiaal oppakken, vasthouden en verplaatsen zonder het te laten vallen.',
    // Niet 'dragen ... lichaamsgewicht': dat is hangen, geen materiaal dragen.
    patroon: new RegExp(`${G}(heffen|heft|oppakk|vasthoud|(dragen|draagt)(?!.*lichaamsgewicht))`, 'iu') },

  // samen
  { id: 'duwentrekken', beweging: 'Duwen en trekken', groep: 'samen',
    interpretatie: 'Speels en gecontroleerd duwen en trekken, met materiaal of met elkaar.',
    patroon: new RegExp(`${G}(duwen|duw${E}|trekken|trekt)`, 'iu') },
  { id: 'signalen', beweging: 'Reageren op een signaal', groep: 'samen',
    interpretatie: 'Starten, stoppen of van richting veranderen op een afgesproken teken.',
    patroon: new RegExp(`${G}(signaal|signalen|teken${E}|afgesproken)`, 'iu') },
  { id: 'spelregels', beweging: 'Spelregels volgen', groep: 'samen',
    interpretatie: 'Binnen een eenvoudig spel één tot twee regels onthouden en toepassen.',
    patroon: new RegExp(`${G}(spelregel|regels van het spel)`, 'iu') },
  { id: 'durf', beweging: 'Durf tonen', groep: 'samen',
    interpretatie: 'Iets nieuws of wat spannends proberen, op eigen tempo.',
    patroon: new RegExp(`${G}durv?[e]?[nf]?`, 'iu') },
];

export interface BewegingDoel {
  net: NetCode;
  doelnummer: string;
  omschrijving: string;
  minimumdoelen: string[];
}

export interface BewegingMetDoelen {
  beweging: Beweging;
  perNet: Record<NetCode, BewegingDoel[]>;
  netten: NetCode[];
}

interface Rij {
  id: string;
  net_code: NetCode;
  doelnummer: string;
  omschrijving: string;
  leeftijd_25_4: boolean;
  leeftijd_4_5: boolean;
  leeftijd_5_6: boolean;
  extra: Record<string, unknown> | null;
}

/**
 * Alle bewegingen met de leerplandoelen die ze beschrijven.
 *
 * Filtert op net, leeftijd en — bij OVSG — hun eigen leerjaar. Bewegingen
 * zonder enig doel binnen de selectie vallen weg, zodat de lijst niet volloopt
 * met lege regels.
 */
export async function loadBewegingen(
  net: NetCode | 'all',
  leeftijd: Leeftijd | 'all',
  ovsgGroep: OvsgGroep | 'all' = 'all',
): Promise<BewegingMetDoelen[]> {
  const { data: koppelingen, error: kFout } = await supabase
    .from('leerplandoel_minimumdoelen')
    .select('leerplandoel_id, code')
    .like('code', '7.%');
  if (kFout) throw kFout;

  const rijen = (koppelingen ?? []) as unknown as { leerplandoel_id: string; code: string }[];
  const codesPerDoel = new Map<string, string[]>();
  for (const r of rijen) {
    if (!codesPerDoel.has(r.leerplandoel_id)) codesPerDoel.set(r.leerplandoel_id, []);
    codesPerDoel.get(r.leerplandoel_id)!.push(r.code);
  }
  const ids = [...codesPerDoel.keys()];
  if (ids.length === 0) return [];

  let q = supabase
    .from('leerplandoelen')
    .select('id, net_code, doelnummer, omschrijving, leeftijd_25_4, leeftijd_4_5, leeftijd_5_6, extra')
    .in('id', ids);
  if (net !== 'all') q = q.eq('net_code', net);
  /*
    Bij OVSG is het leerjaar het leeftijdsfilter; de gedeelde band mag er dan
    niet bovenop komen. Deed hij dat wel, dan bleef bij "Alle leerjaren" de band
    van de klas hangen en zag je minder dan bij een los leerjaar.
  */
  if (net === 'OVSG') {
    if (ovsgGroep !== 'all') q = q.eq('extra->>leeftijdsgroep', ovsgGroep);
  } else if (leeftijd === '2,5-4') q = q.eq('leeftijd_25_4', true);
  else if (leeftijd === '4-5') q = q.eq('leeftijd_4_5', true);
  else if (leeftijd === '5-6') q = q.eq('leeftijd_5_6', true);

  const { data, error } = await q;
  if (error) throw error;
  const doelen = (data ?? []) as unknown as Rij[];

  return BEWEGINGEN.map((b) => {
    const perNet = { KATH: [], GO: [], OVSG: [] } as Record<NetCode, BewegingDoel[]>;
    const gezien = new Set<string>();
    for (const d of doelen) {
      if (!b.patroon.test(d.omschrijving)) continue;
      // Netten herhalen dezelfde zin onder verschillende nummers; één per tekst.
      const sleutel = `${d.net_code}|${d.omschrijving.trim().toLowerCase()}`;
      if (gezien.has(sleutel)) continue;
      gezien.add(sleutel);
      perNet[d.net_code]?.push({
        net: d.net_code,
        doelnummer: d.doelnummer,
        omschrijving: d.omschrijving.trim(),
        minimumdoelen: codesPerDoel.get(d.id) ?? [],
      });
    }
    for (const n of NET_CODES) {
      perNet[n].sort((x, y) => x.doelnummer.localeCompare(y.doelnummer, 'nl', { numeric: true }));
    }
    return { beweging: b, perNet, netten: NET_CODES.filter((n) => perNet[n].length > 0) };
  }).filter((x) => x.netten.length > 0);
}
