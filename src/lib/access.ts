// L'accès au deal flow retenu par ce navigateur (31/10, Antoine) : après un
// premier clic sur le lien magique reçu par email, /dealflow s'ouvre sans email.
// Jamais d'accès sur la seule adresse email : n'importe qui pourrait taper celle
// d'un LP. Le jeton reste celui du lien (vérifié par /profund/verify à chaque
// ouverture) ; « Sign out » l'oublie.
const KEY = 'pf_dealflow_k';
const VALID = /^[A-Za-z0-9_-]{16,64}$/;

export function savedAccess(): string {
  try {
    const k = localStorage.getItem(KEY) || '';
    return VALID.test(k) ? k : '';
  } catch {
    return '';
  }
}

export function rememberAccess(k: string) {
  try {
    if (VALID.test(k)) localStorage.setItem(KEY, k);
  } catch { /* stockage indisponible : on redemandera le lien */ }
}

export function forgetAccess() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* rien à oublier */ }
}
