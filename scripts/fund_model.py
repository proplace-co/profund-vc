"""Modele du fonds ProFund (v3.3) -- la SEULE source des chiffres du fonds.

Ecrit src/data/fund.json, que lisent le site (accueil, /pitch, /calculator via
src/lib/fund.ts), la fiche PDF (scripts/factsheet.py) et le modele Excel
(scripts/fund_xlsx.py). Un chiffre du fonds ne se tape jamais ailleurs : on le
change ICI, on relance, on commite le JSON, le PDF et le xlsx regeneres.

    python scripts/fund_model.py           valide, ecrit fund.json, imprime un resume
    python scripts/fund_model.py --check   code 1 si fund.json n'est plus a jour
    python scripts/fund_model.py --dry     resume seulement, n'ecrit rien

La v3 (05/11, Antoine et Alexandre) : UN tour en actions par societe, puis plus
aucune action nouvelle tant que le fondateur grandit avec ProFund. L'exposition
monte par des rachats de titres existants (angels, leavers, fonds en fin de
vie) avec decote ; la croissance est financee par des prets (plafond EuVECA de
30 % des engagements) ; la societe rachete et annule des actions chaque annee.
Si le fondateur leve ailleurs, ProFund suit ou mene le tour en actions
nouvelles. Le Growth prend aussi des tours de croissance en actions nouvelles.
v3.2 : calendrier realiste (investissements sur 5 ans, sorties annees 5 a 9),
liquidite partielle des gagnants en annee 6 (clause 9 du pacte), prets a 1,4x
tires par tranches, Growth achete a des vendeurs structurels. v3.3 : vrais
tickets Venture et Growth, dont un bloc rachete dans notre propre breakout.
Le portage v3.3 reproduisait a l'euro pres le classeur livre le 05/11 (tag git
v3.3). v3.4 (05/11, Antoine) : prets sains a 12 % par an composes sur leur duree
(au lieu de 1,4x quelle que soit la duree) ; Seed a 50 societes, 40 tickets radar
de 150 K EUR comme en v2, finances par 3 M EUR pris sur les cheques Venture ; la
loi 04 chiffree (la sortie a laquelle la meilleure societe rend tout le fonds).
v3.5 (05/11, Antoine) : la clause 9 (liquidite partielle en annee 6) reste dans le
pacte mais sort du cas cible : c'est une option de la societe, pas une hypothese du
fonds. Elle devient un test de resistance (CLAUSE9_LINES).
v3.6 (05/11, Antoine) : S-01, la vitrine, suit le chemin ProFund pur (aucune
dilution) ; S-02 devient la societe qui leve ailleurs, que l'on suit en actions
nouvelles et qui sort a 250 M EUR (V-02 reste l'autre exemple) ; un seul
vocabulaire, Seed / Venture / Growth ; cinq tests de resistance.
v3.7 (05/11) : une licorne dans le tableau des fondateurs (sortie a 1 Md EUR) et un
scenario « grosse licorne » (S-01 vendue 2 Md EUR) ; le cas cible reste sans licorne.
v3.8 (05/11, Antoine) : la clause 9 (liquidite partielle) est supprimee du pacte ; son
test de resistance disparait. Le mecanisme reste dans le moteur et le classeur comme un
levier « what if » (vente secondaire partielle), sans aucune ligne marquee.
v3.9 (05/11) : le tableau des fondateurs est recale sur les medianes Carta (fondateurs a
37,5 % apres la Serie A ; dilution mediane par tour de B a D ; recharges du pool).
scripts/fund_xlsx.py regenere le classeur en formules vivantes.
v3.17 (07/11, Alexandre) : le fonds ne prete plus. ProFund fait lever la dette des
fondateurs aupres des banques partenaires (elles pretent et portent le risque) ; le fonds
fait des actions et des rachats. Chaque pret du modele devient un rachat de meme montant
dans la meme societe, au prix du rachat deja modelise (V-04, qui n'en avait pas : au prix
d'entree, decote par defaut). Sauf le pret des zombies V-05 (1 M EUR) : il paie les frais de
gestion en plus (la poche de prets payait 1 % au lieu de 2 %). Aucune autre hypothese ne bouge.

Conventions :
- montants en euros entiers ; une ligne qui regroupe n societes porte des
  TOTAUX de ligne, le par-societe vaut total / n ;
- chaque montant est arrondi a sa maille d'affichage AVANT toute somme
  (10 k EUR sous 1 M, 100 k EUR au-dessus) : les sous-totaux affiches tombent
  juste, sur le site comme dans le PDF ;
- les ratios sont exportes a leur precision d'affichage : les formateurs (TS et
  Python) formatent, ils n'arrondissent jamais ;
- annee 1 = annee du premier closing ; tous les flux en fin d'annee ;
- bibliotheque standard uniquement, sortie console en ASCII (cp1252 sous
  Windows quand la sortie est redirigee).

Frais du fonds (mise en place, plateforme, administration, audit) : estimation
en attendant le devis du gestionnaire EuVECA. A remplacer des reception, puis
relancer ce script, la fiche et le xlsx.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, replace
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "fund.json"

VERSION = "v3.17"
MODEL_DATE = "2026-11-07"   # fixe : --check doit rester stable d'un jour a l'autre

M = 1_000_000

# ── hypotheses ──────────────────────────────────────────────────────────────
FUND = {
    "commitments": 100 * M,
    "term_years": 10,
    "investment_period_years": 5,
    "closing_months": 24,            # closings successifs apres le premier
    "company_cap_pct": 0.10,         # exposition max d'une societe DANS le fonds
    "company_max_with_spv": 15 * M,  # au-dela : un ou plusieurs SPV de co-investissement
    "europe_min_pct": 0.85,          # UE/EEE + Royaume-Uni + Suisse
    "euveca_qualifying_min_pct": 0.70,
    "first_close_min": 20 * M,       # premier closing vise (deck /pitch, 05/11)
    "first_close_max": 30 * M,
}
TERMS = {
    "fee_ip_pct": 0.02,              # sur les engagements, periode d'investissement
    "fee_post_pct": 0.015,           # ensuite, sur le capital investi encore detenu
    "fee_first_close_pct": 0.0175,   # LPs du premier closing ; le modele garde le taux standard (prudent)
    "setup_cost": 400_000,           # A CONFIRMER : devis du gestionnaire EuVECA
    "running_cost": 350_000,         # par an, sur toute la duree du fonds, idem
    "carry_pct": 0.20,
    "hurdle_pct": 0.08,              # compose annuellement, cascade europeenne (tout le fonds)
    "catch_up_pct": 1.0,
    "gp_commit_min_pct": 0.01,
    # 07/11 (Alexandre) : on ne s'adresse qu'a des HNWI qui peuvent engager 500 K EUR au moins ; l'art.
    # 6(1) EuVECA n'en exige que 100 K (plancher legal, garde sur /legal). Meme seuil que le popup.
    "lp_commit_min": 500_000,
}
# Clause 9 du pacte : a partir de l'annee 6, la societe peut racheter jusqu'au
# quart de notre ligne, avec decote, et l'annuler. v3.5 : c'est une OPTION de la
# societe, absente du cas cible (aucune ligne `partial`) ; le test de resistance
# « with partial liquidity » l'applique aux cinq gagnants de CLAUSE9_LINES.
SECONDARY = {"share": 0.25, "year": 6, "price_pct": 0.60}
# v3.8 : plus dans le pacte ; aucune ligne `partial` (verifie par validate()).
# Rachats de titres existants : decote par defaut sur la valorisation du moment
# (chaque ligne peut fixer la sienne : 5-10 % sur les gagnants et angels, 30 %
# sur les vendeurs structurels, fonds en fin de vie).
BUYBACK_DISCOUNT = 0.20
# v3.17 : le fonds ne prete plus. LOAN_RATE ne sert qu'au tableau des fondateurs : le cout
# des prets que les banques partenaires font aux societes, 12 % par an composes, frais
# compris (le marche europeen de la venture debt : 10 a 13 % d'interets, 1 a 2 % de frais).
LOAN_RATE = 0.12


def loan_price(draw: float, repay: float) -> float:
    """Multiple de remboursement d'un pret bancaire, au centieme (defini avant ratio())."""
    v = Decimal(str((1 + LOAN_RATE) ** (repay - draw)))
    return float(v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


@dataclass(frozen=True)
class Case:
    id: str
    exit_mult: float        # part de chaque valeur de sortie conservee
    exit_cap: int | None    # plafond optionnel sur chaque valeur de sortie


# Un seul portefeuille dans chaque cas : Base et Stress multiplient chaque
# valeur de sortie.
CASES = (
    Case("target", 1.0, None),
    Case("base", 0.6, None),
    Case("stress", 0.4, None),
)
CASE_IDS = tuple(c.id for c in CASES)

LAYERS = ("seed", "venture", "growth")
# Noms des etages dans le classeur (onglets Lines, Construction) : la fiche le dit.
MODEL_NAMES = {"seed": "Seed", "venture": "Venture", "growth": "Growth"}
# Seed en haltere : 10 leads de conviction portent la propriete, 40 tickets radar
# de 150 K EUR multiplient les tirages (v3.4, comme en v2). En v3, un ticket radar est
# aussi une option sur un rachat : quand la societe decolle, on rachete ses angels
# (S-11). Les 3 M EUR de plus viennent des cheques Venture, la ou l'on paie le plus cher.
SEED_TRACKS = {
    "lead": {"ticket": (500_000, 1_500_000), "companies": 10},
    "radar": {"ticket": (100_000, 150_000), "companies": 40},
}
# Bornes de construction. Premier ticket = premier cheque, ou rachat en Growth.
BOUNDS = {
    "seed": {"ticket": (100_000, 1_500_000), "post": (5 * M, 20 * M),
             "own": (0.01, 0.20), "companies": 50, "stage": "Pre-seed / seed"},
    "venture": {"ticket": (1_500_000, 5 * M), "post": (25 * M, 80 * M),
                "own": (0.05, 0.12), "companies": 7, "stage": "Seed+ / Series A"},
    "growth": {"ticket": (5 * M, 10 * M), "post": (80 * M, 400 * M),
               "own": (0.02, 0.08), "companies": 5, "stage": "Series B and beyond"},
}


@dataclass(frozen=True)
class Line:
    id: str                 # premier identifiant ("S-08" pour S-08..S-10)
    layer: str
    company: str            # cle d'exposition et de sortie ("S-01" pour G-06)
    n: int                  # societes regroupees sur la ligne
    status: str             # libelle affiche (site, fiche, Excel)
    tone: str               # green / blue / grey / red
    kind: str               # "new" : entree ; "breakout" : bloc dans une societe deja detenue
    first: int              # premier cheque en actions nouvelles, total de ligne
    entry_post: int         # post-money d'entree, ou valorisation au rachat en Growth (par societe)
    entry_year: int
    exit_year: int
    buyback: int = 0                  # rachats de titres existants, total de ligne
    buyback_year: int | None = None
    buyback_value: int | None = None  # valorisation (100 %) au rachat, par societe
    discount: float | None = None     # decote du rachat (None : BUYBACK_DISCOUNT)
    cancel: float = 0.0               # rachat-annulation par la societe (% des actions)
    dilution: float = 0.0             # dilution exterieure (le fondateur a leve ailleurs)
    follow: int = 0                   # suivi en actions nouvelles dans ce tour exterieur
    follow_year: int | None = None
    follow_post: int | None = None    # post-money du tour exterieur, par societe
    exit_value: int | None = None     # valorisation de sortie (100 %), avant multiplicateur du cas
    recovery: float | None = None     # sinon : multiple recupere sur les fonds propres investis
    partial: bool = False             # liquidite partielle en annee 6 (clause 9)
    track: str | None = None          # Seed seulement : "lead" ou "radar"


L = Line
LINES = (
    # Seed : 50 societes, pre-seed / seed, entrees annees 1-3.
    # S-01 a S-10 : leads de conviction ; S-11 a S-50 : tickets radar.
    # S-01, la vitrine : le chemin ProFund pur, un tour, des rachats, des annulations.
    # v3.17 : les prets du fonds deviennent des rachats (S-01 : 1 M EUR de plus ; la dette de la
    # societe vient des banques partenaires).
    # v3.16 (06/11, loi de puissance) : la licorne qui porte le fonds, vendue 1 Md EUR.
    L("S-01", "seed", "S-01", 1, "Unicorn: one round, buybacks, cancellations", "green", "new",
      1_500_000, 7_500_000, 1, 9, buyback=2_500_000, buyback_year=3, buyback_value=40 * M,
      discount=0.10, cancel=0.08, exit_value=1000 * M, track="lead"),
    # S-02 : le fondateur leve ailleurs (fair both ways), ProFund suit en actions nouvelles.
    L("S-02", "seed", "S-02", 1, "Breakout, raised elsewhere once, we followed", "green", "new",
      1 * M, 6 * M, 1, 8, buyback=1_500_000, buyback_year=3, buyback_value=25 * M, discount=0.10,
      dilution=0.15, follow=1 * M, follow_year=4, follow_post=60 * M, exit_value=250 * M, track="lead"),
    # v3.16 : la loi de puissance, la plupart des societes ne rendent pas leur mise.
    L("S-03", "seed", "S-03", 1, "Loss, after an angels buyback", "red", "new",
      1 * M, 7 * M, 2, 7, buyback=1 * M, buyback_year=4, buyback_value=20 * M, discount=0.10,
      recovery=0.0, track="lead"),
    L("S-04", "seed", "S-04", 1, "Loss", "red", "new",
      750_000, 7 * M, 2, 5, recovery=0.0, track="lead"),
    L("S-05", "seed", "S-05", 1, "Early exit (M&A)", "blue", "new",
      700_000, 8 * M, 2, 5, exit_value=30 * M, track="lead"),
    L("S-06", "seed", "S-06", 2, "Zombies (×2)", "grey", "new",
      1_500_000, 8 * M, 2, 7, recovery=0.5, track="lead"),
    L("S-08", "seed", "S-08", 3, "Losses (×3)", "red", "new",
      2_250_000, 8 * M, 2, 5, recovery=0.0, track="lead"),
    L("S-11", "seed", "S-11", 1, "Radar breakout", "green", "new",
      150_000, 8 * M, 2, 8, buyback=800_000, buyback_year=4, buyback_value=20 * M, discount=0.10,
      exit_value=150 * M, track="radar"),
    L("S-12", "seed", "S-12", 1, "Radar, early exit", "blue", "new",
      150_000, 8 * M, 2, 5, exit_value=50 * M, track="radar"),
    L("S-13", "seed", "S-13", 1, "Radar, early exit", "blue", "new",
      150_000, 8 * M, 3, 6, exit_value=30 * M, track="radar"),
    L("S-14", "seed", "S-14", 1, "Radar, early exit", "blue", "new",
      150_000, 8 * M, 3, 6, exit_value=40 * M, track="radar"),
    L("S-15", "seed", "S-15", 8, "Zombies (×8)", "grey", "new",
      1_200_000, 8 * M, 3, 7, recovery=0.5, track="radar"),
    L("S-23", "seed", "S-23", 28, "Losses (×28)", "red", "new",
      4_200_000, 8 * M, 3, 5, recovery=0.0, track="radar"),
    # Venture : 7 societes, premiers cheques de 2 a 4 M EUR en seed+ ou
    # Serie A, entrees annees 2-4 (v3.4 : 3 M EUR de moins qu'en v3.3 sur les lignes qui
    # vivent, passes au radar ; la perte V-07 garde son montant).
    L("V-01", "venture", "V-01", 1, "Breakout, second winner", "green", "new",
      4 * M, 40 * M, 2, 9, buyback=3_500_000, buyback_year=4, buyback_value=100 * M,
      discount=0.05, cancel=0.08, exit_value=500 * M),
    L("V-02", "venture", "V-02", 1, "Raised elsewhere once, we followed", "green", "new",
      3_500_000, 35 * M, 2, 8, buyback=2 * M, buyback_year=4, buyback_value=60 * M, discount=0.10,
      dilution=0.20, follow=1_500_000, follow_year=5, follow_post=120 * M, exit_value=250 * M),
    L("V-03", "venture", "V-03", 1, "Zombie, after an angels buyback", "grey", "new",
      3 * M, 35 * M, 3, 7, buyback=1_500_000, buyback_year=4, buyback_value=40 * M,
      discount=0.10, recovery=0.5),
    L("V-04", "venture", "V-04", 1, "Early exit (M&A)", "blue", "new",
      2_500_000, 30 * M, 3, 5, buyback=500_000, buyback_year=4, buyback_value=30 * M,
      exit_value=60 * M),
    L("V-05", "venture", "V-05", 2, "Zombies (×2)", "grey", "new",
      4 * M, 25 * M, 3, 8, recovery=0.5),
    L("V-07", "venture", "V-07", 1, "Loss", "red", "new",
      2_500_000, 25 * M, 4, 6, recovery=0.0),
    # Growth : 5 a 7 M EUR par position. Blocs rachetes a des fonds en fin
    # de vie (30 % de decote), tours de croissance en actions nouvelles, et un bloc
    # dans notre propre breakout ; entrees annees 3-5, sorties 2 a 4 ans plus tard.
    L("G-01", "growth", "G-01", 1, "Strategic exit, block bought from an end-of-life fund", "blue",
      "new", 0, 150 * M, 3, 6, buyback=7 * M, buyback_year=3, buyback_value=150 * M,
      discount=0.30, exit_value=300 * M),
    L("G-02", "growth", "G-02", 1, "Fresh growth round (new shares)", "blue", "new",
      6 * M, 175 * M, 4, 6, exit_value=300 * M),
    L("G-03", "growth", "G-03", 1, "Block bought from an end-of-life fund", "blue", "new",
      0, 100 * M, 4, 6, buyback=5 * M, buyback_year=4, buyback_value=100 * M, discount=0.30,
      exit_value=180 * M),
    L("G-04", "growth", "G-04", 1, "Fresh growth round, downside (preference)", "grey", "new",
      5 * M, 150 * M, 4, 7, exit_value=90 * M),
    L("G-05", "growth", "G-05", 1, "Block bought from an end-of-life fund, loss", "red", "new",
      0, 120 * M, 5, 8, buyback=5 * M, buyback_year=5, buyback_value=120 * M, discount=0.30,
      recovery=0.2),
    L("G-06", "growth", "S-01", 1, "Unicorn (S-01): a seed fund's block bought back", "green",
      "breakout", 0, 150 * M, 5, 9, buyback=5 * M, buyback_year=5, buyback_value=150 * M,
      discount=0.30, cancel=0.04, exit_value=1000 * M),
)

# Complement par SPV (hors fonds) jusqu'a company_max_with_spv, a titre indicatif.
SPV_COMPANIES = ("S-01", "V-01", "G-01")

# Le tableau des fondateurs (accueil, /calculator, /pitch, fiche p. 2 et 4) :
# meme societe, meme sortie, deux chemins. Reconstitution de la table publiee le
# 05/11 ; build() verifie qu'elle retombe sur PUBLISHED_FOUNDER_MATH. Le
# calculateur du site (src/lib/founderMath.js) fait le meme calcul et le build
# du site echoue s'il diverge (scripts/prerender.mjs).
FOUNDER_MATH = {
    "exits": [100 * M, 250 * M, 500 * M, 1000 * M],
    # Cap table apres seed et Serie A (identique sur les deux chemins), sur les medianes
    # Carta (Founder Ownership Report 2026 : 37,5 % pour les fondateurs « digital »
    # apres la Serie A ; dilution mediane d'une Serie A ~20 %) : Serie A 10 M EUR a
    # 50 M post, seed et pre-seed 26 % (2 M EUR de preference), pool 16,5 %.
    "founders": 0.375,
    "holders": [
        {"id": "seed", "label": "Seed investors", "stake": 0.26, "pref": 2 * M},
        {"id": "pool", "label": "Option pool", "stake": 0.165, "pref": 0},
        {"id": "series_a", "label": "Series A investor", "stake": 0.20, "pref": 10 * M},
    ],
    # Chemin VC (v3.15, 06/11 : recale sur les parts MEDIANES PAR ETAPE de Carta, et non
    # plus sur la seule dilution mediane par tour, qui oubliait tout ce qui se passe entre
    # deux tours) : une levee intermediaire avant la B et avant la C, des recharges de
    # pool plus fortes. Cibles (Founder Ownership Report 2026) : 27,3 % pour les
    # fondateurs d'une equipe IA apres la Serie B (le modele : 27,2 %) ; 16,1 % apres
    # la Serie C, le pool (16,8 %) passant devant les fondateurs (le modele : 16,2 % et
    # 16,5 %). 06/11 (2) : une levee intermediaire avant la D aussi, 11,4 % apres la Serie D
    # (donnee Carta citee par SaaStr ; 10,4 % dans une reprise du rapport 2026 ; le modele :
    # 11,4 %). 224 M EUR de fonds propres apres la Serie A. Preferences 1x non participantes,
    # pari passu. `bridge` : levee intermediaire (absente du graphique, presente au
    # calculateur).
    # `loan` (07/11) : la part de la levee intermediaire que le credit peut porter (voir plus bas).
    "vc_rounds": [
        {"id": "A2", "label": "Bridge to B", "bridge": True, "amount": 5 * M, "post": 60 * M, "pool": 0.0, "loan": 3 * M},
        {"id": "B", "label": "Series B", "amount": 25 * M, "post": 150 * M, "pool": 0.05},
        {"id": "B2", "label": "Bridge to C", "bridge": True, "amount": 24 * M, "post": 160 * M, "pool": 0.0, "loan": 7 * M},
        {"id": "C", "label": "Series C", "amount": 60 * M, "post": 260 * M, "pool": 0.09},
        {"id": "C2", "label": "Bridge to D", "bridge": True, "amount": 30 * M, "post": 300 * M, "pool": 0.0, "loan": 15 * M},
        {"id": "D", "label": "Series D", "amount": 80 * M, "post": 450 * M, "pool": 0.05},
    ],
    # Les chemins ProFund (07/11, Alexandre : 59 M EUR de prets, ce n'est pas tenable). 25 M EUR de
    # prets au plus, avec les preteurs partenaires, tires en 3 + 7 + 15 M EUR : 30 %, 28 % et 25 % du
    # dernier tour, 6 %, 4,7 % et 5,8 % de la derniere valorisation. Le marche : 20 a 40 % du dernier
    # tour, 6 a 8 % de la derniere valorisation (First Citizens, ex-SVB, 22/09/2023). Au taux
    # LOAN_RATE (v3.17 : des banques partenaires, le fonds ne prete plus), rembourses en ~1,6 an en moyenne (de 1 a 3
    # ans) : 1,12^1,6 = 1,2x, deduits a la sortie avant les fonds propres.
    #   same   : le meme capital, aux memes valorisations (meme pre-money) : les prets remplacent une
    #            part des levees intermediaires, le reste en equity.
    #   half   : la moitie du capital : ni levees intermediaires ni Serie D, les prets en plus.
    #   credit : le credit seul, aucun tour, pas de recharge du pool (une equipe restreinte vit sur
    #            les 16,5 % du pool).
    # Le pool se recharge en ACTIONS NOUVELLES a chaque tour, comme sur le chemin VC : racheter ces
    # titres (pacte, clause 5) couterait 53 M EUR de plus, ni les prets ni le fonds ne les portent.
    # Le calculateur le laisse en option, avec son cout.
    "loans": 25 * M,
    "loan_life": 1.6,
}
FOUNDER_MATH["loan_rate"] = LOAN_RATE
FOUNDER_MATH["loan_multiple"] = loan_price(0, FOUNDER_MATH["loan_life"])
# 07/11 : le tableau compare les memes montants leves, plus 224 M EUR d'equity a 25 M EUR de prets.
FOUNDER_PATHS = (
    ("vc", "VC path"),
    ("same", "The same capital"),
    ("half", "Half the capital"),
    ("credit", "Credit alone"),
)
PUBLISHED_FOUNDER_MATH = {
    "founders_vc": [0, 5 * M, 57 * M, 114 * M],
    "founders_same": [0, 4 * M, 62 * M, 128 * M],
    "founders_half": [0, 43 * M, 98 * M, 202 * M],
    "founders_credit": [26 * M, 83 * M, 176 * M, 364 * M],
    "series_a_vc": [0.4, 1.0, 3.0, 6.1],
    "series_a_same": [0.3, 1.0, 3.3, 6.8],
    "series_a_half": [0.7, 2.3, 5.2, 10.8],
    "series_a_credit": [1.4, 4.4, 9.4, 19.4],
}

# La v2 (commit 2f3b590, scripts/fund_model.py) avec les memes sorties que la v3,
# toutes plafonnees a 300 M EUR : `git show 2f3b590:scripts/fund_model.py`, puis
# run_case(300 * M). Sans plafond, elle n'atteignait 2,7x net qu'avec deux sorties
# au-dessus de 1 Md EUR (S-01 a 1,5 Md, V-01 a 1,2 Md). Cite sur /pitch.
REFERENCE_V2 = {"commit": "2f3b590", "net_tvpi": 2.7, "capped_exit": 300 * M, "capped_net_tvpi": 1.3}

# Valeurs publiees de la v3.4 (fiche, /pitch) que le modele doit retrouver : un
# changement d'hypothese qui les deplace doit etre voulu, et les textes relus.
# v3.16 (06/11, Antoine) : le portefeuille en loi de puissance, comme les meilleurs fonds :
# une licorne porte le fonds (S-01 vendue 1 Md EUR, 31 % detenus a la sortie, non dilues),
# un second gagnant (V-01, 500 M EUR), et la plupart des societes ne rendent pas leur mise
# (S-03 et S-04 perdues, V-03 zombie). Plus de plafond a 300 M EUR. Sans la licorne : 2,0x.
# v3.17 (07/11) : le fonds ne prete plus, les prets deviennent des rachats : upside 4,4x -> 4,8x,
# cible presentee (base) 2,8x -> 3,0x, stress 2,0x -> 2,1x ; le DPI a 7 ans baisse (les prets
# remboursaient tot). Aucune hypothese retouchee pour tomber sur un chiffre rond.
PUBLISHED = {
    "target": {"net_tvpi": 4.8, "net_irr": 0.37, "dpi_year7": 0.6},
    "base": {"net_tvpi": 3.0, "net_irr": 0.25},
    "stress": {"net_tvpi": 2.1, "net_irr": 0.17},
}


# ── arrondis ────────────────────────────────────────────────────────────────
def money(v) -> int:
    """Arrondi a la maille d'affichage : 10 k sous 1 M, 100 k au-dessus."""
    d = Decimal(str(v))
    step = Decimal(10_000) if abs(d) < M else Decimal(100_000)
    return int((d / step).quantize(Decimal(1), rounding=ROUND_HALF_UP) * step)


def ratio(v, places: int) -> float:
    q = Decimal(1).scaleb(-places)
    return float(Decimal(str(v)).quantize(q, rounding=ROUND_HALF_UP))


def millions(v) -> int:
    """Arrondi au million (le tableau des fondateurs est publie en millions ronds)."""
    return int(Decimal(str(v / M)).quantize(Decimal(1), rounding=ROUND_HALF_UP)) * M


def on_grain(v: int) -> bool:
    return v == money(v)


# ── calculs par ligne (memes formules que l'onglet Lines du classeur) ───────
def equity_cost(line: Line) -> int:
    return line.first + line.buyback + line.follow


def invested(line: Line) -> int:
    return equity_cost(line)


def entry_stake(line: Line) -> float:
    return ratio(line.first / line.n / line.entry_post, 3)


def bought_stake(line: Line) -> float:
    if not line.buyback:
        return 0.0
    disc = BUYBACK_DISCOUNT if line.discount is None else line.discount
    return ratio(line.buyback / line.n / (line.buyback_value * (1 - disc)), 3)


def follow_stake(line: Line) -> float:
    return ratio(line.follow / line.n / line.follow_post, 3) if line.follow else 0.0


def exit_stake(line: Line) -> float | None:
    """Entree + rachats, relevee par les annulations, diluee par les tours exterieurs."""
    if line.recovery is not None:
        return None
    s = (entry_stake(line) + bought_stake(line)) / (1 - line.cancel) * (1 - line.dilution)
    return ratio(s + follow_stake(line), 3)


def shown_entry(line: Line) -> float:
    """Detention d'entree affichee : le premier cheque, ou le bloc rachete en Growth."""
    return entry_stake(line) if line.first else bought_stake(line)


def exit_value(line: Line, case: Case) -> float:
    v = line.exit_value * case.exit_mult
    return v if case.exit_cap is None else min(v, case.exit_cap)


def equity_proceeds(line: Line, case: Case) -> int:
    """Part a la sortie, plancher de la preference 1x non participante du premier cheque."""
    if line.recovery is not None:
        return money(Decimal(str(line.recovery)) * equity_cost(line))
    v = exit_value(line, case)
    return money(max(exit_stake(line) * v, min(line.first, v)))


def proceeds(line: Line, case: Case) -> int:
    return equity_proceeds(line, case)


def secondary_split(line: Line, case: Case):
    """(cession annee 6, solde a la sortie, cout cede en annee 6) des fonds propres."""
    eq = equity_proceeds(line, case)
    if line.partial and line.exit_year > SECONDARY["year"] and eq:
        sec = money(SECONDARY["share"] * SECONDARY["price_pct"] * eq)
        rest = money((1 - SECONDARY["share"]) * eq)
        return sec, rest, SECONDARY["share"] * equity_cost(line)
    return 0, eq, 0.0


def irr(flows: list[float]) -> float:
    """Dichotomie sur la VAN ; exige un changement de signe sur l'intervalle."""
    def npv(r):
        return sum(c / (1 + r) ** t for t, c in enumerate(flows))
    lo, hi = -0.9, 10.0
    if npv(lo) * npv(hi) > 0:
        raise SystemExit("ERREUR : TRI introuvable (pas de changement de signe)")
    for _ in range(400):
        mid = (lo + hi) / 2
        if npv(lo) * npv(mid) <= 0:
            hi = mid
        else:
            lo = mid
    assert abs(npv(mid)) < 1, "TRI : la dichotomie n'a pas converge"
    return mid


def waterfall(calls: list[float], dist: list[float]):
    """Cascade europeenne sur tout le fonds, flux annuels en fin d'annee :
    1) capital appele, 2) rendement prioritaire de 8 % compose,
    3) rattrapage du GP a 100 % jusqu'a 20 % du profit, 4) 80 / 20."""
    carry, hurdle = TERMS["carry_pct"], TERMS["hurdle_pct"]
    hurdle_bal = contrib = paid_out = gp_cum = 0.0
    lp, gp = [0.0] * len(calls), [0.0] * len(calls)
    for t in range(len(calls)):
        hurdle_bal = hurdle_bal * (1 + hurdle) + calls[t]
        contrib += calls[t]
        d = dist[t]
        a = min(d, hurdle_bal)
        hurdle_bal -= a
        d -= a
        lp[t] += a
        paid_out += a
        if d > 0:
            need = (carry * (paid_out - contrib) - gp_cum) / (1 - carry)
            x = min(d, max(0.0, need)) * TERMS["catch_up_pct"]
            gp[t] += x
            gp_cum += x
            paid_out += x
            d -= x
            if d > 0:
                lp[t] += (1 - carry) * d
                gp[t] += carry * d
                gp_cum += carry * d
                paid_out += d
    clawback = max(0.0, gp_cum - carry * max(0.0, paid_out - contrib))
    return lp, gp, clawback


def run_case(case: Case, lines=LINES) -> dict:
    horizon = max(x.exit_year for x in lines)
    years = FUND["term_years"] + 1          # index 0 inutilise : annee 1 = index 1
    inv = [0.0] * years
    dist = [0.0] * years
    cost_out = [0.0] * years
    gross = 0
    for x in lines:
        inv[x.entry_year] += x.first
        if x.buyback:
            inv[x.buyback_year] += x.buyback
        if x.follow:
            inv[x.follow_year] += x.follow
        gross += proceeds(x, case)
        sec, rest, sec_cost = secondary_split(x, case)
        dist[SECONDARY["year"]] += sec
        dist[x.exit_year] += rest
        cost_out[SECONDARY["year"]] += sec_cost
        cost_out[x.exit_year] += equity_cost(x) - sec_cost

    mgmt = [0.0] * years
    expenses = [0.0] * years
    nic = 0.0
    for t in range(1, years):
        nic_start = nic
        nic += inv[t] - cost_out[t]
        if t > horizon:
            continue
        if t <= FUND["investment_period_years"]:
            mgmt[t] = TERMS["fee_ip_pct"] * FUND["commitments"]
        else:
            mgmt[t] = TERMS["fee_post_pct"] * max(nic_start, 0.0)
        expenses[t] = TERMS["running_cost"] + (TERMS["setup_cost"] if t == 1 else 0)
    # Le fonds vit 10 ans : les frais de fonctionnement des annees apres la
    # derniere sortie sont mis de cote sur la derniere distribution (pas d'appel
    # apres la derniere sortie, donc pas de clawback artificiel).
    tail = TERMS["running_cost"] * max(0, FUND["term_years"] - horizon)
    realised_raw = sum(dist)
    dist[horizon] -= tail

    calls = [inv[t] + mgmt[t] + expenses[t] for t in range(years)]
    lp, gp, clawback = waterfall(calls, dist)
    paid_in = sum(calls)
    lp_total, gp_total = sum(lp), sum(gp)
    assert abs(lp_total + gp_total - sum(dist)) < 1, "cascade : LP + GP != distribuable"
    assert gp_total <= TERMS["carry_pct"] * max(0.0, sum(dist) - paid_in) + 1, "carried > 20 % du profit"
    assert clawback < 1, f"clawback inattendu : {clawback:.0f}"

    net = [lp[t] - calls[t] for t in range(1, years)]
    gross_flows = [dist[t] + (tail if t == horizon else 0) - inv[t] for t in range(1, years)]

    def dpi(year):
        return ratio(sum(lp[1:year + 1]) / sum(calls[1:year + 1]), 1)

    realised = money(realised_raw)
    return {
        "exit_mult": case.exit_mult,
        "exit_cap": case.exit_cap,
        "gross_proceeds": gross,
        "gross_moic": ratio(gross / sum(invested(x) for x in lines), 1),
        "realised": realised,
        "secondary_discount": gross - realised,
        "paid_in": money(paid_in),
        "mgmt_fees": money(sum(mgmt)),
        "fund_expenses": money(sum(expenses) + tail),
        "lp_distributions": money(lp_total),
        "carry": money(gp_total),
        "net_tvpi": ratio(lp_total / paid_in, 1),
        "net_irr": ratio(irr(net), 2),
        "gross_irr": ratio(irr(gross_flows), 2),
        "dpi_year6": dpi(6),
        "dpi_year7": dpi(7),
        "largest_exit": money(max(exit_value(x, case) for x in lines if x.exit_value)),
        "horizon_years": horizon,
        "cashflows": {
            "investments": [money(v) for v in inv[1:]],
            "calls": [money(c) for c in calls[1:]],
            "distributions": [money(d) for d in dist[1:]],
            "lp": [money(v) for v in lp[1:]],
            "gp": [money(v) for v in gp[1:]],
        },
    }


def layer_gross_irr(layer: str, case: Case) -> float:
    """TRI brut d'un etage : investissements et sorties (secondaire compris)."""
    flows = [0.0] * (FUND["term_years"] + 1)
    for x in (y for y in LINES if y.layer == layer):
        flows[x.entry_year] -= x.first
        if x.buyback:
            flows[x.buyback_year] -= x.buyback
        if x.follow:
            flows[x.follow_year] -= x.follow
        sec, rest, _ = secondary_split(x, case)
        flows[SECONDARY["year"]] += sec
        flows[x.exit_year] += rest
    return ratio(irr(flows[1:]), 2)


# ── la loi 04 chiffree ───────────────────────────────────────────────────────
def fund_returning_exit(company: str) -> dict:
    """La valeur de sortie a laquelle `company` (toutes ses lignes, cas cible, a la
    valeur de sortie) rend a elle seule les engagements du fonds."""
    lines = [x for x in LINES if x.company == company]
    target = CASES[0]

    def got(v):
        return sum(proceeds(replace(x, exit_value=v), target) for x in lines if x.exit_value)
    lo, hi = 1.0, 100_000 * M
    for _ in range(200):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if got(mid) < FUND["commitments"] else (lo, mid)
    return {
        "stake_at_exit": ratio(sum(exit_stake(x) for x in lines if x.exit_value), 3),
        # arrondi au multiple de 5 M EUR superieur : le chiffre publie est atteint
        "fund_returning_exit": int(-(-hi // (5 * M))) * 5 * M,
    }


# ── tests de resistance (cas cible, une hypothese a la fois) ────────────────
def _shift(lines, years: int):
    """Chaque sortie decalee, au plus tard en annee 10."""
    cap = FUND["term_years"]
    return tuple(replace(x, exit_year=min(x.exit_year + years, cap)) for x in lines)


def _zombie_best(lines):
    best = "S-01"
    out = []
    for x in lines:
        if x.company == best:
            x = replace(x, exit_value=None, recovery=0.5, partial=False)
        out.append(x)
    return tuple(out)


def _unicorn(lines, value=1000 * M, company="S-01"):
    return tuple(replace(x, exit_value=value) if x.company == company else x for x in lines)


def _dilute(lines, keep, company="S-01"):
    """La societe vend de l'equity : chaque ligne ne garde que `keep` de sa part de sortie."""
    return tuple(replace(x, dilution=ratio(1 - (1 - x.dilution) * keep, 4)) if x.company == company else x
                 for x in lines)


def stress_tests() -> list[dict]:
    # 07/11 : la cible PRÉSENTÉE est le cas prudent (« base » : chaque sortie à 60 % de sa valeur
    # modélisée, 2,8x) ; le cas modélisé (« target », 4,4x) est présenté comme l'upside. Les tests de
    # résistance tournent sur la cible présentée. Les clés internes restent target / base / stress.
    target = CASES[1]
    # 07/11 : la cible suppose que la licorne grandit sur le credit (v3.17 : celui des banques
    # partenaires, le fonds ne prete plus). Si elle vend aussi de
    # l'equity, comme sur les chemins du tableau des fondateurs : voici ce qu'il reste au fonds.
    fm = founder_math()
    path = {p["id"]: p for p in fm["paths"]}
    equity = lambda k: f"\u20ac{path[k]['equity'] / M:.0f}M"
    rows = [
        ("exits_plus_1", "Every exit one year later", _shift(LINES, 1), target),
        ("best_zombie", "No unicorn: S-01 (both lines) becomes a zombie", _zombie_best(LINES), target),
        ("unicorn_half", f"The unicorn also sells {equity('half')} of equity",
         _dilute(LINES, path["half"]["stake"] / fm["founders"]), target),
        ("unicorn_same", f"The unicorn also sells {equity('same')} of equity",
         _dilute(LINES, path["same"]["stake"] / fm["founders"]), target),
        ("two_unicorns", "Two unicorns: V-01 also modelled at €1B", _unicorn(LINES, 1000 * M, "V-01"), target),
        ("big_unicorn", "A bigger unicorn: S-01 modelled at €2B", _unicorn(LINES, 2000 * M), target),
    ]
    out = []
    for key, label, lines, case in rows:
        r = run_case(case, lines)
        out.append({"id": key, "label": label, "net_tvpi": r["net_tvpi"], "net_irr": r["net_irr"],
                    "dpi_year7": r["dpi_year7"]})
    return out


# ── le tableau des fondateurs ───────────────────────────────────────────────
def _payout(value: float, holders: list[dict]) -> dict:
    """Preferences 1x non participantes pari passu ; chaque porteur de preference
    convertit si c'est plus avantageux (equilibre trouve par basculements)."""
    def alloc(conv):
        out = {}
        prefs = [h for h in holders if h["pref"] and h["id"] not in conv]
        total = sum(h["pref"] for h in prefs)
        paid = min(value, total)
        for h in prefs:
            out[h["id"]] = paid * h["pref"] / total
        rest = value - paid
        common = [h for h in holders if not h["pref"] or h["id"] in conv]
        shares = sum(h["stake"] for h in common)
        for h in common:
            out[h["id"]] = rest * h["stake"] / shares if shares else 0.0
        return out
    conv: set = set()
    for _ in range(4 * len(holders) + 4):
        now = alloc(conv)
        for h in holders:
            if not h["pref"]:
                continue
            alt = conv ^ {h["id"]}
            if alloc(alt)[h["id"]] > now[h["id"]] + 1e-6:
                conv = alt
                break
        else:
            return now
    raise SystemExit("ERREUR : tableau fondateurs, pas d'equilibre de conversion")


def _founder_cap_table(fm: dict, plan: list) -> tuple[list[dict], list[float]]:
    """Une cap table apres les tours. `plan`, par tour : None (pas de tour) ou la part en prets.
    La part en prets reduit le tour au meme pre-money : equity / (post - pret). MEME CALCUL que
    founderPaths() dans src/lib/founderMath.js (scripts/prerender.mjs verifie l'egalite)."""
    hs = [{"id": "founders", "stake": fm["founders"], "pref": 0}] + [dict(h) for h in fm["holders"]]
    stakes = []
    for r, loan in zip(fm["vc_rounds"], plan):
        if loan is not None:
            pool = r.get("pool", 0.0)      # recharge du pool, avant l'argent frais
            for h in hs:
                h["stake"] *= 1 - pool
            next(h for h in hs if h["id"] == "pool")["stake"] += pool
            equity = r["amount"] - loan
            k = equity / (r["post"] - loan)
            for h in hs:
                h["stake"] *= 1 - k
            hs.append({"id": r["id"], "stake": k, "pref": equity})
        stakes.append(hs[0]["stake"])
    return hs, stakes


def founder_math() -> dict:
    fm = FOUNDER_MATH
    rounds = fm["vc_rounds"]
    last_priced = max(i for i, r in enumerate(rounds) if not r.get("bridge"))
    plans = {
        "vc": ([0] * len(rounds), 0),
        "same": ([r.get("loan", 0) for r in rounds], 0),
        "half": ([None if r.get("bridge") or i == last_priced else 0 for i, r in enumerate(rounds)], fm["loans"]),
        "credit": ([None] * len(rounds), fm["loans"]),
    }
    a_cost = next(h["pref"] for h in fm["holders"] if h["id"] == "series_a")
    tables, paths = {}, []
    for key, label in FOUNDER_PATHS:
        plan, extra = plans[key]
        hs, stakes = _founder_cap_table(fm, plan)
        lent = extra + sum(x for x in plan if x)
        equity = sum(r["amount"] - x for r, x in zip(rounds, plan) if x is not None)
        tables[key] = (hs, lent)
        paths.append({"id": key, "label": label, "equity": equity, "loans": lent, "capital": equity + lent,
                      "stake": ratio(stakes[-1], 3), "stakes": [ratio(x, 3) for x in stakes]})
    rows = []
    for v in fm["exits"]:
        row = {"exit": v}
        for key, _label in FOUNDER_PATHS:
            hs, lent = tables[key]
            out = _payout(max(0.0, v - lent * fm["loan_multiple"]), hs)
            row[f"founders_{key}"] = millions(out["founders"])
            row[f"series_a_{key}"] = ratio(out["series_a"] / a_cost, 1)
        rows.append(row)
    # la part du dernier tour que chaque tranche de pret represente (dite sur le site et la fiche)
    prev = a_cost
    shares = []
    for r in rounds:
        if r.get("loan"):
            shares.append(r["loan"] / prev)
        if not r.get("bridge"):
            prev = r["amount"]
    vc_hs = tables["vc"][0]
    return {
        **{k: v for k, v in fm.items()},
        "vc_equity": sum(r["amount"] for r in rounds),
        "raised_before": sum(h["pref"] for h in fm["holders"]),
        "founders_after_vc": ratio(vc_hs[0]["stake"], 3),
        "vc_stakes": [{"round": r["id"], "label": r.get("label", f"Series {r['id']}"), "bridge": bool(r.get("bridge")),
                       "founders": x} for r, x in zip(rounds, paths[0]["stakes"])],
        "paths": paths,
        "loan_debt": fm["loans"] * fm["loan_multiple"],
        "loan_share": {"min": ratio(min(shares), 2), "max": ratio(max(shares), 2)},
        "rows": rows,
    }


# ── controles ───────────────────────────────────────────────────────────────
class Checks:
    def __init__(self):
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def need(self, ok: bool, msg: str):
        if not ok:
            self.errors.append(msg)

    def warn(self, ok: bool, msg: str):
        if not ok:
            self.warnings.append(msg)


def self_test():
    """Cas jouets calcules a la main."""
    r = irr([-100, 0, 0, 0, 0, 200])
    assert abs(r - (2 ** 0.2 - 1)) < 1e-9, "auto-test TRI"
    lp, gp, claw = waterfall([100, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 200])
    assert abs(sum(gp) - 20) < 1e-6 and abs(sum(lp) - 180) < 1e-6 and claw < 1e-9, "auto-test cascade"
    two = [{"id": "a", "stake": 0.5, "pref": 0}, {"id": "b", "stake": 0.5, "pref": 60}]
    assert abs(_payout(100, two)["b"] - 60) < 1e-9 and abs(_payout(200, two)["b"] - 100) < 1e-9, \
        "auto-test preferences"


def exposures() -> dict[str, float]:
    out: dict[str, float] = {}
    for x in LINES:
        out[x.company] = out.get(x.company, 0.0) + invested(x) / x.n
    return out


def validate(data: dict) -> Checks:
    c = Checks()
    commitments = FUND["commitments"]
    cap = FUND["company_cap_pct"] * commitments
    ip = FUND["investment_period_years"]
    term = FUND["term_years"]
    alloc = data["allocation"]
    c.need(alloc["contingency"] >= 0,
           f"allocation : investi + frais > engagements ({alloc['contingency']})")
    for name, case in data["cases"].items():
        c.need(case["paid_in"] <= commitments, f"{name} : appele {case['paid_in']} > engagements")
    # 07/11 : les prets du tableau des fondateurs restent dans la taille de marche, la meme levee
    # reste la meme levee, et la moitie du capital reste la moitie.
    _fm = founder_math()
    _path = {x["id"]: x for x in _fm["paths"]}
    c.need(sum(r.get("loan", 0) for r in _fm["vc_rounds"]) == _fm["loans"], "fondateurs : tranches de prets != loans")
    c.need(_path["same"]["capital"] == _path["vc"]["capital"], "fondateurs : le meme capital ne leve plus la meme somme")
    c.need(_path["half"]["capital"] <= _path["vc"]["capital"] / 2, "fondateurs : la moitie du capital depasse la moitie")
    _prev_amount = next(h["pref"] for h in _fm["holders"] if h["id"] == "series_a")
    _prev_post = _prev_amount / next(h["stake"] for h in _fm["holders"] if h["id"] == "series_a")
    for _r in _fm["vc_rounds"]:
        if _r.get("loan"):
            c.need(0.20 <= _r["loan"] / _prev_amount <= 0.40, f"fondateurs : pret {_r['id']} hors de 20-40 % du dernier tour")
            c.need(_r["loan"] / _prev_post <= 0.08, f"fondateurs : pret {_r['id']} au-dessus de 8 % de la valorisation")
        if not _r.get("bridge"):
            _prev_amount, _prev_post = _r["amount"], _r["post"]
    for x in LINES:
        b = BOUNDS[x.layer]
        first_ticket = (x.first or x.buyback) / x.n
        if x.kind == "new":
            lo, hi = b["ticket"]
            c.need(lo <= first_ticket <= hi, f"{x.id} : ticket {first_ticket:.0f} hors bornes {lo}-{hi}")
            own = shown_entry(x)
            c.need(b["own"][0] <= own <= b["own"][1] + 1e-9, f"{x.id} : detention d'entree {own:.3f}")
        lo, hi = b["post"]
        c.need(lo <= x.entry_post <= hi, f"{x.id} : valorisation d'entree {x.entry_post} hors bornes")
        # le calendrier : entrees, rachats et suivis pendant la periode d'investissement
        c.need(1 <= x.entry_year <= ip and x.entry_year < x.exit_year <= term, f"{x.id} : annees")
        if x.buyback:
            c.need(x.buyback_year is not None and x.entry_year <= x.buyback_year <= ip
                   and x.buyback_value, f"{x.id} : rachat")
        if x.follow:
            c.need(x.follow_year is not None and x.entry_year <= x.follow_year <= ip
                   and x.follow_post, f"{x.id} : suivi")
        # LE PACTE : apres le premier cheque, aucune action nouvelle tant que le fondateur
        # grandit avec nous ; un suivi en actions nouvelles suppose qu'il a leve ailleurs.
        c.need(not x.follow or x.dilution > 0, f"{x.id} : actions nouvelles sans tour exterieur")
        c.need(not x.dilution or x.follow, f"{x.id} : tour exterieur sans suivi de ProFund")
        # la detention monte a chaque ligne ou le fondateur grandit avec nous
        st = exit_stake(x)
        if st is not None and not x.dilution:
            c.need(st >= shown_entry(x), f"{x.id} : detention de sortie {st} < entree")
        c.need((x.exit_value is None) != (x.recovery is None), f"{x.id} : sortie ambigue")
        c.need(x.exit_value is None or x.n == 1, f"{x.id} : sortie sur une ligne groupee")
        c.need(not x.partial, f"{x.id} : vente secondaire partielle, retiree du pacte (v3.8)")
        c.need(not x.partial or (x.exit_value and x.exit_year > SECONDARY["year"]),
               f"{x.id} : liquidite partielle sans sortie apres l'annee {SECONDARY['year']}")
        # par societe : une ligne groupee peut porter 2,25 M EUR (3 x 750 K)
        for v in (x.first, x.buyback, x.follow):
            c.need(on_grain(v / x.n), f"{x.id} : {v / x.n:.0f} par societe, hors maille d'affichage")
        c.need(on_grain(x.entry_post), f"{x.id} : valorisation {x.entry_post} hors maille d'affichage")
        c.need(x.id.isascii(), f"{x.id} : identifiant non ASCII")
        c.need(x.tone in ("green", "blue", "grey", "red"), f"{x.id} : ton {x.tone}")
        if x.layer == "seed":
            track = SEED_TRACKS.get(x.track)
            c.need(track is not None, f"{x.id} : voie Seed inconnue ({x.track})")
            if track:
                lo, hi = track["ticket"]
                c.need(lo <= x.first / x.n <= hi,
                       f"{x.id} : ticket {x.first / x.n:.0f} hors bornes {x.track} {lo}-{hi}")
        else:
            c.need(x.track is None, f"{x.id} : voie reservee au Seed")
    # voies Seed : comptes, puis leads d'abord et numerotation continue
    tracks = data["layers"]["seed"]["tracks"]
    nxt = 1
    for name, spec in SEED_TRACKS.items():
        c.need(tracks[name]["companies"] == spec["companies"], f"seed {name} : {tracks[name]['companies']} societes")
        for x in (y for y in LINES if y.track == name):
            c.need(int(x.id.split("-")[1]) == nxt, f"{x.id} : numerotation Seed discontinue")
            nxt += x.n
    # meme societe -> meme sortie
    seen: dict[str, tuple] = {}
    for x in LINES:
        if x.exit_value is None:
            continue
        key = (x.exit_year, x.exit_value)
        c.need(seen.setdefault(x.company, key) == key, f"{x.company} : sorties incoherentes")
    for company, total in exposures().items():
        c.need(total <= cap + 1, f"{company} : exposition {total:.0f} > plafond {cap:.0f}")
    for layer in LAYERS:
        x = data["layers"][layer]
        c.need(x["companies"] == BOUNDS[layer]["companies"], f"{layer} : {x['companies']} societes")
        for key in ("first", "buyback", "follow", "invested"):
            c.need(on_grain(x[key]), f"{layer} : {key} {x[key]} hors maille d'affichage")
    # les chiffres publies le 05/11 (fiche v3, /pitch, tableau des fondateurs)
    for name, want in PUBLISHED.items():
        for key, v in want.items():
            got = data["cases"][name][key]
            c.need(got == v, f"{name} : {key} {got} != valeur publiee {v}")
    for i, row in enumerate(data["founder_math"]["rows"]):
        for key, vals in PUBLISHED_FOUNDER_MATH.items():
            c.need(row[key] == vals[i], f"fondateurs, sortie {row['exit']}: {key} {row[key]} != {vals[i]}")
    text = json.dumps(data, ensure_ascii=True, allow_nan=False)
    c.need(text.isascii(), "JSON non ASCII")
    return c


# ── assemblage ──────────────────────────────────────────────────────────────
def last_id(line: Line) -> str:
    """Identifiant de la derniere societe d'une ligne : S-19 + 12 societes -> S-30."""
    prefix, num = line.id.split("-")
    return f"{prefix}-{int(num) + line.n - 1:0{len(num)}d}"


def line_json(x: Line) -> dict:
    target = CASES[0]
    return {
        "id": x.id,
        "last": last_id(x),
        "company": x.company,
        "n": x.n,
        "status": x.status,
        "tone": x.tone,
        "kind": x.kind,
        "track": x.track,
        "first": x.first,
        "buyback": x.buyback,
        "follow": x.follow,
        "invested": invested(x),
        "entry_post": x.entry_post,
        "entry_pct": shown_entry(x),
        "exit_pct": exit_stake(x),
        "exit_value": x.exit_value,
        "recovery": x.recovery,
        "partial": x.partial,
        "proceeds": proceeds(x, target),
        "moic": ratio(proceeds(x, target) / invested(x), 1),
        "entry_year": x.entry_year,
        "exit_year": x.exit_year,
        "buyback_year": x.buyback_year,
        "buyback_value": x.buyback_value,
        "discount": x.discount,
        "cancel": x.cancel,
        "dilution": x.dilution,
        "follow_year": x.follow_year,
        "follow_post": x.follow_post,
    }


def seed_tracks() -> dict:
    out = {}
    for name, spec in SEED_TRACKS.items():
        lines = [x for x in LINES if x.track == name]
        inv = sum(invested(x) for x in lines)
        got = sum(proceeds(x, CASES[0]) for x in lines)
        out[name] = {
            "companies": sum(x.n for x in lines),
            "ticket_min": spec["ticket"][0], "ticket_max": spec["ticket"][1],
            "first": lines[0].id, "last": last_id(lines[-1]),
            "invested": inv, "proceeds": got, "moic": ratio(got / inv, 1),
        }
    return out


def per_company(lines, attr) -> tuple[int, int]:
    vals = [attr(x) / x.n for x in lines]
    return int(min(vals)), int(max(vals))


def build() -> dict:
    self_test()
    cases = {c.id: run_case(c) for c in CASES}
    layers = {}
    for layer in LAYERS:
        lines = [x for x in LINES if x.layer == layer]
        b = BOUNDS[layer]
        new = [x for x in lines if x.kind == "new"]
        first_lines = [x for x in new if x.first]
        entry = {
            "model_name": MODEL_NAMES[layer],
            "stage": b["stage"],
            "ticket_min": b["ticket"][0], "ticket_max": b["ticket"][1],
            "entry_post_min": b["post"][0], "entry_post_max": b["post"][1],
            "ownership_min": b["own"][0], "ownership_max": b["own"][1],
            "companies": sum(x.n for x in new),
            "breakouts": sum(x.n for x in lines if x.kind == "breakout"),
            "positions": len(lines),
            "first": sum(x.first for x in lines),
            "buyback": sum(x.buyback for x in lines),
            "follow": sum(x.follow for x in lines),
            "invested": sum(invested(x) for x in lines),
            "first_cheque_range": list(per_company(first_lines, lambda y: y.first)),
            "position_range": list(per_company(lines, invested)),
            "entry_years": [min(x.entry_year for x in lines), max(x.entry_year for x in lines)],
            "proceeds": {}, "moic": {}, "gross_irr": {},
            "lines": [line_json(x) for x in lines],
        }
        if layer == "seed":
            entry["tracks"] = seed_tracks()
        for case in CASES:
            got = sum(proceeds(x, case) for x in lines)
            entry["proceeds"][case.id] = got
            entry["moic"][case.id] = ratio(got / entry["invested"], 1)
            entry["gross_irr"][case.id] = layer_gross_irr(layer, case)
        layers[layer] = entry

    target = cases["target"]
    invested_total = sum(layers[x]["invested"] for x in LAYERS)
    first_total = sum(layers[x]["first"] for x in LAYERS)
    buy_follow = sum(layers[x]["buyback"] + layers[x]["follow"] for x in LAYERS)
    contingency = FUND["commitments"] - invested_total - target["mgmt_fees"] - target["fund_expenses"]

    expo = exposures()
    spv = [{"company": k, "fund": money(expo[k]),
            "spv": money(FUND["company_max_with_spv"] - expo[k])} for k in SPV_COMPANIES]
    by_company: dict[str, int] = {}
    for x in LINES:
        by_company[x.company] = by_company.get(x.company, 0) + proceeds(x, CASES[0])
    best = max(by_company.items(), key=lambda kv: kv[1])
    returner = fund_returning_exit(best[0])
    lines_partial = [x.id for x in LINES if x.partial]

    return {
        "schema": 3,
        "version": VERSION,
        "model_date": MODEL_DATE,
        "fund": {**FUND, "company_cap": money(FUND["company_cap_pct"] * FUND["commitments"]),
                 "companies": sum(layers[x]["companies"] for x in LAYERS),
                 "positions": len(LINES)},
        "terms": {**TERMS, "gp_commit_min": money(TERMS["gp_commit_min_pct"] * FUND["commitments"])},
        "secondary": {**SECONDARY, "lines": lines_partial},
        "buyback_discount": BUYBACK_DISCOUNT,
        "layers": layers,
        "allocation": {
            "seed": layers["seed"]["invested"],
            "venture": layers["venture"]["invested"],
            "growth": layers["growth"]["invested"],
            "invested": invested_total,
            "first": first_total,
            "buyback_follow": buy_follow,
            "after_first_pct": ratio((invested_total - first_total) / invested_total, 2),
            "mgmt_fees": target["mgmt_fees"],
            "fund_expenses": target["fund_expenses"],
            "contingency": money(contingency),
            "total": FUND["commitments"],
        },
        "spv": spv,
        "spv_total": sum(x["spv"] for x in spv),
        "fund_returner": {"company": best[0], "proceeds": best[1],
                          "multiple_of_fund": ratio(best[1] / FUND["commitments"], 1),
                          **returner},
        "cases": cases,
        "stress_tests": stress_tests(),
        "founder_math": founder_math(),
        "reference_v2": REFERENCE_V2,
    }


def render(data: dict) -> str:
    return json.dumps(data, indent=2, ensure_ascii=True, allow_nan=False) + "\n"


def summary(data: dict) -> str:
    out = [f"ProFund {data['version']} - model {data['model_date']} - "
           f"commitments EUR {data['fund']['commitments'] / M:.0f}M"]
    for layer in LAYERS:
        x = data["layers"][layer]
        out.append(f"  {layer:8s} {x['companies']:2d} cos {x['positions']:2d} pos  first {x['first'] / M:5.1f}  "
                   f"buyback {x['buyback'] / M:4.1f}  follow {x['follow'] / M:3.1f}  "
                   f"invested {x['invested'] / M:5.1f} -> target {x['proceeds']['target'] / M:6.1f} "
                   f"({x['moic']['target']}x, gross IRR {x['gross_irr']['target']:.0%})  "
                   f"base {x['moic']['base']}x  stress {x['moic']['stress']}x")
    a = data["allocation"]
    out.append(f"  invested {a['invested'] / M:.1f} (first {a['first'] / M:.1f} + buybacks/follow-ons "
               f"{a['buyback_follow'] / M:.1f}) + fees {a['mgmt_fees'] / M:.1f} "
               f"+ expenses {a['fund_expenses'] / M:.1f} + contingency {a['contingency'] / M:.1f} = {a['total'] / M:.1f}")
    for name, case in data["cases"].items():
        out.append(f"  {name:7s} gross {case['gross_proceeds'] / M:6.1f}  realised {case['realised'] / M:6.1f}  "
                   f"paid-in {case['paid_in'] / M:5.1f}  carry {case['carry'] / M:5.1f}  "
                   f"TVPI {case['net_tvpi']:.1f}x  IRR {case['net_irr']:.0%}  gross IRR {case['gross_irr']:.0%}  "
                   f"DPI y6 {case['dpi_year6']:.1f}x y7 {case['dpi_year7']:.1f}x")
    for s in data["stress_tests"]:
        out.append(f"    stress {s['id']:13s} {s['net_tvpi']:.1f}x {s['net_irr']:.0%}")
    for r in data["founder_math"]["rows"]:
        out.append(f"    founders @ {r['exit'] / M:4.0f}M: VC {r['founders_vc'] / M:5.1f}  same {r['founders_same'] / M:5.1f}  "
                   f"half {r['founders_half'] / M:5.1f}  credit {r['founders_credit'] / M:5.1f}  "
                   f"Series A {r['series_a_vc']}x {r['series_a_same']}x {r['series_a_half']}x {r['series_a_credit']}x")
    fr = data["fund_returner"]
    out.append(f"  fund returner {fr['company']} -> {fr['proceeds'] / M:.1f} ({fr['multiple_of_fund']}x the fund);"
               f" SPV top-ups (outside the fund): EUR {data['spv_total'] / M:.1f}M")
    return "\n".join(out)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="code 1 si fund.json n'est plus a jour")
    parser.add_argument("--dry", action="store_true", help="n'ecrit rien")
    args = parser.parse_args()

    data = build()
    checks = validate(data)
    for w in checks.warnings:
        print(f"warning: {w}")
    print(summary(data))
    if checks.errors:
        for e in checks.errors:
            print(f"ERROR: {e}")
        return 1
    text = render(data)
    if args.check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != text:
            print(f"ERROR: {OUT.relative_to(ROOT)} is stale, run python scripts/fund_model.py")
            return 1
        print(f"ok: {OUT.relative_to(ROOT)} is up to date")
        return 0
    if not args.dry:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(text, encoding="utf-8", newline="\n")
        print(f"fund_model: {OUT.relative_to(ROOT)} written ({len(text)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
