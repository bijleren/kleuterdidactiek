import { supabase } from '../lib/supabase';

interface LessonItem {
  item_type: 'vocabulary' | 'vocabulary_word' | 'quiz' | 'writing' | 'physical_task' | 'video' | 'material' | 'activity_preset' | 'goal' | 'thema' | 'leerplandoel';
  item_id: string;
  item_name?: string;
}

interface LesOnderdeel extends LessonItem {
  lesson_id: string;
}

const IS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const woordVan = (item: LessonItem) =>
  (item.item_name ?? item.item_id).replace(/^Woordenschat:\s*/i, '').trim();

/*
  De doelen van een les volgen uit haar onderdelen. Dit is de enige plek die
  dat uitrekent: het lesvenster, de kopieerknop en de Excel-export lazen elk
  op hun eigen manier, en liepen daardoor uiteen. De export las lesson_goals,
  dat bij automatisch aangemaakte lessen (een klik op een woord) nooit gevuld
  wordt, en bleef bij de meeste lessen leeg.

  Per type één query voor alle onderdelen samen, zodat een export over een
  week niet honderden losse aanvragen doet.
*/
export async function doelcodesPerLes(onderdelen: LesOnderdeel[]): Promise<Map<string, string[]>> {
  const perType = new Map<string, LesOnderdeel[]>();
  for (const o of onderdelen) {
    const lijst = perType.get(o.item_type) ?? [];
    lijst.push(o);
    perType.set(o.item_type, lijst);
  }
  const idsVan = (type: string) => [...new Set((perType.get(type) ?? []).map((o) => o.item_id))];

  /** Per onderdeel-sleutel (type:id) de doelcodes. */
  const codesPerOnderdeel = new Map<string, string[]>();
  const zet = (type: string, id: string, codes: string[] | null | undefined) => {
    if (!codes || codes.length === 0) return;
    const sleutel = `${type}:${id}`;
    codesPerOnderdeel.set(sleutel, [...(codesPerOnderdeel.get(sleutel) ?? []), ...codes]);
  };

  // Tabellen met goal_codes op de rij zelf.
  const directeTabellen: [string, string][] = [
    ['quiz', 'learning_games'],
    ['writing', 'writing_exercises'],
    ['physical_task', 'physical_tasks'],
    ['activity_preset', 'activity_presets'],
  ];

  // Woorden: een id van vocabulary_words, of bij oudere en eigen woorden de tekst.
  const woorden = perType.get('vocabulary_word') ?? [];
  const woordIds = [...new Set(woorden.filter((w) => IS_UUID.test(w.item_id)).map((w) => w.item_id))];
  const woordTeksten = [...new Set(woorden.map(woordVan))];

  const [
    direct,
    categorieen,
    woordenOpId,
    woordenOpTekst,
    video,
    materiaal,
  ] = await Promise.all([
    Promise.all(
      directeTabellen.map(async ([type, tabel]) => {
        const ids = idsVan(type).filter((id) => IS_UUID.test(id));
        if (ids.length === 0) return { type, rijen: [] as { id: string; goal_codes: string[] }[] };
        const { data } = await supabase.from(tabel).select('id, goal_codes').in('id', ids);
        return { type, rijen: (data ?? []) as unknown as { id: string; goal_codes: string[] }[] };
      })
    ),
    idsVan('vocabulary').length
      ? supabase.from('vocabulary_categories').select('id, goal_codes').in('id', idsVan('vocabulary'))
      : Promise.resolve({ data: [] }),
    woordIds.length
      ? supabase.from('vocabulary_words').select('id, word, category_id').in('id', woordIds)
      : Promise.resolve({ data: [] }),
    woordTeksten.length
      ? supabase.from('vocabulary_words').select('id, word, category_id').in('word', woordTeksten)
      : Promise.resolve({ data: [] }),
    idsVan('video').length
      ? supabase.from('educational_video_goals').select('video_id, goal_code').in('video_id', idsVan('video'))
      : Promise.resolve({ data: [] }),
    idsVan('material').length
      ? supabase.from('educational_material_goals').select('material_id, goal_code').in('material_id', idsVan('material'))
      : Promise.resolve({ data: [] }),
  ]);

  for (const { type, rijen } of direct) for (const r of rijen) zet(type, r.id, r.goal_codes);
  for (const r of (categorieen.data ?? []) as unknown as { id: string; goal_codes: string[] }[]) {
    zet('vocabulary', r.id, r.goal_codes);
  }
  for (const r of (video.data ?? []) as unknown as { video_id: string; goal_code: string }[]) {
    zet('video', r.video_id, [r.goal_code]);
  }
  for (const r of (materiaal.data ?? []) as unknown as { material_id: string; goal_code: string }[]) {
    zet('material', r.material_id, [r.goal_code]);
  }

  // Woorden krijgen de doelen van hun categorie, zoals in het lesvenster.
  type Woordrij = { id: string; word: string; category_id: string };
  const opId = new Map(((woordenOpId.data ?? []) as unknown as Woordrij[]).map((w) => [w.id, w]));
  const opTekst = new Map(((woordenOpTekst.data ?? []) as unknown as Woordrij[]).map((w) => [w.word, w]));
  const categorieVanWoord = new Map<string, string>();
  for (const w of woorden) {
    const rij = opId.get(w.item_id) ?? opTekst.get(woordVan(w));
    if (rij?.category_id) categorieVanWoord.set(w.item_id, rij.category_id);
  }
  const woordCategorieIds = [...new Set(categorieVanWoord.values())];
  if (woordCategorieIds.length) {
    const { data } = await supabase
      .from('vocabulary_categories')
      .select('id, goal_codes')
      .in('id', woordCategorieIds);
    const doelenVanCategorie = new Map(
      ((data ?? []) as unknown as { id: string; goal_codes: string[] }[]).map((c) => [c.id, c.goal_codes])
    );
    for (const [itemId, categorieId] of categorieVanWoord) {
      zet('vocabulary_word', itemId, doelenVanCategorie.get(categorieId));
    }
  }

  /*
    Een thema telt bewust niet mee voor de doelen. Het toont welk thema de klas
    behandelde, niet wat er gebeurde: in één les werk je niet aan alle doelen
    van alle woorden van een thema, en ze allemaal toekennen zou de
    doelenoverzichten opblazen.
  */

  /*
    Een leerplandoel telt voor de minimumdoelen waaraan het gekoppeld is. Het
    doelnummer van het net zelf komt hier niet bij: de lijsten met doelen zijn
    minimumdoelen, en de leerplandoelen worden daar telkens uit afgeleid.
  */
  const leerplandoelIds = idsVan('leerplandoel').filter((id) => IS_UUID.test(id));
  if (leerplandoelIds.length) {
    const { data } = await supabase
      .from('leerplandoel_minimumdoelen')
      .select('leerplandoel_id, code')
      .in('leerplandoel_id', leerplandoelIds);
    for (const k of (data ?? []) as unknown as { leerplandoel_id: string; code: string }[]) {
      zet('leerplandoel', k.leerplandoel_id, [k.code]);
    }
  }

  const resultaat = new Map<string, string[]>();
  for (const o of onderdelen) {
    const codes = o.item_type === 'goal' ? [o.item_id] : codesPerOnderdeel.get(`${o.item_type}:${o.item_id}`) ?? [];
    const set = new Set(resultaat.get(o.lesson_id) ?? []);
    for (const c of codes) if (c && c.trim() !== '') set.add(c);
    resultaat.set(o.lesson_id, [...set]);
  }
  return resultaat;
}

export async function extractGoalCodesFromLessonItems(lessonItems: LessonItem[]): Promise<string[]> {
  const perLes = await doelcodesPerLes(lessonItems.map((i) => ({ ...i, lesson_id: '' })));
  return perLes.get('') ?? [];
}
