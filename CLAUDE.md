# CLAUDE.md — profund.vc

Site vitrine de ProFund. SPA React + Vite, servi en statique par GitHub Pages
sur le domaine `profund.vc`. **Pas de backend, aucun appel réseau côté app**
(la seule ressource externe est l'iframe Brevo du formulaire d'inscription).

## Structure

```
src/
  main.tsx              montage React + ErrorBoundary
  App.tsx               les 7 routes + la route catch-all
  index.css             TOUT le style du site (CSS maison : jetons, système pv-, anciennes classes)
  components/
    Thesis.tsx          LE TEXTE DE LA THÈSE (manifeste, 4 lois, 2 moteurs, proof of work),
                        barre du haut, visuel du héros — rendus par / ET /pitch
    Founders.tsx        LA PROPOSITION FONDATEURS v3 (the rules + le pacte dépliable, the math + le
                        calculateur dépliable, how we back, every stage, les moteurs côté fondateur,
                        Founding Partner, final call) — rendus par /, /lp, /pitch
    HomepageLite.tsx    route / (état des deux panneaux, ancres /#pact et /#calculator)
    Drawer.tsx          le panneau dépliable (Drawer) et son bouton « + » qui tourne en « × »
    Pact.tsx            LE PACTE DES FONDATEURS (CLAUSES, N_CLAUSES, PACT_LEAD, PactList) — /terms et accueil
    TermsPage.tsx       route /terms — le pacte, page sombre sans barre du haut (texte dans Pact.tsx)
    CalculatorPage.tsx  route /calculator — « Run your numbers » ; exporte `Calculator` (aussi dans l'accueil)
    LpPage.tsx          route /lp — la page LP, fermée par une porte (LpGate) sauf accès accepté ou ?gp
    SubPage.tsx         coquille de /terms, /calculator, /lp
    LeadForm.tsx        le formulaire de /lp → email préparé
    ProFundPage.tsx     route /pitch — le deck LP, une section par slide + annexe
    LegalPage.tsx       route /legal — le texte vit dans le tableau CLAUSES
    PrivacyPage.tsx     route /privacy — le texte vit dans le tableau SECTIONS
    Footer.tsx          pied de page commun (sauf /dealflow) : « Venture capital for the AI era », LPs,
                        email ; Privacy, Legal Notice, The pact et Run your numbers masqués depuis le 06/11
    CookieBanner.tsx    bandeau, monté globalement dans App.tsx
    ErrorBoundary.tsx   filet anti-page-blanche
  lib/fund.ts           types de fund.json + formateurs (€, ×, %)
  lib/founderMath.js    le calcul fondateurs (VC vs ProFund), en JS pur : prerender.mjs l'importe
  lib/links.ts          URL (avec ?v=) de la fiche PDF et du modèle Excel
  data/fund.json        CHIFFRES DU FONDS — généré, ne pas éditer à la main
  data/pipeline.json    chiffres du pipeline signé (slide 9 de /pitch, cachée tant que null)
scripts/fund_model.py   modèle du fonds : la seule source des chiffres → fund.json
scripts/factsheet.py    fiche PDF 4 pages (v3), lit fund.json
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
thèse** (Antoine, 31/10 ; le titre « Where pure vision directs recursive AI. » est remplacé le 06/11
par « Backing AI-native teams building self-improving AI systems. » sur /lp et la fiche ; manifeste et
sa chute v3 « Capital is no longer scarce. Ownership is. », quatre lois, deux moteurs,
proof of work) vit dans `Thesis.tsx`, rendu à l'identique par l'accueil et /pitch ;
la fiche PDF en porte une copie (`factsheet.py`, chute en variante LP « …we lend and
we buy ») : les changer ensemble. **La proposition fondateurs v3** (Antoine, 05/11 :
« One round. Then never diluted again. » ; **retirée de la copie le 06/11** : elle faisait
passer le fonds pour incapable de suivre ; l'accueil joue la concurrence avec les meilleurs
fonds, « The same cheques. Your terms. », « You dilute only when you choose. », « Equity,
cheque for cheque », « Mega rounds, on your terms » ; la clause 1 du pacte, elle, ne change
pas) vit dans `Founders.tsx` et `TermsPage.tsx`
(le pacte, 12 clauses depuis la v3.15, dans `Pact.tsx` : texte contractuel public, ne pas le reformuler ;
v3.11 : clauses 1 et 2, l'equity complémentaire dite en clair, « Every option stays open » ;
v3.12 : 9 clauses, la liquidité partielle supprimée, « Their votes move to your side » sur les
rachats ; le nombre de clauses se lit dans `N_CLAUSES`, jamais en dur, et `prerender.mjs`
fait échouer le build si le titre de /terms ne dit pas le même nombre ; **v3.15 (06/11,
Antoine) : 12 clauses**, une logique : on rend le contrôle de la gestion, on garde la
protection du capital, et ce qui protège ne joue que si le fondateur quitte notre chemin ou
se conduit mal. UN siège au conseil (seul « and a veto » est barré dans les règles de
l'accueil : « One seat. Our shares vote with you. ») ; consentement limité à
l'anti-spoliation (« No veto on how you run, raise or sell ») ; prêts aux conditions d'un
prêteur (un impayé suspend la convention de vote) ; conflits dans les deux sens ; la
convention de vote tombe si un tiers mène un tour (on prend alors les droits du nouveau lead,
jamais plus), si le fondateur part ou cède le contrôle, et dans les cas de repli objectifs ;
sortie conjointe, sortie forcée aux mêmes conditions, prêts remboursés à la cession ; 1×
non participante sans ratchet ; vesting 4 ans et leavers (standard BVCA, esprit « be generous
to leavers » d'Index : seul un départ fautif fait un bad leaver, les titres acquis restent).
« The term sheet, rewritten » (`TermSheet`, accueil) compare un term sheet VC classique au
pacte, ligne à ligne : chaque ligne ProFund doit rester une clause. Aussi en v3.15 : la phrase
sur les conflits, « our shares don't vote… LP advisory committee », quitte le pacte des
fondateurs : c'est la politique de conflits du fonds, gardée côté LPs, /lp « Protection » et
fiche p. 2) ; la fiche p. 1 et 2 en porte une copie. Deux écarts volontaires à la copie du 05/11 :
« Every cancellation lifts your stake » (et non « buyback » : quand ProFund rachète
un angel, la part du fondateur ne bouge pas) et « A partner from venture debt will run
the loan book (to be recruited) » (le poste n'est pas pourvu). **Ton de la copie (Antoine, 30/10)** : pas de tiret long
« — » dans les textes visibles (accueil, /pitch, fiche, meta ; virgule, deux-points
ou parenthèses à la place ; cellules vides des tableaux : « – »), et titres en
casse de phrase, pas en Title Case (« Self-improving systems »). /legal et
/privacy n'ont pas été retouchés (texte juridique). Le visuel du héros : sur le site (/lp,
/pitch), une seule capture du deal flow, la carte (`public/dealflow-map.jpg`), depuis le
06/11 ; la fiche p. 1 garde aussi `-pipeline.jpg`. Captures prises en 3x sur la vue LP
marque blanche et affichées SANS rotation CSS (une rotation rend le texte flou).

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
classe `sub`. /pitch n'est lié nulle part sur le site (deck LP, remis via /lp) ;
il est hors sitemap et en `noindex` (comme /dealflow, `noindex: true` dans ROUTES).

**L'accueil est pour les fondateurs d'exception, et pour eux seuls** (Antoine, 05/11,
v3.9-v3.10 ; comme Sequoia ou Index). Pas de barre du haut : le logo blanc ouvre le
héros, sans chapeau. Il s'ouvre sur les règles (`TheRules hero` : « Control was
always yours. », les anciennes règles du VC barrées à l'écran), puis le capital
(`CapitalStack` : « Funded like the leaders. Diluted like no one. », revenus, un tour, la
ligne de prêt avec nos prêteurs partenaires, puis l'equity seulement si le fondateur la
demande), les chiffres (« The capital you don't raise is the company you keep. » : le
tableau compare 224 M€ d'equity à 25 M€ de dette, l'hypothèse est dite en clair ; v3.15 :
au-dessus, `RealDilution`, un cas réel sourcé, Will Shu à 6,3 % de Deliveroo à l'IPO de 2021,
et les médianes Carta 37,5 / 27,3 / 16,1 / 11,4 %, la D étant une donnée Carta reprise par
SaaStr, sources en note, ne pas les changer sans relire les sources ; le graphique « Your
stake, round after round » montre chaque étape, levées intermédiaires comprises, la ligne
ProFund à 37,5 % et une dernière colonne rouge, le cas réel Deliveroo à l'IPO ; tout se dit
au niveau de l'ÉQUIPE fondatrice (la part « par fondateur », 5,7 %, retirée le 06/11 :
elle mélangeait deux unités et faisait passer Deliveroo pour mieux que la médiane) ; ne
jamais afficher une MÉDIANE plus basse que ce que Carta mesure ; le tableau de
l'accueil a une colonne « At 6.3%, the Deliveroo case » : les fondateurs ramenés à 6,3 %,
mêmes tours, mêmes préférences, calculée par `atFounderStake` de `founderMath.js` ; sous les
moteurs, « Running today » : Proplace et Maximum Insurance, dont la corp dev, l'inbound et
l'outbound sont entièrement gérés par les deux moteurs, Antoine, 06/11),
(v3.14) le fonds en chiffres (taille, tickets, suivi, au-delà de 10 M€), les étages, les
chiffres sans phrase contestable (« When debt can carry your growth… When it cannot, we bring
the equity on the same terms »), les deux moteurs côté fondateur (« Two AI engines, working
for you. » ; v3.15 : « The External AI Growth Engine », la thèse d'investissement paramétrée
ensemble puis les startups à plus forte synergie sourcées chaque jour, et « The Internal AI
Growth Engine », les ICP, l'inbound (posts LinkedIn et X quotidiens à approuver) et l'outbound
(leads quotidiens à intention, séquences envoyées depuis LinkedIn et notre infrastructure de
cold email) ; mêmes noms côté LPs depuis la v3.15, `OurEdge` et fiche p. 3, dits pour les LPs) et un
seul bouton, « Run your numbers ». **v3.15 (06/11)** : le pacte et le calculateur se
déplient DANS l'accueil (`Drawer.tsx`) : le pacte sous les règles du héros (« Read the pact,
9 clauses »), le calculateur sous le tableau, avec de l'air sous la ligne à 1 Md€ ; le
bouton du héros et le bandeau final ouvrent le panneau et y défilent ; `/#pact` et
`/#calculator` aussi (liens du pied de page). /terms et /calculator restent en ligne.
Plus de Founding Partner ni de mention de pré-commercialisation sur l'accueil (le
partner reste sur /lp). L'exigence ne se dit pas, elle se lit. **/lp est écrite pour un LP exigeant** (réécrite le 06/11 : il doit tout trouver dès la
première visite ; rien qui s'adresse aux fondateurs). Pas de barre du haut ni de menu, pas
de formulaire, pas de « Request LP access » : le seul bouton est « Follow our deal flow
live » (direct vers /dealflow si ce navigateur a l'accès, sinon le popup de candidature),
plus la fiche. Dans l'ordre : le héros et la capture du deal flow ; « Fund I at a glance »
(TRI, TVPI, DPI 7 ans, plus grosse sortie, termes clés dont frais, carry et engagement du
GP, les trois documents) ; le manifeste (chute LP) ; « The shift » en six chiffres sourcés
(Lovable, Stripe, Bessemer) ; les lois ; « The model », avec « Competing for the best
rounds » (on apporte aussi de l'equity ; quand un fonds de premier plan mène, on suit ses
termes, comme tout co-investisseur, et le pacte ne s'applique que là où on mène ; Index
Ventures et Balderton cités comme référence, jamais comme partenaires) ; « Exits » (le
marché européen réel, PitchBook et Atomico ; la société du tableau vendue à la taille de
vraies cessions européennes, calculée par `founderMath.js` ; notre equity revient à 1× dès
60 M€, la série A VC à 250 M€ ; en dessous de 60 M€ personne ne gagne : ne jamais écrire
« ça marche à tous les coups » ; 15 cessions réelles par taille, valeurs telles que
publiées, sources en note) ; « Protection » ; les moteurs version LP (`FounderEngines lp` :
le process, puis Proplace et Maximum Insurance) ; le Founding Partner ; les termes et la
performance complets (`TermsTables`, `PerformanceTables` et `Downloads` exportés de
`ProFundPage.tsx` : un seul texte pour /pitch et /lp) ; l'accès et la mention de
pré-commercialisation. « Our LPs are mainly high-net-worth individuals and family offices »
(06/11). **Positionnement (06/11, Antoine)** : on chasse les licornes comme Index Ventures ou
Sequoia, et les meilleurs fondateurs nous choisissent parce que nos termes sont réellement
alignés (pas une posture). Plus de « returns built on ownership, not on unicorns » ni de
« no unicorn needed » en accès LP ; plus de « Luxembourg » dans la copie (site, fiche).
Jamais de posture « petits bras » : « The shift » dit « Unicorn valuations, on a fraction of
the capital » (plus de « no longer need €50M ») ; le bloc « Competing with the best » de /lp
dit « The new go-to fund for elite founders » : chèque pour chèque en seed, pré-série A, série
A et B (jusqu'à 10 M€ du fonds, SPV pour la taille du tour), méga-tours en SPV avec nos LPs
(l'upside reste aux LPs, le fondateur garde nos termes), on suit les termes d'un lead de
premier plan, on gagne par les termes ; la fiche p. 1 porte cette ligne au lieu de « One
round. Then never diluted again. » et n'a plus la capture du pipeline. « Exits » s'intitule « From a trade sale to a unicorn » ; son tableau (`pv-xt`) vend la
société à six prix réels, de 40 M€ à 7 Md€ (Wolt), licornes surlignées, avantage en vert. **/lp est fermée
(v3.15)** derrière la MÊME candidature que le deal flow (`DealFlowModal` avec `lp`) : elle
s'ouvre quand ce navigateur a l'accès retenu par /dealflow (`lib/access.ts`, lien magique
vérifié une fois ; /dealflow porte un lien « LP page »), ou avec `?gp` dans l'URL (aperçu du
GP : `profund.vc/lp/?gp`). Barrière côté client : le texte reste dans le bundle JS, ne rien
mettre sur /lp qui doive rester secret. Sur l'accueil, les LPs n'ont
qu'un lien « LPs » en pied de page ; le popup du deal flow reste monté pour
`profund.vc/#dealflow` (le QR de la fiche), sans bouton visible. **L'equity complémentaire**
(si la dette ne suffit pas) se fait au choix du fondateur, aux conditions du pacte, avec la
même préférence 1× que notre premier chèque (clause 2 ; champ du calculateur). Plus de formulaire « Reserve your round » ni de page /sell : le
parcours fondateur s'arrête au calculateur (« Send these numbers to the partner », un
mailto) et la fin de l'accueil dit « A handful of founders a year. ». Le formulaire de
/lp a été retiré le 06/11 (`LeadForm.tsx` reste, inutilisé ; il n'avait PAS de backend, il
ouvrait un email pré-rempli). Sur l'accueil, sous les étapes : « Raising from a top-tier
fund? Take both. » (on investit aux termes du lead, sans nommer de fonds côté fondateurs). Au-delà
de la dette, la copie dit qu'on apporte de l'equity aux mêmes conditions, avec des SPV
(« Your call », pour rester cohérent avec « never create a new share »).

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

**PAS DE FRAIS, DE CARRY NI DE RENDEMENT CIBLE EN ACCÈS LIBRE** (Antoine, 05/11,
remplace la règle « un seul montant » du 30/08) : l'accueil et les pages fondateurs
(/terms, /calculator) parlent aux fondateurs, /lp aux LPs. Montants permis, tous lus
dans `fund.json` : la taille du fonds (héros, loi 04), les tickets des étages (Every
stage, sans les SPV : ils sont hors du fonds, documents LP seulement) et le tableau fondateurs, illustratif (`founder_math`). Frais, carry,
construction détaillée et rendements cibles vivent **uniquement** derrière /lp :
/lp elle-même (fermée aux candidats acceptés depuis le 06/11), fiche PDF, modèle Excel,
/pitch. La règle couvre aussi le shell `index.html` (meta
description et `<noscript>`), servi sur TOUTES les routes et sur `404.html` :
`prerender.mjs` fait échouer le build s'il y trouve un montant. Exception : les
fourchettes de souscription des LPs de `DealFlowModal.tsx` (contrat avec
`_PROFUND_TICKETS` du proxy). Le calculateur (`founderMath.js`) et le tableau publié
doivent dire la même chose : `prerender.mjs` fait échouer le build sinon.

**Les chiffres du fonds ont UNE source : `scripts/fund_model.py`** (v3.4, 05/11 :
un fonds de 100 M€, trois étages Seed / Venture / Growth (un seul vocabulaire,
classeur compris, depuis la v3.6) ; UN tour en actions par société, puis des rachats de
titres existants avec décote, des prêts (plafond EuVECA de 30 % des engagements) et
des annulations ; suivi en actions nouvelles seulement si le fondateur lève ailleurs ;
la liquidité partielle de l'année 6 (ancienne clause 9) est supprimée du pacte en v3.12 : le moteur et le classeur la gardent comme levier « what if », aucune ligne marquée ; SPV de
co-investissement au-delà de 10 M€ par société). **v3.16 (06/11, Antoine) : le portefeuille
en loi de puissance, comme les meilleurs fonds** (choix « P2 ») : S-01 est une licorne
vendue 1 Md€ qui porte le fonds (31,3 % détenus à la sortie, non dilués : 3,1× le fonds à
elle seule), V-01 un second gagnant à 500 M€, et la plupart des sociétés ne rendent pas leur
mise (S-03 et S-04 perdues, V-03 zombie, leurs prêts suivent). Plus de plafond à 300 M€ ni
de « no unicorn needed ». Cible 4,4× net / 36 % (DPI 7 ans 0,7×), base 2,8× / 24 %, stress
2,0× / 15 % ; tests : sans licorne 2,0× / 18 %, deux licornes 5,0×, licorne à 2 Md€ 7,0×.
Titre LP (site, fiche, /pitch) : « Backing AI-native teams building self-improving AI
systems. » Le
portage v3.3 reproduisait à l'euro près le classeur livré le 05/11 (1 532 valeurs,
tag git `v3.3`). **v3.4** (Antoine, 05/11) : prêts sains à 12 % par an composés sur
leur durée (`LOAN_RATE`, pas de BSA : ils créeraient des actions nouvelles), au lieu
de 1,4× quelle que soit la durée ; 40 tickets radar au lieu de 20, financés par 3 M€
pris sur les chèques Venture des sociétés qui vivent ; la loi 04 chiffrée
(`fund_returner.fund_returning_exit` : la sortie à laquelle S-01 rend seule tout le
fonds). Le tableau fondateurs prend le même taux (1,2× = 12 % sur ~1,6 an de vie
moyenne). `PUBLISHED` fige les valeurs publiées : un changement qui les déplace
doit être voulu, et les textes relus. Il porte les hypothèses, les lignes de simulation (S-, V-, G-), les frais,
la cascade de distribution, le TRI, les tests de résistance (`stress_tests` : les
sorties décalées gardent l'échéancier des prêts), le tableau fondateurs
(`founder_math`, vérifié contre la table publiée) et vérifie ses invariants (total =
engagements, tickets dans les bornes, plafond par société, plafond des prêts, pas
d'action nouvelle sans tour extérieur, détention de sortie ≥ entrée quand le fondateur
grandit avec nous, valeurs publiées…). Il écrit `src/data/fund.json`, que lisent le
site (via `src/lib/fund.ts`), la fiche PDF, le xlsx et le titre de `/pitch` dans
`prerender.mjs`. La v2 (50 sociétés Seed, licornes) reste dans l'historique git
(commit `2f3b590`) ; `reference_v2` cite son 1,3× à sorties plafonnées.
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

**Le tableau des fondateurs est calé sur les médianes Carta** (`FOUNDER_MATH`) :
fondateurs à 37,5 % après la série A (Founder Ownership Report 2026, sociétés « digital »).
**v3.15 (06/11)** : le chemin VC est calé sur les parts médianes PAR ÉTAPE (et non plus sur
la seule dilution médiane par tour, qui oubliait tout ce qui se passe entre deux tours) :
une levée intermédiaire avant la B, la C et la D (`bridge: true`, « Bridge to B/C/D »), des
recharges de pool plus fortes ; 27,2 % après la B (Carta, équipes IA : 27,3 %), 16,2 % après
la C avec un pool à 16,5 % (Carta : 16,1 % et 16,8 %), 11,4 % après la D (donnée Carta citée
par SaaStr : 11,4 % ; 10,4 % dans une reprise du rapport 2026) ; 224 M€ de fonds propres
après la A. Le graphique et le calculateur montrent les levées intermédiaires ; le
calculateur garde les classes d'investisseurs séparées (seed, Series A),
comme le modèle, sinon il s'écarte du tableau publié. Côté ProFund, le pool se recharge
avec des titres rachetés (pacte, clause 5). Ne pas revenir à des hypothèses plus flatteuses
pour le VC sans source.

**Le Seed est en haltère** (01/11, Alexandre ; v3.4 du 05/11) : 50 sociétés, 10 leads
de conviction S-01..S-10 et 40 tickets radar de 150 K€ S-11..S-50 (`SEED_TRACKS`,
champ `track` des lignes, exporté dans `layers.seed.tracks`). En v3, un ticket radar est
aussi une option sur un rachat : quand la société décolle, on rachète ses angels (S-11). Le modèle refuse un ticket hors de sa voie, une
numérotation discontinue et une ligne de sortie groupée (la part de sortie est celle
d'UNE société). La voie se lit dans l'onglet Lines de l'Excel ; sur la fiche p. 4 et
/pitch, un filet sépare leads et radar et la note de l'étage les nomme. Dans
`fund_xlsx.py`, les formules de Lines prennent leurs lettres de colonne via `lc()`,
jamais en dur. Les produits d'une ligne (fonds propres à 100 K près + prêt à 10 K près)
ne tombent pas toujours sur la maille : c'est voulu (identique au classeur v3.3).

**Le modèle Excel** (téléchargeable sur /pitch, « sur demande » dans la fiche et sur /lp)
est vivant : chaque sortie est une formule, écrite avec sa valeur en cache pour
les aperçus qui ne recalculent pas. `fund_xlsx.py` le recalcule avec pycel et
échoue si une formule ne retombe pas sur sa valeur et sur `fund.json` (onglet
Checks). Dépendance : `xlsxwriter` (`pip install --user xlsxwriter`).

**La fiche PDF fait 4 pages** (v3, 05/11 ; 1 : thèse, ligne forte, mention de
pré-commercialisation, manifeste, lois, pacte, bandeau de chiffres ; 2 : construction,
termes, allocation, « Everyone wins », conflits ; 3 : moteurs, équipe, track record,
proof of work, contact avec QR vers `profund.vc/#dealflow` qui ouvre le popup ;
4 : tableau fondateurs, simulation ligne à ligne, performance, tests de résistance).
Pages 3 et 4 n'ont qu'environ 5 mm de marge. Elle embarque Archivo (`scripts/assets/fonts/`) : `€`, `—`, `×`
sont permis, mais `sheet_engine.check_glyphs` fait échouer la fiche sur tout
caractère absent d'Archivo. Elle échoue aussi si une page déborde sur le pied :
chaque page n'a que 6 à 8 mm de marge, tout ajout se paie ailleurs.

**Les versions sont taguées** : `v1` (le site à 35 M€, Scout + Core ; fiche dans
`archive/v1/profund-factsheet-v1.pdf`), `v2` (100 M€, Seed à 50 sociétés pour une
licorne, fiche 3 pages, avant la proposition fondateurs), `v3.3` (le classeur
d'Antoine du 05/11 tel quel), `v3.4` (prêts au taux, radar à 40), `v3.5` (clause 9 hors du cas cible), `v3.6`
(S-01 en chemin pur, S-02 lève ailleurs et sort à 250 M€, Seed / Venture / Growth
partout, accueil à 10 sections, page 4 de la fiche allégée, SPV hors de l'accueil) et
`v3.7` (plus de Reserve ni de /sell, licorne à 1 Md€ dans le tableau fondateurs, scénario
grosse licorne à 2 Md€) `v3.8` (accueil 100 % fondateurs) et `v3.9` (les règles en ouverture, le capital
optimisé, le tableau recadré, la thèse et la capture du deal flow sur /lp, l'equity
complémentaire à préférence 1×) `v3.10` (accueil sans barre du haut, /lp réécrite pour
les LPs), `v3.11` (le pacte sur l'accueil, l'equity complémentaire dans les clauses 1-2) et
`v3.12` (clause 9 supprimée, conflits et rachats en clair) et `v3.13` (le tableau fondateurs
sur les médianes Carta : 37,5 % après la série A, dilution médiane B-D, recharges du pool ;
clause 4 : le pool se recharge avec des titres rachetés) et `v3.14` (accueil : le fonds en
chiffres, les étages, les moteurs côté fondateur ; le pacte sur une page /terms sombre) et
`v3.15` (06/11, non tagué à ce jour : pacte et calculateur dépliables dans l'accueil, /lp
fermée, pacte à 12 clauses avec un siège au conseil, chemin VC calé sur les parts Carta par
étape, cas Deliveroo, « The term sheet, rewritten », moteurs « External / Internal AI Growth
Engine » partout, signature « Venture capital for the AI era »). Pour revenir à une version : partir du tag
(`git checkout v2 -- .` sur une branche), vérifier, puis fusionner sur `main`.

**Chaque section de `/pitch` est un composant local** dans `ProFundPage.tsx`
(`TitleSlide`, `TheShift`, `TheProblem`… une par slide du deck v3 du 05/11, puis
l'annexe `Construction`, `Simulation`, `Performance`), assemblés en bas du fichier.
Pour réordonner les sections, changer l'ordre dans le `export default`. La slide 9
(pipeline signé) lit `src/data/pipeline.json` et reste cachée tant qu'un chiffre est
`null` : jamais de « [X] » en ligne. Le cas Datadog est retiré des documents LP.

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
en pied de la fiche (`factsheet.py`), sur la porte de /lp et dans le pied du popup
(retirée de l'accueil le 06/11) :
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
npm run preview                # puis ouvrir /, /terms/, /calculator/, /lp/, /pitch/, /legal/, /privacy/
```

Après un changement de la fiche : rendre ses quatre pages en PNG (PyMuPDF,
`python -c "import fitz; …"`, sans `-I` : fitz est installé dans le site-packages
utilisateur) et les regarder.

Contrôler le rendu à 390 px, 768 px et 1440 px : les classes `pv-` basculent à
1080, 900 et 600 px ; l'ancien jeu à 768 px (`@media (max-width: 768px)`), où
les grilles passent en une colonne, la grille `.hero-stats` de 4 à 2 colonnes
et les tableaux de fonds défilent horizontalement dans leur carte
(`.table-scroll`). Le titre du héros tient sur 2 lignes au-delà de 600 px (taille
en `cqw`) : le vérifier si on change son texte.
