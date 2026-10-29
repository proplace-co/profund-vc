"""Modele du fonds ProFund (v2) -- la SEULE source des chiffres du fonds.

Ecrit src/data/fund.json, que lisent /pitch (via src/lib/fund.ts) et la fiche
PDF (scripts/factsheet.py). Un chiffre du fonds ne se tape jamais ailleurs : on
le change ICI, on relance, on commite le JSON et le PDF regenere.

    python scripts/fund_model.py           valide, ecrit fund.json, imprime un resume
    python scripts/fund_model.py --check   code 1 si fund.json n'est plus a jour
    python scripts/fund_model.py --dry     resume seulement, n'ecrit rien

Conventions :
- montants en euros entiers ; une ligne qui regroupe n societes porte des
  TOTAUX de ligne (initial, suivi), le par-societe vaut total / n ;
- chaque montant est arrondi a sa maille d'affichage AVANT toute somme
  (10 k EUR sous 1 M, 100 k EUR au-dessus) : les sous-totaux affiches tombent
  juste, sur le site comme dans le PDF ;
- les ratios sont exportes a leur precision d'affichage : les formateurs (TS et
  Python) formatent, ils n'arrondissent jamais ;
- annee 1 = annee du premier closing ; tous les flux en fin d'annee ;
- bibliotheque standard uniquement, sortie console en ASCII (cp1252 sous
  Windows quand la sortie est redirigee).

Frais du fonds (mise en place, plateforme, administration, audit) : estimation
en attendant le devis du gestionnaire EuVECA (Roundtable). A remplacer des
reception, puis relancer ce script et la fiche.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "fund.json"

VERSION = "v2"
MODEL_DATE = "2026-10-29"   # fixe : --check doit rester stable d'un jour a l'autre

M = 1_000_000

# ── hypotheses ──────────────────────────────────────────────────────────────
FUND = {
    "commitments": 100 * M,
    "term_years": 10,
    "investment_period_years": 5,
    "closing_months": 24,           # closings successifs apres le premier
    "company_cap_pct": 0.10,        # exposition max d'une societe DANS le fonds
    "company_max_with_spv": 15 * M,  # au-dela : un ou plusieurs SPV de co-investissement
    "europe_min_pct": 0.85,         # UE/EEE + Royaume-Uni + Suisse
    "euveca_qualifying_min_pct": 0.70,
}
TERMS = {
    "fee_ip_pct": 0.02,             # sur les engagements, pendant la periode d'investissement
    "fee_post_pct": 0.015,          # ensuite, sur le capital encore investi (cout des lignes detenues)
    "fee_first_close_pct": 0.0175,  # LPs du premier closing ; le modele garde 2 % (prudent)
    "setup_cost": 400_000,          # A CONFIRMER : devis Roundtable
    "running_cost": 350_000,        # par an, sur toute la duree du fonds, idem
    "carry_pct": 0.20,
    "hurdle_pct": 0.08,             # compose annuellement, cascade europeenne (tout le fonds)
    "catch_up_pct": 1.0,
    "gp_commit_min_pct": 0.01,
}
# Liquidite anticipee : une part des positions gagnantes cedee en secondaire.
SECONDARY = {"share": 0.25, "year": 6, "price_pct": 0.60, "companies": ("S-01", "V-01")}
# Cas : plafond applique aux valorisations de sortie, tout le reste identique.
CASES = (("target", None), ("base", 500 * M), ("stress", 250 * M))

LAYERS = ("seed", "venture", "growth")
BOUNDS = {
    "seed": {"ticket": (150_000, 1_500_000), "post": (5 * M, 20 * M),
             "own": (0.05, 0.125), "companies": 18},
    "venture": {"ticket": (1_500_000, 5 * M), "post": (25 * M, 80 * M),
                "own": (0.05, 0.08), "companies": 8},
    # 29/10 (Alexandre) : pas seulement une filiere Seed -> Venture -> Growth. Chaque etage
    # entre aussi en direct dans les meilleurs tours externes : le Venture est 100 % direct,
    # le Growth au moins 40 % direct (aux cotes d'un grand fonds growth), le reste pour nos
    # propres gagnants.
    "growth": {"ticket": (5 * M, 10 * M), "post": (80 * M, 400 * M),
               "own": (0.02, 0.05), "companies": 3, "direct_min_pct": 0.40},
}
# Politique de reserves, en esperance : les lignes de suivi doivent la retrouver.
RESERVES = {
    "seed": {"graduation_pct": 0.40, "next_round": 15 * M, "pro_rata_pct": 0.06,
             "bridges": 1 * M},
    "venture": {"graduation_pct": 0.50, "next_round": 40 * M, "pro_rata_pct": 0.065,
                "bridges": 0},
}
# Complement par SPV (hors fonds) jusqu'a company_max_with_spv, a titre indicatif.
SPV_COMPANIES = ("S-01", "V-01", "G-07")


@dataclass(frozen=True)
class Line:
    id: str                 # premier identifiant ("S-07" pour S-07..S-09)
    layer: str
    company: str            # cle d'exposition et de sortie ("S-01" pour G-01)
    n: int                  # societes regroupees sur la ligne
    outcome: str
    kind: str               # "new" : entree ; "follow_on" : societe deja en portefeuille
    initial: int            # EUR, total de ligne
    entry_post: int         # EUR, post-money d'entree, par societe
    follow_on: int          # EUR, total de ligne
    invest_year: int
    follow_on_year: int | None
    exit_year: int
    exit_pct: float | None = None    # part diluee a la sortie
    exit_value: int | None = None    # valorisation de sortie (100 %)
    recovery: float | None = None    # sinon : multiple recupere sur le montant investi


L = Line
LINES = (
    # Seed : 18 societes, pre-seed / seed, lead ou co-lead, detection avant le tour
    L("S-01", "seed", "S-01", 1, "fund_returner", "new", 1_000_000, 8 * M, 2 * M, 1, 2, 8,
      exit_pct=0.045, exit_value=1500 * M),
    L("S-02", "seed", "S-02", 1, "breakout", "new", 750_000, 8 * M, 1_500_000, 1, 2, 7,
      exit_pct=0.035, exit_value=600 * M),
    L("S-03", "seed", "S-03", 1, "breakout", "new", 750_000, 10 * M, 1 * M, 1, 3, 7,
      exit_pct=0.03, exit_value=300 * M),
    L("S-04", "seed", "S-04", 1, "strategic_exit", "new", 500_000, 8 * M, 500_000, 2, 3, 5,
      exit_pct=0.05, exit_value=150 * M),
    L("S-05", "seed", "S-05", 1, "early_exit", "new", 500_000, 8 * M, 500_000, 1, 2, 4,
      exit_pct=0.045, exit_value=60 * M),
    L("S-06", "seed", "S-06", 1, "early_exit", "new", 300_000, 6 * M, 0, 2, None, 4,
      exit_pct=0.04, exit_value=40 * M),
    L("S-07", "seed", "S-07", 3, "zombie", "new", 1_200_000, 8 * M, 600_000, 2, 3, 7,
      recovery=0.5),
    L("S-10", "seed", "S-10", 9, "loss", "new", 4 * M, 8 * M, 1_400_000, 2, 3, 5,
      recovery=0.0),
    # Venture : 8 societes, seed+ / Serie A, entree au point d'inflexion (Seed Radar)
    L("V-01", "venture", "V-01", 1, "anchor", "new", 3 * M, 45 * M, 2 * M, 1, 3, 8,
      exit_pct=0.045, exit_value=1200 * M),
    L("V-02", "venture", "V-02", 1, "strategic_win", "new", 3 * M, 45 * M, 2 * M, 1, 3, 7,
      exit_pct=0.045, exit_value=600 * M),
    L("V-03", "venture", "V-03", 1, "strategic_win", "new", 3 * M, 40 * M, 1_500_000, 2, 4, 6,
      exit_pct=0.045, exit_value=400 * M),
    L("V-04", "venture", "V-04", 1, "base_hit", "new", 3 * M, 45 * M, 1 * M, 2, 4, 6,
      exit_pct=0.04, exit_value=250 * M),
    L("V-05", "venture", "V-05", 2, "zombie", "new", 6 * M, 40 * M, 1_500_000, 3, 4, 7,
      recovery=0.4),
    L("V-07", "venture", "V-07", 2, "loss", "new", 6 * M, 40 * M, 2_400_000, 3, 4, 6,
      recovery=0.0),
    # Growth : 3 entrees directes aux cotes d'un lead growth (>= 40 %), 3 suivis de nos gagnants
    L("G-01", "growth", "S-01", 1, "breakout_follow_on", "follow_on", 7 * M, 250 * M, 0, 3, None, 8,
      exit_pct=0.022, exit_value=1500 * M),
    L("G-02", "growth", "V-01", 1, "breakout_follow_on", "follow_on", 5 * M, 400 * M, 0, 4, None, 8,
      exit_pct=0.01, exit_value=1200 * M),
    L("G-03", "growth", "S-02", 1, "breakout_follow_on", "follow_on", 5 * M, 150 * M, 0, 3, None, 7,
      exit_pct=0.028, exit_value=600 * M),
    L("G-07", "growth", "G-07", 1, "external_growth", "new", 6 * M, 250 * M, 0, 2, None, 6,
      exit_pct=0.021, exit_value=1000 * M),
    L("G-08", "growth", "G-08", 1, "external_growth", "new", 5 * M, 250 * M, 0, 3, None, 7,
      exit_pct=0.017, exit_value=900 * M),
    L("G-09", "growth", "G-09", 1, "downside_protected", "new", 5 * M, 200 * M, 0, 3, None, 7,
      recovery=0.8),
)


# ── arrondis ────────────────────────────────────────────────────────────────
def money(v) -> int:
    """Arrondi a la maille d'affichage : 10 k sous 1 M, 100 k au-dessus."""
    d = Decimal(str(v))
    step = Decimal(10_000) if abs(d) < M else Decimal(100_000)
    return int((d / step).quantize(Decimal(1), rounding=ROUND_HALF_UP) * step)


