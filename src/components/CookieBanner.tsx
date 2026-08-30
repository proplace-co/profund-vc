import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'pf_cookie_ack_v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const ack = localStorage.getItem(STORAGE_KEY);
      if (!ack) setVisible(true);
    } catch {
      // localStorage indisponible → on n'affiche pas le bandeau
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '540px',
      background: '#fff',
      border: '1px solid var(--line)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      padding: '16px 20px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
    }}>
      <p style={{ fontSize: '12px', color: 'var(--sub)', lineHeight: 1.65, flex: 1, margin: 0 }}>
        We use strictly necessary cookies to operate this site (session, security). No analytics or advertising cookies.{' '}
        <Link to="/privacy" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Privacy Policy</Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="btn"
        style={{ padding: '8px 16px', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        Got it
      </button>
    </div>
  );
}
