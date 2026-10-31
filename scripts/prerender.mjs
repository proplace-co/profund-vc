// Pré-rendu du shell HTML pour GitHub Pages.
//
// DEUX PROBLÈMES, UN SEUL SCRIPT.
//
// 1) Une SPA sur GitHub Pages renvoie **HTTP 404** sur les URL profondes : aucun
//    fichier n'existe à /pitch, donc Pages sert 404.html. La page s'affiche
//    correctement (React prend le relais), mais le STATUT reste 404 — et
//    Googlebot comme le crawler LinkedIn traitent un 404 comme une page morte.
//    On écrit donc un vrai fichier dist/pitch/index.html : statut 200.
//
// 2) Ni Googlebot (dans sa première passe) ni LinkedIn n'exécutent le JS. Tout ce
//    qu'ils lisent, c'est ce shell. Un titre unique partagé par les 4 routes
//    donnait la même carte de partage pour l'accueil et pour le deck LP.
//    Chaque route porte donc désormais ses propres title/description/canonical.
//
// Ce script remplace aussi le `cp dist/index.html dist/404.html` du site
// proplace : `cp` n'existe pas sous cmd.exe, un script npm avec `cp` casse sur
// cette machine Windows. Le CNAME, lui, est un fichier commité dans public/ —
// JAMAIS généré par `echo`, qui écrit une espace finale sous cmd.exe et de
// l'UTF-16 avec BOM sous PowerShell : GitHub refuse le domaine dans les deux cas.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '..', 'dist');
const ORIGIN = 'https://profund.vc';

const BASE_TITLE = 'ProFund · Where Pure Vision Directs Recursive AI.';
const BASE_DESC = 'Seed to Growth. We don’t fund headcount. We back tight-knit, AI-native teams building self-improving systems with massive real-world utility. Follow our deal flow live.';

// Le titre de /pitch porte la taille du fonds : lue dans le modèle
// (scripts/fund_model.py → src/data/fund.json), jamais tapée ici.
const FUND = JSON.parse(readFileSync(join(here, '..', 'src', 'data', 'fund.json'), 'utf8'));
const FUND_SIZE = `€${FUND.fund.commitments / 1e6}M`;

// '' = accueil (déjà écrit par Vite, on ne fait que le laisser en place).
const ROUTES = [
  {
    path: '',
    title: BASE_TITLE,
    desc: BASE_DESC,
  },
  {
    path: 'pitch',
    title: `ProFund · Seed to Growth · ${FUND_SIZE} target`,
    desc: 'The thesis, the platform, the three-layer portfolio construction, the fund simulation and target returns of ProFund, a venture fund from seed to growth for tight-knit, AI-native teams building self-improving systems with massive real-world utility.',
  },
  {
    path: 'dealflow',
    title: 'ProFund deal flow · private',
    desc: 'Private live deal flow for accepted ProFund investors.',
  },
  {
    path: 'legal',
    title: 'Legal notice · Pre-marketing communication | ProFund',
    desc: 'EuVECA pre-marketing communication. Professional and eligible investors only. Strictly confidential. Not an offer.',
  },
  {
    path: 'privacy',
    title: 'Privacy Policy | ProFund',
    desc: 'How ProFund collects, uses and protects personal data, in accordance with Regulation (EU) 2016/679 (GDPR).',
  },
];

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Remplace le contenu d'une balise meta identifiée par name= ou property=. */
function setMeta(html, kind, key, value) {
  const re = new RegExp(`(<meta\\s+${kind}="${key}"\\s+content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`Balise meta ${kind}="${key}" introuvable dans index.html`);
  return html.replace(re, `$1${escapeAttr(value)}$2`);
}

function render(shell, { path, title, desc }) {
  // Trailing slash : c'est l'URL que GitHub Pages sert réellement pour un
  // dossier (/pitch redirige en 301 vers /pitch/). Le canonical doit désigner
  // l'URL servie, pas celle qui redirige.
  const url = path === '' ? `${ORIGIN}/` : `${ORIGIN}/${path}/`;

  let html = shell;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`);
  html = setMeta(html, 'name', 'description', desc);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', desc);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', desc);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  return html;
}

const shell = readFileSync(join(DIST, 'index.html'), 'utf8');

// Le shell (meta + <noscript>) est servi sur TOUTES les routes, accueil et
// 404.html compris : aucun montant ne doit y figurer (règle de l'accueil).
const amount = shell.match(/(?:€|EUR)\s?\d[^<"]*/);
if (amount) throw new Error(`Montant dans index.html (shell de toutes les routes) : « ${amount[0]} »`);

for (const route of ROUTES) {
  const html = render(shell, route);
  if (route.path === '') {
    writeFileSync(join(DIST, 'index.html'), html, 'utf8');
  } else {
    mkdirSync(join(DIST, route.path), { recursive: true });
    writeFileSync(join(DIST, route.path, 'index.html'), html, 'utf8');
  }
}

// Filet pour toute URL inconnue : GitHub Pages sert 404.html, la SPA se charge
// et la route catch-all d'App.tsx renvoie sur l'accueil.
copyFileSync(join(DIST, 'index.html'), join(DIST, '404.html'));

console.log(`prerender: ${ROUTES.length} routes + 404.html écrits dans dist/`);
