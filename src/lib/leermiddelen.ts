/*
  Leermiddelen die de leerplannen zelf benoemen.

  Anders dan de bewegingen in lichamelijkeOpvoeding gaat dit dwars door alle
  vakken: een spiegel komt terug bij wetenschap én muzische vorming, geld bij
  wiskunde én burgerschap. Er is dus geen domein om op te filteren; de tekst
  van het doel is de enige aanwijzing.

  De lijst is uit de data gehaald, niet verzonnen: een telling over alle
  leerplandoelen en minimumdoelen (doelzin, uitbreiding en woordenschat samen).
  Wat er niet in stond is er ook niet: een rekenmachine bijvoorbeeld komt in
  geen enkel kleuterdoel voor, ook al bestaat er een oefenvorm voor.
*/
import { supabase } from './supabase';
import { compareGoalCodes } from '../utils/goalSort';
import type { Leeftijd, NetCode, OvsgGroep } from './leerplandoelen';

const G = String.raw`(?<![\p{L}])`;

export interface Leermiddel {
  id: string;
  naam: string;
  toelichting: string;
  patroon: RegExp;
  groep: 'meten' | 'ontdekken' | 'creatief' | 'taal' | 'spel';
}

export const LEERMIDDELEN: Leermiddel[] = [
  // meten en rekenen
  { id: 'weegschaal', naam: 'Weegschaal of balans', groep: 'meten',
    toelichting: 'Om massa te vergelijken en te wegen: eerst zwaarder of lichter, later met maten.',
    patroon: new RegExp(`${G}(weegschaal|balans)`, 'iu') },
  { id: 'maatbeker', naam: 'Maatbeker en reservoirs', groep: 'meten',
    toelichting: 'Om inhoud te vergelijken en over te gieten tussen potten van verschillende vorm.',
    patroon: new RegExp(`${G}(maatbeker|maatglas|reservoir)`, 'iu') },
  { id: 'meetlat', naam: 'Meetlat of liniaal', groep: 'meten',
    toelichting: 'Om lengte te vergelijken en af te meten, ook met natuurlijke maten zoals voeten.',
    patroon: new RegExp(`${G}(meetlat|liniaal)`, 'iu') },
  { id: 'klok', naam: 'Klok en zandloper', groep: 'meten',
    toelichting: 'Om tijdsduur te ervaren en gebeurtenissen in de dag te plaatsen.',
    patroon: new RegExp(`${G}(klok|uurwerk|zandloper)`, 'iu') },
  { id: 'kalender', naam: 'Kalender', groep: 'meten',
    toelichting: 'Om de dag, de week en het jaar te structureren en vooruit te kijken.',
    patroon: new RegExp(`${G}kalender`, 'iu') },
  { id: 'geld', naam: 'Geld: munten en biljetten', groep: 'meten',
    toelichting: 'Om te betalen in een winkelhoek en de waarde van munten te leren kennen.',
    patroon: new RegExp(`${G}(munt|briefgeld|geld)`, 'iu') },
  { id: 'thermometer', naam: 'Thermometer', groep: 'meten',
    toelichting: 'Om warm en koud te vergelijken en de temperatuur af te lezen.',
    patroon: new RegExp(`${G}thermometer`, 'iu') },

  // ontdekken
  { id: 'spiegel', naam: 'Spiegel', groep: 'ontdekken',
    toelichting: 'Om symmetrie te onderzoeken, licht te weerkaatsen en jezelf te bekijken.',
    patroon: new RegExp(`${G}spiegel`, 'iu') },
  { id: 'vergrootglas', naam: 'Vergrootglas of loep', groep: 'ontdekken',
    toelichting: 'Om kleine dingen van dichtbij te bekijken: blaadjes, insecten, structuren.',
    patroon: new RegExp(`${G}(vergrootglas|loep)`, 'iu') },
  { id: 'lamp', naam: 'Lamp of zaklamp', groep: 'ontdekken',
    toelichting: 'Om licht en schaduw te onderzoeken, en donker en licht te vergelijken.',
    patroon: new RegExp(`${G}(lamp|zaklamp)`, 'iu') },
  { id: 'magneet', naam: 'Magneet', groep: 'ontdekken',
    toelichting: 'Om te ontdekken wat aantrekt en afstoot, en welke materialen magnetisch zijn.',
    patroon: new RegExp(`${G}magneet`, 'iu') },
  { id: 'landkaart', naam: 'Landkaart of plattegrond', groep: 'ontdekken',
    toelichting: 'Om een ruimte van bovenaf te bekijken en een route te volgen.',
    patroon: new RegExp(`${G}(landkaart|plattegrond|kompas)`, 'iu') },
  { id: 'camera', naam: 'Camera', groep: 'ontdekken',
    toelichting: 'Om waarnemingen vast te leggen en later samen te bekijken.',
    patroon: new RegExp(`${G}camera`, 'iu') },
  { id: 'computer', naam: 'Computer of tablet', groep: 'ontdekken',
    toelichting: 'Om digitaal materiaal te bekijken en eenvoudige opdrachten uit te voeren.',
    patroon: new RegExp(`${G}(computer|tablet|digitaal bord)`, 'iu') },

  // creatief
  { id: 'verf', naam: 'Verf en penseel', groep: 'creatief',
    toelichting: 'Om te schilderen, kleuren te mengen en met druk te experimenteren.',
    patroon: new RegExp(`${G}(verf|penseel)`, 'iu') },
  { id: 'potlood', naam: 'Potlood en stift', groep: 'creatief',
    toelichting: 'Om te tekenen en te schrijven, van dik materiaal naar fijne lijnen.',
    patroon: new RegExp(`${G}(potlood|stift|marker|krijt)`, 'iu') },
  { id: 'papier', naam: 'Papier', groep: 'creatief',
    toelichting: 'Om op te tekenen, te vouwen, te scheuren en te knippen.',
    patroon: new RegExp(`${G}papier`, 'iu') },
  { id: 'schaar', naam: 'Schaar en lijm', groep: 'creatief',
    toelichting: 'Om te knippen en te plakken; oefent de fijne motoriek en samenwerking van beide handen.',
    patroon: new RegExp(`${G}(schaar|lijm)`, 'iu') },
  { id: 'muziekinstrument', naam: 'Muziekinstrumenten', groep: 'creatief',
    toelichting: 'Trom, triangel, tamboerijn of fluit: om ritme en klank te verkennen.',
    patroon: new RegExp(`${G}(trom|triangel|tamboerijn|fluit|instrument)`, 'iu') },

  // taal
  { id: 'boek', naam: 'Prentenboek', groep: 'taal',
    toelichting: 'Om voor te lezen, te navertellen en de functie van schrift te ontdekken.',
    patroon: new RegExp(`${G}boek`, 'iu') },
  { id: 'pictogram', naam: 'Pictogrammen en symbolen', groep: 'taal',
    toelichting: 'Om de dagindeling te tonen, afspraken te maken en boodschappen zonder letters te lezen.',
    patroon: new RegExp(`${G}(pictogram|symbol)`, 'iu') },
  { id: 'foto', naam: "Foto's", groep: 'taal',
    toelichting: 'Om gebeurtenissen te herinneren, chronologisch te ordenen en over te vertellen.',
    patroon: new RegExp(`${G}foto`, 'iu') },

  // spel en beweging
  { id: 'kralen', naam: 'Kralen om te rijgen', groep: 'spel',
    toelichting: 'Om patronen te maken, te sorteren en de fijne motoriek te oefenen.',
    patroon: new RegExp(`${G}(kralen|rijg)`, 'iu') },
  { id: 'blokken', naam: 'Blokken en constructiemateriaal', groep: 'spel',
    toelichting: 'Om te bouwen, vormen samen te stellen en ruimtelijk te denken.',
    patroon: new RegExp(`${G}(blokken|construct)`, 'iu') },
  { id: 'puzzel', naam: 'Puzzel', groep: 'spel',
    toelichting: 'Om delen tot een geheel te maken en vormen te herkennen.',
    patroon: new RegExp(`${G}puzzel`, 'iu') },
  { id: 'bal', naam: 'Bal', groep: 'spel',
    toelichting: 'Om te gooien, te vangen, te rollen en tegen te trappen.',
    patroon: new RegExp(`${G}bal(len)?(?![a-z])`, 'iu') },
  { id: 'touw', naam: 'Touw en hoepel', groep: 'spel',
    toelichting: 'Om over te springen, mee te balanceren en parcours mee af te bakenen.',
    patroon: new RegExp(`${G}(touw|hoepel)`, 'iu') },
];

