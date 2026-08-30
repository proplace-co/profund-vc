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

// Fourchettes de ticket — mêmes identifiants que _PROFUND_TICKETS côté proxy.
// Le plancher est 500 k€ : il n'existe volontairement aucune option en dessous.
const TICKETS: { id: string; label: string }[] = [
  { id: '500k-1m', label: '€500k – €1M' },
  { id: '1m-2.5m', label: '€1M – €2.5M' },
  { id: '2.5m-5m', label: '€2.5M – €5M' },
  { id: '5m+', label: '€5M +' },
];

const HOUR_MIN = 6;
const HOUR_MAX = 21;

type Status = 'idle' | 'sending' | 'done' | 'error';

export default function DealFlowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [ticket, setTicket] = useState('');
  const [rhythm, setRhythm] = useState<'daily' | 'weekly'>('daily');
  const [hour, setHour] = useState(8);
  const [on, setOn] = useState<string[]>(SECTIONS.map((s) => s.id));
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const firstRef = useRef<HTMLInputElement>(null);

  // Échap ferme, et on bloque le défilement du fond tant que la boîte est ouverte.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => firstRef.current?.focus(), 60);
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
        body: JSON.stringify({
          email, consent, rhythm, hour, sections: on,
          first_name: first, last_name: last, ticket,
          source: 'profund.vc',
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setStatus('done');
    } catch (err) {
      // On ne renvoie jamais le message brut du serveur à l'écran : il peut
      // contenir un détail d'infra. Un message clair, et la voie de secours.
      const raw = err instanceof Error ? err.message : '';
      setStatus('error');
      setError(
        raw === 'invalid email' ? 'That address does not look valid.'
        : raw === 'ticket required' ? 'Please choose an indicative ticket.'
        : raw === 'name required' ? 'Please give your first and last name.'
        : 'Something went wrong. Write to alexandre@profund.vc and we will add you.',
      );
    }
  }

  return (
    <div className="pfm-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pfm" role="dialog" aria-modal="true" aria-label="Apply to follow our deal flow">
        <button className="pfm-x" onClick={onClose} aria-label="Close">×</button>

        {status === 'done' ? (
          <div className="pfm-done">
            <span className="pfh-live"><span className="pfh-dot" />Application received</span>
            <h3>Thank you, {first || 'and welcome'}.</h3>
            <p>
              We review every application and will come back to you. If we move forward,
              you receive the deal flow {rhythm === 'daily' ? 'every morning' : 'once a week'} at {hour}:00
              Paris time, with a one-click unsubscribe in every email.
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

            <div className="pfm-fld pfm-grid">
              <div>
                <label className="pfm-lbl" htmlFor="pfm-first">First name</label>
                <input id="pfm-first" ref={firstRef} className="pfm-in" required
                       autoComplete="given-name" value={first}
                       onChange={(e) => setFirst(e.target.value)} />
              </div>
              <div>
                <label className="pfm-lbl" htmlFor="pfm-last">Last name</label>
                <input id="pfm-last" className="pfm-in" required
                       autoComplete="family-name" value={last}
                       onChange={(e) => setLast(e.target.value)} />
              </div>
            </div>

            <div className="pfm-fld">
              <label className="pfm-lbl" htmlFor="pfm-email">Your email</label>
              <input id="pfm-email" className="pfm-in" type="email" required
                     autoComplete="email" placeholder="you@fund.com" value={email}
                     onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="pfm-fld">
              <label className="pfm-lbl" htmlFor="pfm-ticket">Indicative ticket</label>
              <select id="pfm-ticket" className="pfm-in" required value={ticket}
                      onChange={(e) => setTicket(e.target.value)}>
                <option value="" disabled>Choose a range</option>
                {TICKETS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <p className="pfm-hint">Minimum commitment €500k.</p>
            </div>

            <div className="pfm-fld pfm-grid">
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

            <div className="pfm-fld">
              <span className="pfm-lbl">What you receive</span>
              <div className="pfm-secs">
                {SECTIONS.map((s) => (
                  <label key={s.id} className={`pfm-sec ${on.includes(s.id) ? 'on' : ''}`}>
                    <input type="checkbox" checked={on.includes(s.id)} onChange={() => toggle(s.id)} />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
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
              {status === 'sending' ? 'Sending' : 'Apply'}
            </button>
            <p className="pfm-fine">
              Every application is reviewed. We are free to accept it or not, and we may
              ask for further information before we do.
              <br />Pre-marketing communication, professional investors only. Not an offer to subscribe.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
