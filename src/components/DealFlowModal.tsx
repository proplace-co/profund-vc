import { useEffect, useRef, useState } from 'react';

// Le site est statique (GitHub Pages) : le formulaire POSTe directement le proxy
// Modal, dont le middleware CORS est ouvert (allow_origins=["*"]). La route est
// définie dans le monorepo, modal_proxy/proxy.py → POST /profund/subscribe.
const SUBSCRIBE_URL =
  'https://alexandre-79537--proplace-chat-proxy-fastapi-app.modal.run/profund/subscribe';

// Les cinq identifiants sont ceux du renderer d'email (stan_proxy.py, _sec_on) :
// ne pas les renommer ici sans les renommer là-bas, c'est le même contrat.
const SECTIONS: { id: string; label: string }[] = [
  { id: 'pending', label: 'Deals under review' },
  { id: 'market', label: 'Market pulse and thesis' },
  { id: 'sourcing', label: 'What we sourced today' },
  { id: 'autonomous', label: 'Decisions taken automatically' },
  { id: 'stats', label: 'Pipeline numbers' },
];

const HOUR_MIN = 6;
const HOUR_MAX = 21;

type Status = 'idle' | 'sending' | 'done' | 'error';

export default function DealFlowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [rhythm, setRhythm] = useState<'daily' | 'weekly'>('daily');
  const [hour, setHour] = useState(8);
  const [on, setOn] = useState<string[]>(SECTIONS.map((s) => s.id));
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Échap ferme, et on bloque le défilement du fond tant que la boîte est ouverte.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (id: string) =>
    setOn((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const r = await fetch(SUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, rhythm, hour, sections: on, source: 'profund.vc' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setStatus('done');
    } catch (err) {
      // On ne renvoie jamais le message brut du serveur à l'écran : il peut
      // contenir un détail d'infra. Un seul message, et la voie de secours.
      setStatus('error');
      setError(err instanceof Error && err.message === 'invalid email'
        ? 'That address does not look valid.'
        : 'Something went wrong. Write to alexandre@profund.vc and we will add you.');
    }
  }

  return (
    <div className="pfm-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pfm" role="dialog" aria-modal="true" aria-label="Follow our deal flow">
        <button className="pfm-x" onClick={onClose} aria-label="Close">×</button>

        {status === 'done' ? (
          <div className="pfm-done">
            <span className="pfh-live"><span className="pfh-dot" />Subscribed</span>
            <h3>You are on the list.</h3>
            <p>
              We review every application. Once approved you receive the deal flow
              {rhythm === 'daily' ? ' every morning' : ' once a week'} at {hour}:00 Paris time.
              Every email carries a one-click unsubscribe.
            </p>
            <button className="pfh-btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 className="pfm-h">Follow our deal flow.</h3>
            <p className="pfm-sub">
              The companies our platform detects, before they are obvious.
              Set it up here — you can change it later from any email.
            </p>

            <label className="pfm-lbl" htmlFor="pfm-email">Your email</label>
            <input
              id="pfm-email"
              ref={inputRef}
              className="pfm-in"
              type="email"
              required
              autoComplete="email"
              placeholder="you@fund.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="pfm-grid">
              <div>
                <span className="pfm-lbl">Rhythm</span>
                <div className="pfm-seg">
                  <button type="button" className={rhythm === 'daily' ? 'on' : ''}
                          onClick={() => setRhythm('daily')}>Every morning</button>
                  <button type="button" className={rhythm === 'weekly' ? 'on' : ''}
                          onClick={() => setRhythm('weekly')}>Once a week</button>
                </div>
              </div>
              <div>
                <span className="pfm-lbl">Time (Paris)</span>
                <div className="pfm-step">
                  <button type="button" onClick={() => setHour((h) => Math.max(HOUR_MIN, h - 1))}
                          aria-label="Earlier">−</button>
                  <b>{hour}:00</b>
                  <button type="button" onClick={() => setHour((h) => Math.min(HOUR_MAX, h + 1))}
                          aria-label="Later">+</button>
                </div>
              </div>
            </div>

            <span className="pfm-lbl">What you receive</span>
            <div className="pfm-secs">
              {SECTIONS.map((s) => (
                <label key={s.id} className={`pfm-sec ${on.includes(s.id) ? 'on' : ''}`}>
                  <input type="checkbox" checked={on.includes(s.id)} onChange={() => toggle(s.id)} />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>

            <label className="pfm-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                I agree to receive these emails. I can unsubscribe at any time — see the{' '}
                <a href="/privacy">privacy notice</a>.
              </span>
            </label>

            {status === 'error' && <p className="pfm-err">{error}</p>}

            <button className="pfh-btn pfm-go" type="submit" disabled={!consent || status === 'sending'}>
              {status === 'sending' ? 'Sending' : 'Start receiving it'}
            </button>
            <p className="pfm-fine">
              Pre-marketing communication, professional investors only. Not an offer to subscribe.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
