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
Ce modele reproduit a l'euro pres le classeur v3.3 livre le 05/11 (onglet
Checks, 267 valeurs) ; scripts/fund_xlsx.py le regenere en formules vivantes.

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

VERSION = "v3.3"
MODEL_DATE = "2026-11-05"   # fixe : --check doit rester stable d'un jour a l'autre

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
    "loan_cap_pct": 0.30,            # EuVECA : prets aux seules societes du portefeuille
    "first_close_min": 20 * M,       # premier closing vise (deck /pitch, 05/11)
    "first_close_max": 30 * M,
}
TERMS = {
    "fee_ip_pct": 0.02,              # sur les engagements hors poche de prets, periode d'investissement
    "fee_loan_pct": 0.01,            # sur la poche de prets deployee, periode d'investissement
    "fee_post_pct": 0.015,           # ensuite, sur le capital investi encore detenu, prets compris
    "fee_first_close_pct": 0.0175,   # LPs du premier closing ; le modele garde le taux standard (prudent)
    "setup_cost": 400_000,           # A CONFIRMER : devis du gestionnaire EuVECA
    "running_cost": 350_000,         # par an, sur toute la duree du fonds, idem
    "carry_pct": 0.20,
    "hurdle_pct": 0.08,              # compose annuellement, cascade europeenne (tout le fonds)
    "catch_up_pct": 1.0,
    "gp_commit_min_pct": 0.01,
}
# Clause 9 du pacte : a partir de l'annee 6, la societe peut racheter jusqu'a un
# quart de notre ligne, avec decote, et l'annuler. Lignes marquees `partial`.
SECONDARY = {"share": 0.25, "year": 6, "price_pct": 0.60}
# Rachats de titres existants : decote par defaut sur la valorisation du moment
# (chaque ligne peut fixer la sienne : 5-10 % sur les gagnants et angels, 30 %
# sur les vendeurs structurels, fonds en fin de vie).
BUYBACK_DISCOUNT = 0.20
# Multiples de remboursement de reference (chaque ligne porte le sien).
LOAN_MULTIPLES = {"performing": 1.4, "zombie": 0.8, "loss": 0.2}


@dataclass(frozen=True)
class Case:
    id: str
    exit_mult: float        # part de chaque valeur de sortie conservee
    exit_cap: int | None    # plafond optionnel sur chaque valeur de sortie
    loan_repaid: float      # part du remboursement modelise de chaque pret effectivement recue


# Un seul portefeuille dans chaque cas : Base et Stress multiplient chaque
# valeur de sortie et perdent davantage sur les prets.
CASES = (
    Case("target", 1.0, None, 0.95),
    Case("base", 0.6, None, 0.85),
    Case("stress", 0.4, None, 0.65),
)
CASE_IDS = tuple(c.id for c in CASES)

