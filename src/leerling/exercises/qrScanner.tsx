/*
  Digitool "QR-codescanner" — port of iOS Features/QRScanner/QRScannerView.swift
  (+ BlinkQRService.swift → ./digitool/blinkqr.ts).
  Scan a blinkQR.app sticker with the webcam (jsQR) and play its content:
  audio (one big play/pause button), video, photo and text render here.
  Like the iPad app, only media on our own storage is played; websites,
  documents, external links etc. show an "ask your teacher" card. Locked
  codes ask for the password (checked client-side, as blinkQR does).
  A code with several items shows a big-button menu first.
  Dev only: `__kdBlinkQR('https://blinkqr.app/qr/<code>')` feeds a payload
  as if it had been scanned (the camera is blocked in the test browser).
*/
import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  AlignLeft, Camera, CameraOff, FileText, Globe, Hand, HelpCircle, Image as ImageIcon, LayoutGrid,
  ListChecks, Loader2, Lock, MapPin, Pause, Play, QrCode, RefreshCw, Volume2, Clapperboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { C, ExerciseShell } from '../ui';
import { useStopOnUnmount } from '../hooks';
import { useSettings } from '../settings';
import { voice } from '../lib/audio';
import { t } from '../strings';
import { GOLD_GRADIENT } from './digitool/kit';
import { BlinkFetchError, codeFromQRPayload, fetchBlink, isFirstParty } from './digitool/blinkqr';
import type { BlinkContentType, BlinkItem, BlinkResult } from './digitool/blinkqr';

type Phase =
  | { kind: 'scanning' }
  | { kind: 'loading' }
  | { kind: 'locked'; result: BlinkResult }
  | { kind: 'content'; result: BlinkResult }
  | { kind: 'error'; key: string };

declare global {
  interface Window { __kdBlinkQR?: (payload: string) => void }
}

export default function QRScanner() {
  useStopOnUnmount();
  const { settings } = useSettings();
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' });
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const busy = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Spoken prompt once ("Scan een QR-code.").
  useEffect(() => {
    void voice.playInstruction(t('qrscan.prompt'), settings.spokenInstructions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePayload = useCallback((payload: string) => {
    if (busy.current || phaseRef.current.kind !== 'scanning') return;
    const code = codeFromQRPayload(payload);
    if (!code) return;
    busy.current = true;
    voice.stop();
    setPhase({ kind: 'loading' });
    fetchBlink(code)
      .then((result) => setPhase(result.isLocked ? { kind: 'locked', result } : { kind: 'content', result }))
      .catch((e) => {
        const kind = e instanceof BlinkFetchError ? e.kind : 'loadFailed';
        setPhase({ kind: 'error', key: `qrscan.${kind}` });
      })
      .finally(() => { busy.current = false; });
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__kdBlinkQR = handlePayload;
    return () => { delete window.__kdBlinkQR; };
  }, [handlePayload]);

  const rescan = () => {
    setPassword('');
    setPasswordError(false);
    busy.current = false;
    setPhase({ kind: 'scanning' });
  };

  const unlock = () => {
    if (phase.kind !== 'locked') return;
    if (password === (phase.result.password ?? '')) {
      setPasswordError(false);
      setPhase({ kind: 'content', result: phase.result });
    } else {
      setPasswordError(true);
    }
  };

  return (
    <ExerciseShell mode="qrScanner" hideNiveau>
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        {(phase.kind === 'scanning' || phase.kind === 'loading') && (
          <div className="w-full flex flex-col items-center gap-4">
            <h2 className="font-baloo font-extrabold text-3xl text-center">{t('qrscan.title')}</h2>
            <p className="text-center font-medium opacity-60">{t('qrscan.hint')}</p>
            <CameraBox onPayload={handlePayload} paused={phase.kind !== 'scanning'} loading={phase.kind === 'loading'} />
          </div>
        )}

        {phase.kind === 'locked' && (
          <Panel>
            <Lock size={44} strokeWidth={2.6} style={{ color: C.gold }} />
            <h2 className="font-baloo font-extrabold text-2xl">{t('qrscan.locked')}</h2>
            <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); unlock(); }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('qrscan.password')}
                autoComplete="off"
                className="w-full rounded-2xl bg-white/90 px-4 py-3 text-lg font-semibold border-[1.5px] focus:outline-none"
                style={{ borderColor: C.gold + '59' }}
              />
              {passwordError && <p className="text-sm font-bold text-center" style={{ color: C.danger }}>{t('qrscan.wrongPassword')}</p>}
              <button className="kd-btn w-full h-[52px]" disabled={!password}>{t('qrscan.unlock')}</button>
            </form>
            <ScanAgain onClick={rescan} />
          </Panel>
        )}

        {phase.kind === 'error' && (
          <Panel>
            <HelpCircle size={44} strokeWidth={2.6} style={{ color: C.gold }} />
            <h2 className="font-baloo font-extrabold text-xl text-center">{t(phase.key)}</h2>
            <ScanAgain onClick={rescan} />
          </Panel>
        )}

        {phase.kind === 'content' && <ContentScreen result={phase.result} onScanAgain={rescan} />}
      </div>
    </ExerciseShell>
  );
}

