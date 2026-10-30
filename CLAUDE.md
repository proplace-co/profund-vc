# CLAUDE.md — profund.vc

Site vitrine de ProFund. SPA React + Vite, servi en statique par GitHub Pages
sur le domaine `profund.vc`. **Pas de backend, aucun appel réseau côté app**
(la seule ressource externe est l'iframe Brevo du formulaire d'inscription).

## Structure

```
src/
  main.tsx              montage React + ErrorBoundary
  App.tsx               les 4 routes + la route catch-all
  index.css             TOUT le style du site (CSS maison : jetons, système pv-, anciennes classes)
  components/
    Thesis.tsx          LE TEXTE DE LA THÈSE (manifeste, 4 lois, 2 moteurs, proof of work),
                        barre du haut, visuel du héros — rendus par / ET /pitch
    HomepageLite.tsx    route /
    ProFundPage.tsx     route /pitch — un composant local par section
    LegalPage.tsx       route /legal — le texte vit dans le tableau CLAUSES
    PrivacyPage.tsx     route /privacy — le texte vit dans le tableau SECTIONS
    Footer.tsx          pied de page commun aux 4 routes
    CookieBanner.tsx    bandeau, monté globalement dans App.tsx
    ErrorBoundary.tsx   filet anti-page-blanche
  lib/fund.ts           types de fund.json + formateurs (€, ×, %) de /pitch
  lib/links.ts          URL (avec ?v=) de la fiche PDF et du modèle Excel
  data/fund.json        CHIFFRES DU FONDS — généré, ne pas éditer à la main
scripts/fund_model.py   modèle du fonds : la seule source des chiffres → fund.json
scripts/factsheet.py    fiche PDF 3 pages, lit fund.json
scripts/sheet_engine.py moteur de dessin de la fiche (repris de Maximum fiches_v5.py)
scripts/assets/fonts/   Archivo (OFL), embarquée dans la fiche
scripts/fund_xlsx.py    modèle Excel vivant (formules + valeurs en cache) → public/
scripts/prerender.mjs   post-build : un index.html par route + 404.html
public/                 images, CNAME, robots.txt, sitemap.xml, fiche PDF, modèle Excel
archive/v1/             fiche PDF de la V1 (hors public/ : jamais publiée)
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
(`CLAUSES`, `SECTIONS`), c'est là qu'il faut le modifier. **Le texte de la
thèse** (Antoine, 30/10 : « Pure Vision. Autonomous Scale. », manifeste, quatre
lois, deux moteurs, proof of work) vit dans `Thesis.tsx`, rendu à l'identique
par l'accueil et /pitch ; la fiche PDF en porte une copie (`factsheet.py`) :
les changer ensemble.

**Le style reprend la grammaire de Maximum Insurance V5** (maximum-insurance.com,
`landing_v5.py` du dépôt Maximum) dans les couleurs ProFund (30/10, Antoine) :
police Archivo, titres 750 serrés, chapeaux en capitales espacées bleues,
cartes arrondies à ombre douce, boutons en pilule, pastilles d'icône en dégradé
gris-bleu, sections « de nuit », bandeau final sombre. Les jetons (couleurs,
rayons, ombres) sont en tête de `src/index.css` et repris tels quels dans
`scripts/sheet_engine.py` : les changer ensemble. Deux jeux de classes
cohabitent : le système commun `pv-` (barre du haut, héros, sections de la
thèse, bandeau, boutons — accueil ET /pitch) et l'ancien jeu (`.pf-wrap`,
`.mod`, `.fund-table`…) des sections propres à /pitch, /legal et /privacy,
redessiné avec les mêmes jetons. Dans les tableaux, la ligne de total porte la
classe `sub`. /pitch n'est lié nulle part depuis l'accueil (deck, un à un).

**Le popup d'abonnement appelle un vrai backend.** `DealFlowModal.tsx` POSTe
`https://alexandre-79537--proplace-chat-proxy-fastapi-app.modal.run/profund/subscribe`,
route définie dans l'AUTRE dépôt (monorepo antigravity, `modal_proxy/proxy.py`,
app Modal `proplace-chat-proxy`). Le site reste statique : c'est le seul appel
réseau de l'app. Les 5 identifiants de section (`pending`, `market`, `sourcing`,
`autonomous`, `stats`) sont le contrat partagé avec le renderer d'email
(`stan_proxy.py`, `_sec_on`) — les renommer ici casse le filtrage là-bas.
L'inscription stocke (Dict `profund-subscribers`, `status: pending`) ; le GP
accepte d'un clic (`/profund/accept`). **Le brief du soir des LPs** (29/10) : c'est
le daily brief du fonds « Profund VC » de Proplace, logo ProFund, sans crédits ni
pouces ni lien /cibles (variante `html_profund` de `stan_proxy.py`), envoyé par
`_profund_lp_run` (monorepo, `modal_app.py`) à chaque LP accepté juste après le
brief du fonds, à 18 h Paris, une fois par jour. Désabonnement :
`/profund/unsubscribe` (garde l'accès au deal flow). Le popup n'a plus que nom
complet (coupé en prénom/nom), email, ticket en boutons : le bouton « Apply »
vaut demande de recevoir les emails (`consent: true`).

**`/dealflow` embarque le cockpit Proplace en marque blanche.** L'iframe pointe
`proplace.co/fr/carte?…&guest=lp` (jeton fourni par `/profund/verify`, présentation
normalisée par `src/lib/dealFlowPreview.ts` : Validées, période complète, liste).
Côté
monorepo, `guest=lp` résout le mode `lp` (`proplace/src/components/AtelierV2/uiState.ts`) :
lecture seule, aucun élément Proplace (offre, crédits, Stan, RDV), contact du
GP en pied (`LpContact.tsx`). La vue LP est simplifiée et montre les mémos
complets en lecture seule ; les décisions, liens et versions enregistrées sont
relus automatiquement toutes les 30 secondes et au retour sur l'onglet.
Dans le panneau de lecture, l'onglet Mémo embarque la page native
`analysis.proplace.co/…?embed=cockpit&reader=1` : aperçu, Plan, version enregistrée,
export PDF et synthèse en deck, sans « Modifier ». Les exports conservent leurs
droits du serveur : depuis le 28/10, le dossier comité PDF et le deck pour tout lecteur
de la dernière version (decks des lecteurs non connectés plafonnés par jour).
**Depuis le 28/10, `/profund/verify` choisit la vue** : `guest=gp` pour le lien du GP
(alexandre@profund.vc, alexandre@proplace.co : tous les gestes de la fiche sauf
S'abonner), `guest=lp` pour un LP (lecture + discussion), et `lpk=<lien magique>` qui
signe les messages de la discussion du dossier. `dealFlowPreview.ts` les reprend tels
quels — ne pas les remettre en dur. L'iframe attend la confirmation du mode lecteur avant de
s'afficher pour ne jamais exposer un ancien éditeur mis en cache.
Ce mode défile DANS l'iframe ; l'écouteur
`pp-ck-h` de `DealFlowPage.tsx` ne sert qu'aux anciens cockpits qui annoncent
leur hauteur. Les emails (accusé de réception, lien d'accès) sont rendus par
`_profund_mail_html` dans `modal_proxy/proxy.py`.
L'intégration LP conserve la classe de mise en page `pp-desk` du cockpit source :
titre, pastilles avec le bouton « + » à droite, puis période/recherche/filtres.
Le panneau « + » reste flottant et sa largeur est bornée dans la vue LP.

**UN SEUL MONTANT SUR L'ACCUEIL** (décision d'Antoine, 30/08, assouplie par
Alexandre le 29/10) : la taille du fonds, lue dans `fund.json` — dans la phrase
du héros et, depuis le texte d'Antoine du 30/10, dans la loi 04 (« return our
entire €100M fund »). La construction, les tickets et les rendements cibles vivent
**uniquement** dans la fiche PDF, le modèle Excel et /pitch. L'accueil
parle du passé, de ce qui est en cours, et du deal flow. `/pitch` garde ses
chiffres : c'est le deck, pas la vitrine. La règle couvre aussi le shell
`index.html` (meta description et `<noscript>`), servi sur TOUTES les routes et
sur `404.html` : `prerender.mjs` fait échouer le build s'il y trouve un montant.
Seule exception : les fourchettes de souscription des LPs de `DealFlowModal.tsx`
(contrat avec `_PROFUND_TICKETS` du proxy).

**Les chiffres du fonds ont UNE source : `scripts/fund_model.py`** (v2, 28/10 :
un fonds de 100 M€, trois étages Seed / Venture / Growth, SPV de co-investissement
au-delà de 10 M€ par société). Le modèle porte les hypothèses, les lignes de
simulation (S-, V-, G-), les frais, la cascade de distribution, le TRI, et
vérifie ses invariants (total = engagements, tickets dans les bornes, plafond par
société, arrondis…). Il écrit `src/data/fund.json`, que lisent `/pitch` (via
`src/lib/fund.ts`), la fiche PDF et le titre de `/pitch` dans `prerender.mjs`.
Ne JAMAIS taper un montant, un multiple ou un TRI du fonds dans un composant
ou dans la fiche : changer le modèle, puis

```bash
python scripts/fund_model.py     # contrôles + écrit src/data/fund.json
python scripts/factsheet.py      # régénère public/profund-factsheet.pdf
python scripts/fund_xlsx.py      # régénère public/profund-fund-model.xlsx
```

commiter le JSON, le PDF **et** le xlsx, et changer les `?v=` de
`FACTSHEET_URL` et `MODEL_XLSX_URL` (`src/lib/links.ts`) pour que les
navigateurs reprennent les nouveaux fichiers.
`npm run build` ne régénère NI le JSON NI le PDF NI le xlsx (ils sont commités).
`python scripts/fund_model.py --check` échoue si le JSON n'est plus à jour ;
`factsheet.py` et `fund_xlsx.py` refusent aussi de tourner dans ce cas. Les frais
du fonds du modèle sont une estimation en attendant le devis du gestionnaire EuVECA.

**Le modèle Excel** (téléchargeable sur /pitch, « sur demande » dans la fiche)
est vivant : chaque sortie est une formule, écrite avec sa valeur en cache pour
les aperçus qui ne recalculent pas. `fund_xlsx.py` le recalcule avec pycel et
échoue si une formule ne retombe pas sur sa valeur et sur `fund.json` (onglet
Checks). Dépendance : `xlsxwriter` (`pip install --user xlsxwriter`).

**La fiche PDF fait 3 pages** (1 : vision, manifeste, lois, construction ;
2 : moteurs, termes, GP, track record, proof of work, appel avec QR vers
`profund.vc/#dealflow` qui ouvre le popup ; 3 : simulation ligne à ligne et
performance). Elle embarque Archivo (`scripts/assets/fonts/`) : `€`, `—`, `×`
sont permis, mais `sheet_engine.check_glyphs` fait échouer la fiche sur tout
caractère absent d'Archivo. Elle échoue aussi si une page déborde sur le pied :
chaque page n'a que 6 à 8 mm de marge, tout ajout se paie ailleurs.

**La V1 est sauvegardée** : tag git `v1` (le site à 35 M€, Scout + Core, avant
la v2) et `archive/v1/profund-factsheet-v1.pdf`. Pour y revenir : partir du tag
(`git checkout v1 -- .` sur une branche), vérifier, puis fusionner sur `main`.

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
pré-commercialisation au sens de l'art. 4a du règlement EuVECA (UE 345/2013,
inséré par le règlement 2019/1156 ; passage depuis l'art. 30a AIFMD le 29/10,
demandé par Alexandre) et `/pitch` contient des chiffres de performance cible.
Ne jamais reformuler, arrondir ou « améliorer » un chiffre, une date ou une
clause de ces pages sans demande explicite. La même mention figure en tête et
en pied de la fiche (`factsheet.py`), dans le pied de l'accueil et du popup :
les changer ensemble. Destinataires : investisseurs professionnels et
investisseurs éligibles de l'art. 6(1) EuVECA (100 000 € minimum, déclaration
écrite des risques). Les chiffres de tiers cités sur `/pitch` (Lovable, Stripe) sont
sourcés en note : ne pas les modifier sans relire la source.

**Le workflow de déploiement accepte n'importe quelle branche** via « Run
workflow » (`workflow_dispatch` sans garde) : ne jamais le lancer sur une
branche de travail, ce serait la mettre en ligne.

## Vérifier une modification

```bash
python scripts/fund_model.py --check   # fund.json à jour et invariants du modèle
npm run typecheck              # doit sortir 0 erreur
npm run build                  # doit finir par "prerender: N routes ... écrits"
npm run preview                # puis ouvrir /, /pitch/, /legal/, /privacy/
```

Après un changement de la fiche : rendre ses trois pages en PNG (PyMuPDF,
`python -c "import fitz; …"`, sans `-I` : fitz est installé dans le site-packages
utilisateur) et les regarder.

Contrôler le rendu à 390 px, 768 px et 1440 px : les classes `pv-` basculent à
1080, 900 et 600 px ; l'ancien jeu à 768 px (`@media (max-width: 768px)`), où
les grilles passent en une colonne, la grille `.hero-stats` de 4 à 2 colonnes
et les tableaux de fonds défilent horizontalement dans leur carte
(`.table-scroll`). Le titre du héros tient sur 2 lignes au-delà de 600 px (taille
en `cqw`) : le vérifier si on change son texte.
