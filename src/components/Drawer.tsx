import { useEffect, useRef, useState, type ReactNode } from 'react';

// Les panneaux dépliables de l'accueil (v3.15, 06/11) : le pacte sous les règles, le
// calculateur sous le tableau. La hauteur s'anime en CSS (grid-template-rows 0fr → 1fr) ;
// fermé, le panneau sort du focus clavier (inert). Une fois ouvert, il cesse de rogner
// son contenu (« settled ») : ombres des cartes et colonne collante du calculateur.
const SETTLE_MS = 800; // un peu plus que la transition de .pv-drawer (index.css)

export function Drawer({ id, open, label, className = '', children }: {
  id: string;
  open: boolean;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(open);

  useEffect(() => {
    const el = ref.current as (HTMLDivElement & { inert: boolean }) | null;
    if (el) el.inert = !open;
    if (!open) { setSettled(false); return; }
    const t = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div ref={ref} id={id} role="region" aria-label={label}
         className={`pv-drawer${open ? ' open' : ''}${settled ? ' settled' : ''}${className ? ` ${className}` : ''}`}>
      <div className="pv-drawer-in">
        <div className="pv-drawer-body">{children}</div>
      </div>
    </div>
  );
}

/** Le bouton qui ouvre et ferme un panneau : une pilule, son « + » tourne en « × ». */
export function DrawerToggle({ open, controls, onClick, label, closeLabel, className = '' }: {
  open: boolean;
  controls: string;
  onClick: () => void;
  label: string;
  closeLabel: string;
  className?: string;
}) {
  return (
    <button type="button" className={`pv-btn pv-toggle${className ? ` ${className}` : ''}${open ? ' open' : ''}`}
            aria-expanded={open} aria-controls={controls} onClick={onClick}>
      <span>{open ? closeLabel : label}</span>
      <span className="pv-toggle-ic" aria-hidden="true" />
    </button>
  );
}

/** Un bloc repliable : un titre, un « + » qui tourne, le détail en dessous (accueil et /lp). */
export function Fold({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lp-fold${open ? ' open' : ''}`}>
      <button type="button" className="lp-fold-bar" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span><b>{title}</b>{sub && <small>{sub}</small>}</span>
        <span className="pv-toggle-ic" aria-hidden="true" />
      </button>
      <Drawer id={id} open={open} label={title}>{children}</Drawer>
    </div>
  );
}