LAYERS = ("seed", "venture", "growth")
# Noms des etages dans le classeur (onglets Lines, Construction) : la fiche le dit.
MODEL_NAMES = {"seed": "Ignite", "venture": "Relute", "growth": "Compound"}
# Seed en haltere : 10 leads de conviction portent la propriete, 20 tickets
# radar multiplient les tirages. La v3 n'a plus besoin d'une licorne (plus
# aucune sortie au-dessus de 300 M EUR) : 30 societes au lieu de 50.
SEED_TRACKS = {
    "lead": {"ticket": (500_000, 1_500_000), "companies": 10},
    "radar": {"ticket": (100_000, 150_000), "companies": 20},
}
# Bornes de construction. Premier ticket = premier cheque, ou rachat en Growth.
BOUNDS = {
    "seed": {"ticket": (100_000, 1_500_000), "post": (5 * M, 20 * M),
             "own": (0.01, 0.20), "companies": 30, "stage": "Pre-seed / seed"},
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
    loan: int = 0                     # pret, total de ligne
    loan_year: int | None = None
    loan_repay_year: int | None = None
    loan_mult: float | None = None
    exit_value: int | None = None     # valorisation de sortie (100 %), avant multiplicateur du cas
    recovery: float | None = None     # sinon : multiple recupere sur les fonds propres investis
    partial: bool = False             # liquidite partielle en annee 6 (clause 9)
    track: str | None = None          # Seed seulement : "lead" ou "radar"


L = Line
LINES = (
    # Seed (Ignite) : 30 societes, pre-seed / seed, entrees annees 1-3.
    # S-01 a S-10 : leads de conviction ; S-11 a S-30 : tickets radar.
    L("S-01", "seed", "S-01", 1, "Breakout, raised elsewhere once, we followed", "green", "new",
      1_500_000, 7_500_000, 1, 9, buyback=1_500_000, buyback_year=3, buyback_value=40 * M,
      discount=0.10, cancel=0.08, dilution=0.15, follow=1 * M, follow_year=4, follow_post=80 * M,
      loan=1 * M, loan_year=3, loan_repay_year=5, loan_mult=1.4, exit_value=300 * M,
      partial=True, track="lead"),
    L("S-02", "seed", "S-02", 1, "Breakout", "green", "new",
      1 * M, 6 * M, 1, 8, buyback=1 * M, buyback_year=3, buyback_value=25 * M, discount=0.10,
      loan=500_000, loan_year=3, loan_repay_year=5, loan_mult=1.4, exit_value=150 * M,
      partial=True, track="lead"),
    L("S-03", "seed", "S-03", 1, "Strategic exit, angels bought back", "blue", "new",
      1 * M, 7 * M, 2, 7, buyback=500_000, buyback_year=4, buyback_value=20 * M, discount=0.10,
      loan=500_000, loan_year=3, loan_repay_year=5, loan_mult=1.4, exit_value=80 * M,
      track="lead"),
    L("S-04", "seed", "S-04", 1, "Early exit (M&A)", "blue", "new",
      750_000, 7 * M, 2, 5, exit_value=40 * M, track="lead"),
    L("S-05", "seed", "S-05", 1, "Early exit (M&A)", "blue", "new",
      700_000, 8 * M, 2, 5, exit_value=30 * M, track="lead"),
    L("S-06", "seed", "S-06", 2, "Zombies (×2)", "grey", "new",
      1_500_000, 8 * M, 2, 7, recovery=0.5, track="lead"),
    L("S-08", "seed", "S-08", 3, "Losses (×3)", "red", "new",
      2_250_000, 8 * M, 2, 5, recovery=0.0, track="lead"),
    L("S-11", "seed", "S-11", 1, "Radar breakout", "green", "new",
      150_000, 8 * M, 2, 8, buyback=800_000, buyback_year=4, buyback_value=20 * M, discount=0.10,
      exit_value=150 * M, partial=True, track="radar"),
    L("S-12", "seed", "S-12", 1, "Radar, early exit", "blue", "new",
      150_000, 8 * M, 2, 5, exit_value=50 * M, track="radar"),
    L("S-13", "seed", "S-13", 1, "Radar, early exit", "blue", "new",
      150_000, 8 * M, 3, 6, exit_value=30 * M, track="radar"),
    L("S-14", "seed", "S-14", 5, "Zombies (×5)", "grey", "new",
      750_000, 8 * M, 3, 7, recovery=0.5, track="radar"),
    L("S-19", "seed", "S-19", 12, "Losses (×12)", "red", "new",
      1_800_000, 8 * M, 3, 5, recovery=0.0, track="radar"),
    # Venture (Relute) : 7 societes, premiers cheques de 2,5 a 4,5 M EUR en seed+ ou
    # Serie A, entrees annees 2-4.
    L("V-01", "venture", "V-01", 1, "Breakout", "green", "new",
      4_500_000, 40 * M, 2, 9, buyback=1_500_000, buyback_year=4, buyback_value=100 * M,
      discount=0.05, cancel=0.08, loan=2 * M, loan_year=3, loan_repay_year=6, loan_mult=1.4,
      exit_value=300 * M, partial=True),
    L("V-02", "venture", "V-02", 1, "Raised elsewhere once, we followed", "green", "new",
      4 * M, 35 * M, 2, 8, buyback=500_000, buyback_year=4, buyback_value=60 * M, discount=0.10,
      dilution=0.20, follow=1_500_000, follow_year=5, follow_post=120 * M,
      loan=1_500_000, loan_year=4, loan_repay_year=6, loan_mult=1.4, exit_value=250 * M,
      partial=True),
    L("V-03", "venture", "V-03", 1, "Strategic exit, angels bought back", "blue", "new",
      3_500_000, 35 * M, 3, 7, buyback=500_000, buyback_year=4, buyback_value=40 * M,
      discount=0.10, loan=1 * M, loan_year=4, loan_repay_year=6, loan_mult=1.4,
      exit_value=120 * M),
    L("V-04", "venture", "V-04", 1, "Early exit (M&A)", "blue", "new",
      3 * M, 30 * M, 3, 5, loan=500_000, loan_year=4, loan_repay_year=5, loan_mult=1.4,
      exit_value=60 * M),
    L("V-05", "venture", "V-05", 2, "Zombies (×2)", "grey", "new",
      5 * M, 25 * M, 3, 8, loan=1 * M, loan_year=5, loan_repay_year=7, loan_mult=0.8,
      recovery=0.5),
    L("V-07", "venture", "V-07", 1, "Loss", "red", "new",
      2_500_000, 25 * M, 4, 6, recovery=0.0),
    # Growth (Compound) : 5 a 7 M EUR par position. Blocs rachetes a des fonds en fin
    # de vie (30 % de decote), tours de croissance en actions nouvelles, et un bloc
    # dans notre propre breakout ; entrees annees 3-5, sorties 2 a 4 ans plus tard.
    L("G-01", "growth", "G-01", 1, "Strategic exit, block bought from an end-of-life fund", "blue",
      "new", 0, 150 * M, 3, 6, buyback=5 * M, buyback_year=3, buyback_value=150 * M,
      discount=0.30, loan=2 * M, loan_year=4, loan_repay_year=6, loan_mult=1.4,
      exit_value=300 * M),
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
    L("G-06", "growth", "S-01", 1, "Breakout (S-01): a seed fund's block bought back", "green",
      "breakout", 0, 150 * M, 5, 9, buyback=5 * M, buyback_year=5, buyback_value=150 * M,
      discount=0.30, cancel=0.04, exit_value=300 * M),
)
# Complement par SPV (hors fonds) jusqu'a company_max_with_spv, a titre indicatif.
SPV_COMPANIES = ("S-01", "V-01", "G-01")

# Le tableau des fondateurs (accueil, /calculator, /pitch, fiche p. 2 et 4) :
# meme societe, meme sortie, deux chemins. Reconstitution de la table publiee le
# 05/11 ; build() verifie qu'elle retombe sur PUBLISHED_FOUNDER_MATH. Le
# calculateur du site (src/lib/founderMath.js) fait le meme calcul et le build
# du site echoue s'il diverge (scripts/prerender.mjs).
FOUNDER_MATH = {
    "exits": [100 * M, 250 * M, 500 * M],
    # Cap table apres seed et Serie A (identique sur les deux chemins) :
    # seed 2 M EUR a 10 M post, pool de 10 %, Serie A 10 M EUR a 40 M post.
    "founders": 0.54,
    "holders": [
        {"id": "seed", "label": "Seed investors", "stake": 0.135, "pref": 2 * M},
        {"id": "pool", "label": "Option pool", "stake": 0.075, "pref": 0},
        {"id": "series_a", "label": "Series A investor", "stake": 0.25, "pref": 10 * M},
    ],
    # Chemin VC : 135 M EUR de fonds propres de la Serie B a la D, preferences 1x
    # non participantes, pari passu.
    "vc_rounds": [
        {"id": "B", "amount": 30 * M, "post": 150 * M},
        {"id": "C", "amount": 35 * M, "post": 250 * M},
        {"id": "D", "amount": 70 * M, "post": 400 * M},
    ],
    # Chemin ProFund : aucune action nouvelle ; 25 M EUR de prets, rembourses a la
    # sortie avant les fonds propres, a 1,2x.
    "loans": 25 * M,
    "loan_multiple": 1.2,
}
PUBLISHED_FOUNDER_MATH = {
    "founders_vc": [0, 62 * M, 153 * M],
    "founders_profund": [38 * M, 119 * M, 254 * M],
    "series_a_vc": [0.7, 2.9, 7.1],
    "series_a_profund": [1.8, 5.5, 11.8],
}

# La v2 (commit 2f3b590, scripts/fund_model.py) avec les memes sorties que la v3,
# toutes plafonnees a 300 M EUR : `git show 2f3b590:scripts/fund_model.py`, puis
# run_case(300 * M). Sans plafond, elle n'atteignait 2,7x net qu'avec deux sorties
# au-dessus de 1 Md EUR (S-01 a 1,5 Md, V-01 a 1,2 Md). Cite sur /pitch.
REFERENCE_V2 = {"commit": "2f3b590", "net_tvpi": 2.7, "capped_exit": 300 * M, "capped_net_tvpi": 1.3}

# Valeurs publiees de la v3.3 (fiche v3, /pitch) que le modele doit retrouver.
PUBLISHED = {
    "target": {"net_tvpi": 2.5, "net_irr": 0.26, "dpi_year7": 1.2},
    "base": {"net_tvpi": 1.6, "net_irr": 0.13},
    "stress": {"net_tvpi": 1.2, "net_irr": 0.06},
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
    return equity_cost(line) + line.loan


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


def loan_repayment(line: Line, case: Case) -> int:
    if not line.loan:
        return 0
    return money(line.loan * line.loan_mult * case.loan_repaid)


def proceeds(line: Line, case: Case) -> int:
    return equity_proceeds(line, case) + loan_repayment(line, case)


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
        if x.loan:
            inv[x.loan_year] += x.loan
            dist[x.loan_repay_year] += loan_repayment(x, case)
            cost_out[x.loan_repay_year] += x.loan
        gross += proceeds(x, case)
        sec, rest, sec_cost = secondary_split(x, case)
        dist[SECONDARY["year"]] += sec
        dist[x.exit_year] += rest
        cost_out[SECONDARY["year"]] += sec_cost
        cost_out[x.exit_year] += equity_cost(x) - sec_cost

    sleeve = sum(x.loan for x in lines)
    mgmt = [0.0] * years
    expenses = [0.0] * years
    nic = 0.0
    for t in range(1, years):
        nic_start = nic
        nic += inv[t] - cost_out[t]
        if t > horizon:
            continue
        if t <= FUND["investment_period_years"]:
            mgmt[t] = (TERMS["fee_ip_pct"] * (FUND["commitments"] - sleeve)
                       + TERMS["fee_loan_pct"] * sleeve)
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

    lent = sum(x.loan for x in lines)
    repaid = sum(loan_repayment(x, case) for x in lines)
    realised = money(realised_raw)
    return {
        "exit_mult": case.exit_mult,
        "exit_cap": case.exit_cap,
        "loan_repaid": case.loan_repaid,
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
        "loans_repaid": repaid,
        "loans_multiple": ratio(repaid / lent, 2) if lent else 0.0,
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
    """TRI brut d'un etage : investissements, sorties (secondaire compris) et prets."""
    flows = [0.0] * (FUND["term_years"] + 1)
    for x in (y for y in LINES if y.layer == layer):
        flows[x.entry_year] -= x.first
        if x.buyback:
            flows[x.buyback_year] -= x.buyback
        if x.follow:
            flows[x.follow_year] -= x.follow
        if x.loan:
            flows[x.loan_year] -= x.loan
            flows[x.loan_repay_year] += loan_repayment(x, case)
        sec, rest, _ = secondary_split(x, case)
        flows[SECONDARY["year"]] += sec
        flows[x.exit_year] += rest
    return ratio(irr(flows[1:]), 2)


# ── tests de resistance (cas cible, une hypothese a la fois) ────────────────
def _shift(lines, years: int):
    """Chaque sortie decalee, au plus tard en annee 10 ; les prets gardent leur
    echeancier (ils se remboursent sur les flux de la societe, pas a la sortie)."""
    cap = FUND["term_years"]
    return tuple(replace(x, exit_year=min(x.exit_year + years, cap)) for x in lines)


def _zombie_best(lines):
    best = "S-01"
    out = []
    for x in lines:
        if x.company == best:
            x = replace(x, exit_value=None, recovery=0.5, partial=False,
                        loan_mult=None if x.loan_mult is None else LOAN_MULTIPLES["zombie"])
        out.append(x)
    return tuple(out)


def _unicorn(lines):
    return tuple(replace(x, exit_value=1000 * M) if x.company == "S-01" else x for x in lines)


def stress_tests() -> list[dict]:
    target = CASES[0]
    rows = [
        ("as_published", "As published", LINES, target),
        ("exits_plus_1", "Every exit one year later", _shift(LINES, 1), target),
        ("exits_plus_2", "Every exit two years later, by year 10 at the latest", _shift(LINES, 2), target),
        ("best_zombie", "Best company (S-01, both lines) becomes a zombie", _zombie_best(LINES), target),
        ("loan_losses", "30% more losses on every loan", LINES,
         replace(target, loan_repaid=ratio(target.loan_repaid - 0.30, 2))),
        ("no_partial", "No partial liquidity", tuple(replace(x, partial=False) for x in LINES), target),
        ("unicorn", "One unicorn: S-01 sold for €1B", _unicorn(LINES), target),
    ]
    out = []
    for key, label, lines, case in rows:
        r = run_case(case, lines)
        out.append({"id": key, "label": label, "net_tvpi": r["net_tvpi"], "net_irr": r["net_irr"]})
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


def founder_math() -> dict:
    fm = FOUNDER_MATH
    base = [{"id": "founders", "stake": fm["founders"], "pref": 0}] + [dict(h) for h in fm["holders"]]
    vc = [dict(h) for h in base]
    stakes = []
    for r in fm["vc_rounds"]:
        k = r["amount"] / r["post"]
        for h in vc:
            h["stake"] *= 1 - k
        vc.append({"id": r["id"], "stake": k, "pref": r["amount"]})
        stakes.append({"round": r["id"], "founders": ratio(vc[0]["stake"], 3)})
    debt = fm["loans"] * fm["loan_multiple"]
    a_cost = next(h["pref"] for h in fm["holders"] if h["id"] == "series_a")
    rows = []
    for v in fm["exits"]:
        p_vc = _payout(v, vc)
        p_pf = _payout(max(0.0, v - debt), base)
        rows.append({
            "exit": v,
            "founders_vc": millions(p_vc["founders"]),
            "founders_profund": millions(p_pf["founders"]),
            "series_a_vc": ratio(p_vc["series_a"] / a_cost, 1),
            "series_a_profund": ratio(p_pf["series_a"] / a_cost, 1),
        })
    return {
        **{k: v for k, v in fm.items()},
        "vc_equity": sum(r["amount"] for r in fm["vc_rounds"]),
        "raised_before": sum(h["pref"] for h in fm["holders"]),
        "founders_after_vc": ratio(vc[0]["stake"], 3),
        "vc_stakes": stakes,
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
    c.need(alloc["loans"] <= FUND["loan_cap_pct"] * commitments, "prets au-dela du plafond EuVECA")
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
        # le calendrier : entrees, rachats, suivis et prets pendant la periode d'investissement
        c.need(1 <= x.entry_year <= ip and x.entry_year < x.exit_year <= term, f"{x.id} : annees")
        if x.buyback:
            c.need(x.buyback_year is not None and x.entry_year <= x.buyback_year <= ip
                   and x.buyback_value, f"{x.id} : rachat")
        if x.follow:
            c.need(x.follow_year is not None and x.entry_year <= x.follow_year <= ip
                   and x.follow_post, f"{x.id} : suivi")
        if x.loan:
            c.need(x.loan_year is not None and x.loan_repay_year is not None and x.loan_mult
                   and x.entry_year <= x.loan_year <= ip
                   and x.loan_year < x.loan_repay_year <= x.exit_year, f"{x.id} : pret")
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
        c.need(not x.partial or (x.exit_value and x.exit_year > SECONDARY["year"]),
               f"{x.id} : liquidite partielle sans sortie apres l'annee {SECONDARY['year']}")
        # par societe : une ligne groupee peut porter 2,25 M EUR (3 x 750 K)
        for v in (x.first, x.buyback, x.follow, x.loan):
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
        # Les produits d'une ligne ajoutent des fonds propres (maille de 100 K) et un
        # remboursement de pret (maille de 10 K sous 1 M) : comme dans le classeur v3.3,
        # ils ne tombent pas toujours sur la maille ; le site et la fiche les affichent
        # a 100 K pres.
        for key in ("first", "buyback", "follow", "loans", "invested"):
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
        "loan": x.loan,
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
        "loan_year": x.loan_year,
        "loan_repay_year": x.loan_repay_year,
        "loan_mult": x.loan_mult,
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
            "loans": sum(x.loan for x in lines),
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
        entry["loans_pct"] = ratio(entry["loans"] / entry["invested"], 2)
        layers[layer] = entry

    target = cases["target"]
    invested_total = sum(layers[x]["invested"] for x in LAYERS)
    first_total = sum(layers[x]["first"] for x in LAYERS)
    buy_follow = sum(layers[x]["buyback"] + layers[x]["follow"] for x in LAYERS)
    loans = sum(layers[x]["loans"] for x in LAYERS)
    contingency = FUND["commitments"] - invested_total - target["mgmt_fees"] - target["fund_expenses"]

    expo = exposures()
    spv = [{"company": k, "fund": money(expo[k]),
            "spv": money(FUND["company_max_with_spv"] - expo[k])} for k in SPV_COMPANIES]
    by_company: dict[str, int] = {}
    for x in LINES:
        by_company[x.company] = by_company.get(x.company, 0) + proceeds(x, CASES[0])
    best = max(by_company.items(), key=lambda kv: kv[1])
    lines_partial = [x.id for x in LINES if x.partial]

    return {
        "schema": 3,
        "version": VERSION,
        "model_date": MODEL_DATE,
        "fund": {**FUND, "company_cap": money(FUND["company_cap_pct"] * FUND["commitments"]),
                 "loan_cap": money(FUND["loan_cap_pct"] * FUND["commitments"]),
                 "companies": sum(layers[x]["companies"] for x in LAYERS),
                 "positions": len(LINES)},
        "terms": {**TERMS, "gp_commit_min": money(TERMS["gp_commit_min_pct"] * FUND["commitments"])},
        "secondary": {**SECONDARY, "lines": lines_partial},
        "buyback_discount": BUYBACK_DISCOUNT,
        "loan_multiples": LOAN_MULTIPLES,
        "layers": layers,
        "allocation": {
            "seed": layers["seed"]["invested"],
            "venture": layers["venture"]["invested"],
            "growth": layers["growth"]["invested"],
            "invested": invested_total,
            "first": first_total,
            "buyback_follow": buy_follow,
            "loans": loans,
            "after_first_pct": ratio((invested_total - first_total) / invested_total, 2),
            "loans_pct": ratio(loans / invested_total, 2),
            "mgmt_fees": target["mgmt_fees"],
            "fund_expenses": target["fund_expenses"],
            "contingency": money(contingency),
            "total": FUND["commitments"],
        },
        "spv": spv,
        "spv_total": sum(x["spv"] for x in spv),
        "fund_returner": {"company": best[0], "proceeds": best[1],
                          "multiple_of_fund": ratio(best[1] / FUND["commitments"], 1)},
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
                   f"buyback {x['buyback'] / M:4.1f}  follow {x['follow'] / M:3.1f}  loans {x['loans'] / M:4.1f}  "
                   f"invested {x['invested'] / M:5.1f} -> target {x['proceeds']['target'] / M:6.1f} "
                   f"({x['moic']['target']}x, gross IRR {x['gross_irr']['target']:.0%})  "
                   f"base {x['moic']['base']}x  stress {x['moic']['stress']}x")
    a = data["allocation"]
    out.append(f"  invested {a['invested'] / M:.1f} (first {a['first'] / M:.1f} + buybacks/follow-ons "
               f"{a['buyback_follow'] / M:.1f} + loans {a['loans'] / M:.1f}) + fees {a['mgmt_fees'] / M:.1f} "
               f"+ expenses {a['fund_expenses'] / M:.1f} + contingency {a['contingency'] / M:.1f} = {a['total'] / M:.1f}")
    for name, case in data["cases"].items():
        out.append(f"  {name:7s} gross {case['gross_proceeds'] / M:6.1f}  realised {case['realised'] / M:6.1f}  "
                   f"paid-in {case['paid_in'] / M:5.1f}  carry {case['carry'] / M:5.1f}  "
                   f"TVPI {case['net_tvpi']:.1f}x  IRR {case['net_irr']:.0%}  gross IRR {case['gross_irr']:.0%}  "
                   f"DPI y6 {case['dpi_year6']:.1f}x y7 {case['dpi_year7']:.1f}x  loans {case['loans_multiple']:.2f}x")
    for s in data["stress_tests"]:
        out.append(f"    stress {s['id']:13s} {s['net_tvpi']:.1f}x {s['net_irr']:.0%}")
    for r in data["founder_math"]["rows"]:
        out.append(f"    founders @ {r['exit'] / M:4.0f}M: VC {r['founders_vc'] / M:5.1f}  ProFund "
                   f"{r['founders_profund'] / M:5.1f}  Series A {r['series_a_vc']}x vs {r['series_a_profund']}x")
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
