/*
  Per-student settings (the iOS AppSettings), kept in localStorage per
  student id. The coach-set skill level (student.settings.kleuterdidactiek)
  wins when the child logs in, like StudentSettingsSync.applyRemote on iOS.
*/
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { voice } from './lib/audio';

export interface AnswerModes { camera: boolean; mic: boolean; keypad: boolean; draw: boolean }

export interface LeerlingSettings {
  /** "Niveau": highest number used in exercises (3…10 or 20). */
  maxNumber: number;
  spokenInstructions: boolean;
  sound: boolean;
  /** Answer touch exercises by voice as well (iOS "voiceAnswers"). */
  voiceAnswers: boolean;
  allowZero: boolean;
  /** Answer modes for Speelkaarten / Dobbelsteen / Handen. */
  playingCard: AnswerModes;
  dobbelsteen: AnswerModes;
  handen: AnswerModes;
  cardCountDownward: boolean;
  rangordeMax: number;
  meetlatMax: number;
}

export const DEFAULT_SETTINGS: LeerlingSettings = {
  maxNumber: 10,
  spokenInstructions: true,
  sound: true,
  voiceAnswers: false,
  allowZero: false,
  // Web default: microphone + keypad (the camera/draw paths are optional).
  playingCard: { camera: false, mic: true, keypad: true, draw: false },
  dobbelsteen: { camera: false, mic: true, keypad: true, draw: false },
  handen: { camera: false, mic: true, keypad: true, draw: false },
  cardCountDownward: false,
  rangordeMax: 5,
  meetlatMax: 10,
};

export const NIVEAUS = [3, 4, 5, 6, 7, 8, 9, 10, 20];

/** iOS SkillLevel raw value ("till10") ↔ max number. */
export function skillLevelToMax(raw?: string | null): number | null {
  const m = raw?.match(/^till(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return NIVEAUS.includes(n) ? n : null;
}

const keyFor = (studentId: string | null) => 'kd.leerling.settings.' + (studentId ?? 'gast');

function load(studentId: string | null): LeerlingSettings {
  try {
    const raw = localStorage.getItem(keyFor(studentId));
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<LeerlingSettings>) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

interface Ctx {
  settings: LeerlingSettings;
  update: (patch: Partial<LeerlingSettings>) => void;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({
  studentId, remoteSkillLevel, children,
}: { studentId: string | null; remoteSkillLevel?: string | null; children: ReactNode }) {
  const [settings, setSettings] = useState<LeerlingSettings>(() => load(studentId));

  useEffect(() => {
    const s = load(studentId);
    const remoteMax = skillLevelToMax(remoteSkillLevel);
    if (remoteMax) s.maxNumber = remoteMax;
    setSettings(s);
  }, [studentId, remoteSkillLevel]);

  useEffect(() => {
    voice.enabled = settings.sound;
    if (!settings.sound) voice.stop();
  }, [settings.sound]);

  const update = useCallback((patch: Partial<LeerlingSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(keyFor(studentId), JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [studentId]);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const c = useContext(SettingsContext);
  if (!c) throw new Error('useSettings outside SettingsProvider');
  return c;
}
