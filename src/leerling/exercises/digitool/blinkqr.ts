/*
  Read-only client for blinkQR.app — port of iOS Features/QRScanner/BlinkQRService.swift.
  A scanned sticker encodes `https://blinkqr.app/qr/<code>`; the content
  behind it lives in the qr_codes / qr_content_items tables. Anonymous reads
  are allowed by RLS for unlocked codes (every scan on blinkqr.app is an
  anonymous read too).

  NB: the web app's Supabase project (Bijleren.eu, xtvmshymjewtfrtydtmc) is
  blinkQR's live database. The iOS service still points at the old
  "blinkQR" project (umsjwrhmlgdyrmdadqmi), a stale copy.
*/
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

// qr_codes / qr_content_items aren't in the generated Database types.
const db = supabase as unknown as SupabaseClient;

/** Extract the short code from a scanned payload (with or without www / scheme; query ignored). */
export function codeFromQRPayload(payload: string): string | null {
  let s = payload.trim();
  if (!s.toLowerCase().startsWith('http')) s = 'https://' + s;
  let url: URL;
  try { url = new URL(s); } catch { return null; }
  const host = url.hostname.toLowerCase();
  if (host !== 'blinkqr.app' && host !== 'www.blinkqr.app') return null;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2 || parts[0] !== 'qr' || !parts[1]) return null;
  return parts[1];
}

/**
 * Hosts we operate ourselves. Only media served from these is played
 * (children's section: no third-party requests — same rule as the iPad app).
 */
const OWN_HOSTS = new Set([
  'umsjwrhmlgdyrmdadqmi.supabase.co',
  'xtvmshymjewtfrtydtmc.supabase.co',
  'blinkqr.app', 'www.blinkqr.app',
  'woordenschat.be', 'www.woordenschat.be',
  'bijleren.eu', 'www.bijleren.eu',
  'bijleer.school', 'www.bijleer.school',
]);

export function isFirstParty(url: string): boolean {
  try { return OWN_HOSTS.has(new URL(url).hostname.toLowerCase()); } catch { return false; }
}

export type BlinkContentType = 'audio' | 'video' | 'photo' | 'text' | 'website' | 'document' | 'location' | 'todo';
const TYPES = new Set<string>(['audio', 'video', 'photo', 'text', 'website', 'document', 'location', 'todo']);

export interface BlinkItem {
  id: string;
  type: BlinkContentType;
  title: string | null;
  /** Public storage / target URL (media, website, document). */
  url: string | null;
  /** Inline text (text type). */
  text: string | null;
}

export interface BlinkResult {
  code: string;
  title: string | null;
  isLocked: boolean;
  /** blinkQR checks the password client-side (the web app does the same). */
  password: string | null;
  items: BlinkItem[];
}

export class BlinkFetchError extends Error {
  constructor(public kind: 'notFound' | 'empty' | 'loadFailed') { super(kind); }
}

interface Content { url?: string | null; text?: string | null; title?: string | null; address?: string | null }

function makeItem(id: string, type: string | null | undefined, content: Content | null | undefined): BlinkItem | null {
  if (!type || !TYPES.has(type)) return null;
  const rawUrl = typeof content?.url === 'string' ? content.url.trim() : '';
  const url = rawUrl && rawUrl !== 'https://' ? rawUrl : null;
  const text = typeof content?.text === 'string' ? content.text.trim() : null;
  switch (type) {
    case 'text': if (!text) return null; break;
    case 'audio': case 'video': case 'photo': case 'website': case 'document': if (!url) return null; break;
    default: break; // location / todo: not rendered here, nothing to validate
  }
  return { id, type: type as BlinkContentType, title: content?.title ?? null, url, text };
}

export async function fetchBlink(code: string): Promise<BlinkResult> {
  const { data: rows, error } = await db
    .from('qr_codes')
    .select('id, code, title, content_type, content, is_locked, password')
    .eq('code', code)
    .limit(1);
  if (error) throw new BlinkFetchError('loadFailed');
  const qr = rows?.[0] as {
    id: string; code: string; title: string | null; content_type: string | null;
    content: Content | null; is_locked: boolean | null; password: string | null;
  } | undefined;
  if (!qr) throw new BlinkFetchError('notFound');

  const { data: itemRows, error: e2 } = await db
    .from('qr_content_items')
    .select('id, content_type, content, position')
    .eq('qr_code_id', qr.id)
    .order('position');
  if (e2) throw new BlinkFetchError('loadFailed');

  // Main content on the qr_codes row first (like the web app), then the extra items by position.
  const items: BlinkItem[] = [];
  const main = makeItem(`main-${qr.id}`, qr.content_type, qr.content);
  if (main) items.push(main);
  for (const r of (itemRows ?? []) as { id: string; content_type: string; content: Content | null }[]) {
    const it = makeItem(r.id, r.content_type, r.content);
    if (it) items.push(it);
  }
  if (!items.length) throw new BlinkFetchError('empty');

  return { code: qr.code, title: qr.title, isLocked: !!qr.is_locked, password: qr.password, items };
}
