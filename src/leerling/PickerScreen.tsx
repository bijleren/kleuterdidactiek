/*
  "Wat wil je doen?" — the exercise picker, grouped in the same four
  collapsible categories as the iOS app. Only exercises that exist in
  ./exercises are listed; the niveau hides exercises that need bigger numbers.
*/
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ChevronDown, LogOut, Mic, BookOpen, Puzzle, Ruler, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStudent, isAvailable } from './LeerlingApp';
import { CATEGORIES, MODE_ICONS, USES_CAMERA, USES_MIC, minimumNiveau } from './modes';
import type { CategoryId } from './modes';
import { t } from './strings';
import { useSettings, NIVEAUS } from './settings';
import { C, Pill, cx } from './ui';

const CAT_ICONS: Record<CategoryId, LucideIcon> = {
  digitool: Puzzle, onderbouw: BookOpen, meetkunde: Ruler, taalTijd: Type,
};

const OPEN_KEY = 'kd.leerling.openCategories';

export default function PickerScreen() {
  const { student, signOut } = useStudent();
  const { settings, update } = useSettings();
  const navigate = useNavigate();
  const [open, setOpen] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(OPEN_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
    return new Set(['onderbouw']);
  });
  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(OPEN_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <div className="min-h-screen font-quicksand" style={{ background: C.cream, color: C.text }}>
      <header className="flex items-center gap-3 px-4 sm:px-8 py-3 bg-white/80 backdrop-blur border-b border-[#946B29]/15 sticky top-0 z-20">
        <img src="/leerling-img/logo.png" alt="" className="w-10 h-10 rounded-xl" />
        <div className="flex-1 min-w-0">
          <div className="font-baloo font-bold text-xl leading-tight" style={{ color: C.gold }}>Wat wil je doen?</div>
          <div className="text-sm opacity-60 truncate">Kleuterdidactiek</div>
        </div>
        <Avatar />
        <span className="hidden sm:block font-baloo font-bold text-lg">{student ? student.firstName : 'Gast'}</span>
        <button
          className="kd-icon-btn"
          onClick={() => { signOut(); navigate('/leerling'); }}
          aria-label="Afmelden"
          title="Afmelden"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-5">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="font-semibold mr-1">Getallen tot</span>
          {NIVEAUS.map((n) => (
            <Pill key={n} active={settings.maxNumber === n} onClick={() => update({ maxNumber: n })}>{n}</Pill>
          ))}
        </div>

        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const modes = cat.modes.filter((m) => isAvailable(m) && minimumNiveau(m) <= settings.maxNumber);
            if (!modes.length) return null;
            const Icon = CAT_ICONS[cat.id];
            const isOpen = open.has(cat.id);
            return (
              <section key={cat.id} className="rounded-3xl bg-white/70 border border-[#946B29]/15 overflow-hidden">
                <button
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ background: `linear-gradient(180deg, ${C.goldMid}, ${C.gold})` }}>
                    <Icon size={22} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-baloo font-bold text-2xl leading-tight">{t(`category.${cat.id}`)}</span>
                    <span className="block text-sm opacity-60">{t('category.count', modes.length)}</span>
                  </span>
                  <ChevronDown className={cx('transition', isOpen && 'rotate-180')} style={{ color: C.gold }} />
                </button>
                {isOpen && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3 sm:p-4 pt-0 sm:pt-0 kd-fade-in">
                    {modes.map((m) => {
                      const MI = MODE_ICONS[m];
                      return (
                        <Link
                          key={m}
                          to={`/leerling/oefenen/${m}`}
                          className="group relative rounded-2xl bg-white shadow-sm hover:shadow-md border border-[#946B29]/10 p-4 flex flex-col gap-2 transition active:scale-[0.98]"
                        >
                          <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: C.goldLight, color: C.gold }}>
                            <MI size={26} />
                          </span>
                          <span className="font-baloo font-bold text-lg leading-tight">{t(`exercise.${m}`)}</span>
                          <span className="text-sm opacity-60 leading-snug">{t(`exercise.${m}.subtitle`)}</span>
                          <span className="absolute top-3 right-3 flex gap-1 opacity-50">
                            {USES_MIC.has(m) && <Mic size={16} aria-label="microfoon" />}
                            {USES_CAMERA.has(m) && <Camera size={16} aria-label="camera" />}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Avatar() {
  const { student } = useStudent();
  const [broken, setBroken] = useState(false);
  const url = student?.profilePictureUrl || student?.symbolUrl;
  if (url && !broken) {
    return <img src={url} alt="" onError={() => setBroken(true)} className="w-10 h-10 rounded-full object-cover border-2" style={{ borderColor: student?.color ?? C.gold }} />;
  }
  return (
    <span className="w-10 h-10 rounded-full flex items-center justify-center font-baloo font-bold text-lg text-white" style={{ background: student?.color ?? C.goldMid }}>
      {(student?.firstName ?? 'G').slice(0, 1).toUpperCase()}
    </span>
  );
}
