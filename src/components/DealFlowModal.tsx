import { useEffect, useRef, useState } from 'react';

// Le site est statique (GitHub Pages) : le formulaire POSTe directement le proxy
// Modal, dont le middleware CORS est ouvert (allow_origins=["*"]). La route est
// définie dans le monorepo, modal_proxy/proxy.py → POST /profund/subscribe.
const PROXY =
  'https://alexandre-79537--proplace-chat-proxy-fastapi-app.modal.run';
const SUBSCRIBE_URL = `${PROXY}/profund/subscribe`;
const RESEND_URL = `${PROXY}/profund/resend`;

// Les cinq identifiants sont ceux du renderer d'email (stan_proxy.py, _sec_on) :
// ne pas les renommer ici sans les renommer là-bas, c'est le même contrat.
// Plus aucun choix côté abonné : toutes les sections, chaque soir, à 18 h
// (l'heure du daily brief de /cibles/profund-vc, dont le mail LP est la copie).
const SECTIONS = ['pending', 'market', 'sourcing', 'autonomous', 'stats'];
const RHYTHM = 'daily';
const HOUR = 18;

// Fourchettes de ticket — mêmes identifiants que _PROFUND_TICKETS côté proxy.
// Le plancher est 500 k€ : il n'existe volontairement aucune option en dessous.
const TICKETS: { id: string; label: string }[] = [
  { id: '500k-1m', label: '€500k–1M' },
  { id: '1m-2.5m', label: '€1–2.5M' },
  { id: '2.5m-5m', label: '€2.5–5M' },
  { id: '5m+', label: '€5M+' },
];

type Status = 'idle' | 'sending' | 'done' | 'error';

// Un seul champ « nom » à l'écran ; le proxy exige prénom ET nom : le premier
// mot est le prénom, le reste le nom (« Jean-Marc de la Tour » → Jean-Marc / de la Tour).
function splitName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return [parts[0] || '', parts.slice(1).join(' ')];
}

export default function DealFlowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ticket, setTicket] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [pane, setPane] = useState<'apply' | 'returning'>('apply');
  const [doneKind, setDoneKind] = useState<'pending' | 'resent'>('pending');
  const firstRef = useRef<HTMLInputElement>(null);
  const [first] = splitName(name);

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

  function switchPane(next: 'apply' | 'returning') {
    setPane(next);
    setError('');
    setStatus('idle');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    const [firstName, lastName] = splitName(name);
    if (!lastName) {
      setStatus('error');
      setError('Please give your first and last name.');
      return;
    }
    if (!ticket) {
      setStatus('error');
      setError('Please choose an indicative ticket.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      // consent : le bouton « Apply » EST la demande de recevoir ces e-mails
      // (la phrase sous le bouton le dit, avec le lien vers /privacy).
      const r = await fetch(SUBSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, consent: true, rhythm: RHYTHM, hour: HOUR, sections: SECTIONS,
          first_name: firstName, last_name: lastName, ticket,
          source: 'profund.vc',
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setDoneKind(data.status === 'accepted' ? 'resent' : 'pending');
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

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const r = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.error === 'unknown') {
        setStatus('error');
        setError('We do not have this email. Apply first.');
        return;
      }
      if (!r.ok || !data.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setDoneKind(data.status === 'pending' ? 'pending' : 'resent');
      setStatus('done');
    } catch {
      setStatus('error');
      setError('Something went wrong. Write to alexandre@profund.vc.');
    }
  }

  return (
    <div className="pfm-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pfm" role="dialog" aria-modal="true" aria-label="Apply to follow our deal flow">
        <button className="pfm-x" onClick={onClose} aria-label="Close">×</button>

        {status === 'done' ? (
          <div className="pfm-done">
            <span className="pfh-live"><span className="pfh-dot" />
              {doneKind === 'resent' ? 'Link sent' : 'Application received'}
            </span>
            <h3>Thank you{first ? `, ${first}` : ''}.</h3>
            {doneKind === 'resent' ? (
              <p>
                You are already on the list. We just emailed your private link
                to open the live deal flow.
              </p>
            ) : pane === 'returning' ? (
              <p>
                Your application is still under review. Nothing is sent until
                we accept — then you will receive a private link.
              </p>
            ) : (
              <p>
                We review every application. Once accepted, you receive a private
                link to the live deal flow and, every evening at {HOUR}:00 Paris time,
                the companies we reviewed that day. One-click unsubscribe.
              </p>
            )}
            <button className="pfh-btn" onClick={onClose}>Close</button>
          </div>
        ) : pane === 'returning' ? (
          <form onSubmit={resend}>
            <h3 className="pfm-h">Get your access link.</h3>
            <p className="pfm-sub">We email a private link to the live deal flow.</p>
            <div className="pfm-fld">
              <label className="pfm-lbl" htmlFor="pfm-email">Email</label>
              <input id="pfm-email" ref={firstRef} className="pfm-in" type="email" required
                     autoComplete="email" placeholder="you@fund.com" value={email}
                     onChange={(e) => setEmail(e.target.value)} />
            </div>
            {status === 'error' && <p className="pfm-err">{error}</p>}
            <button className="pfh-btn pfm-go" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending' : 'Send my access link'}
            </button>
            <p className="pfm-fine">
              New here? <button type="button" className="pfm-alt" onClick={() => switchPane('apply')}>Apply</button>
            </p>
          </form>
        ) : (
          <form onSubmit={submit}>
            <h3 className="pfm-h">Follow our deal flow.</h3>
            <p className="pfm-sub">
              Every evening at {HOUR}:00 Paris time: the companies we reviewed that day,
              the ones we kept, and why.
            </p>

            <div className="pfm-fld pfm-grid">
              <div>
                <label className="pfm-lbl" htmlFor="pfm-name">Full name</label>
                <input id="pfm-name" ref={firstRef} className="pfm-in" required
                       autoComplete="name" value={name}
                       onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="pfm-lbl" htmlFor="pfm-email">Email</label>
                <input id="pfm-email" className="pfm-in" type="email" required
                       autoComplete="email" placeholder="you@fund.com" value={email}
                       onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="pfm-fld">
              <span className="pfm-lbl" id="pfm-ticket">Indicative ticket · minimum €500k</span>
              <div className="pfm-seg pfm-tk" role="radiogroup" aria-labelledby="pfm-ticket">
                {TICKETS.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={ticket === t.id}
                          className={ticket === t.id ? 'on' : ''}
                          onClick={() => { setTicket(t.id); if (error) setError(''); }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {status === 'error' && <p className="pfm-err">{error}</p>}

            <button className="pfh-btn pfm-go" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending' : 'Apply'}
            </button>
            <p className="pfm-fine">
              By applying, you ask to receive these emails. One-click unsubscribe,
              see the <a href="/privacy">privacy notice</a>. Every application is reviewed.
              <br />EuVECA pre-marketing communication, eligible investors only. Not an offer to subscribe.
            </p>
            <p className="pfm-fine">
              Already following? <button type="button" className="pfm-alt" onClick={() => switchPane('returning')}>Get my access link</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
