import { useEffect, useState } from 'react';
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
          className="pfd-frame"
          title="ProFund deal flow"
          src={src}
          referrerPolicy="no-referrer"
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
