/*
  Student access: login with the printed QR card (access hash), with the
  student code + pin, or via a link with ?h=<hash>. Uses the same SECURITY
  DEFINER RPCs as the iOS app, so no coach account is needed on the device.
*/
import { supabase } from '../../lib/supabase';

export const APP_ID = 'kleuterdidactiek';

export interface Student {
  id: string;
  firstName: string;
  lastName: string | null;
  color: string | null;
  symbolUrl: string | null;
  profilePictureUrl: string | null;
  accessHash: string | null;
  schoolId: string | null;
  /** Remote per-app settings set by the coach (skillLevel, darkMode). */
  remoteSettings: { skillLevel?: string; darkMode?: boolean } | null;
}

export type LoginError = 'notFound' | 'blocked' | 'license' | 'network';

interface Row {
  id: string;
  first_name: string;
  last_name: string | null;
  color: string | null;
  symbol_url: string | null;
  profile_picture_url: string | null;
  access_hash: string | null;
  school_id: string | null;
  settings: Record<string, { skillLevel?: string; darkMode?: boolean }> | null;
  access_status: number | null;
}

async function call(fn: string, params: Record<string, string>): Promise<Student> {
  // The generated Database types do not list these RPCs; call untyped.
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    params: Record<string, string>,
  ) => Promise<{ data: Row[] | null; error: unknown }>;
  let rows: Row[] | null;
  try {
    const { data, error } = await rpc(fn, params);
    if (error) throw error;
    rows = data;
  } catch {
    throw 'network' as LoginError;
  }
  const row = rows?.[0];
  if (!row) throw 'notFound' as LoginError;
  if (row.access_status === 0) throw 'blocked' as LoginError;
  if (row.access_status === 2) throw 'license' as LoginError;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    color: row.color,
    symbolUrl: row.symbol_url,
    profilePictureUrl: row.profile_picture_url,
    accessHash: row.access_hash,
    schoolId: row.school_id,
    remoteSettings: row.settings?.[APP_ID] ?? null,
  };
}

export function loginWithCode(code: string, pin: string): Promise<Student> {
  const c = code.trim().toUpperCase();
  if (!c) return Promise.reject('notFound' as LoginError);
  return call('authenticate_student_by_code', { p_code: c, p_pin: pin.trim() });
}

export function loginWithHash(hash: string): Promise<Student> {
  const h = hash.trim();
  if (!h) return Promise.reject('notFound' as LoginError);
  return call('authenticate_student_by_hash', { p_hash: h });
}

/**
 * Access hash from a scanned QR payload. The printed cards (shared with
 * WebWijzer and the iOS apps) encode https://bijleer.school/webwijzer?h=<hash>;
 * we also accept our own https://kleuterdidactiek.be/leerling?h=<hash>.
 */
export function hashFromQR(payload: string): string | null {
  try {
    const u = new URL(payload.trim());
    const okHost = u.host.includes('bijleer.school') || u.host.includes('kleuterdidactiek.be') || u.host.includes('localhost');
    const okPath = u.pathname.startsWith('/webwijzer') || u.pathname.startsWith('/leerling');
    const h = hashParam(u.search);
    return okHost && okPath && h ? h : null;
  } catch {
    return null;
  }
}

/**
 * The `h` query parameter, decoded WITHOUT turning '+' into a space.
 * Access hashes are base64 ("a+b/c=") and the printed cards do not always
 * escape the '+'; URLSearchParams would corrupt those (iOS keeps them).
 */
export function hashParam(search: string): string | null {
  for (const part of search.replace(/^\?/, '').split('&')) {
    const eq = part.indexOf('=');
    const k = eq === -1 ? part : part.slice(0, eq);
    if (k !== 'h') continue;
    const v = eq === -1 ? '' : part.slice(eq + 1);
    try { return decodeURIComponent(v) || null; } catch { return v || null; }
  }
  return null;
}

export function loginErrorText(e: LoginError): string {
  switch (e) {
    case 'notFound': return 'Deze code of pincode klopt niet.';
    case 'blocked': return 'Je account is even geblokkeerd. Vraag het aan je juf of meester.';
    case 'license': return 'Je school heeft nog geen licentie. Vraag het aan je juf of meester.';
    default: return 'Er is geen verbinding. Probeer het nog eens.';
  }
}

/* ---------- current student (per browser tab + remembered on device) ---------- */

const KEY = 'kd.leerling.student';
const GUEST_KEY = 'kd.leerling.guest';

export function loadStudent(): Student | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Student) : null;
  } catch {
    return null;
  }
}

export function saveStudent(s: Student | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch { /* private mode */ }
}

export function loadGuest(): boolean {
  try { return localStorage.getItem(GUEST_KEY) === '1'; } catch { return false; }
}

export function saveGuest(on: boolean) {
  try {
    if (on) localStorage.setItem(GUEST_KEY, '1');
    else localStorage.removeItem(GUEST_KEY);
  } catch { /* private mode */ }
}
