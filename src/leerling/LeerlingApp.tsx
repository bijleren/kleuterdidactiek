/*
  kleuterdidactiek.be/leerling — the web version of the Kleuterdidactiek
  iPad app, for children. Separate from the coach site: its own login
  (QR card / code + pin / ?h= link), its own layout, no coach account needed.

  Routes:
    /leerling                 login
    /leerling/oefenen         exercise picker
    /leerling/oefenen/:mode   one exercise (src/leerling/exercises/<mode>.tsx)
*/
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import './leerling.css';
import type { Student } from './lib/student';
import { loadGuest, loadStudent, saveGuest, saveStudent } from './lib/student';
import { endSession, flush, setProgressHash, startSession } from './lib/progress';
import { SettingsProvider } from './settings';
import { isModeId } from './modes';
import type { ModeId } from './modes';
import LoginScreen from './LoginScreen';
import PickerScreen from './PickerScreen';
import { C } from './ui';

/* ---------- who is practising ---------- */

interface StudentCtx {
  student: Student | null;
  guest: boolean;
  signIn: (s: Student) => void;
  signInAsGuest: () => void;
  signOut: () => void;
}

const Ctx = createContext<StudentCtx | null>(null);

export function useStudent(): StudentCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStudent outside LeerlingApp');
  return c;
}

function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(() => loadStudent());
  const [guest, setGuest] = useState<boolean>(() => !loadStudent() && loadGuest());

  useEffect(() => {
    setProgressHash(student?.accessHash ?? null);
    if (student) startSession();
    return () => { endSession(); void flush(); };
  }, [student]);

  const signIn = useCallback((s: Student) => {
    saveStudent(s); saveGuest(false);
    setGuest(false); setStudent(s);
  }, []);
  const signInAsGuest = useCallback(() => {
    saveStudent(null); saveGuest(true);
    setStudent(null); setGuest(true);
  }, []);
  const signOut = useCallback(() => {
    endSession(); void flush();
    saveStudent(null); saveGuest(false);
    setStudent(null); setGuest(false);
  }, []);

  const value = useMemo(() => ({ student, guest, signIn, signInAsGuest, signOut }),
    [student, guest, signIn, signInAsGuest, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ---------- exercise registry: one file per mode in ./exercises ---------- */

const modules = import.meta.glob<{ default: ComponentType }>('./exercises/*.tsx');
const lazyCache = new Map<string, LazyExoticComponent<ComponentType>>();

export function isAvailable(mode: ModeId): boolean {
  return `./exercises/${mode}.tsx` in modules;
}

function exerciseComponent(mode: ModeId): LazyExoticComponent<ComponentType> | null {
  const path = `./exercises/${mode}.tsx`;
  const loader = modules[path];
  if (!loader) return null;
  let c = lazyCache.get(path);
  if (!c) { c = lazy(loader); lazyCache.set(path, c); }
  return c;
}

function ExerciseRoute() {
  const { mode } = useParams();
  if (!isModeId(mode)) return <Navigate to="/leerling/oefenen" replace />;
  const Comp = exerciseComponent(mode);
  if (!Comp) return <Navigate to="/leerling/oefenen" replace />;
  // key = mode so switching exercises fully resets state.
  return <Comp key={mode} />;
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center font-baloo text-2xl" style={{ background: C.cream, color: C.gold }}>
      Laden…
    </div>
  );
}

function RequireStudent({ children }: { children: ReactNode }) {
  const { student, guest } = useStudent();
  if (!student && !guest) return <Navigate to="/leerling" replace />;
  return <>{children}</>;
}

function WithSettings({ children }: { children: ReactNode }) {
  const { student } = useStudent();
  return (
    <SettingsProvider studentId={student?.id ?? null} remoteSkillLevel={student?.remoteSettings?.skillLevel ?? null}>
      {children}
    </SettingsProvider>
  );
}

export default function LeerlingApp() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Kleuterdidactiek – Leerlingen';
    return () => { document.title = prev; };
  }, []);

  return (
    <StudentProvider>
      <WithSettings>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<LoginScreen />} />
            <Route path="oefenen" element={<RequireStudent><PickerScreen /></RequireStudent>} />
            <Route path="oefenen/:mode" element={<RequireStudent><ExerciseRoute /></RequireStudent>} />
            <Route path="*" element={<Navigate to="/leerling" replace />} />
          </Routes>
        </Suspense>
      </WithSettings>
    </StudentProvider>
  );
}
