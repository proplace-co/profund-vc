import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';

const PROXY =
  'https://alexandre-79537--proplace-chat-proxy-fastapi-app.modal.run';
const FALLBACK_PREVIEW =
  'https://proplace.co/cibles/profund-vc/?teaser=1&guest=lp&ticker=0&onb=0&tab=kept';
const LOGO = '/logo.png';

// Le proxy Modal peut mettre plusieurs dizaines de secondes à se réveiller, et
// un fetch sans délai n'abandonne jamais : la page restait figée sur
// « Checking your access… ». On coupe à 15 s, on retente une fois, puis on
// propose de réessayer. Seul un 401 veut dire « lien invalide ».
const VERIFY_TIMEOUT_MS = 15000;
const VERIFY_TRIES = 2;
const SLOW_AFTER_MS = 4000;

// Le cockpit Proplace en embed=1 coupe son propre défilement (overflow:hidden)
// et annonce sa hauteur au parent : { type: 'pp-ck-h', h } (CartePage.tsx du
// monorepo). Sans écouteur ici, l'iframe restait à la hauteur de l'écran et
// rien ne défilait. On agrandit donc l'iframe : c'est la page qui défile.
const FRAME_ORIGIN = /^https:\/\/(www\.)?proplace\.co$/;
const FRAME_MAX_H = 40000;

type State = 'check' | 'ok' | 'bad' | 'none' | 'down';

export default function DealFlowPage() {
  const [params] = useSearchParams();
  const k = (params.get('k') || '').trim();
  const [state, setState] = useState<State>(k ? 'check' : 'none');
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [first, setFirst] = useState('');
  const [src, setSrc] = useState(FALLBACK_PREVIEW);
  const [modal, setModal] = useState(false);
  const [frameH, setFrameH] = useState<number | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!FRAME_ORIGIN.test(e.origin)) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      const d = e.data as { type?: string; h?: number } | null;
      if (!d || d.type !== 'pp-ck-h' || typeof d.h !== 'number' || !(d.h > 0)) return;
      const h = Math.min(Math.ceil(d.h), FRAME_MAX_H);
      setFrameH((cur) => (cur !== null && Math.abs(cur - h) < 2 ? cur : h));
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    if (!k) {
      setState('none');
      return;
    }
    let stop = false;
    setState('check');
    setSlow(false);
    const slowTimer = window.setTimeout(() => { if (!stop) setSlow(true); }, SLOW_AFTER_MS);

    (async () => {
      for (let i = 0; i < VERIFY_TRIES; i++) {
        const ctl = new AbortController();
        const t = window.setTimeout(() => ctl.abort(), VERIFY_TIMEOUT_MS);
        try {
          const r = await fetch(`${PROXY}/profund/verify?k=${encodeURIComponent(k)}`,
                                { signal: ctl.signal });
          const d = await r.json().catch(() => null);
          if (stop) return;
          if (r.ok && d && d.ok) {
            setFirst(d.first_name || '');
            if (d.preview_src) setSrc(d.preview_src);
            setState('ok');
            return;
          }
          if (r.status === 401 || r.ok) {
            setState('bad');
            return;
          }
          // 5xx ou route absente : on retente.
        } catch {
          // délai dépassé ou réseau : on retente.
        } finally {
          window.clearTimeout(t);
        }
        if (stop) return;
      }
      if (!stop) setState('down');
    })();

    return () => {
      stop = true;
      window.clearTimeout(slowTimer);
    };
  }, [k, attempt]);

  return (
    <div className="pfd">
      <header className="pfd-bar">
        <a href="/" className="pfd-brand">
          <img src={LOGO} alt="ProFund" />
        </a>
        {state === 'ok' && (
          <span className="pfd-who">Deal flow{first ? ` · ${first}` : ''}</span>
        )}
      </header>

      {state === 'ok' && (
        <iframe
          ref={frameRef}
          className="pfd-frame"
          title="ProFund deal flow"
          src={src}
          referrerPolicy="no-referrer"
          scrolling={frameH ? 'no' : undefined}
          style={frameH ? { height: frameH, flex: 'none' } : undefined}
        />
      )}

      {state !== 'ok' && (
        <main className="pfd-gate">
          {state === 'check' && (
            <>
              <p>Opening your deal flow…</p>
              {slow && <p className="pfd-hint">Waking up the server, this can take a few seconds.</p>}
            </>
          )}
          {state === 'down' && (
            <>
              <h1>We could not open your deal flow.</h1>
              <p>The server is taking too long to answer. Your link is fine, try again in a moment.</p>
              <button className="pfh-btn" type="button" onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </button>
            </>
          )}
          {state === 'bad' && (
            <>
              <h1>This link is no longer valid.</h1>
              <p>Ask for a new one with the email you used to apply.</p>
              <button className="pfh-btn" type="button" onClick={() => setModal(true)}>
                Send my access link
              </button>
            </>
          )}
          {state === 'none' && (
            <>
              <h1>Private deal flow</h1>
              <p>
                This page is for investors we have accepted. Apply, or if you
                already follow, we will email you the link.
              </p>
              <button className="pfh-btn" type="button" onClick={() => setModal(true)}>
                Apply or receive my link
              </button>
            </>
          )}
        </main>
      )}

      <DealFlowModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
