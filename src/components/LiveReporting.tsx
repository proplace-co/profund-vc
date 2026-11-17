import { useState } from 'react';
import { dealFlowPreview } from '../lib/dealFlowPreview';
import { PORTFOLIO, type PortfolioCo } from './Founders';

// /lp, « Live reporting & deal flow » (17/11, Alexandre) : les trois sociétés du portefeuille, puis la
// fiche de la société choisie dans le cockpit du fonds, le même que /dealflow (proplace.co/cibles/
// profund-vc redirige vers le jeton de `dealFlowPreview`, vérifié le 17/11). Proplace d'abord.
// RÈGLE : aucun code du cockpit ni de /dealflow n'est modifié. On prend son lien profond existant, celui
// de l'email du matin : `?sel=<société>&only=<société>`, la ligne choisie et elle seule, sa fiche ouverte
// à droite avec tous ses onglets (Screening, Conviction, Memo, Reporting, Decision thread, Company). En
// anglais (`/carte/`, comme /lp) ; /dealflow garde `/fr/`. Lecture seule (`guest=lp`, sans `lpk`).
// Ce que le cockpit ne sait pas faire par lien au 17/11 : ouvrir sa vue Reporting (« In portfolio ») ni
// choisir l'onglet de la fiche (elle s'ouvre sur le mémo). Il lui faut environ 1 080 px pour montrer la
// liste ET la fiche : le choix des sociétés est au-dessus du cadre, qui prend toute la largeur.
// Une société hors du cockpit (`dealflow: false`, Founders.tsx) a une carte à la place du cadre.
function reportingSrc(name: string): string {
  const u = new URL(dealFlowPreview(undefined, name));
  u.pathname = '/carte/';
  u.searchParams.set('only', name);
  return u.href;
}

const RUNS: Record<string, string> = { corpdev: 'Corp dev', inbound: 'Inbound', outbound: 'Outbound' };

export default function LiveReporting() {
  const [sel, setSel] = useState(PORTFOLIO[0].name);
  const [loaded, setLoaded] = useState('');
  const co: PortfolioCo = PORTFOLIO.find((c) => c.name === sel) ?? PORTFOLIO[0];
  return (
    <div className="lp-live">
      <h3 className="lp-live-h"><span className="pv-dot" />Live reporting &amp; deal flow</h3>
      {/* des boutons à état (aria-pressed), pas des onglets ARIA : pas de contrat clavier à tenir. Le
          message d'attente repart à chaque changement de société (le cadre est remonté). */}
      <div className="lp-live-cos" role="group" aria-label="Portfolio companies">
        {PORTFOLIO.map((c) => (
          <button key={c.name} type="button" aria-pressed={c.name === co.name} aria-controls="lp-live-pane"
                  onClick={() => { if (c.name !== co.name) { setSel(c.name); setLoaded(''); } }}>
            <img src={c.logo} alt={c.name} style={{ maxHeight: c.h }} />
            <small>Seed · {c.caps.map((k) => RUNS[k]).join(', ')}</small>
          </button>
        ))}
      </div>
      <div id="lp-live-pane" className="lp-live-pane" role="region" aria-label={`${co.name}, live file`}>
        {co.dealflow ? (
          <>
            {loaded !== co.name && <p className="lp-live-wait">Opening {co.name}’s live file…</p>}
            <iframe key={co.name} title={`ProFund deal flow: ${co.name}`} src={reportingSrc(co.name)}
                    loading="lazy" referrerPolicy="no-referrer" onLoad={() => setLoaded(co.name)} />
          </>
        ) : (
          <div className="lp-live-off">
            <img src={co.logo} alt={co.name} style={{ maxHeight: co.h * 1.4 }} />
            <p>{co.d}</p>
            <p className="lp-live-soon">{co.name} is not in the live deal flow yet. Its file opens here as soon as it is.</p>
          </div>
        )}
      </div>
    </div>
  );
}
