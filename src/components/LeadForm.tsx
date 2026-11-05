import { useState, type FormEvent } from 'react';
import { Icon } from './Thesis';

// Les formulaires de l'accueil (« Reserve your round »), de /sell et de /lp.
// Le site est statique et ces demandes n'ont PAS de route côté proxy (seul
// /profund/subscribe existe, pour le deal flow : DealFlowModal.tsx) : le
// formulaire prépare donc un email structuré vers le GP, que la personne envoie
// depuis sa messagerie. Le jour où une route existe (modal_proxy/proxy.py, dans
// le monorepo), seul submit() change ici.
export const CONTACT = 'alexandre@profund.vc';

export interface Field {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'url' | 'textarea' | 'select' | 'seg';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  full?: boolean;             // occupe toute la largeur de la grille
  hint?: string;
}

export default function LeadForm({ subject, fields, submit, extra, dark = false }: {
  subject: string;
  fields: Field[];
  submit: string;
  extra?: string;             // lignes ajoutées en tête de l'email (ex. le calcul du calculateur)
  dark?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const set = (name: string, v: string) => setValues((x) => ({ ...x, [name]: v }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const missing = fields.filter((f) => f.required && !(values[f.name] || '').trim());
    if (missing.length) {
      setError(`Please fill in: ${missing.map((f) => f.label.toLowerCase()).join(', ')}.`);
      return;
    }
    const email = fields.find((f) => f.type === 'email');
    if (email && values[email.name] && !/^\S+@\S+\.\S+$/.test(values[email.name])) {
      setError('Please check the email address.');
      return;
    }
    setError('');
    const lines = fields
      .filter((f) => (values[f.name] || '').trim())
      .map((f) => `${f.label}: ${values[f.name].trim()}`);
    const body = [extra, ...lines].filter(Boolean).join('\n');
    window.location.href = `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className={`pv-form pv-form-done${dark ? ' dark' : ''}`} role="status">
        <span className="pv-ic"><Icon name="mail" /></span>
        <h3>Your email is ready to send.</h3>
        <p>
          Your mail app opened with your answers addressed to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          Send it and we answer within 24 hours.
        </p>
        <button type="button" className="pv-btn line" onClick={() => setSent(false)}>Edit my answers</button>
      </div>
    );
  }

  return (
    <form className={`pv-form${dark ? ' dark' : ''}`} onSubmit={onSubmit} noValidate>
      <div className="pv-form-grid">
        {fields.map((f) => {
          // un groupe de boutons ne va pas dans un <label> : cliquer le libellé cliquerait le premier
          const Wrap = f.type === 'seg' ? 'div' : 'label';
          return (
          <Wrap key={f.name} className={`pv-fld${f.full || f.type === 'textarea' || f.type === 'seg' ? ' full' : ''}`}>
            <span className="pv-fld-l">{f.label}{f.required && <i aria-hidden="true"> *</i>}</span>
            {f.type === 'textarea' ? (
              <textarea className="pfm-in pv-ta" rows={3} placeholder={f.placeholder} value={values[f.name] || ''}
                        onChange={(e) => set(f.name, e.target.value)} />
            ) : f.type === 'select' ? (
              <select className="pfm-in" value={values[f.name] || ''} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">Select</option>
                {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'seg' ? (
              <span className="pfm-seg pv-seg" role="group" aria-label={f.label}>
                {f.options!.map((o) => (
                  <button key={o} type="button" className={values[f.name] === o ? 'on' : undefined}
                          aria-pressed={values[f.name] === o} onClick={() => set(f.name, o)}>{o}</button>
                ))}
              </span>
            ) : (
              <input className="pfm-in" type={f.type || 'text'} placeholder={f.placeholder} value={values[f.name] || ''}
                     autoComplete={f.type === 'email' ? 'email' : f.name === 'name' ? 'name' : 'off'}
                     onChange={(e) => set(f.name, e.target.value)} />
            )}
            {f.hint && <span className="pv-fld-h">{f.hint}</span>}
          </Wrap>
          );
        })}
      </div>
      {error && <p className="pfm-err" role="alert">{error}</p>}
      <button type="submit" className={`pv-btn${dark ? ' light' : ''} pv-form-go`}>{submit} <Icon name="arrow" /></button>
      <p className="pv-form-fine">Opens your mail app with your answers, addressed to {CONTACT}. Nothing is stored on this site.</p>
    </form>
  );
}
