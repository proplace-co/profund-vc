import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';

const PROXY =
  'https://alexandre-79537--proplace-chat-proxy-fastapi-app.modal.run';
const PREVIEW =
  'https://proplace.co/cibles/profund-vc/?teaser=1&guest=lp&ticker=0&onb=0&tab=kept';
const LOGO = '/logo.png';

export default function DealFlowPage() {
  const [params] = useSearchParams();
  const k = (params.get('k') || '').trim();
  const [state, setState] = useState<'check' | 'ok' | 'bad' | 'none'>(
    k ? 'check' : 'none',
  );
  const [first, setFirst] = useState('');
  const [modal, setModal] = useState(false);

  useEffect(() => {
    if (!k) {
      setState('none');
      return;
    }
    let stop = false;
    setState('check');
    fetch(`${PROXY}/profund/verify?k=${encodeURIComponent(k)}`)
      .then((r) => r.json())
      .then((d) => {
        if (stop) return;
        if (d && d.ok) {
          setFirst(d.first_name || '');
          setState('ok');
        } else setState('bad');
      })
      .catch(() => { if (!stop) setState('bad'); });
    return () => { stop = true; };
  }, [k]);

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
          src={PREVIEW}
          referrerPolicy="no-referrer"
        />
      )}

      {state !== 'ok' && (
        <main className="pfd-gate">
          {state === 'check' && <p>Checking your access…</p>}
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
