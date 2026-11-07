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
    Founders.tsx        LA PROPOSITION FONDATEURS v3 (the rules + le pacte dépliable, the few, le capital,
                        the math + le calculateur dépliable, les moteurs, final call ; `Say` et `Numbers`,
                        les briques de la voix) — rendus par /, /lp, /pitch
    HomepageLite.tsx    route / (état des deux panneaux, ancres /#pact et /#calculator)
    Drawer.tsx          le panneau dépliable (Drawer), son bouton « + » qui tourne en « × », et `Fold`
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
passer le fonds pour incapable de suivre ; depuis : « Big cheques. Your terms. », « You dilute
only when you choose. », sans se comparer à aucun fonds, cf. « La voix » ; la comparaison quitte
aussi la clause 1 du pacte le 06/11, à la demande du fondateur, le fond ne change pas) vit dans `Founders.tsx` et `TermsPage.tsx`
(le pacte, 12 clauses depuis la v3.15, dans `Pact.tsx` : texte contractuel public, ne pas le reformuler ;
v3.11 : clauses 1 et 2, l'equity complémentaire dite en clair, « Every option stays open » ;
v3.12 : 9 clauses, la liquidité partielle supprimée, « Their votes move to your side » sur les
rachats ; le nombre de clauses se lit dans `N_CLAUSES`, jamais en dur, et `prerender.mjs`
fait échouer le build si le titre de /terms ne dit pas le même nombre ; **v3.15 (06/11,
Antoine) : 12 clauses**, une logique : on rend le contrôle de la gestion, on garde la
protection du capital, et ce qui protège ne joue que si le fondateur quitte notre chemin ou
se conduit mal. UN siège au conseil (règles de l'accueil : « Their seats, their votes, their veto », barré en
entier, devient « One seat. Our shares vote with you. ») ; consentement limité à
l'anti-spoliation (« No veto on how you run, raise or sell ») ; prêts aux conditions d'un
prêteur (un impayé suspend la convention de vote) ; conflits dans les deux sens ; la
convention de vote tombe si un tiers mène un tour (on prend alors les droits du nouveau lead,
jamais plus), si le fondateur part ou cède le contrôle, et dans les cas de repli objectifs ;
sortie conjointe, sortie forcée aux mêmes conditions, prêts remboursés à la cession ; 1×
non participante sans ratchet ; vesting 4 ans et leavers (standard BVCA, esprit « be generous
to leavers » d'Index : seul un départ fautif fait un bad leaver, les titres acquis restent).
Clauses 1 et 2 réécrites le 06/11 (2) : « Equity, only when you choose. » (plus de « We invest
once », on ne pousse jamais de tour) et « Follow-on capital, reserved for you. » (prêts, puis
equity aux mêmes termes dès que le fondateur la demande, SPV pour les plus gros tours) ; la
réserve se lit dans `allocation.after_first_pct` (46 % de l'investi après le premier chèque :
rachats et suivis depuis la v3.17), dite sur /lp et dans le bandeau de la fiche p. 1.
**v3.17 (07/11, Alexandre) : LE FONDS NE PRÊTE PLUS** (« j'ai pas envie de recruter un profil crédit »).
ProFund, en Chief Fundraising Officer, fait lever la dette des fondateurs auprès des banques partenaires ;
le prêt est entre la société et la banque, sans frais ni BSA pour ProFund ; si la banque demande des
BSA, c'est le choix du fondateur (ne JAMAIS promettre « never with warrants » sur un prêt bancaire). Pas
d'associé crédit à recruter, nulle part. Pacte : toujours 12 clauses, la clause 3 devient « Debt, raised
for you. », les renvois aux prêts du fonds quittent les clauses 2, 4, 6, 7, 10 et 12 (12 : « a payment
default on the company’s debt »). Modèle : chaque prêt devient un rachat de même montant dans la même
société (V-04 au prix d'entrée), sauf le million des zombies V-05 qui paie les frais en plus (la poche de
prêts payait 1 % au lieu de 2 %) ; plus de `fee_loan_pct`, `loan_cap_pct`, `LOAN_MULTIPLES`, ni de test
« pertes sur prêts ». Cible 3,0x / 25 % (DPI an 7 0,4x), upside 4,8x / 37 %, stress 2,1x / 17 %, sans
licorne 1,4x, licorne qui vend 199 M EUR d'equity 2,0x ; S-01 détenue à 34,2 %, une vente à 295 M EUR
rend le fonds ; frais 12,6 M EUR. `LOAN_RATE` ne sert plus qu'au tableau des fondateurs (dette bancaire).
Sous chaque clause du pacte (`vc` dans `CLAUSES`, Pact.tsx), une ligne « Classic VC » : ce que dit un term
sheet classique, notre résumé, pas une clause ni une citation (l'ancien tableau « The term sheet, rewritten », fondu dedans).
**Le pacte v3.19 (07/11, Alexandre, relu côté LPs)** : toujours 12 clauses, la même logique (la
gestion au fondateur, le capital protégé), sans naïveté : anti-dilution moyenne pondérée large et
garanties usuelles (1) ; plus d'engagement ouvert, « we can lead », comité d'investissement, limites
du fonds, prêts par tranches contre des jalons (2) ; impayé non réglé sous 30 jours : prêt exigible
(3) ; les deux clauses de rachat fusionnées, rachat annuel sur réserves distribuables, jamais pendant
un défaut, jamais auprès d'un fondateur sans nous (4) ; plus de droits de vote multiples, convention
de vote à durée (dix ans au plus) et jamais sur ce qui protège le capital (5) ; rémunération hors
budget, parties liées et rachat des titres d'un fondateur soumis à notre administrateur (7) ; droit
au prorata, un lead tiers : nos titres gardent leurs droits et on investit à ses termes, jamais
mieux (8) ; NOUVELLE clause 9, les titres des fondateurs (incessibilité, préemption, sortie
conjointe) ; clause 10 renforcée : « We never block a sale that pays back what we invested », sortie
forcée seulement vers un acheteur indépendant, en cash ou titres cotés, garanties plafonnées, tout
avantage versé à un fondateur au-delà du marché compté dans le prix, et une vente sous notre mise
demande notre accord (donc plus de « No veto. Ever. » nulle part) ; cliff d'un an, crédit
d'ancienneté plafonné à un an, bad leaver = tous ses titres au plus bas du coût et de la valeur,
non-concurrence d'un an (11) ; « If things go wrong » : les protections dormantes, ce qui les réveille
et ce qui se réveille, les consentements d'un lead classique (12). /lp (GIVE, KEEP, PROTECTION),
/pitch (slide 7), la fiche (PACT p. 1, encadré p. 2) et l'accueil (règles, HowWeBack) suivent.
La durée et la validité de la convention de vote et la conformité EuVECA sont à faire valider par
un avocat avant toute signature.
**Le positionnement (07/11, Alexandre)** : le crédit n'est pas une révolution (venture debt partout ;
à levée égale, 13,2 % contre 11,4 %) et ce sont les valorisations qui protègent les meilleurs
fondateurs de la dilution : on ne se bat plus sur la dilution ni sur la taille des chèques. On se bat
sur le CONTRÔLE : « The terms the best founders negotiate. From your first cheque. » (ligne validée).
JAMAIS « We take shares » ni rien qui parle du fonds comme d'un preneur (« c'est anti-fondateurs ») ; pas
de schéma actions / votes (rejeté). Face aux géants : arriver
les premiers (le deal flow), être utiles (les moteurs qui font tourner Proplace et Maximum Insurance),
être alignés (le pacte) ; les géants mènent les gros tours, on reste à côté, sans bravade. Accueil :
le héros (contrôle), The few (l'implosion, « Capital is no longer scarce. Control is. », l'accueil
seulement : le manifeste de Thesis.tsx, la fiche et /pitch gardent « Ownership is. » en attendant
Antoine), les moteurs, « Capital, in the right order. » (le tracé), le bandeau final (« A handful of
founders a year. »). « Diluted like no one. », le graphique des chemins (`TheMath`, `StakeChart`) et le
calculateur quittent l'accueil ; /terms n'y renvoie plus ; /calculator reste en ligne, hors du sitemap et
en noindex ; le code reste. /lp suivra (l'accès, l'alignement, la protection plutôt que la dilution).
**L'ordre de l'accueil (07/11, 6e passe, Alexandre)** : « Control was always yours. » en ouverture
(« c'était beaucoup mieux »), puis l'implosion dans sa carte (« The companies that define this era… »,
« Capital is no longer scarce. Control is. »), puis la vision (`WhatWeBack`, 7e passe : « The clearest minds, directing the most
autonomous machines. », la phrase du manifeste, et UN tracé qui se dessine de gauche à droite ; 9e
passe, l'ordre logique des lois (Alexandre) : 01 Visionary founders, 02 Maximum impact, minimum
headcount, 03 Self-improving systems, 04 Category leaders, le même dans `LAWS` (Thesis.tsx) et la fiche
p. 1 ; une chaîne : les trois fondateurs (le triangle où s'arrête l'implosion), leur intention, un
marché entier atteint depuis un point, chaque passage qui revient au cœur de la boucle, la boucle qui
s'élargit, la loi de puissance et son leader ; puis des impulsions parcourent toute la chaîne (client
touché, retour au cœur, l'impulsion grossit en s'enroulant, le leader s'allume) ; 10e passe : le
marché n'a que TROIS lignes (le minimum headcount), les points restent, une onde le balaie d'un coup ;
la catégorie se gagne à l'écran (une foule au coude à coude, puis le leader s'envole et la traîne
retombe, loi de puissance plus raide : le leader pèse plus que tous les autres réunis) ; les quatre lois
dessous, alignées sur leur zone ; sur mobile, de haut en bas ; jamais de cartes tassées), puis « Your Chief Fundraising Officer. Perfectly aligned. » (`CapitalStack`, 8e passe : plus de
plan de capital générique ; ce qu'un CFO aligné fait d'intelligent : « Raise from strength » et sa courbe,
on lève au point d'inflexion et non à court de cash, puis la table nettoyée avant chaque tour, les
acquisitions sans dilution, les plus gros tours en une ligne ; les tickets en une bande ; « full
potential », jamais « full size »), puis les moteurs (« Running today » en cartes sombres vivantes), le bandeau final.
**/lp, /pitch, la fiche alignés sur l'accueil (07/11)** : /lp et /pitch portent l'implosion
(`CollapseVisual`) et la vision (`WhatWeBack`) de l'accueil (« The kingmakers » est remplacé ; les
chiffres sourcés de Lovable et Bessemer restent sous l'implosion ; les quatre cartes `FourLaws` quittent
/pitch) ; la fiche p. 1 dit « An in-house Chief Fundraising Officer. » ; la chute du manifeste devient « Capital is no
longer scarce. Control is. » PARTOUT (Thesis.tsx, /lp, fiche p. 1) ; la fiche p. 1 porte « The terms the
best founders negotiate, from their first cheque. » au lieu de « The new go-to fund for elite
founders » ; /lp a une section « How a focused fund wins the best founders. » (First, Useful, Aligned ;
les géants mènent les gros tours, on reste à côté, les SPV gardent cet upside aux LPs) ; /pitch (« The
inversion ») dit le Chief Fundraising Officer ; la meta description et le `<noscript>` reprennent la
ligne de positionnement.
**Les règles du héros (07/11, 2)** : six, chacune une clause du pacte (un siège et nos votes avec toi,
pas de veto, jamais de tour poussé, au plus une 1× sans participation, les rachats, la démission qui
garde tout ce qui est acquis) ; chacune se barre à son tour quand elle arrive à l'écran (`RuleRow`, un
départ commun), un trait rouge épais, une lueur qui balaie la ligne, la nouvelle règle qui se fait
nette ; puis `RulesCoda` : « Your shares, your board, your exit. » barrés un par un, et « Now you get the
capital without giving the company away. » en grand.
**/lp, « Check every figure. » (07/11)** : l'ancienne « data room » (mot que les LPs visés ne
comprennent pas), purgée de ce qui répétait la page : plus les chemins de dilution ni la protection en
double. Restent : ce que les fondateurs gardent vraiment (cotations, Carta), les sorties européennes,
le fonds et ses termes, rendements et tests, la simulation ligne à ligne, les moteurs, les documents.
**/lp, « Questions you might ask. » (07/11 ; titre d'abord « The questions you will ask. »)** : onze
questions dépliables (`FAQ`, LpPage.tsx), la
part publiable de la FAQ de préparation (document Claude « ProFund Fund I : pitch et FAQ LP ») : pourquoi
le fonds ne prête pas, qui décide, le GP seul et son successeur, les votes et la protection, la liquidité
sans le contrôle, les rachats, les appels de fonds, les frais, l'engagement du GP, qui peut investir
(minimum 500 000 €, comme le popup du deal flow ; /legal garde les 100 000 € de l'art. 6(1), le plancher
légal), la revente des parts. La liquidité (Alexandre, 07/11) : ce que le pacte signe (clauses 9 et 10),
puis le marché, sourcé et relu le 07/11 (Jefferies, Schwab-Forge, SpaceX, SEC) ; JAMAIS « liquidité
assurée » : un token ne change pas ce qu'est une action, un token de tiers ne donne aucun droit, et
l'Innovation Exemption de la SEC (09/2026) ne couvre que les actions cotées. JAMAIS la
fiscalité (avis en attente), le domicile, le nom du successeur ni les questions « pièges » (coaching).
**L'engagement du GP (07/11, Alexandre : « j'ai pas cet argent »)** : au moins 1 % (1 M€ à 100 M€),
appelé au fil des investissements comme celui des LPs (~50 K€ l'an 1, ~500 K€ l'an 3, lus dans les
appels du modèle), financé ENTIÈREMENT par une renonciation à une part des frais de gestion (fee waiver,
pas de cash, décision du 07/11) : dit UNE fois, dans la FAQ de /lp (« pas la peine de le mettre
partout ») ; le tableau des termes (/lp, /pitch) et l'Excel disent seulement « 1 % of commitments ».
Ne jamais le présenter comme du numéraire. Les frais ne bougent pas pour le financer (ce serait faire payer
l'engagement aux LPs). Sa validité (avocat, avis fiscal) reste à confirmer.
**La cible présentée prudemment (07/11, Alexandre)** : partout (/lp, /pitch, fiche, Excel), la cible
affichée est le cas prudent, chaque sortie à 60 % de sa valeur modélisée : 2,8x net, 24 % de TRI, DPI 0,5x
à l'an 7 ; le cas modélisé (4,4x, 36 %) est présenté comme l'upside ; stress 2,0x. Les tests de
résistance tournent sur la cible affichée (sans licorne 1,4x, licorne qui vend 199 M EUR d'equity 1,8x,
licorne à 2 Md EUR 4,3x). ATTENTION : les clés internes ne changent pas (« target » = valeurs modélisées,
présenté « Upside » ; « base » = 60 %, présenté « Target »). Aucune hypothèse n'a été retouchée pour
atteindre un chiffre rond. La tuile « One unicorn » devient « One company returns the fund » (une vente
de S-01 à 320 M EUR rend le fonds). Chiffres remplacés par la v3.17 (ci-dessus) : 3,0x, 4,8x, 2,1x, 295 M EUR.
**Les prêteurs partenaires (07/11, Alexandre ; v3.17 : ils prêtent seuls, le fonds ne prête plus)** : la
dette des sociétés vient des banques partenaires et de la BEI ; les fonds de venture debt prennent
d'ordinaire des BSA, qui créeraient des actions nouvelles. Pistes
(recherche du 07/11, à confirmer en direct) : BNP Paribas Growth Solutions, HSBC Innovation Banking,
J.P. Morgan Innovation Economy, BEI (tranches de 10 M EUR et plus ; elle prend souvent des BSA ou une
rémunération indexée), Bpifrance pour les petits prêts de seed. Le gestionnaire EuVECA n'est pas
choisi : la recommandation (recherche du 07/11, LPs internationaux, environ un tiers FR, un tiers CH,
un tiers autres) est une SCSp luxembourgeoise gérée par un gestionnaire AGRÉÉ, avec le label EuVECA,
à mettre en concurrence entre IQ-EQ, Fundcraft et Innpact ; un FPCI hébergé (IQ-EQ Management) si les
résidents fiscaux français deviennent majoritaires ; jamais la Suisse comme domicile ; Roundtable n'est
qu'enregistré (bon pour les SPV). Deux adaptations décidées (Alexandre, 07/11), à valider par un avis
fiscal avant toute mention publique : (1) le piège des 10 % (163 quinquies B : un particulier français
et sa famille au-delà de 10 % des parts d'un FPCI sont imposés chaque année) : gros tickets français
via une holding à l'IS, ou plafonnés à 10 % du véhicule français, même au premier closing ; (2)
l'apport-cession (150-0 B ter, quota de 75 %, rachats et prêts limités) : un véhicule parallèle
français dédié, qui ne suit que les tours en actions nouvelles éligibles, le fonds principal gardant
les rachats (v3.17 : il ne prête plus).
**Le dessin de l'accueil (07/11, trois passes ; Alexandre : « trop de texte », « les grandes icônes
font cheap », « on se répète », « que l'on s'en souvienne après avoir quitté le site »)** : une idée
par section, aucune répétition. `TheFew` : le titre, `CollapseVisual` (un organigramme de 250 points
implose sous les yeux et ne laisse que trois fondateurs entourés de leurs machines ; Before / Now pour
rejouer ; lancé une fois à l'écran), « Capital is no longer scarce. Ownership is. » sur UNE ligne, puis
« What we back » en quatre intitulés. Ne pas forcer de retour à la ligne (`display: block`) dans une
phrase qui tient sur une ligne. `CapitalStack` : le tracé de l'ordre du capital (plat, puis l'equity en
pointillé, au choix du fondateur). Plus de bifurcation « Stay with us / Raise elsewhere » ni de
truismes (« Any investor can lead », « never better », « You dilute only when you choose », « Your
exit, on your timing », « Big cheques ») : ils faisaient passer le fonds pour naïf. Les règles du héros
ne parlent que de contrôle (un siège et nos votes avec le fondateur, pas de veto, les rachats).
`TheMath` : une phrase, le graphique (les noms des chemins une seule fois, dans les pavés), une note
courte. Sous 900 px, des colonnes. Animations coupées si `prefers-reduced-motion`.
**Préférence 1× (06/11)** : pas sur les petits tours de seed (clause 1 : « The most we ever ask is a 1×… ») ;
aucun chiffre ne bouge, le plancher du modèle ne joue sur aucune ligne Seed (V-04, G-02, G-04 seulement). Aussi en v3.15 : la phrase
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
l'outbound sont entièrement gérés par les deux moteurs, Antoine, 06/11 ; 07/11, Alexandre (11e passe) :
SIX petites cartes identiques (`RUN`, `.pv-runc`), trois colonnes, deux sous 900 px, une sous 600 px ;
une légende des deux moteurs et de leurs sous-moteurs (`RUN_ENGINES`) ; chaque carte : le logo, un
point vert, puis les mêmes trois sous-moteurs dans le même ordre (External : Corp dev ; Internal :
Inbound, Outbound), allumés si la société s'en sert (`caps`), éteints sinon ; la description en
infobulle. Proplace corp dev, inbound, outbound ; Maximum Insurance inbound et outbound, PAS de corp dev ;
Sosuites inbound ; WinHealth Group outbound et corp dev ; Nexecur (logo sans celui du Crédit Agricole)
et S4BT (sforbt.com) corp dev ; ne jamais allumer un sous-moteur que la société ne fait pas tourner),
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
partner reste sur /lp). L'exigence ne se dit pas, elle se lit. **La voix (06/11, 6e passe, le fondateur)** : humble, puissant, élitiste sans le dire. Une phrase,
ce qui la prouve, de l'air (`Say`, `Numbers`, `.pv-ruled`) ; le technique est replié (`Fold`). **On ne
se compare jamais aux autres fonds** : plus de « cheque for cheque with the best » (« c'est ridicule »),
aucun fonds nommé ; on propose tout ce que proposent les meilleurs, la table retournée, et on prouve
l'alignement par ce qu'on signe. **Accueil** : les règles, `TheFew` (« The companies that define this
era will be built by very few people. »), le capital (« Diluted like no one. », un chemin : on agit comme le Chief Fundraising Officer interne
du fondateur, lever tout ce qu'il faut, dans l'ordre qui dilue le moins ; les quatre étapes à
l'horizontale, les chiffres du fonds fondus dedans, « Another lead? Take both. » ; étages et tickets
repliés, `StageLadder` ; posture humble et alignée, jamais faible),
ce qu'ils gardent (« The equity you don’t sell is the company you keep. » ; `StakeChart` visible, **quatre
chemins, chacun dit ce qu'il lève** (`paths`, 07/11) : le chemin VC, 224 M€ d'equity, 11,4 % ; **le même capital**,
199 M€ d'equity et 25 M€ de prêts, 13,2 % ; **la moitié du capital**, 85 M€ et 25 M€, 20,8 % ; **le crédit seul**,
25 M€, 37,5 %. 59 M€ de prêts ne tenaient pas (Alexandre, 07/11) : le crédit s'arrête à 25 M€, 3 + 7 + 15 M€, soit 25 à
30 % du dernier tour, dans les 20-40 % du marché (First Citizens, ex-SVB) ; `fund_model.py` échoue au-delà. À capital
égal l'écart reste modeste, et c'est dit : il devient massif quand une société a besoin de moins d'equity, et c'est la
thèse. Mêmes valorisations partout (même pre-money). Le pool se recharge en actions nouvelles à chaque tour, comme sur
le chemin VC : le racheter (clause 5) coûterait 53 M€ de plus, c'est une option du calculateur, jamais le chemin par
défaut. Plus de Deliveroo sur ce graphique, il a levé 1,3 Md£. Le calculateur part du même capital, montre les trois
chemins d'un coup d'œil, dit quand les chemins ne lèvent pas la même somme et quand un prêt dépasse 40 % du dernier
tour. `prerender.mjs` échoue si le moteur JS s'écarte de `fund.json` sur un chemin ; plus de tableau
« What you take home » sur l'accueil, il reste illustratif sur /pitch et la fiche), les moteurs (étapes repliées), « Exceptional numbers deserve exceptional terms. ». **/lp** : plus de plan numéroté (« le plan 1 2 3 4 alourdit »), un seul raisonnement,
chaque phrase appelle la suivante : « The kingmakers. » (les équipes AI-native, l'éloge, trois chiffres
sourcés) → « Capital is no longer scarce. Ownership is. » (ils ont le choix ; 11,4 %, 6,3 %, sous les
20 %) → « Every fund says founders come first. We wrote it down. » (ce qu'on rend aux fondateurs, ce
qui protège le capital : chaque ligne est une clause du pacte) → « What is right for them is what pays
you. » (cibles et test sans licorne, dits comme des sorties du modèle) → « We run on what we back. » (un
premier fonds qui ne fait pas semblant, Proplace, Maximum Insurance, le deal flow chaque soir) puis
l'équipe → « The data room. » (huit `Fold` : introductions en bourse et médianes, multiplication aux
prix réels, cessions, termes, performance, simulation, protection, moteurs ; les documents) → « What €10M
would represent » et la carte de contact du Founding Partner (téléphone, le même que la fiche, et
email) → mention de pré-commercialisation → sources numérotées et cliquables (`SRC`). Pas de barre du
haut ni de formulaire ; le deal flow s'ouvre directement si le LP est accepté, sinon le popup. **Jamais
de promesse** : l'« inévitable » vient du raisonnement, pas d'un adjectif ; tout chiffre du fonds se dit
modèle, cible ou hypothèse, aucune société n'a encore suivi ce chemin.
**Pas de société fictive sur /lp (06/11, Antoine : « fais des chiffres réels »)** : plus de tableau
« €0 » à côté de noms de sociétés réelles, ça laissait croire que leurs fondateurs avaient touché 0 €.
JAMAIS un nom de société réelle à côté d'un calcul fictif. Prix réel × part, ce qui est réel et ce qui
est notre hypothèse dit au-dessus. Aucun prix sous le dernier tour (500 M€, 1,8 Md€, 7 Md€). Ne pas écrire
« lever moins, c'est garder plus » : ces cas ne le montrent pas (Criteo, 47 M€ levés, 8,4 %), et ces parts
mêlent dilution et ventes de titres. Carta n'a pas de coupe européenne : ne pas dire « européen » pour
ses médianes. **L'audience LP (07/11, Alexandre)** : on ne s'adresse qu'à des HNWI qui peuvent engager
500 K€ au moins (`terms.lp_commit_min` de `fund_model.py`, lu par la porte de /lp « For high-net-worth
individuals investing €500K or more. », la FAQ « Who can invest? », les termes de /pitch, la fiche p. 2 et
l'Excel ; le popup du deal flow dit « minimum €500k ») ; plus de « family offices ». Les mentions
réglementaires (« For professional and eligible investors only », /legal et ses 100 000 € de l'art. 6(1),
le plancher légal) ne changent pas. **Positionnement (06/11, Antoine)** : on chasse les licornes comme Index Ventures ou
Sequoia, et les meilleurs fondateurs nous choisissent parce que nos termes sont réellement
alignés (pas une posture). Plus de « returns built on ownership, not on unicorns » ni de
« no unicorn needed » en accès LP ; plus de « Luxembourg » dans la copie (site, fiche).
Jamais de posture « petits bras » : du seed à la série B (jusqu'à 10 M€ du fonds, SPV pour la
taille du tour), méga-tours en SPV avec nos LPs (l'upside reste aux LPs, le fondateur garde nos
termes), on suit les termes d'un lead de premier plan ; ces moyens se disent, la comparaison aux
autres fonds non (cf. « La voix »). La fiche p. 1 porte « The new go-to fund for elite founders »
au lieu de « One round. Then never diluted again. » et n'a plus la capture du pipeline. **/lp est fermée
(v3.15)** derrière la MÊME candidature que le deal flow (`DealFlowModal` avec `lp`) : elle
s'ouvre quand ce navigateur a l'accès retenu par /dealflow (`lib/access.ts`, lien magique
vérifié une fois ; /dealflow porte un lien « LP page »), ou avec `?gp` dans l'URL (aperçu du
GP : `profund.vc/lp/?gp`). Barrière côté client : le texte reste dans le bundle JS, ne rien
mettre sur /lp qui doive rester secret. Sur l'accueil, les LPs n'ont
qu'un lien « LPs » en pied de page ; le popup du deal flow reste monté pour
`profund.vc/#dealflow` (le QR de la fiche), sans bouton visible. **L'equity complémentaire**
(si la dette ne suffit pas) se fait au choix du fondateur, aux conditions du pacte, avec au plus une préférence 1× (clause 2 ; champ du calculateur). Plus de formulaire « Reserve your round » ni de page /sell : le
parcours fondateur s'arrête au calculateur (« Send these numbers to the partner », un
mailto) et la fin de l'accueil dit « A handful of founders a year. ». Le formulaire de
/lp a été retiré le 06/11 (`LeadForm.tsx` reste, inutilisé ; il n'avait PAS de backend, il
ouvrait un email pré-rempli). Sur l'accueil : « Another lead? Take both. » (on investit aux termes du lead, sans nommer de fonds ;
ON DEVIENT ALORS UN CO-INVESTISSEUR CLASSIQUE, clause 8 : ne jamais y promettre prêts, rachats, moteurs ni vote avec le fondateur). Au-delà
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
comme le modèle, sinon il s'écarte du tableau publié. Ne pas revenir à des hypothèses plus
flatteuses pour le VC sans source. **Les lignes du tableau (07/11)** : `founders_vc`, `_same`, `_half`, `_credit` et
leurs `series_a_*` (`PUBLISHED_FOUNDER_MATH`) ; /lp, /pitch et la fiche p. 2 et 4 les montrent, plus jamais 224 M€
d'equity contre 25 M€ de prêts sans le dire. Les stress `unicorn_half` et `unicorn_same` disent ce qu'il reste au fonds
si la licorne S-01, que la cible suppose financée à crédit, vend aussi de l'equity (3,3× et 2,8× net).

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
