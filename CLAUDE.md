# CLAUDE.md — profund.vc

Site vitrine de ProFund. SPA React + Vite, servi en statique par GitHub Pages
sur le domaine `profund.vc`. **Pas de backend, aucun appel réseau côté app**
(la seule ressource externe est l'iframe Brevo du formulaire d'inscription).

## Structure

```
src/
  main.tsx              montage React + ErrorBoundary
  App.tsx               les 4 routes + la route catch-all
  index.css             TOUT le style du site (~450 lignes de CSS maison)
  components/
    HomepageLite.tsx    route /
    ProFundPage.tsx     route /pitch — 17 sections, un composant local par section
    LegalPage.tsx       route /legal — le texte vit dans le tableau CLAUSES
    PrivacyPage.tsx     route /privacy — le texte vit dans le tableau SECTIONS
    Footer.tsx          pied de page commun aux 4 routes
    CookieBanner.tsx    bandeau, monté globalement dans App.tsx
    ErrorBoundary.tsx   filet anti-page-blanche
scripts/prerender.mjs   post-build : un index.html par route + 404.html
public/                 images, CNAME, robots.txt, sitemap.xml
```

## Conventions

**Le style est du CSS maison, pas du Tailwind.** Les classes `.pf-wrap`,
`.hero-title`, `.mod`, `.fund-table`, `.fw-stats`… sont définies dans
`src/index.css`. Pour modifier l'apparence, éditer ce fichier — ne pas ajouter
d'utilitaires Tailwind par-dessus, le site deviendrait illisible à maintenir
avec deux systèmes concurrents.

**Tailwind est néanmoins indispensable et ne doit pas être retiré.** Il n'est
pas là pour ses utilitaires mais pour son *preflight* : le CSS maison a été
écrit par-dessus ce reset (`table{border-collapse}`, `h1-h6{font-size:inherit}`,
`ul{list-style:none}`, `img{display:block}`). Sans lui, les tableaux de
simulation et tous les titres se re-rendent différemment.
Corollaire : `src/index.css` contient `@layer base { * { @apply border-border } }`,
qui dépend à la fois de `--border` dans le `:root` du CSS **et** de
`colors.border` dans `tailwind.config.ts`. Supprimer une moitié casse le build.

**Le contenu textuel est dans les composants**, en dur. Les pages Legal et
Privacy sont l'exception : leur texte est dans un tableau en haut du fichier
(`CLAUSES`, `SECTIONS`), c'est là qu'il faut le modifier.

**L'accueil a sa propre grammaire visuelle, scopée `.pfh`** (bas de
`src/index.css`) : gabarit 1120 px, sections à `padding: 104px 0` séparées par
des filets 1 px, titres à interlettrage négatif, chapeaux à filet bleu — jamais
de capitales espacées. Elle est reprise de la home de proplace.co. `/pitch`,
`/legal` et `/privacy` gardent l'ancien jeu de classes (`.pf-wrap`, `.mod`,
`.fund-table`…) : les deux cohabitent, ne pas les mélanger.

**AUCUN MONTANT SUR L'ACCUEIL** (décision d'Antoine, 30/08). La taille du fonds,
la construction, les tickets et les rendements cibles vivent **uniquement** dans
la fiche PDF, qui porte la mention de pré-commercialisation AIFMD. L'accueil
parle du passé, de ce qui est en cours, et du deal flow. `/pitch` garde ses
chiffres : c'est le deck, pas la vitrine.

**La fiche PDF est un fichier commité, pas un artefact de build.**
`public/profund-factsheet.pdf` est produit par `python scripts/factsheet.py`
(reportlab). `npm run build` ne le régénère PAS. Après toute modification d'un
chiffre, relancer le script ET commiter le PDF.
⚠️ Les chiffres du fonds vivent à **trois endroits** qui doivent rester
d'accord : `ProFundPage.tsx` (/pitch), `HomepageLite.tsx` (accueil) et
`scripts/factsheet.py` (PDF). Le PDF emploie « EUR » et de l'ASCII pur : les
polices Helvetica de base de reportlab sont en WinAnsi et rendent un caractère
de remplacement sur `€` ou `—`.

**Chaque section de `/pitch` est un composant local** dans `ProFundPage.tsx`
(`HeroSection`, `TheOpportunity`, `ThePlatform`…), assemblés en bas du fichier.
Pour réordonner les sections, changer l'ordre dans le `export default`.

**Fichiers en UTF-8 sans BOM, fins de ligne LF** (cf. `.gitattributes`). Les
pages juridiques contiennent des caractères non-ASCII (`— · € ’`) : un fichier
écrit en UTF-16 par PowerShell produit du mojibake sur une page que personne ne
relit.

## Pièges

**Ajouter une route** demande DEUX modifications : la `<Route>` dans `App.tsx`
**et** une entrée dans `ROUTES` de `scripts/prerender.mjs`. Sans la seconde,
GitHub Pages sert la page en **HTTP 404** (le contenu s'affiche, mais Google et
LinkedIn la traitent comme morte) et elle hérite du titre de l'accueil.
Penser aussi à `public/sitemap.xml`.

**`public/CNAME`** : exactement `profund.vc` + saut de ligne. Ne jamais le
régénérer avec `echo` sous Windows (espace finale en cmd.exe, UTF-16+BOM en
PowerShell) : GitHub rejette le domaine et le site repasse sur
`proplace-co.github.io`.

**Pas de `cp`, `echo >`, `sed -i` dans les scripts npm** : ils tournent sous
cmd.exe sur cette machine. Tout post-traitement de build passe par
`scripts/prerender.mjs` (Node, multiplateforme).

**`base: '/'` dans `vite.config.ts`** : tant que le DNS n'est pas basculé, le
site servi sur `proplace-co.github.io/profund-vc/` affiche des 404 sur tous les
assets. C'est attendu, ne pas « corriger » cette valeur.

**Contenu juridiquement sensible.** `/legal` est une communication de
pré-commercialisation AIFMD (art. 30a) et `/pitch` contient des chiffres de
performance cible. Ne jamais reformuler, arrondir ou « améliorer » un chiffre,
une date ou une clause de ces pages sans demande explicite.

## Vérifier une modification

```bash
npm run typecheck              # doit sortir 0 erreur
npm run build                  # doit finir par "prerender: N routes ... écrits"
npm run preview                # puis ouvrir /, /pitch/, /legal/, /privacy/
```

Contrôler le rendu à 390 px, 768 px et 1440 px : le CSS bascule à 768 px
(`@media (max-width: 768px)`), où les grilles passent en une colonne, la grille
`.hero-stats` de 4 à 2 colonnes et les tableaux de fonds passent en défilement
horizontal (`.table-scroll`).