/* ------------------------------------------------------------------ */
/* Camera (jsQR loop, like the student login)                          */
/* ------------------------------------------------------------------ */

function CameraBox({ onPayload, paused, loading }: { onPayload: (p: string) => void; paused: boolean; loading: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camState, setCamState] = useState<'starting' | 'on' | 'denied' | 'none'>('starting');
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const v = videoRef.current;
      if (v && v.readyState >= 2 && !pausedRef.current) {
        const w = 640, h = Math.round((v.videoHeight / v.videoWidth) * 640) || 480;
        const c = (canvasRef.current ??= document.createElement('canvas'));
        c.width = w; c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const code = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
          if (code?.data) onPayloadRef.current(code.data);
        }
      }
      raf = requestAnimationFrame(() => { timer = setTimeout(tick, 120); });
    };

    (async () => {
      setCamState('starting');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        const v = videoRef.current;
        if (v) { v.srcObject = stream; await v.play().catch(() => {}); }
        setCamState('on');
        tick();
      } catch (e) {
        const name = (e as DOMException)?.name;
        setCamState(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'none' : 'denied');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [facing]);

  return (
    <div className="relative w-full max-w-[560px] h-[340px] rounded-[22px] overflow-hidden" style={{ background: C.text + '14' }}>
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined, opacity: camState === 'on' ? 1 : 0 }}
      />
      {camState !== 'on' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center p-5">
          {camState === 'starting'
            ? <Camera size={34} style={{ color: C.gold }} />
            : <>
                <CameraOff size={34} style={{ color: C.gold }} />
                <span className="text-sm font-medium opacity-60">
                  {camState === 'none'
                    ? 'Er is geen camera gevonden.'
                    : 'De camera staat uit. Klik op het slotje naast het webadres en zet Camera op Toestaan.'}
                </span>
              </>}
        </div>
      )}
      {camState === 'on' && !loading && (
        <div className="absolute inset-[16%] border-4 border-white/80 rounded-3xl pointer-events-none" />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <Loader2 size={44} className="animate-spin text-white" />
        </div>
      )}
      <button
        className="absolute bottom-3 right-3 w-[46px] h-[46px] rounded-full bg-black/45 text-white flex items-center justify-center"
        onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
        aria-label={t('studentLogin.flipCamera')}
        title={t('studentLogin.flipCamera')}
      >
        <RefreshCw size={19} strokeWidth={2.6} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[440px] bg-white rounded-3xl p-7 flex flex-col items-center gap-4 border" style={{ borderColor: C.gold + '26', boxShadow: '0 4px 14px rgba(0,0,0,.06)' }}>
      {children}
    </div>
  );
}

function ScanAgain({ onClick, muted }: { onClick: () => void; muted?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-[18px] py-[11px] rounded-full bg-white/90 font-quicksand font-extrabold"
      style={muted
        ? { color: C.text + 'a6', border: `1px solid ${C.text}33` }
        : { color: C.gold, border: `1.5px solid ${C.gold}66` }}
    >
      <QrCode size={18} strokeWidth={2.6} /> {t('qrscan.scanAgain')}
    </button>
  );
}

const TYPE_ICONS: Record<BlinkContentType, LucideIcon> = {
  audio: Volume2, video: Clapperboard, photo: ImageIcon, text: AlignLeft,
  website: Globe, document: FileText, location: MapPin, todo: ListChecks,
};

/* ------------------------------------------------------------------ */
/* Content                                                              */
/* ------------------------------------------------------------------ */

