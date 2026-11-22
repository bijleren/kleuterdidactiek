/*
  Student login — like the iOS Welcome page: scan the printed QR card with
  the webcam, or type the student code + pin. A link with ?h=<hash> logs in
  directly (handy as a desktop shortcut per child).
*/
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import jsQR from 'jsqr';
import { Camera, CameraOff, KeyRound, QrCode, RefreshCw, UserRound } from 'lucide-react';
import { useStudent } from './LeerlingApp';
import { hashFromQR, hashParam, loginErrorText, loginWithCode, loginWithHash } from './lib/student';
import type { LoginError } from './lib/student';
import { C, cx } from './ui';

export default function LoginScreen() {
  const { student, guest, signIn, signInAsGuest } = useStudent();
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const [tab, setTab] = useState<'qr' | 'code'>('qr');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recognised, setRecognised] = useState(false);

  // ?h=<hash> → log in straight away.
  useEffect(() => {
    const h = hashParam(window.location.search);
    if (!h) return;
    setBusy(true);
    loginWithHash(h)
      .then((s) => { signIn(s); navigate('/leerling/oefenen', { replace: true }); })
      .catch((e: LoginError) => { setError(loginErrorText(e)); setParams({}, { replace: true }); })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onHash = async (hash: string) => {
    setBusy(true);
    setError(null);
    try {
      const s = await loginWithHash(hash);
      setRecognised(true);
      setTimeout(() => { signIn(s); navigate('/leerling/oefenen'); }, 600);
    } catch (e) {
      setError(loginErrorText(e as LoginError));
    } finally {
      setBusy(false);
    }
  };

  const loggedIn = !!student || guest;

  return (
    <div className="min-h-screen font-quicksand flex flex-col" style={{ background: `linear-gradient(160deg, ${C.cream}, #FBF1DC)`, color: C.text }}>
      <header className="flex items-center justify-between px-4 sm:px-8 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/leerling-img/logo.png" alt="" className="w-11 h-11 rounded-xl shadow" />
          <span className="font-baloo font-bold text-xl" style={{ color: C.gold }}>Kleuterdidactiek</span>
        </Link>
        <Link to="/login" className="text-sm font-semibold underline opacity-70 hover:opacity-100">Leerkracht? Log hier in</Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 pb-10">
        <h1 className="font-baloo font-bold text-4xl sm:text-5xl text-center mt-4" style={{ color: C.gold }}>Hallo!</h1>
        <p className="text-lg text-center opacity-80 mb-6">Toon je kaart aan de camera of typ je code.</p>

        {loggedIn && (
          <button className="kd-btn mb-6" onClick={() => navigate('/leerling/oefenen')}>
            Verder als {student ? student.firstName : 'gast'}
          </button>
        )}

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-full mb-5" style={{ background: C.goldLight }}>
            <TabButton active={tab === 'qr'} onClick={() => { setTab('qr'); setError(null); }}>
              <QrCode size={18} /> Kaart scannen
            </TabButton>
            <TabButton active={tab === 'code'} onClick={() => { setTab('code'); setError(null); }}>
              <KeyRound size={18} /> Met code
            </TabButton>
          </div>

          {tab === 'qr'
            ? <QRScanner onHash={onHash} paused={busy || recognised} recognised={recognised} error={error} />
            : <CodeForm busy={busy} setBusy={setBusy} error={error} setError={setError} />}

        </div>

        <button
          className="mt-6 flex items-center gap-2 font-semibold opacity-70 hover:opacity-100"
          onClick={() => { signInAsGuest(); navigate('/leerling/oefenen'); }}
        >
          <UserRound size={18} /> Oefenen zonder kaart (er wordt niets bewaard)
        </button>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx('flex items-center justify-center gap-2 py-2 rounded-full font-baloo font-bold transition')}
      style={active ? { background: 'white', color: C.gold, boxShadow: '0 2px 6px rgba(0,0,0,.08)' } : { color: C.gold + 'aa' }}
    >
      {children}
    </button>
  );
}

/* ---------- code + pin ---------- */

function CodeForm({ busy, setBusy, error, setError }: {
  busy: boolean; setBusy: (b: boolean) => void; error: string | null; setError: (e: string | null) => void;
}) {
  const { signIn } = useStudent();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const s = await loginWithCode(code, pin);
      signIn(s);
      navigate('/leerling/oefenen');
    } catch (err) {
      setError(loginErrorText(err as LoginError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-sm font-semibold opacity-70">Leerlingcode</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          className="mt-1 w-full rounded-2xl border-2 border-[#946B29]/25 px-4 py-3 font-baloo text-2xl tracking-widest text-center focus:outline-none focus:border-[#946B29]"
          placeholder="ABC123"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold opacity-70">Pincode</span>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          type="password"
          autoComplete="off"
          className="mt-1 w-full rounded-2xl border-2 border-[#946B29]/25 px-4 py-3 font-baloo text-2xl tracking-[0.5em] text-center focus:outline-none focus:border-[#946B29]"
          placeholder="••••"
        />
      </label>
      {error && <p className="text-center font-semibold" style={{ color: C.danger }}>{error}</p>}
      <button className="kd-btn w-full" disabled={busy || !code}>{busy ? 'Even geduld…' : 'Start'}</button>
    </form>
  );
}

/* ---------- QR card via webcam (jsQR; works in every browser) ---------- */

function QRScanner({ onHash, paused, recognised, error }: {
  onHash: (h: string) => void; paused: boolean; recognised: boolean; error: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camState, setCamState] = useState<'starting' | 'on' | 'denied' | 'none'>('starting');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [hint, setHint] = useState<string | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const lastPayload = useRef<{ text: string; at: number } | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
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
          if (code?.data) {
            const now = Date.now();
            const last = lastPayload.current;
            if (!last || last.text !== code.data || now - last.at > 4000) {
              lastPayload.current = { text: code.data, at: now };
              const hash = hashFromQR(code.data);
              if (hash) { setHint(null); onHash(hash); }
              else setHint('Dit is geen leerlingkaart.');
            }
          }
        }
      }
      raf = requestAnimationFrame(() => setTimeout(tick, 120));
    };

    (async () => {
      setCamState('starting');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
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
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
        />
        {camState !== 'on' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6">
            {camState === 'starting'
              ? <><Camera size={36} style={{ color: C.gold }} /><span>Camera starten…</span></>
              : <><CameraOff size={36} style={{ color: C.danger }} />
                  <span>{camState === 'none'
                    ? 'Er is geen camera gevonden. Log in met je code.'
                    : 'De camera staat uit. Klik op het slotje naast het webadres en zet Camera op Toestaan, of log in met je code.'}</span></>}
          </div>
        )}
        {camState === 'on' && !recognised && (
          <div className="absolute inset-[18%] border-4 border-white/80 rounded-3xl pointer-events-none" />
        )}
        {recognised && (
          <div className="absolute inset-0 flex items-center justify-center font-baloo font-bold text-3xl text-white" style={{ background: C.success + 'dd' }}>
            Herkend!
          </div>
        )}
        {error && !recognised && camState === 'on' && (
          <div className="absolute inset-x-0 bottom-0 p-2 text-center text-white text-sm font-semibold" style={{ background: C.danger + 'dd' }}>{error}</div>
        )}
        <button
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-black/45 text-white flex items-center justify-center"
          onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          aria-label="Andere camera"
          title="Andere camera"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      <p className="mt-3 text-center text-sm opacity-70">{hint ?? 'Houd je leerlingkaart met de QR-code voor de camera.'}</p>
    </div>
  );
}
