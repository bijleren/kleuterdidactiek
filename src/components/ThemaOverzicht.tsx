import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Film, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import Modal from './Modal';
import DoelChips from './DoelChips';

interface Thema {
  id: string;
  school_id: string | null;
  naam: string;
  beschrijving: string | null;
  emoji: string;
  sort_order: number;
}

interface ThemaItem {
  id: string;
  thema_id: string;
  item_type: 'woord' | 'materiaal' | 'video';
  item_id: string;
  item_name: string;
  sort_order: number;
}

interface Woordenschatwoord {
  word: string;
  goal_codes: string[];
}

/**
 * Thema's: een bundel woorden, materialen en video's rond één onderwerp.
 *
 * Woorden vormen de kern. De bestaande woordenschat bestaat uit begrippen uit
 * de leerplannen (neerslag, zoogdieren), niet uit alledaagse themawoorden, dus
 * een thema bevat allebei: woorden die al bestaan — met hun doelen — en woorden
 * die alleen in dit thema voorkomen.
 */
export default function ThemaOverzicht() {
  const { selectedSchool } = useSchool();
  const [themas, setThemas] = useState<Thema[]>([]);
  const [items, setItems] = useState<ThemaItem[]>([]);
  const [woordenschat, setWoordenschat] = useState<Map<string, Woordenschatwoord>>(new Map());
  const [gekozen, setGekozen] = useState<Thema | null>(null);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [zoek, setZoek] = useState('');

  /*
    Platformbeheerder, niet schoolbeheerder: is_current_user_admin() kijkt in
    admin_users op e-mail. Alleen zij mogen de platformthema's aanpassen.
  */
  const [isPlatformbeheerder, setIsPlatformbeheerder] = useState(false);
  const [bewerken, setBewerken] = useState<Thema | null>(null);
  const [bewerkVorm, setBewerkVorm] = useState({ naam: '', beschrijving: '', emoji: '' });
  const [teVerwijderen, setTeVerwijderen] = useState<Thema | null>(null);

  const [nieuwWoord, setNieuwWoord] = useState('');
  const [toonNieuwThema, setToonNieuwThema] = useState(false);
  const [nieuwThema, setNieuwThema] = useState({ naam: '', beschrijving: '', emoji: '🎨' });

  const laad = useCallback(async () => {
    setLaden(true);
    setFout('');
    try {
      const [tRes, wRes, aRes] = await Promise.all([
        supabase.from('themas').select('*').eq('is_actief', true).order('sort_order').order('naam'),
        supabase.from('vocabulary_words').select('word, goal_codes'),
        supabase.rpc('is_current_user_admin'),
      ]);
      if (tRes.error) throw tRes.error;
      if (wRes.error) throw wRes.error;
      setIsPlatformbeheerder(aRes.data === true);

      const lijst = (tRes.data ?? []) as unknown as Thema[];
      setThemas(lijst);
      setWoordenschat(
        new Map(
          ((wRes.data ?? []) as unknown as Woordenschatwoord[]).map((w) => [w.word.toLowerCase(), w]),
        ),
      );

      if (lijst.length > 0) {
        const { data, error } = await supabase
          .from('thema_items')
          .select('*')
          .in('thema_id', lijst.map((t) => t.id))
          .order('sort_order');
        if (error) throw error;
        setItems((data ?? []) as unknown as ThemaItem[]);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error('Thema\'s laden mislukt', e);
      setFout('De thema\'s konden niet geladen worden.');
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    laad();
  }, [laad]);

  const itemsVan = useCallback(
    (themaId: string, type: ThemaItem['item_type']) =>
      items.filter((i) => i.thema_id === themaId && i.item_type === type),
    [items],
  );

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return themas;
    return themas.filter(
      (t) =>
        t.naam.toLowerCase().includes(q) ||
        (t.beschrijving ?? '').toLowerCase().includes(q) ||
        items.some((i) => i.thema_id === t.id && i.item_name.toLowerCase().includes(q)),
    );
  }, [themas, items, zoek]);

  /*
    Een leerkracht beheert de thema's van haar eigen school; een
    platformbeheerder daarnaast ook de thema's zonder school. Zelfde regel als
    in de RLS, zodat de knoppen niet iets beloven wat de databank weigert.
  */
  const magBeheren = (t: Thema) =>
    (t.school_id !== null && t.school_id === selectedSchool?.id) ||
    (t.school_id === null && isPlatformbeheerder);

  const voegWoordToe = async () => {
    const woord = nieuwWoord.trim();
    if (!woord || !gekozen) return;
    const bestaat = itemsVan(gekozen.id, 'woord').some(
      (i) => i.item_id.toLowerCase() === woord.toLowerCase(),
    );
    if (bestaat) {
      setNieuwWoord('');
      return;
    }
    try {
      const rij = {
        thema_id: gekozen.id,
        item_type: 'woord',
        item_id: woord,
        item_name: woord,
        sort_order: itemsVan(gekozen.id, 'woord').length + 1,
      };
      // Zie lib/leerplandoelen.ts: de gegenereerde types lossen op naar never.
      const { data, error } = await supabase.from('thema_items').insert(rij as never).select().single();
      if (error) throw error;
      setItems((s) => [...s, data as unknown as ThemaItem]);
      setNieuwWoord('');
    } catch (e) {
      console.error('Woord toevoegen mislukt', e);
      setFout('Het woord kon niet toegevoegd worden.');
    }
  };

  const verwijderItem = async (item: ThemaItem) => {
    try {
      const { error } = await supabase.from('thema_items').delete().eq('id', item.id);
      if (error) throw error;
      setItems((s) => s.filter((i) => i.id !== item.id));
    } catch (e) {
      console.error('Item verwijderen mislukt', e);
      setFout('Het item kon niet verwijderd worden.');
    }
  };

  const openBewerken = (t: Thema) => {
    setBewerken(t);
    setBewerkVorm({ naam: t.naam, beschrijving: t.beschrijving ?? '', emoji: t.emoji });
  };

  const bewaarBewerking = async () => {
    if (!bewerken || !bewerkVorm.naam.trim()) return;
    try {
      const wijziging = {
        naam: bewerkVorm.naam.trim(),
        beschrijving: bewerkVorm.beschrijving.trim() || null,
        emoji: bewerkVorm.emoji || '🎨',
      };
      const { error } = await supabase.from('themas').update(wijziging as never).eq('id', bewerken.id);
      if (error) throw error;
      const bijgewerkt = { ...bewerken, ...wijziging };
      setThemas((s) => s.map((t) => (t.id === bewerken.id ? bijgewerkt : t)));
      setGekozen((g) => (g && g.id === bewerken.id ? bijgewerkt : g));
      setBewerken(null);
    } catch (e) {
      console.error('Thema bewaren mislukt', e);
      setFout('Het thema kon niet bewaard worden.');
    }
  };

  const verwijderThema = async () => {
    if (!teVerwijderen) return;
    try {
      // De items verdwijnen mee via on delete cascade.
      const { error } = await supabase.from('themas').delete().eq('id', teVerwijderen.id);
      if (error) throw error;
      setThemas((s) => s.filter((t) => t.id !== teVerwijderen.id));
      setItems((s) => s.filter((i) => i.thema_id !== teVerwijderen.id));
      setGekozen((g) => (g && g.id === teVerwijderen.id ? null : g));
      setTeVerwijderen(null);
    } catch (e) {
      console.error('Thema verwijderen mislukt', e);
      setFout('Het thema kon niet verwijderd worden.');
    }
  };

  const maakThema = async () => {
    if (!nieuwThema.naam.trim() || !selectedSchool) return;
    try {
      const rij = {
        school_id: selectedSchool.id,
        naam: nieuwThema.naam.trim(),
        beschrijving: nieuwThema.beschrijving.trim() || null,
        emoji: nieuwThema.emoji || '🎨',
        sort_order: 100,
      };
      const { data, error } = await supabase.from('themas').insert(rij as never).select().single();
      if (error) throw error;
      const t = data as unknown as Thema;
      setThemas((s) => [...s, t]);
      setToonNieuwThema(false);
      setNieuwThema({ naam: '', beschrijving: '', emoji: '🎨' });
      setGekozen(t);
    } catch (e) {
      console.error('Thema aanmaken mislukt', e);
      setFout('Het thema kon niet aangemaakt worden.');
    }
  };

  if (laden) return <p className="text-gray-500 px-4">Thema&apos;s laden...</p>;

  /* ---------- detail ---------- */
  if (gekozen) {
    const woorden = itemsVan(gekozen.id, 'woord');
    const materialen = itemsVan(gekozen.id, 'materiaal');
    const videos = itemsVan(gekozen.id, 'video');
    const mag = magBeheren(gekozen);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setGekozen(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-deep-purple hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Alle thema&apos;s
        </button>

        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{gekozen.emoji}</span>
            <div className="flex-1">
              <h3 className="text-2xl font-baloo text-deep-purple">{gekozen.naam}</h3>
              {gekozen.beschrijving && <p className="text-sm text-gray-600">{gekozen.beschrijving}</p>}
              <p className="text-xs text-gray-400 mt-1">
                {gekozen.school_id === null ? 'Thema van het platform' : 'Thema van je school'}
                {' · '}
                {woorden.length} woorden, {materialen.length} materialen, {videos.length} video&apos;s
              </p>
            </div>
            {mag && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openBewerken(gekozen)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Bewerken
                </button>
                <button
                  onClick={() => setTeVerwijderen(gekozen)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Verwijderen
                </button>
              </div>
            )}
          </div>
        </div>

        {fout && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
            {fout}
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-lg space-y-3">
          <h4 className="font-semibold text-gray-800">Woorden</h4>
          <p className="text-xs text-gray-500">
            Woorden die al in de woordenschat staan tonen hun doelen. De andere horen alleen bij dit
            thema — handig voor wat de leerplannen niet als begrip benoemen.
          </p>

          <ul className="divide-y divide-gray-100">
            {woorden.map((i) => {
              const bekend = woordenschat.get(i.item_id.toLowerCase());
              return (
                <li key={i.id} className="py-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">{i.item_name}</span>
                    {bekend ? (
                      <div className="mt-1">
                        <DoelChips codes={bekend.goal_codes} max={3} klein />
                      </div>
                    ) : (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        alleen in dit thema
                      </span>
                    )}
                  </div>
                  {mag && (
                    <button
                      onClick={() => verwijderItem(i)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label={`${i.item_name} verwijderen`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {mag ? (
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={nieuwWoord}
                onChange={(e) => setNieuwWoord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && voegWoordToe()}
                placeholder="Woord toevoegen..."
                className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
              />
              <button
                onClick={voegWoordToe}
                disabled={!nieuwWoord.trim()}
                className="px-4 py-2 rounded-xl bg-deep-purple text-white text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 pt-2">
              Dit is een thema van het platform. Maak een eigen thema om er woorden aan toe te voegen.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-deep-purple" /> Materialen ({materialen.length})
            </h4>
            {materialen.length === 0 ? (
              <p className="text-sm text-gray-400">Nog geen materiaal gekoppeld.</p>
            ) : (
              <ul className="space-y-1 text-sm text-gray-700">
                {materialen.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <span>{i.item_name}</span>
                    {mag && (
                      <button onClick={() => verwijderItem(i)} className="text-gray-300 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Film className="w-4 h-4 text-deep-purple" /> Video&apos;s ({videos.length})
            </h4>
            {videos.length === 0 ? (
              <p className="text-sm text-gray-400">Nog geen video gekoppeld.</p>
            ) : (
              <ul className="space-y-1 text-sm text-gray-700">
                {videos.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <span>{i.item_name}</span>
                    {mag && (
                      <button onClick={() => verwijderItem(i)} className="text-gray-300 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      <Modal isOpen={bewerken !== null} onClose={() => setBewerken(null)} title="Thema bewerken">
        <div className="space-y-4">
          {bewerken?.school_id === null && (
            <p className="text-xs text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-xl px-3 py-2">
              Dit is een thema van het platform. Je past het aan voor alle scholen.
            </p>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={bewerkVorm.emoji}
              onChange={(e) => setBewerkVorm({ ...bewerkVorm, emoji: e.target.value })}
              className="w-16 px-3 py-3 rounded-xl border-2 border-gray-200 text-center text-2xl focus:border-deep-purple focus:outline-none"
              aria-label="Emoji"
            />
            <input
              type="text"
              value={bewerkVorm.naam}
              onChange={(e) => setBewerkVorm({ ...bewerkVorm, naam: e.target.value })}
              placeholder="Naam van het thema"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
            />
          </div>
          <textarea
            value={bewerkVorm.beschrijving}
            onChange={(e) => setBewerkVorm({ ...bewerkVorm, beschrijving: e.target.value })}
            placeholder="Waar gaat dit thema over?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setBewerken(null)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={bewaarBewerking}
              disabled={!bewerkVorm.naam.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-deep-purple text-white font-semibold disabled:opacity-40 transition-colors"
            >
              Bewaren
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={teVerwijderen !== null} onClose={() => setTeVerwijderen(null)} title="Thema verwijderen?">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{teVerwijderen?.naam}</span> verdwijnt, samen met alle
            woorden, materialen en video&apos;s die eraan hangen. Dit kan niet ongedaan gemaakt worden.
          </p>
          {teVerwijderen?.school_id === null && (
            <p className="text-xs text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-xl px-3 py-2">
              Dit is een thema van het platform. Het verdwijnt voor alle scholen.
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setTeVerwijderen(null)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={verwijderThema}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Ja, verwijderen
            </button>
          </div>
        </div>
      </Modal>
      </div>
    );
  }

  /* ---------- lijst ---------- */
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-deep-purple flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 leading-relaxed">
            Een thema bundelt wat bij elkaar hoort tijdens een projectweek: woorden, materialen en
            video&apos;s. De vijf thema&apos;s hieronder zijn een vertrekpunt; maak er gerust een eigen
            bij.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek op thema of woord..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setToonNieuwThema(true)}
            disabled={!selectedSchool}
            className="px-4 py-2 rounded-full bg-deep-purple text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-40 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nieuw thema
          </button>
        </div>
      </div>

      {fout && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {fout}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zichtbaar.map((t) => {
          const woorden = itemsVan(t.id, 'woord').length;
          const bekend = itemsVan(t.id, 'woord').filter((i) =>
            woordenschat.has(i.item_id.toLowerCase()),
          ).length;
          return (
            <button
              key={t.id}
              onClick={() => setGekozen(t)}
              className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left"
            >
              <div className="text-4xl mb-2">{t.emoji}</div>
              <h4 className="text-lg font-baloo text-deep-purple">{t.naam}</h4>
              {t.beschrijving && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.beschrijving}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {woorden} woorden · {bekend} met doelen
                {t.school_id !== null && ' · eigen thema'}
              </p>
            </button>
          );
        })}
      </div>

      {zichtbaar.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <p className="text-gray-500">Geen thema&apos;s gevonden.</p>
        </div>
      )}

      <Modal isOpen={bewerken !== null} onClose={() => setBewerken(null)} title="Thema bewerken">
        <div className="space-y-4">
          {bewerken?.school_id === null && (
            <p className="text-xs text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-xl px-3 py-2">
              Dit is een thema van het platform. Je past het aan voor alle scholen.
            </p>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={bewerkVorm.emoji}
              onChange={(e) => setBewerkVorm({ ...bewerkVorm, emoji: e.target.value })}
              className="w-16 px-3 py-3 rounded-xl border-2 border-gray-200 text-center text-2xl focus:border-deep-purple focus:outline-none"
              aria-label="Emoji"
            />
            <input
              type="text"
              value={bewerkVorm.naam}
              onChange={(e) => setBewerkVorm({ ...bewerkVorm, naam: e.target.value })}
              placeholder="Naam van het thema"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
            />
          </div>
          <textarea
            value={bewerkVorm.beschrijving}
            onChange={(e) => setBewerkVorm({ ...bewerkVorm, beschrijving: e.target.value })}
            placeholder="Waar gaat dit thema over?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setBewerken(null)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={bewaarBewerking}
              disabled={!bewerkVorm.naam.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-deep-purple text-white font-semibold disabled:opacity-40 transition-colors"
            >
              Bewaren
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={teVerwijderen !== null} onClose={() => setTeVerwijderen(null)} title="Thema verwijderen?">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{teVerwijderen?.naam}</span> verdwijnt, samen met alle
            woorden, materialen en video&apos;s die eraan hangen. Dit kan niet ongedaan gemaakt worden.
          </p>
          {teVerwijderen?.school_id === null && (
            <p className="text-xs text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-xl px-3 py-2">
              Dit is een thema van het platform. Het verdwijnt voor alle scholen.
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setTeVerwijderen(null)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={verwijderThema}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Ja, verwijderen
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={toonNieuwThema} onClose={() => setToonNieuwThema(false)} title="Nieuw thema">
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={nieuwThema.emoji}
              onChange={(e) => setNieuwThema({ ...nieuwThema, emoji: e.target.value })}
              className="w-16 px-3 py-3 rounded-xl border-2 border-gray-200 text-center text-2xl focus:border-deep-purple focus:outline-none"
              aria-label="Emoji"
            />
            <input
              type="text"
              value={nieuwThema.naam}
              onChange={(e) => setNieuwThema({ ...nieuwThema, naam: e.target.value })}
              placeholder="Naam van het thema"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
            />
          </div>
          <textarea
            value={nieuwThema.beschrijving}
            onChange={(e) => setNieuwThema({ ...nieuwThema, beschrijving: e.target.value })}
            placeholder="Waar gaat dit thema over?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setToonNieuwThema(false)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={maakThema}
              disabled={!nieuwThema.naam.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-deep-purple text-white font-semibold disabled:opacity-40 transition-colors"
            >
              Aanmaken
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