/** Single item → straight to its viewer; several → a big-button menu. */
function ContentScreen({ result, onScanAgain }: { result: BlinkResult; onScanAgain: () => void }) {
  const [selected, setSelected] = useState<BlinkItem | null>(null);
  const active = result.items.length === 1 ? result.items[0] : selected;

  return (
    <div className="w-full flex-1 flex flex-col items-center gap-4" style={{ maxHeight: 'calc(100dvh - 110px)' }}>
      {result.title
        ? <h2 className="font-baloo font-extrabold text-3xl text-center">{result.title}</h2>
        : <div className="h-2" />}

      {active ? (
        <>
          <div className="w-full flex-1 min-h-0 flex items-center justify-center">
            <ItemView key={active.id} item={active} />
          </div>
          {result.items.length > 1 && (
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 px-[18px] py-[11px] rounded-full bg-white/90 font-quicksand font-extrabold"
              style={{ color: C.gold, border: `1.5px solid ${C.gold}66` }}
            >
              <LayoutGrid size={18} strokeWidth={2.6} /> {t('qrscan.backToList')}
            </button>
          )}
        </>
      ) : (
        <div className="w-full max-w-[700px] flex-1 min-h-0 overflow-auto p-1">
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
            {result.items.map((it) => {
              const Icon = TYPE_ICONS[it.type];
              return (
                <button
                  key={it.id}
                  onClick={() => setSelected(it)}
                  className="min-h-[150px] p-3.5 bg-white rounded-3xl flex flex-col items-center justify-center gap-2.5 transition active:scale-[0.97]"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                >
                  <span className="w-[76px] h-[76px] rounded-[20px] flex items-center justify-center text-white" style={{ background: GOLD_GRADIENT }}>
                    <Icon size={40} strokeWidth={2.4} />
                  </span>
                  <span className="font-quicksand font-extrabold text-center line-clamp-2">
                    {it.title || t(`qrscan.type.${it.type}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ScanAgain onClick={onScanAgain} muted />
    </div>
  );
}

function ItemView({ item }: { item: BlinkItem }) {
  // Only media the teacher uploaded to our own storage; never third-party content.
  switch (item.type) {
    case 'audio':
      return item.url && isFirstParty(item.url) ? <AudioView url={item.url} /> : <Unsupported />;
    case 'video':
      return item.url && isFirstParty(item.url)
        ? <video src={item.url} controls autoPlay playsInline className="max-w-[900px] w-full max-h-full rounded-[22px] bg-black" onPlay={() => voice.stop()} />
        : <Unsupported />;
    case 'photo':
      return item.url && isFirstParty(item.url) ? <PhotoView url={item.url} /> : <Unsupported />;
    case 'text':
      return (
        <div className="w-full max-w-[700px] max-h-full overflow-auto bg-white rounded-[22px] p-7">
          <p className="font-quicksand font-semibold text-[28px] text-center whitespace-pre-wrap">{item.text}</p>
        </div>
      );
    default:
      return <Unsupported />;
  }
}

function Unsupported() {
  return (
    <Panel>
      <Hand size={40} strokeWidth={2.6} style={{ color: C.gold }} />
      <p className="font-quicksand font-extrabold text-lg text-center">{t('qrscan.unsupported')}</p>
    </Panel>
  );
}

/** One big gold play/pause button — sized for toddler fingers. */
function AudioView({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => { audioRef.current?.pause(); audioRef.current = null; }, []);

  const toggle = () => {
    if (!audioRef.current) {
      const a = new Audio(url);
      a.onended = () => { setPlaying(false); a.currentTime = 0; };
      a.onpause = () => setPlaying(false);
      a.onplay = () => setPlaying(true);
      audioRef.current = a;
    }
    const a = audioRef.current;
    if (a.paused) { voice.stop(); void a.play().catch(() => setPlaying(false)); }
    else a.pause();
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        onClick={toggle}
        aria-label={t(playing ? 'qrscan.pause' : 'qrscan.play')}
        className="w-40 h-40 rounded-full flex items-center justify-center text-white transition active:scale-95"
        style={{ background: GOLD_GRADIENT, boxShadow: '0 5px 12px rgba(0,0,0,.15)' }}
      >
        {playing ? <Pause size={64} fill="white" strokeWidth={0} /> : <Play size={64} fill="white" strokeWidth={0} className="ml-2" />}
      </button>
      <Volume2 size={26} strokeWidth={2.6} className={playing ? 'animate-pulse' : ''} style={{ color: C.gold, opacity: playing ? 1 : 0.35 }} />
    </div>
  );
}

function PhotoView({ url }: { url: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'failed'>('loading');
  return (
    <div className="w-full h-full flex items-center justify-center">
      {state === 'loading' && <Loader2 size={44} className="animate-spin absolute" style={{ color: C.gold }} />}
      {state === 'failed'
        ? <ImageIcon size={44} style={{ color: C.text + '66' }} />
        : (
          <img
            src={url}
            alt=""
            onLoad={() => setState('ok')}
            onError={() => setState('failed')}
            className="max-w-full max-h-full object-contain rounded-[22px]"
            style={{ opacity: state === 'ok' ? 1 : 0 }}
          />
        )}
    </div>
  );
}
