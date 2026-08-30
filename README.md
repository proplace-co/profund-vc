# profund.vc

Site public de **ProFund** — AI-native venture platform.
React + Vite, déployé sur GitHub Pages, domaine `profund.vc`.

Ce dépôt remplace la version hébergée sur Zite (build.fillout.com), qui n'était
ni versionnée ni modifiable hors de leur interface.

## Routes

| URL         | Contenu                                                          |
|-------------|------------------------------------------------------------------|
| `/`         | Accueil : hero, badge « Pre-Marketing Phase », 4 chiffres clés, formulaire Brevo |
| `/pitch`    | Deck LP complet — 17 sections, simulations de fonds, track record  |
| `/legal`    | Legal Notice — communication de pré-commercialisation AIFMD        |
| `/privacy`  | Politique de confidentialité (RGPD)                                |

## Développer

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # dist/ prêt pour GitHub Pages
npm run preview    # sert dist/ en local
```

En `preview`, ouvrir les routes profondes **avec le slash final** (`/pitch/`) :
c'est ce que sert GitHub Pages. Sans slash, le serveur de preview retombe sur
le shell de l'accueil — artefact local, pas un bug de production.

## Déploiement

Push sur `main` → GitHub Actions (`.github/workflows/deploy.yml`) construit et
pousse `dist/` sur la branche `gh-pages`, servie par GitHub Pages.

Réglages nécessaires une seule fois, dans les paramètres du dépôt :

1. **Settings → Actions → General → Workflow permissions** : `Read and write`
   (sans ça, `GITHUB_TOKEN` ne peut pas écrire sur `gh-pages`).
2. **Settings → Pages → Source** : branche `gh-pages`, dossier `/ (root)`.
   Disponible seulement après le premier run réussi du workflow.
3. **Settings → Pages → Custom domain** : `profund.vc`, puis **Enforce HTTPS**
   une fois le certificat émis.

## DNS

Chez le fournisseur DNS du domaine, pour l'apex :

```
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
AAAA  @    2606:50c0:8000::153
AAAA  @    2606:50c0:8001::153
AAAA  @    2606:50c0:8002::153
AAAA  @    2606:50c0:8003::153
CNAME www  proplace-co.github.io.
```

Jamais de CNAME sur l'apex. Supprimer les anciens enregistrements Zite, `www`
compris — un CNAME qui pointe vers un hébergeur no-code désactivé est un vecteur
de détournement de sous-domaine.

Vérifier avant bascule qu'aucun enregistrement CAA n'exclut `letsencrypt.org` :
sinon GitHub ne pourra jamais émettre le certificat et « Enforce HTTPS » restera
grisé.

## Points d'attention

- **`public/CNAME`** doit rester exactement `profund.vc` + un saut de ligne, en
  UTF-8 sans BOM. Ne jamais le régénérer avec `echo` depuis Windows (cmd.exe
  ajoute une espace, PowerShell écrit de l'UTF-16 avec BOM) — GitHub refuse le
  domaine dans les deux cas.
- **Le formulaire d'inscription est un iframe Brevo** (`sibforms.com`), hébergé
  chez eux. Il peut avoir une allowlist de domaines côté Brevo : à vérifier après
  la bascule DNS, sinon il tombe silencieusement.
- **Aucune analytics.** La version Zite chargeait son propre traceur
  (`workflows.fillout.com`), perdu à la migration. GitHub Pages ne fournit aucun
  log. À rebrancher si le trafic doit être mesuré.
- Les images (`public/logo.png`, `gp-photo.jpg`, `favicon.png`, `og-cover.png`)
  ont été rapatriées du CDN Fillout et sont désormais servies par le dépôt.
