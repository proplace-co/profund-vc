import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Filet de sécurité minimal, sans dépendance.
 *
 * La version Zite du site s'appuyait sur le runtime de la plateforme
 * (`react-error-boundary` + `window._ziteOnFixError`) pour attraper les erreurs
 * de rendu. Ce runtime a disparu avec la migration : sans ce composant, la
 * moindre exception dans un composant donne une page BLANCHE sur le site public
 * d'un fonds, sans le moindre signal.
 */
interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur de rendu ProFund:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="pf-section">
        <div className="pf-wrap">
          <span className="eyebrow">Erreur</span>
          <h1 className="h2" style={{ fontSize: '22px' }}>
            Cette page n'a pas pu s'afficher.
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--sub)', lineHeight: 1.8, marginBottom: '24px' }}>
            Merci de recharger la page. Si le problème persiste, écrivez-nous à{' '}
            <a href="mailto:alexandre@profund.vc" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
              alexandre@profund.vc
            </a>
            .
          </p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </div>
      </div>
    );
  }
}