def ratio(v, places: int) -> float:
    q = Decimal(1).scaleb(-places)
    return float(Decimal(str(v)).quantize(q, rounding=ROUND_HALF_UP))


def on_grain(v: int) -> bool:
    return v == money(v)


# ── calculs ─────────────────────────────────────────────────────────────────
def invested(line: Line) -> int:
    return line.initial + line.follow_on


def proceeds(line: Line, cap: int | None) -> int:
    """Produit de cession a la sortie (avant toute vente secondaire)."""
    if line.recovery is not None:
        return money(Decimal(str(line.recovery)) * invested(line))
    value = line.exit_value if cap is None else min(line.exit_value, cap)
    return money(Decimal(str(line.exit_pct)) * value)


def split_secondary(line: Line, value: int):
    """(annee, montant) des encaissements d'une ligne : secondaire partiel puis solde."""
    if line.company in SECONDARY["companies"] and line.exit_year > SECONDARY["year"] and value:
        share = Decimal(str(SECONDARY["share"]))
        sec = money(share * Decimal(str(SECONDARY["price_pct"])) * value)
        rest = money((1 - share) * value)
        return [(SECONDARY["year"], sec), (line.exit_year, rest)], float(share)
    return [(line.exit_year, value)], 0.0


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


def run_case(cap: int | None):
    horizon = max(line.exit_year for line in LINES)
    years = horizon + 1                      # index 0 inutilise : annee 1 = index 1
    inv = [0.0] * years
    dist = [0.0] * years
    cost_out = [0.0] * years
    gross_exits = 0
    for line in LINES:
        inv[line.invest_year] += line.initial
        if line.follow_on:
            inv[line.follow_on_year] += line.follow_on
        value = proceeds(line, cap)
        gross_exits += value
        parts, share = split_secondary(line, value)
        for year, amount in parts:
            dist[year] += amount
        if share:
            cost_out[SECONDARY["year"]] += share * invested(line)
            cost_out[line.exit_year] += (1 - share) * invested(line)
        else:
            cost_out[line.exit_year] += invested(line)

    mgmt = [0.0] * years
    expenses = [0.0] * years
    nic = 0.0
    for t in range(1, years):
        nic_start = nic
        nic += inv[t] - cost_out[t]
        if t <= FUND["investment_period_years"]:
            mgmt[t] = TERMS["fee_ip_pct"] * FUND["commitments"]
        else:
            mgmt[t] = TERMS["fee_post_pct"] * max(nic_start, 0.0)
        expenses[t] = TERMS["running_cost"] + (TERMS["setup_cost"] if t == 1 else 0)
    # Le fonds vit 10 ans : les frais de fonctionnement des annees sans ligne
    # sont mis de cote sur la derniere distribution (pas d'appel apres la
    # derniere sortie, donc pas de clawback artificiel).
    tail = TERMS["running_cost"] * max(0, FUND["term_years"] - horizon)
    dist[horizon] -= tail

    realised = sum(dist) + tail
    calls = [inv[t] + mgmt[t] + expenses[t] for t in range(years)]
    lp, gp, clawback = waterfall(calls, dist)
    paid_in = sum(calls)
    lp_total, gp_total = sum(lp), sum(gp)
    assert abs(lp_total + gp_total - sum(dist)) < 1, "cascade : LP + GP != distribuable"
    assert gp_total <= TERMS["carry_pct"] * max(0.0, sum(dist) - paid_in) + 1, "carried > 20 % du profit"
    assert clawback < 1, f"clawback inattendu : {clawback:.0f}"

    net = [lp[t] - calls[t] for t in range(1, years)]
    gross = [dist[t] + (tail if t == horizon else 0) - inv[t] for t in range(1, years)]
    lp_to_6 = sum(lp[1:7])
    calls_to_6 = sum(calls[1:7])
    return {
        "exit_cap": cap,
        "gross_exits": gross_exits,
        "secondary_discount": gross_exits - money(realised),
        "realised": money(realised),
        "paid_in": money(paid_in),
        "mgmt_fees": money(sum(mgmt)),
        "fund_expenses": money(sum(expenses) + tail),
        "lp_distributions": money(lp_total),
        "carry": money(gp_total),
        "net_tvpi": ratio(lp_total / paid_in, 1),
        "net_irr": ratio(irr(net), 2),
        "gross_irr": ratio(irr(gross), 2),
        "dpi_year6": ratio(lp_to_6 / calls_to_6, 1),
        "horizon_years": horizon,
        "cashflows": {
            "calls": [money(c) for c in calls[1:]],
            "distributions": [money(d) for d in dist[1:]],
            "lp": [money(x) for x in lp[1:]],
            "gp": [money(x) for x in gp[1:]],
        },
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
    """Cas jouet calcule a la main : 100 investis, 200 rendus 5 ans plus tard."""
    r = irr([-100, 0, 0, 0, 0, 200])
    assert abs(r - (2 ** 0.2 - 1)) < 1e-9, "auto-test TRI"
    lp, gp, claw = waterfall([100, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 200])
    assert abs(sum(gp) - 20) < 1e-6 and abs(sum(lp) - 180) < 1e-6 and claw < 1e-9, "auto-test cascade"


def exposures() -> dict[str, float]:
    out: dict[str, float] = {}
    for line in LINES:
        out[line.company] = out.get(line.company, 0.0) + invested(line) / line.n
    return out


def validate(data: dict) -> Checks:
    c = Checks()
    commitments = FUND["commitments"]
    cap = FUND["company_cap_pct"] * commitments
    alloc = data["allocation"]
    c.need(alloc["contingency"] >= 0,
           f"allocation : investi + frais > engagements ({alloc['contingency']})")
    for name, case in data["cases"].items():
        c.need(case["paid_in"] <= commitments, f"{name} : appele {case['paid_in']} > engagements")
    for line in LINES:
        b = BOUNDS[line.layer]
        per_initial = line.initial / line.n
        if line.kind == "new":
            lo, hi = b["ticket"]
            c.need(lo <= per_initial <= hi, f"{line.id} : ticket {per_initial:.0f} hors bornes {lo}-{hi}")
            own = per_initial / line.entry_post
            c.warn(b["own"][0] <= own <= b["own"][1] + 1e-9, f"{line.id} : detention d'entree {own:.3f}")
        lo, hi = b["post"]
        c.need(lo <= line.entry_post <= hi, f"{line.id} : post-money {line.entry_post} hors bornes")
        c.need(1 <= line.invest_year <= line.exit_year, f"{line.id} : annees")
        if line.kind == "new":
            c.need(line.invest_year <= FUND["investment_period_years"], f"{line.id} : entree apres la periode")
        if line.follow_on:
            c.need(line.follow_on_year is not None
                   and line.invest_year <= line.follow_on_year <= min(line.exit_year, 7),
                   f"{line.id} : annee de suivi")
        c.need((line.exit_value is None) != (line.recovery is None), f"{line.id} : sortie ambigue")
        for v in (line.initial, line.follow_on, line.entry_post):
            c.need(on_grain(v), f"{line.id} : {v} hors maille d'affichage")
        c.need(line.id.isascii() and line.outcome.isascii(), f"{line.id} : libelle non ASCII")
    # meme societe -> meme sortie
    seen: dict[str, tuple] = {}
    for line in LINES:
        if line.exit_value is None:
            continue
        key = (line.exit_year, line.exit_value)
        c.need(seen.setdefault(line.company, key) == key, f"{line.company} : sorties incoherentes")
    for company, total in exposures().items():
        c.need(total <= cap + 1, f"{company} : exposition {total:.0f} > plafond {cap:.0f}")
    for layer in LAYERS:
        x = data["layers"][layer]
        c.need(x["companies"] == BOUNDS[layer]["companies"], f"{layer} : {x['companies']} societes")
        # un sous-total doit s'afficher tel quel : sinon la ligne SUB ne tombe pas juste
        for key in ("initial", "follow_on", "invested"):
            c.need(on_grain(x[key]), f"{layer} : {key} {x[key]} hors maille d'affichage")
        for name, v in x["proceeds"].items():
            c.need(on_grain(v), f"{layer} : produits {name} {v} hors maille d'affichage")
    g = data["layers"]["growth"]
    c.need(g["external"] / g["invested"] >= BOUNDS["growth"]["direct_min_pct"],
           "growth : entrees directes < 40 %")
    c.need(all(x.kind == "new" for x in LINES if x.layer == "venture"),
           "venture : toutes les entrees doivent etre directes")
    for layer, ev in data["reserve_policy"].items():
        if layer == "growth":
            continue
        fo = data["layers"][layer]["follow_on"]
        c.need(abs(fo - ev["expected"]) <= 0.05 * ev["expected"],
               f"{layer} : suivi {fo} loin de la politique de reserves {ev['expected']}")
    text = json.dumps(data, ensure_ascii=True, allow_nan=False)
    c.need(text.isascii(), "JSON non ASCII")
    return c


# ── assemblage ──────────────────────────────────────────────────────────────
def line_json(line: Line) -> dict:
    per_initial = line.initial / line.n
    return {
        "id": line.id,
        "company": line.company,
        "n": line.n,
        "outcome": line.outcome,
        "kind": line.kind,
        "initial": line.initial,
        "entry_post": line.entry_post,
        "entry_pct": ratio(per_initial / line.entry_post, 3),
        "follow_on": line.follow_on,
        "exit_pct": line.exit_pct,
        "exit_value": line.exit_value,
        "recovery": line.recovery,
        "proceeds": proceeds(line, None),
        "moic": ratio(proceeds(line, None) / invested(line), 1),
        "invest_year": line.invest_year,
        "follow_on_year": line.follow_on_year,
        "exit_year": line.exit_year,
    }


def build() -> dict:
    self_test()
    cases = {name: run_case(cap) for name, cap in CASES}
    layers = {}
    for layer in LAYERS:
        lines = [x for x in LINES if x.layer == layer]
        initial = sum(x.initial for x in lines)
        follow_on = sum(x.follow_on for x in lines)
        inv = initial + follow_on
        b = BOUNDS[layer]
        entry = {
            "ticket_min": b["ticket"][0], "ticket_max": b["ticket"][1],
            "entry_post_min": b["post"][0], "entry_post_max": b["post"][1],
            "ownership_min": b["own"][0], "ownership_max": b["own"][1],
            "companies": sum(x.n for x in lines if x.kind == "new"),
            "positions": len(lines),
            "initial": initial, "follow_on": follow_on, "invested": inv,
            "proceeds": {}, "moic": {},
            "lines": [line_json(x) for x in lines],
        }
        if layer == "growth":
            internal = sum(invested(x) for x in lines if x.kind == "follow_on")
            entry["internal"] = internal
            entry["external"] = inv - internal
            entry["internal_pct"] = ratio(internal / inv, 2)
            entry["direct_pct"] = ratio((inv - internal) / inv, 2)
            entry["direct_min_pct"] = b["direct_min_pct"]
        for name, cap in CASES:
            got = sum(proceeds(x, cap) for x in lines)
            entry["proceeds"][name] = got
            entry["moic"][name] = ratio(got / inv, 1)
        layers[layer] = entry

    invested_total = sum(layers[x]["invested"] for x in LAYERS)
    target = cases["target"]
    contingency = FUND["commitments"] - invested_total - target["mgmt_fees"] - target["fund_expenses"]
    new_initial = sum(x.initial for x in LINES if x.kind == "new")
    follow_total = invested_total - new_initial

    reserve_policy = {}
    for layer, p in RESERVES.items():
        n = layers[layer]["companies"]
        expected = n * p["graduation_pct"] * p["pro_rata_pct"] * p["next_round"] + p["bridges"]
        reserve_policy[layer] = {**p, "companies": n, "expected": money(expected)}
    reserve_policy["growth"] = {"internal": layers["growth"]["internal"]}

    expo = exposures()
    top = sorted(expo.items(), key=lambda kv: -kv[1])[:4]
    spv = [{"company": k, "fund": money(expo[k]),
            "spv": money(FUND["company_max_with_spv"] - expo[k])} for k in SPV_COMPANIES]

    # Le fund returner : la societe qui rend le plus (toutes lignes, cas cible).
    by_company: dict[str, int] = {}
    for line in LINES:
        by_company[line.company] = by_company.get(line.company, 0) + proceeds(line, None)
    best = max(by_company.items(), key=lambda kv: kv[1])

    return {
        "schema": 1,
        "version": VERSION,
        "model_date": MODEL_DATE,
        "fund": {**FUND, "company_cap": money(FUND["company_cap_pct"] * FUND["commitments"]),
                 "companies": sum(layers[x]["companies"] for x in LAYERS)},
        "terms": {**TERMS, "gp_commit_min": money(TERMS["gp_commit_min_pct"] * FUND["commitments"])},
        "secondary": {**SECONDARY, "companies": list(SECONDARY["companies"])},
        "reserve_policy": reserve_policy,
        "layers": layers,
        "allocation": {
            "seed": layers["seed"]["invested"],
            "venture": layers["venture"]["invested"],
            "growth": layers["growth"]["invested"],
            "invested": invested_total,
            "initial": new_initial,
            "follow_on": follow_total,
            "follow_on_pct": ratio(follow_total / invested_total, 2),
            "mgmt_fees": target["mgmt_fees"],
            "fund_expenses": target["fund_expenses"],
            "contingency": money(contingency),
            "total": FUND["commitments"],
        },
        "exposure_top": [{"company": k, "total": money(v)} for k, v in top],
        "spv": spv,
        "spv_total": sum(x["spv"] for x in spv),
        "fund_returner": {"company": best[0], "proceeds": best[1],
                          "multiple_of_fund": ratio(best[1] / FUND["commitments"], 1)},
        "cases": cases,
        "benchmark": {"net_tvpi": None, "net_irr": None, "source": None},
    }


def render(data: dict) -> str:
    return json.dumps(data, indent=2, ensure_ascii=True, allow_nan=False) + "\n"


def summary(data: dict) -> str:
    out = [f"ProFund {data['version']} - model {data['model_date']} - "
           f"commitments EUR {data['fund']['commitments'] / M:.0f}M"]
    for layer in LAYERS:
        x = data["layers"][layer]
        out.append(f"  {layer:8s} {x['companies']:2d} cos  initial {x['initial'] / M:5.1f}  "
                   f"follow-on {x['follow_on'] / M:5.1f}  invested {x['invested'] / M:5.1f}  "
                   f"-> target {x['proceeds']['target'] / M:6.1f} ({x['moic']['target']}x)  "
                   f"base {x['moic']['base']}x  stress {x['moic']['stress']}x")
    a = data["allocation"]
    out.append(f"  invested {a['invested'] / M:.1f} + fees {a['mgmt_fees'] / M:.1f} + expenses "
               f"{a['fund_expenses'] / M:.1f} + contingency {a['contingency'] / M:.1f} = {a['total'] / M:.1f}"
               f"   follow-on share {a['follow_on_pct']:.0%}")
    for name, case in data["cases"].items():
        out.append(f"  {name:7s} exits {case['gross_exits'] / M:6.1f}  realised {case['realised'] / M:6.1f}  "
                   f"paid-in {case['paid_in'] / M:5.1f}  carry {case['carry'] / M:5.1f}  "
                   f"net TVPI {case['net_tvpi']:.1f}x  net IRR {case['net_irr']:.0%}  "
                   f"gross IRR {case['gross_irr']:.0%}  DPI y6 {case['dpi_year6']:.1f}x")
    fr = data["fund_returner"]
    out.append(f"  fund returner {fr['company']} -> {fr['proceeds'] / M:.1f} ({fr['multiple_of_fund']}x the fund);"
               f" top exposures " + ", ".join(f"{e['company']} {e['total'] / M:.2f}" for e in data["exposure_top"]))
    out.append(f"  SPV top-ups (outside the fund): EUR {data['spv_total'] / M:.1f}M")
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
    if checks.errors:
        for e in checks.errors:
            print(f"ERROR: {e}")
        return 1
    print(summary(data))
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