export interface LeermiddelDoel {
  net: NetCode;
  doelnummer: string;
  omschrijving: string;
}

export interface LeermiddelMetDoelen {
  leermiddel: Leermiddel;
  perNet: Record<NetCode, LeermiddelDoel[]>;
  netten: NetCode[];
  aantal: number;
}

interface Rij {
  id: string;
  net_code: NetCode;
  doelnummer: string;
  omschrijving: string;
}

/**
 * Alle leermiddelen met de leerplandoelen die ze noemen.
 *
 * Filtert op net, leeftijd en — bij OVSG — hun eigen leerjaar. Leermiddelen
 * zonder doel binnen de selectie vallen weg, zodat de lijst geen lege regels
 * toont.
 */
export async function loadLeermiddelen(
  net: NetCode | 'all',
  leeftijd: Leeftijd | 'all',
  ovsgGroep: OvsgGroep | 'all' = 'all',
): Promise<LeermiddelMetDoelen[]> {
  const PAGINA = 1000;
  const doelen: Rij[] = [];
  for (let van = 0; ; van += PAGINA) {
    let q = supabase
      .from('leerplandoelen')
      .select('id, net_code, doelnummer, omschrijving');
    if (net !== 'all') q = q.eq('net_code', net);
    /* Bij OVSG is het leerjaar het leeftijdsfilter; de band mag er niet bij. */
    if (net === 'OVSG') {
      if (ovsgGroep !== 'all') q = q.eq('extra->>leeftijdsgroep', ovsgGroep);
    } else if (leeftijd === '2,5-4') q = q.eq('leeftijd_25_4', true);
    else if (leeftijd === '4-5') q = q.eq('leeftijd_4_5', true);
    else if (leeftijd === '5-6') q = q.eq('leeftijd_5_6', true);

    const { data, error } = await q.range(van, van + PAGINA - 1);
    if (error) throw error;
    const rijen = (data ?? []) as unknown as Rij[];
    doelen.push(...rijen);
    if (rijen.length < PAGINA) break;
  }

  return LEERMIDDELEN.map((m) => {
    const perNet = { KATH: [], GO: [], OVSG: [] } as Record<NetCode, LeermiddelDoel[]>;
    const gezien = new Set<string>();
    for (const d of doelen) {
      if (!m.patroon.test(d.omschrijving)) continue;
      // Netten herhalen dezelfde zin onder verschillende nummers; één per tekst.
      const sleutel = `${d.net_code}|${d.omschrijving.trim().toLowerCase()}`;
      if (gezien.has(sleutel)) continue;
      gezien.add(sleutel);
      perNet[d.net_code]?.push({
        net: d.net_code,
        doelnummer: d.doelnummer,
        omschrijving: d.omschrijving.trim(),
      });
    }
    for (const n of Object.keys(perNet) as NetCode[]) {
      perNet[n].sort((a, b) => compareGoalCodes(a.doelnummer, b.doelnummer));
    }
    const netten = (Object.keys(perNet) as NetCode[]).filter((n) => perNet[n].length > 0);
    const aantal = netten.reduce((s, n) => s + perNet[n].length, 0);
    return { leermiddel: m, perNet, netten, aantal };
  }).filter((x) => x.netten.length > 0);
}
