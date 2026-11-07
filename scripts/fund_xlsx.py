"""Genere public/profund-fund-model.xlsx — le modele du fonds (v3.3) en Excel, vivant.

Le classeur se telecharge depuis /pitch (MODEL_XLSX_URL, src/lib/links.ts). Ce
n'est pas un export de chiffres : chaque sortie est une FORMULE qui se recalcule
dans Excel, LibreOffice ou Google Sheets quand on change une hypothese (police
bleue), et qui retombe exactement sur src/data/fund.json (cas Target, Base,
Stress). Chaque formule est ecrite AVEC sa valeur calculee : un apercu qui ne
recalcule pas (QuickLook, Gmail, Outlook, iOS) affiche donc les bons chiffres.

La mise en page reprend le classeur v3.3 livre le 05/11 (memes onglets, memes
noms definis, memes colonnes dans Lines, memes formules) : seules differences,
le Read me (le script du site calcule desormais la v3.3), trois sorties de plus
en Performance (DPI annee 7, prets rembourses / pretes, plus grande sortie) et le
bloc des tests de resistance, et des controles de plus dans Checks.

CHIFFRES : tous lus dans scripts/fund_model.py (constantes et build()). Aucun
chiffre du fonds ne se tape ici. Le script refuse de tourner si fund.json n'est
plus a jour, comme factsheet.py.

VERIFICATION, a chaque generation (le script echoue sinon) :
- un miroir Python de chaque formule donne la valeur ecrite en cache, et ses
  sorties doivent egaler fund.json ;
- pycel relit le fichier produit et RECALCULE toutes les formules (IRR par
  dichotomie, comme fund_model.irr : pycel ne l'implemente pas) ; chaque
  resultat doit egaler sa valeur en cache, et l'onglet Checks doit etre vert.

Regenerer a la main apres toute modification du modele :

    python scripts/fund_model.py
    python scripts/fund_xlsx.py

puis commiter le xlsx et changer le ?v= de MODEL_XLSX_URL (src/lib/links.ts)
pour que les navigateurs reprennent le nouveau fichier.

Dependances : xlsxwriter (pip install --user xlsxwriter) ; pycel pour le
controle seulement.
"""

import datetime
import json
import sys
from pathlib import Path

import xlsxwriter
from xlsxwriter.utility import xl_col_to_name, xl_rowcol_to_cell

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "profund-fund-model.xlsx"
FUND_JSON = ROOT / "src" / "data" / "fund.json"
sys.path.insert(0, str(ROOT / "scripts"))
import fund_model as fm  # noqa: E402

FUND, TERMS, SEC = fm.FUND, fm.TERMS, fm.SECONDARY
CASES = {c.id: c for c in fm.CASES}
CASE_IDS = fm.CASE_IDS
# 07/11 : la cible présentée est le cas prudent (clé « base ») ; le cas modélisé (clé « target ») est l'upside.
CASE_NAME = {"target": "Upside", "base": "Target", "stress": "Stress"}
LAYER_NAME = dict(fm.MODEL_NAMES)          # Seed / Venture / Growth, comme le site et la fiche
SITE_NAME = {"seed": "Seed", "venture": "Venture", "growth": "Growth"}
HORIZON = max(x.exit_year for x in fm.LINES)
SHEETS = ("Read me", "Assumptions", "Lines", "Construction", "Cash flows", "Performance", "Checks")
YEARS = list(range(1, FUND["term_years"] + 1))   # colonnes annuelles : toute la duree du fonds

# Palette ProFund (src/index.css)
BLUE, BLUE_DK, BAND, INK, MUTED, LINE = "#627C99", "#4A6080", "#EEF2F7", "#15181D", "#646B77", "#D9DDE3"
INPUT, GREEN, RED = "#1D4ED8", "#1F8A4C", "#C0392B"
EUR, PCT0, PCT1, MULT, MULT2, YEAR, INT = ('"€"#,##0;-"€"#,##0;"–"', "0%", "0.0%", '0.0"×"', '0.00"×"', "0",
                                          "#,##0")

NOTICE = ("This document is a pre-marketing communication within the meaning of Article 4a of "
          "Regulation (EU) No 345/2013 (EuVECA). The fund is not yet established and no units may be "
          "subscribed at this stage. For professional and eligible investors only.")
PROJECTIONS = ("All projections, targets, simulated portfolios, and return figures (IRR/DPI/MOIC) are "
               "indicative, hypothetical, and illustrative; actual results may differ materially.")
EXPENSES = "Fund expenses are an estimate pending the EuVECA manager's quote."


# ── donnees du fonds ────────────────────────────────────────────────────────
def _load_fund():
    data = json.loads(FUND_JSON.read_text(encoding="utf-8"))
    built = fm.build()
    if json.loads(fm.render(built)) != data:
        raise SystemExit("src/data/fund.json n'est plus a jour : lancer python scripts/fund_model.py")
    checks = fm.validate(built)
    if checks.errors:
        raise SystemExit("modele invalide : " + "; ".join(checks.errors))
    return data


DATA = _load_fund()
SEED_TR = DATA["layers"]["seed"]["tracks"]   # leads S-01..S-10, radar S-11..S-30


# ── formules ────────────────────────────────────────────────────────────────
def xmoney(e: str) -> str:
    """money() de fund_model en Excel : maille de 10 k sous 1 M, 100 k au-dessus."""
    g = f"IF(ABS({e})<1000000,10000,100000)"
    return f"ROUND(({e})/{g},0)*{g}"


def ratio(v, places):
    return fm.ratio(v, places)


def row_id(line) -> str:
    """S-01 ; S-08–10 pour trois societes ; S-06/07 pour deux (src/lib/fund.ts, rowId)."""
    if line.n == 1:
        return line.id
    prefix, num = line.id.split("-")
    last = str(int(num) + line.n - 1).zfill(len(num))
    return f"{line.id}/{last}" if line.n == 2 else f"{prefix}-{num}–{last}"


def eur_txt(v) -> str:
    """€300M, €1.5M, €750K : pour les textes generes (notes), jamais pour une cellule."""
    if v >= 1e9:
        return f"€{v / 1e9:g}B"
    if v >= 1e6:
        return f"€{v / 1e6:g}M"
    return f"€{v / 1e3:g}K"


def pct_txt(v) -> str:
    return f"{v * 100:g}%"


class Book:
    """Le classeur, plus la valeur en cache de chaque formule (pour le controle)."""

    def __init__(self, path: Path):
        self.wb = xlsxwriter.Workbook(str(path))
        created = datetime.datetime.strptime(fm.MODEL_DATE, "%Y-%m-%d")
        self.wb.set_properties({
            "title": f"ProFund Fund I - Fund model ({fm.VERSION})", "author": "ProFund",
            "company": "ProFund", "comments": "EuVECA pre-marketing communication. Generated by scripts/fund_xlsx.py.",
            "created": created,
        })
        self.cache: dict[tuple, object] = {}
        self._fmts: dict[tuple, object] = {}
        # xlsxwriter ne sait pas inserer un onglet : on les cree tous dans l'ordre
        # d'affichage, puis on les remplit dans l'ordre des dependances.
        self.sheets = {name: self.wb.add_worksheet(name) for name in SHEETS}

    def f(self, **kw):
        key = tuple(sorted(kw.items()))
        if key not in self._fmts:
            base = {"font_name": "Arial", "font_size": 10, "font_color": INK, "valign": "vcenter"}
            base.update(kw)
            self._fmts[key] = self.wb.add_format(base)
        return self._fmts[key]

    def sheet(self, name, tab=BLUE, grid=False):
        ws = self.sheets[name]
        ws.set_tab_color(tab)
        if not grid:
            ws.hide_gridlines(2)
        ws.set_paper(9)
        ws.set_landscape()
        ws.fit_to_pages(1, 0)
        return ws

    def formula(self, ws, r, c, formula, value, fmt=None):
        ws.write_formula(r, c, "=" + formula, fmt, value)
        self.cache[(ws.name, r, c)] = value

    def name(self, name, sheet, r, c):
        self.wb.define_name(name, "=" + ref(sheet, r, c))

    def title(self, ws, text, sub=None):
        ws.set_row(0, 30)
        ws.write(0, 0, text, self.f(bold=True, font_size=16))
        if sub:
            ws.write(1, 0, sub, self.f(font_color=MUTED, italic=True))

    def band(self, ws, r, text, c0=0, c1=8, fill=BLUE):
        ws.set_row(r, 20)
        for c in range(c0, c1 + 1):
            ws.write_blank(r, c, None, self.f(bg_color=fill))
        ws.write(r, c0, text, self.f(bold=True, font_color="#FFFFFF", bg_color=fill))

    def close(self):
        self.wb.close()


def ref(sheet, r, c, absolute=True):
    cell = xl_rowcol_to_cell(r, c, absolute, absolute)
    return f"'{sheet}'!{cell}" if " " in sheet else f"{sheet}!{cell}"


def rng(sheet, r0, r1, c, absolute=True):
    a = xl_rowcol_to_cell(r0, c, absolute, absolute)
    b = xl_rowcol_to_cell(r1, c, absolute, absolute)
    return f"'{sheet}'!{a}:{b}" if " " in sheet else f"{sheet}!{a}:{b}"


# ── Assumptions ─────────────────────────────────────────────────────────────
class AssLayout:
    bounds: dict = {}      # (cle, i) -> rang ; colonnes B, C, D = seed, venture, growth


def sheet_assumptions(bk: Book) -> None:
    ws = bk.sheet("Assumptions")
    bk.title(ws, "Assumptions", "Blue cells are inputs: change one and the whole workbook recalculates.")
    ws.set_column(0, 0, 66)
    ws.set_column(1, 4, 16)
    ws.set_column(5, 5, 70)
    inp = {k: bk.f(font_color=INPUT, num_format=v, align="right") for k, v in
           (("eur", EUR), ("pct0", PCT0), ("pct1", PCT1), ("pct2", "0.00%"), ("int", INT), ("txt", "@"),
            ("mult", MULT), ("mult2", "0.00"))}
    out = {k: bk.f(num_format=v, align="right") for k, v in (("eur", EUR), ("pct0", PCT0), ("int", INT))}
    note = bk.f(font_color=MUTED, italic=True)
    r = 3

    def put(label, name, value, kind, comment="", c=1):
        nonlocal r
        ws.write(r, 0, label)
        ws.write(r, c, value, inp[kind])
        if comment:
            ws.write(r, 5, comment, note)
        if name:
            bk.name(name, "Assumptions", r, c)
        r += 1

    def calc(label, name, formula, value, kind, comment=""):
        nonlocal r
        ws.write(r, 0, label)
        bk.formula(ws, r, 1, formula, value, out[kind])
        if comment:
            ws.write(r, 5, comment, note)
        if name:
            bk.name(name, "Assumptions", r, 1)
        r += 1

    bk.band(ws, r, "Fund", c1=5)
    r += 1
    put("Commitments (target Fund I)", "Commitments", FUND["commitments"], "eur")
    put("Fund term (years)", "TermYears", FUND["term_years"], "int")
    put("Investment period (years)", "IPYears", FUND["investment_period_years"], "int",
        "Management fee on commitments during this period")
    put("Successive closings after the first (months)", "ClosingMonths", FUND["closing_months"], "int",
        "Information; flows start at year 1 = year of first closing")
    if "first_close_min" in FUND:
        put("First close, minimum", "FirstCloseMin", FUND["first_close_min"], "eur", "Information")
        put("First close, maximum", "FirstCloseMax", FUND["first_close_max"], "eur", "Information")
    put("Max per company from the fund (% of commitments)", "CompanyCapPct", FUND["company_cap_pct"], "pct0")
    calc("Max per company from the fund", "CompanyCap", xmoney("CompanyCapPct*Commitments"),
         DATA["fund"]["company_cap"], "eur")
    put("Max per company with co-investment SPVs", "CompanyMaxSPV", FUND["company_max_with_spv"], "eur",
        "Above the fund's cap: one or several SPVs offered to investors, outside the fund")
    put("Europe (EU/EEA, UK, Switzerland), minimum", "EuropeMinPct", FUND["europe_min_pct"], "pct0", "Information")
    put("EuVECA qualifying investments, minimum", "QualifyingMinPct", FUND["euveca_qualifying_min_pct"], "pct0",
        "Information")
    r += 1

    bk.band(ws, r, "Terms", c1=5)
    r += 1
    put("Management fee during the investment period, on commitments", "FeeIP", TERMS["fee_ip_pct"], "pct1")
    put("Management fee after, on invested capital still held (at cost)", "FeePost", TERMS["fee_post_pct"], "pct1")
    put("Management fee, first-close investors", "FeeFirstClose", TERMS["fee_first_close_pct"], "pct2",
        "Information only: the model keeps the standard fee (prudent)")
    put("Set-up cost (year 1)", "SetupCost", TERMS["setup_cost"], "eur", EXPENSES)
    put("Running cost per year (platform, administration, audit)", "RunningCost", TERMS["running_cost"], "eur",
        EXPENSES)
    put("Carried interest", "Carry", TERMS["carry_pct"], "pct0")
    put("Hurdle (compounded annually)", "Hurdle", TERMS["hurdle_pct"], "pct0", "European whole-of-fund waterfall")
    put("GP catch-up", "CatchUp", TERMS["catch_up_pct"], "pct0")
    put("GP commitment, minimum (% of commitments)", "GPCommitPct", TERMS["gp_commit_min_pct"], "pct0", "Information")
    calc("GP commitment, minimum", "GPCommitMin", xmoney("GPCommitPct*Commitments"),
         DATA["terms"]["gp_commit_min"], "eur")
    put("Management fee on the loan sleeve, during the investment period", "FeeLoan", TERMS["fee_loan_pct"], "pct1",
        "Applied to the loans deployed (Construction); the rest of commitments pays the standard fee")
    ws.write(r, 0, "What if: partial secondary sale of a position (not in the pact; no line flagged)",
             bk.f(bold=True))
    r += 1
    put("Share of the position sold", "SecShare", SEC["share"], "pct0")
    put("Year of the secondary sale", "SecYear", SEC["year"], "int",
        "Applies to every flagged line that exits after this year")
    put("Price, % of the exit value", "SecPrice", SEC["price_pct"], "pct0")
    calc("Lines sold in part (flagged in Lines, column " + lc("partial") + ")", None,
         f'COUNTIF({LinesLayout.col("partial")},"yes")', len(DATA["secondary"]["lines"]), "int")
    r += 2

    ws.write(r, 0, "Cases: exit multiplier and optional cap, and the share of each loan repaid; everything else "
                   "unchanged", bk.f(bold=True))
    r += 1
    for case in fm.CASES:
        nm = CASE_NAME[case.id]
        ws.write(r, 0, f"{nm} case: exit cap (B), exit multiplier (C), loans repaid (D)")
        ws.write(r, 1, "none" if case.exit_cap is None else case.exit_cap,
                 inp["txt"] if case.exit_cap is None else inp["eur"])
        ws.write(r, 2, case.exit_mult, inp["pct0"])
        ws.write(r, 3, case.loan_repaid, inp["pct0"])
        bk.name(f"Cap{nm}", "Assumptions", r, 1)
        bk.name(f"Mult{nm}", "Assumptions", r, 2)
        bk.name(f"LoanRep{nm}", "Assumptions", r, 3)
        if case.id == "target":
            ws.write(r, 5, "Cap: an amount, or 'none'. Multiplier: share of every exit value kept. Loans repaid: "
                           "share of each line's modelled repayment received (the rest is a default loss).", note)
        elif case.id == "base":
            lm = fm.LOAN_MULTIPLES
            ws.write(r, 5, f"Line-level defaults are explicit (zombies {lm['zombie']}×, losses {lm['loss']}×); "
                           "the case factor adds losses on every loan on top of them.", note)
        r += 1
    r += 1

    bk.band(ws, r, "Layer bounds (portfolio construction rules)", c1=5)
    r += 1
    ws.write_row(r, 1, [LAYER_NAME[x] for x in fm.LAYERS], bk.f(bold=True, align="right"))
    r += 1
    for label, key, i, kind in (
        ("First ticket, minimum (first cheque, or buyback in Growth)", "ticket", 0, "eur"),
        ("First ticket, maximum (first cheque, or buyback in Growth)", "ticket", 1, "eur"),
        ("Entry valuation, minimum (post-money; at buyback in Growth)", "post", 0, "eur"),
        ("Entry valuation, maximum (post-money; at buyback in Growth)", "post", 1, "eur"),
        ("Entry stake, minimum", "own", 0, "pct1"),
        ("Entry stake, maximum (Growth: first cheque or stake bought back)", "own", 1, "pct1"),
    ):
        ws.write(r, 0, label)
        for j, layer in enumerate(fm.LAYERS):
            ws.write(r, 1 + j, fm.BOUNDS[layer][key][i], inp[kind])
        AssLayout.bounds[(key, i)] = r
        r += 1
    ws.write(r, 0, "Companies (new entries)")
    for j, layer in enumerate(fm.LAYERS):
        ws.write(r, 1 + j, fm.BOUNDS[layer]["companies"], inp["int"])
    AssLayout.bounds[("companies", 0)] = r
    r += 1
    ws.write(r, 0, f"Growth: blocks bought from end-of-life funds at a {pct_txt(max(x.discount or 0 for x in fm.LINES))} "
                   "discount, fresh growth rounds in new shares, and blocks bought in our own breakouts (kind "
                   f"'breakout': same company, not a new entry). Above {eur_txt(DATA['fund']['company_cap'])} per "
                   "company, SPVs.", note)
    r += 2

    bk.band(ws, r, "Buybacks and loans (replaces the v2 follow-on reserve policy)", c1=5)
    r += 1
    put("Buyback discount to the valuation of the time (default; Lines column " + lc("discount") + " overrides)",
        "BuybackDiscount", fm.BUYBACK_DISCOUNT, "pct0",
        "Every buyback of existing shares: angels, leavers, early funds, the founder")
    put("Loans, maximum (% of commitments)", "LoanCapPct", FUND["loan_cap_pct"], "pct0",
        "EuVECA: loans only to portfolio companies, at most 30% of commitments")
    calc("Loans, maximum", "LoanCap", xmoney("LoanCapPct*Commitments"), DATA["fund"]["loan_cap"], "eur")
    ws.write(r, 0, "Loan rate, performing loans (per year, compounded over each loan's tenor)")
    ws.write(r, 1, fm.LOAN_RATE, inp["pct0"])
    ws.write(r, 5, "Performing lines: multiple = (1 + rate) ^ (repayment year - draw year), rounded to 0.01 "
                   "(Lines, column " + lc("loan_mult") + "). No warrants: they would create new shares.", note)
    r += 1
    ws.write(r, 0, "Loan repayment multiple: zombie / loss (reference)")
    for j, k in enumerate(("zombie", "loss")):
        ws.write(r, 1 + j, fm.LOAN_MULTIPLES[k], inp["mult2"])
    ws.write(r, 5, "Reference values: each distressed line carries its own multiple (Lines, column "
                   + lc("loan_mult") + ")", note)
    r += 1
    ws.write(r, 0, "After the first cheque, no new shares while the founder grows with ProFund")
    ws.write(r, 5, "If the founder raises elsewhere, ProFund follows or leads the round in new shares (Lines, columns "
                   f"{lc('follow')} to {lc('follow_post')}).", note)
    ws.freeze_panes(3, 0)


# ── Lines ───────────────────────────────────────────────────────────────────
# L'ordre des colonnes est celui du classeur livre (A..BE) : les lettres citees
# dans les notes et les autres onglets sortent de lc(), jamais en dur.
COLS = (
    # INPUTS (A..P), N est une formule
    "id", "layer", "company", "n", "status", "kind", "track", "first", "entry_post", "buyback",
    "entry_year", "buyback_year", "exit_year", "exit_pct", "exit_value", "recovery",
    # FORMULAS (Q..Y)
    "invested", "perco", "entry_pct", "p_target", "p_base", "p_stress", "m_target", "m_base", "m_stress",
    # CASH-FLOW HELPERS (Z..AK)
    "sp_target", "ep_target", "sc_target", "ec_target", "sp_base", "ep_base", "sc_base", "ec_base",
    "sp_stress", "ep_stress", "sc_stress", "ec_stress",
    # MECHANICS INPUTS (AL..AR)
    "buyback_value", "cancel", "dilution", "loan", "loan_year", "loan_repay_year", "loan_mult",
    # MECHANICS FORMULAS (AS..AY)
    "bought", "lr_target", "eq_target", "eq_base", "eq_stress", "lr_base", "lr_stress",
    # HARDENING AND FOLLOW-ON INPUTS (AZ..BE), BD est une formule
    "discount", "follow", "follow_year", "follow_post", "follow_stake", "partial",
)
COL = {k: i for i, k in enumerate(COLS)}
INPUTS = ("id", "layer", "company", "n", "status", "kind", "track", "first", "entry_post", "buyback", "entry_year",
          "buyback_year", "exit_year", "exit_value", "recovery", "buyback_value", "cancel", "dilution", "loan",
          "loan_year", "loan_repay_year", "loan_mult", "discount", "follow", "follow_year", "follow_post", "partial")


def lc(key: str) -> str:
    """Lettre de colonne de l'onglet Lines : les formules ne citent jamais une lettre en dur."""
    return xl_col_to_name(COL[key])


HEAD = {
    "id": "Deal ID", "layer": "Layer", "company": "Company (exit key)", "n": "Companies on the line",
    "status": "Outcome", "kind": "Kind", "track": "Seed track (lead / radar)",
    "first": "First cheque, new shares (line total)",
    "entry_post": "Entry valuation: post-money, or at buyback in Growth (per company)",
    "buyback": "Buybacks of existing shares (line total)", "entry_year": "Entry year", "buyback_year": "Buyback year",
    "exit_year": "Exit year",
    "exit_pct": "Exit stake (formula: entry + buybacks, after cancellations and outside rounds)",
    "exit_value": "Exit value (100%, before the case multiplier)",
    "recovery": "Recovery multiple on equity (if no exit value)",
    "invested": "Invested (equity + loans)", "perco": "Invested per company", "entry_pct": "Entry stake",
    "buyback_value": "Buyback valuation (100%, per company)",
    "cancel": "Company buyback and cancellation (% of shares)",
    "dilution": "Outside dilution (founder raised elsewhere)", "loan": "Loan (line total)",
    "loan_year": "Loan draw year", "loan_repay_year": "Loan repayment year", "loan_mult": "Loan repayment multiple",
    "bought": "Stake bought back (per company)",
    "discount": "Buyback discount (line; blank = default)",
    "follow": "Follow-on in new shares when the founder raises elsewhere (line total)",
    "follow_year": "Follow-on year", "follow_post": "Outside round, post-money (per company)",
    "follow_stake": "Stake from the follow-on (per company)",
    "partial": "What if: partial secondary sale (yes / no)",
}
for _c in CASE_IDS:
    _n = CASE_NAME[_c]
    HEAD[f"p_{_c}"] = f"Proceeds · {_n} (equity + loan)"
    HEAD[f"m_{_c}"] = f"MOIC · {_n}"
    HEAD[f"sp_{_c}"] = f"{_n} · secondary sale proceeds (equity)"
    HEAD[f"ep_{_c}"] = f"{_n} · equity proceeds at exit year"
    HEAD[f"sc_{_c}"] = f"{_n} · equity cost sold in secondary"
    HEAD[f"ec_{_c}"] = f"{_n} · equity cost at exit year"
    HEAD[f"eq_{_c}"] = f"Equity proceeds · {_n}"
    HEAD[f"lr_{_c}"] = f"Loan repayment · {_n} (line)"


class LinesLayout:
    first = 5
    rows: dict = {}        # id de ligne -> rang
    sub: dict = {}         # etage -> rang de la ligne SUB
    total = 0
    last = 0

    @classmethod
    def col(cls, key, r0=None, r1=None):
        """Plage absolue d'une colonne sur tout le bloc (lignes SUB comprises : leurs criteres sont vides)."""
        return rng("Lines", cls.first if r0 is None else r0, cls.last if r1 is None else r1, COL[key])


def _layout_lines():
    r = LinesLayout.first
    for layer in fm.LAYERS:
        for line in (x for x in fm.LINES if x.layer == layer):
            LinesLayout.rows[line.id] = r
            r += 1
        LinesLayout.sub[layer] = r
        r += 1
    LinesLayout.last = r - 1
    LinesLayout.total = r


def _exit_expr(case_id: str, x: int) -> str:
    nm = CASE_NAME[case_id]
    v = f"${lc('exit_value')}{x}*Mult{nm}"
    return f"IF(ISNUMBER(Cap{nm}),MIN({v},Cap{nm}),{v})"


def line_values(line) -> dict:
    """Le miroir Python de chaque formule d'une ligne (fund_model)."""
    out = {
        "exit_pct": "" if line.recovery is not None else fm.exit_stake(line),
        "invested": fm.invested(line), "perco": fm.invested(line) / line.n, "entry_pct": fm.entry_stake(line),
        "bought": fm.bought_stake(line), "follow_stake": fm.follow_stake(line),
    }
    for case_id in CASE_IDS:
        case = CASES[case_id]
        p = fm.proceeds(line, case)
        out[f"p_{case_id}"] = p
        out[f"m_{case_id}"] = ratio(p / fm.invested(line), 1)
        out[f"eq_{case_id}"] = fm.equity_proceeds(line, case)
        out[f"lr_{case_id}"] = fm.loan_repayment(line, case)
        sec, rest, sc = fm.secondary_split(line, case)
        out[f"sp_{case_id}"] = sec
        out[f"ep_{case_id}"] = rest
        out[f"sc_{case_id}"] = sc
        out[f"ec_{case_id}"] = fm.equity_cost(line) - sc
    return out


def sheet_lines(bk: Book) -> None:
    ws = bk.sheet("Lines", grid=True)
    bk.title(ws, "Fund simulation — line by line",
             "Seed (S-), Venture (V-) and Growth (G-) lines. A line may group several companies (n): amounts are "
             "line totals. Blue = input, black = formula. While the founder grows with ProFund: no new shares after "
             "the first cheque, exposure grows by buybacks, growth is financed by loans. If the founder raises "
             f"elsewhere, ProFund follows or leads in new shares (columns {lc('follow')} to {lc('follow_post')}).")
    ws.set_column(0, len(COLS) - 1, 14)
    ws.set_column(COL["status"], COL["status"], 40)
    ws.set_column(COL["sp_target"], COL["ec_stress"], 15, None, {"level": 1})

    groups = (("INPUTS", 0, COL["recovery"], BLUE_DK), ("FORMULAS", COL["invested"], COL["m_stress"], BLUE),
              ("CASH-FLOW HELPERS (used by the Cash flows tab)", COL["sp_target"], COL["ec_stress"], MUTED),
              ("MECHANICS INPUTS (v3)", COL["buyback_value"], COL["loan_mult"], BLUE_DK),
              ("MECHANICS FORMULAS (v3)", COL["bought"], COL["lr_stress"], BLUE),
              ("HARDENING AND FOLLOW-ON INPUTS (v3.1)", COL["discount"], COL["partial"], BLUE_DK))
    for text, c0, c1, fill in groups:
        bk.band(ws, 3, text, c0, c1, fill)
    ws.set_row(4, 66)
    hd = bk.f(bold=True, bg_color=BAND, text_wrap=True, align="center", border=1, border_color=LINE)
    for key, c in COL.items():
        ws.write(4, c, HEAD[key], hd)

    kinds = {
        "eur": ("first", "entry_post", "buyback", "exit_value", "buyback_value", "loan", "follow", "follow_post"),
        "year": ("entry_year", "buyback_year", "exit_year", "loan_year", "loan_repay_year", "follow_year"),
        "pct": ("cancel", "dilution", "discount"), "mult": ("recovery", "loan_mult"),
    }
    fmt_in = {k: bk.f(font_color=INPUT) for k in INPUTS}
    fmt_in["id"] = bk.f(font_color=INPUT, bold=True)
    fmt_in["track"] = bk.f(font_color=INPUT, bold=True)
    fmt_in["n"] = bk.f(font_color=INPUT, num_format=INT, align="center")
    fmt_in["partial"] = bk.f(font_color=INPUT, align="center")
    for k in kinds["eur"]:
        fmt_in[k] = bk.f(font_color=INPUT, num_format=EUR)
    for k in kinds["year"]:
        fmt_in[k] = bk.f(font_color=INPUT, num_format=YEAR, align="center")
    for k in kinds["pct"]:
        fmt_in[k] = bk.f(font_color=INPUT, num_format=PCT0)
    for k in kinds["mult"]:
        fmt_in[k] = bk.f(font_color=INPUT, num_format=MULT)
    eur, pct1, mult = bk.f(num_format=EUR), bk.f(num_format=PCT1), bk.f(num_format=MULT)
    helper = bk.f(num_format=EUR, font_color=MUTED)
    sub_txt = bk.f(bold=True, bg_color=BAND)
    sub_eur, sub_mult = bk.f(bold=True, bg_color=BAND, num_format=EUR), bk.f(bold=True, bg_color=BAND, num_format=MULT)

    for line in fm.LINES:
        r = LinesLayout.rows[line.id]
        x = r + 1                                    # numero de ligne Excel
        ins = {
            "id": row_id(line), "layer": LAYER_NAME[line.layer], "company": line.company, "n": line.n,
            "status": line.status, "kind": line.kind,
            "track": line.track.capitalize() if line.track else None,
            "first": line.first, "entry_post": line.entry_post, "buyback": line.buyback,
            "entry_year": line.entry_year, "buyback_year": line.buyback_year, "exit_year": line.exit_year,
            "exit_value": line.exit_value, "recovery": line.recovery, "buyback_value": line.buyback_value,
            "cancel": line.cancel, "dilution": line.dilution, "loan": line.loan,
            "loan_year": line.loan_year, "loan_repay_year": line.loan_repay_year, "loan_mult": line.loan_mult,
            "discount": line.discount, "follow": line.follow, "follow_year": line.follow_year,
            "follow_post": line.follow_post, "partial": "yes" if line.partial else "no",
        }
        for key in INPUTS:
            v = ins[key]
            if v is None:
                ws.write_blank(r, COL[key], None, fmt_in[key])
            else:
                ws.write(r, COL[key], v, fmt_in[key])
        V = line_values(line)
        c = {k: f"{lc(k)}{x}" for k in COLS}
        a = {k: f"${lc(k)}{x}" for k in COLS}

        def put(key, formula, fmt):
            bk.formula(ws, r, COL[key], formula, V[key], fmt)

        eq_cost = f"({a['first']}+{a['buyback']}+{a['follow']})"
        put("exit_pct", f"IF(ISNUMBER({a['recovery']}),\"\",ROUND(({c['entry_pct']}+{c['bought']})/(1-{c['cancel']})"
                        f"*(1-{c['dilution']})+{c['follow_stake']},3))", pct1)
        put("invested", f"{c['first']}+{c['buyback']}+{c['loan']}+{c['follow']}", eur)
        put("perco", f"{c['invested']}/{c['n']}", eur)
        put("entry_pct", f"ROUND({c['first']}/{c['n']}/{c['entry_post']},3)", pct1)
        put("bought", f"IF({c['buyback']}=0,0,ROUND({c['buyback']}/{c['n']}/({c['buyback_value']}*(1-IF(ISNUMBER("
                      f"{c['discount']}),{c['discount']},BuybackDiscount))),3))", pct1)
        put("follow_stake", f"IF({c['follow']}=0,0,ROUND({c['follow']}/{c['n']}/{c['follow_post']},3))", pct1)
        for case_id in CASE_IDS:
            nm = CASE_NAME[case_id]
            v = _exit_expr(case_id, x)
            eq = f"{lc(f'eq_{case_id}')}{x}"
            put(f"lr_{case_id}", f"IF({c['loan']}=0,0,{xmoney(f'{c['loan']}*{c['loan_mult']}*LoanRep{nm}')})",
                eur)
            put(f"eq_{case_id}", f"IF(ISNUMBER({a['recovery']}),{xmoney(f'{a['recovery']}*{eq_cost}')},"
                                 f"{xmoney(f'MAX({a['exit_pct']}*{v},MIN({a['first']},{v}))')})",
                eur)
            put(f"p_{case_id}", f"{eq}+{lc(f'lr_{case_id}')}{x}", eur)
            put(f"m_{case_id}", f"ROUND({lc(f'p_{case_id}')}{x}/{a['invested']},1)", mult)
            flag = f"AND({a['partial']}=\"yes\",{a['exit_year']}>SecYear,{eq}<>0)"
            put(f"sp_{case_id}", f"IF({flag},{xmoney(f'SecShare*SecPrice*{eq}')},0)", helper)
            put(f"ep_{case_id}", f"IF({flag},{xmoney(f'(1-SecShare)*{eq}')},{eq})", helper)
            put(f"sc_{case_id}", f"IF({flag},SecShare*{eq_cost},0)", helper)
            put(f"ec_{case_id}", f"{eq_cost}-{lc(f'sc_{case_id}')}{x}", helper)

    sums = ("first", "buyback", "invested", "loan", "follow") + tuple(
        f"{k}_{c}" for c in CASE_IDS for k in ("p", "eq", "lr"))
    tot_vals = {k: 0 for k in sums}
    for layer in fm.LAYERS:
        r = LinesLayout.sub[layer]
        lines = [x for x in fm.LINES if x.layer == layer]
        r0, r1 = LinesLayout.rows[lines[0].id] + 1, LinesLayout.rows[lines[-1].id] + 1
        for c in range(len(COLS)):
            ws.write_blank(r, c, None, sub_txt)
        ws.write(r, 0, "SUB", sub_txt)
        ws.write(r, COL["status"], f"({LAYER_NAME[layer]})", sub_txt)
        vals = {k: 0 for k in sums}
        for line in lines:
            V = line_values(line)
            for k in sums:
                vals[k] += getattr(line, k) if k in ("first", "buyback", "loan", "follow") else V[k]
        for k in sums:
            cl = lc(k)
            bk.formula(ws, r, COL[k], f"SUM({cl}{r0}:{cl}{r1})", vals[k], sub_eur)
            tot_vals[k] += vals[k]
        for case_id in CASE_IDS:
            bk.formula(ws, r, COL[f"m_{case_id}"], f"ROUND({lc(f'p_{case_id}')}{r + 1}/{lc('invested')}{r + 1},1)",
                       ratio(vals[f"p_{case_id}"] / vals["invested"], 1), sub_mult)
        lay = DATA["layers"][layer]
        assert vals["invested"] == lay["invested"] and vals["p_target"] == lay["proceeds"]["target"], layer

    r = LinesLayout.total
    tot_txt = bk.f(bold=True, top=2, top_color=INK)
    tot_eur = bk.f(bold=True, top=2, top_color=INK, num_format=EUR)
    tot_mult = bk.f(bold=True, top=2, top_color=INK, num_format=MULT)
    for c in range(len(COLS)):
        ws.write_blank(r, c, None, tot_txt)
    ws.write(r, 0, "TOTAL", tot_txt)
    subs = [LinesLayout.sub[x] + 1 for x in fm.LAYERS]
    for k in sums:
        cl = lc(k)
        bk.formula(ws, r, COL[k], "+".join(f"{cl}{s}" for s in subs), tot_vals[k], tot_eur)
    for case_id in CASE_IDS:
        assert tot_vals[f"p_{case_id}"] == DATA["cases"][case_id]["gross_proceeds"], case_id
        bk.formula(ws, r, COL[f"m_{case_id}"], f"ROUND({lc(f'p_{case_id}')}{r + 1}/{lc('invested')}{r + 1},1)",
                   ratio(tot_vals[f"p_{case_id}"] / tot_vals["invested"], 1), tot_mult)
    ws.write(r + 2, 0, "Equity proceeds = exit stake × exit value × case multiplier (capped if a cap is set), floored by "
                       "the 1× preference on the first cheque; or recovery multiple × equity invested. Exit stake = "
                       "(entry stake + stake bought back at the line's discount) ÷ (1 − cancellations) × (1 − outside "
                       "dilution) + stake from the follow-on in the outside round. Loan repayment = loan × repayment "
                       "multiple × share repaid in the case, received in the repayment year. Amounts rounded to EUR "
                       "10K below EUR 1M and EUR 100K above, before any sum. A what-if partial secondary sale "
                       "(not in the pact) is in the helpers and the Cash flows tab, unused. Kind 'breakout' = a block "
                       "bought at growth stage in a company already in the portfolio (same exit key): not a new "
                       "company.", bk.f(font_color=MUTED, italic=True))
    ws.freeze_panes(5, 1)


# ── Construction ────────────────────────────────────────────────────────────
class ConsLayout:
    layer_row: dict = {}
    total_row = 0
    cols: dict = {}
    alloc: dict = {}
    returner: dict = {}
    exposure: dict = {}
    loan_cap_row = 0


def sheet_construction(bk: Book, cf_out: dict) -> None:
    ws = bk.sheet("Construction")
    bk.title(ws, "Portfolio construction",
             "Per layer, capital allocation (first cheques, buybacks, loans), loans vs the EuVECA cap and exposure "
             "per company.")
    ws.set_column(0, 0, 50)
    ws.set_column(1, 14, 15)
    hd = bk.f(bold=True, bg_color=BAND, text_wrap=True, align="center", border=1, border_color=LINE)
    eur, mult, pct0, num = bk.f(num_format=EUR), bk.f(num_format=MULT), bk.f(num_format=PCT0), bk.f(num_format=INT)
    bold = {k: bk.f(bold=True, top=1, top_color=INK, num_format=v) for k, v in
            (("eur", EUR), ("mult", MULT), ("pct0", PCT0), ("int", INT), ("txt", "@"))}
    L = LinesLayout
    lay_all = DATA["layers"]

    r = 3
    bk.band(ws, r, "Portfolio by layer", c1=14)
    r += 1
    cols = ["companies", "positions", "first", "buy_follow", "invested", "loans", "loans_pct"] + \
        [f"p_{c}" for c in CASE_IDS] + [f"m_{c}" for c in CASE_IDS]
    heads = ["Companies (new entries)", "Positions (lines)", "First cheques (new shares)",
             "Buybacks + follow-ons in outside rounds", "Invested (incl. loans)", "Of which loans",
             "Loans, share of invested"] + \
        [f"Proceeds · {CASE_NAME[c]}" for c in CASE_IDS] + [f"Gross MOIC · {CASE_NAME[c]}" for c in CASE_IDS]
    ConsLayout.cols = C = {k: 1 + i for i, k in enumerate(cols)}
    cl = {k: xl_col_to_name(v) for k, v in C.items()}
    ws.set_row(r, 32)
    ws.write(r, 0, "Layer", hd)
    for i, h in enumerate(heads):
        ws.write(r, 1 + i, h, hd)
    r += 1
    for layer in fm.LAYERS:
        ConsLayout.layer_row[layer] = r
        x, crit = r + 1, f"$A{r + 1}"
        lay = lay_all[layer]
        ws.write(r, 0, LAYER_NAME[layer], bk.f(bold=True))
        bk.formula(ws, r, C["companies"], f'SUMIFS({L.col("n")},{L.col("layer")},{crit},{L.col("kind")},"new")',
                   lay["companies"], num)
        bk.formula(ws, r, C["positions"], f"COUNTIF({L.col('layer')},{crit})", lay["positions"], num)
        bk.formula(ws, r, C["first"], f"SUMIF({L.col('layer')},{crit},{L.col('first')})", lay["first"], eur)
        bk.formula(ws, r, C["buy_follow"], f"SUMIF({L.col('layer')},{crit},{L.col('buyback')})"
                                           f"+SUMIF({L.col('layer')},{crit},{L.col('follow')})",
                   lay["buyback"] + lay["follow"], eur)
        bk.formula(ws, r, C["invested"], f"SUMIF({L.col('layer')},{crit},{L.col('invested')})", lay["invested"], eur)
        bk.formula(ws, r, C["loans"], f"SUMIF({L.col('layer')},{crit},{L.col('loan')})", lay["loans"], eur)
        bk.formula(ws, r, C["loans_pct"], f"IF({cl['invested']}{x}=0,0,ROUND({cl['loans']}{x}/{cl['invested']}{x},2))",
                   lay["loans_pct"], pct0)
        for case in CASE_IDS:
            bk.formula(ws, r, C[f"p_{case}"], f"SUMIF({L.col('layer')},{crit},{L.col(f'p_{case}')})",
                       lay["proceeds"][case], eur)
            bk.formula(ws, r, C[f"m_{case}"],
                       f"IF(${cl['invested']}{x}=0,0,ROUND({cl[f'p_{case}']}{x}/${cl['invested']}{x},1))",
                       lay["moic"][case], mult)
        r += 1
    ConsLayout.total_row = r
    r0, r1 = ConsLayout.layer_row["seed"] + 1, ConsLayout.layer_row["growth"] + 1
    ws.write(r, 0, "Total", bold["txt"])
    a = DATA["allocation"]
    totals = {"companies": DATA["fund"]["companies"], "positions": DATA["fund"]["positions"], "first": a["first"],
              "buy_follow": a["buyback_follow"], "invested": a["invested"], "loans": a["loans"]}
    for key, val in totals.items():
        bk.formula(ws, r, C[key], f"SUM({cl[key]}{r0}:{cl[key]}{r1})", val,
                   bold["int" if key in ("companies", "positions") else "eur"])
    bk.formula(ws, r, C["loans_pct"], f"IF({cl['invested']}{r + 1}=0,0,ROUND({cl['loans']}{r + 1}/{cl['invested']}{r + 1},2))",
               a["loans_pct"], bold["pct0"])
    for case in CASE_IDS:
        gross = DATA["cases"][case]["gross_proceeds"]
        bk.formula(ws, r, C[f"p_{case}"], f"SUM({cl[f'p_{case}']}{r0}:{cl[f'p_{case}']}{r1})", gross, bold["eur"])
        bk.formula(ws, r, C[f"m_{case}"], f"ROUND({cl[f'p_{case}']}{r + 1}/{cl['invested']}{r + 1},1)",
                   ratio(gross / a["invested"], 1), bold["mult"])
    r += 3

    # Allocation : les frais du cas cible (Cash flows), la reserve tombe juste
    bk.band(ws, r, "Capital allocation", c1=3)
    r += 1
    lr = ConsLayout.layer_row
    inv_cell = cl["invested"]
    items = [
        ("seed", f"{LAYER_NAME['seed']} — invested", f"{inv_cell}{lr['seed'] + 1}", a["seed"], eur),
        ("venture", f"{LAYER_NAME['venture']} — invested", f"{inv_cell}{lr['venture'] + 1}", a["venture"], eur),
        ("growth", f"{LAYER_NAME['growth']} — invested", f"{inv_cell}{lr['growth'] + 1}", a["growth"], eur),
        ("invested", "Invested", None, a["invested"], bold["eur"]),
        ("first", "  of which first cheques (new shares)",
         f'SUMIFS({L.col("first")},{L.col("kind")},"new")+SUMIFS({L.col("first")},{L.col("kind")},"breakout")',
         a["first"], eur),
        ("buyback_follow", "  of which buybacks and follow-ons in outside rounds",
         f'SUMIFS({L.col("buyback")},{L.col("kind")},"new")+SUMIFS({L.col("buyback")},{L.col("kind")},"breakout")'
         f'+SUMIFS({L.col("follow")},{L.col("kind")},"new")+SUMIFS({L.col("follow")},{L.col("kind")},"breakout")',
         a["buyback_follow"], eur),
        ("loans", "  of which loans",
         f'SUMIFS({L.col("loan")},{L.col("kind")},"new")+SUMIFS({L.col("loan")},{L.col("kind")},"breakout")',
         a["loans"], eur),
        ("mgmt_fees", "Management fees (upside case)", cf_out["target"]["mgmt_fees"], a["mgmt_fees"], eur),
        ("fund_expenses", "Fund expenses, incl. set-up (upside case)", cf_out["target"]["fund_expenses"],
         a["fund_expenses"], eur),
        ("contingency", "Contingency", None, a["contingency"], eur),
        ("total", "Total commitments", "Commitments", a["total"], bold["eur"]),
    ]
    for key, label, formula, value, fmt in items:
        ConsLayout.alloc[key] = r
        ws.write(r, 0, label, bk.f(bold=True) if fmt is bold["eur"] else None)
        al = ConsLayout.alloc
        if key == "invested":
            formula = "+".join(f"B{al[k] + 1}" for k in ("seed", "venture", "growth"))
        elif key == "contingency":
            formula = xmoney(f"Commitments-B{al['invested'] + 1}-B{al['mgmt_fees'] + 1}-B{al['fund_expenses'] + 1}")
        bk.formula(ws, r, 1, formula, value, fmt)
        if key == "loans":
            bk.name("LoanSleeve", "Construction", r, 1)
        r += 1
    ConsLayout.alloc_after = r
    ws.write(r, 0, "  share of invested capital after the first cheque (buybacks, follow-ons, loans)")
    bk.formula(ws, r, 1, f"ROUND((B{ConsLayout.alloc['invested'] + 1}-B{ConsLayout.alloc['first'] + 1})"
                         f"/B{ConsLayout.alloc['invested'] + 1},2)", a["after_first_pct"], pct0)
    ConsLayout.alloc["after_first_pct"] = r
    r += 3

    # Prets et plafond EuVECA
    bk.band(ws, r, "Loans vs the EuVECA cap", c1=5)
    r += 1
    for i, h in enumerate(("Scope", "Loans deployed", "Cap (% of commitments)", "Cap", "Headroom", "Within cap")):
        ws.write(r, i, h, hd)
    r += 1
    x = r + 1
    ws.write(r, 0, "All lines", bk.f(bold=True))
    loans = a["loans"]
    cap = DATA["fund"]["loan_cap"]
    bk.formula(ws, r, 1, f"B{ConsLayout.alloc['loans'] + 1}", loans, eur)
    bk.formula(ws, r, 2, "LoanCapPct", FUND["loan_cap_pct"], pct0)
    bk.formula(ws, r, 3, "LoanCap", cap, eur)
    bk.formula(ws, r, 4, f"D{x}-B{x}", cap - loans, eur)
    bk.formula(ws, r, 5, f'IF(B{x}<=D{x},"OK","CHECK")', "OK" if loans <= cap else "CHECK", bk.f(align="center", bold=True))
    ConsLayout.loan_cap_row = r
    r += 3

    # Exposition par societe (toutes lignes) et fund returner
    bk.band(ws, r, "Exposure per company (all lines, per company) and fund returner", c1=6)
    r += 1
    for i, h in enumerate(("Company", "Invested by the fund", "Cap from the fund", "Within cap",
                           "Proceeds · Upside (all lines)", "SPV top-up to the max per company")):
        ws.write(r, i, h, hd)
    ws.set_row(r, 32)
    r += 1
    expo = fm.exposures()
    by_co: dict[str, int] = {}
    for line in fm.LINES:
        by_co[line.company] = by_co.get(line.company, 0) + fm.proceeds(line, CASES["target"])
    first = r
    spv = {s["company"]: s for s in DATA["spv"]}
    for co in expo:
        x = r + 1
        ws.write(r, 0, co, bk.f(bold=True))
        bk.formula(ws, r, 1, xmoney(f'SUMIF({L.col("company")},A{x},{L.col("perco")})'), fm.money(expo[co]), eur)
        bk.formula(ws, r, 2, "CompanyCap", DATA["fund"]["company_cap"], eur)
        bk.formula(ws, r, 3, f'IF(SUMIF({L.col("company")},A{x},{L.col("perco")})<=C{x}+1,"OK","CHECK")',
                   "OK" if expo[co] <= DATA["fund"]["company_cap"] + 1 else "CHECK", bk.f(align="center", bold=True))
        bk.formula(ws, r, 4, f'SUMIF({L.col("company")},A{x},{L.col("p_target")})', by_co[co], eur)
        if co in spv:
            bk.formula(ws, r, 5, xmoney(f'CompanyMaxSPV-SUMIF({L.col("company")},A{x},{L.col("perco")})'),
                       spv[co]["spv"], eur)
        ConsLayout.exposure[co] = r
        r += 1
    last = r - 1
    ConsLayout.exposure_range = (first, last)
    r += 1
    ws.write(r, 0, "SPV top-ups, total (outside the fund)", bk.f(bold=True))
    bk.formula(ws, r, 5, f"SUM(F{first + 1}:F{last + 1})", DATA["spv_total"], bold["eur"])
    ConsLayout.exposure["_spv_total"] = r
    r += 2
    fr = DATA["fund_returner"]
    for key, label, formula, value, fmt in (
        ("company", "Fund returner (largest proceeds, Upside)",
         f"INDEX(A{first + 1}:A{last + 1},MATCH(MAX(E{first + 1}:E{last + 1}),E{first + 1}:E{last + 1},0))",
         fr["company"], bk.f(bold=True, align="right")),
        ("proceeds", "  its proceeds, all lines", f"MAX(E{first + 1}:E{last + 1})", fr["proceeds"], eur),
        ("multiple", "  multiple of the fund", f"ROUND(B{r + 2}/Commitments,1)", fr["multiple_of_fund"], mult),
    ):
        ws.write(r, 0, label)
        bk.formula(ws, r, 1, formula, value, fmt)
        ConsLayout.returner[key] = r
        r += 1
    ws.freeze_panes(3, 1)


# ── Cash flows ──────────────────────────────────────────────────────────────
FLOW_ROWS = (
    ("inv", "Investments (first cheques, buybacks, follow-ons and loans)", True),
    ("exitp", "Exit proceeds and loan repayments, incl. the partial secondary sale", True),
    ("tail", "Running costs of the years after the horizon, set aside", True),
    ("dist", "Distributable proceeds", True),
    ("cost", "Cost of the positions sold and of the loans repaid", True),
    ("nic", "Net invested capital at cost, end of year", False),
    ("mgmt", "Management fees", True),
    ("exp", "Fund expenses", True),
    ("calls", "Capital calls", True),
    None,
    ("hb0", "Hurdle balance before distribution (capital + 8% compounded)", False),
    ("a", "1. Return of capital and preferred return to LPs", True),
    ("hb1", "Hurdle balance after distribution", False),
    ("contrib", "Cumulative contributions", False),
    ("d1", "Remaining after step 1", False),
    ("po1", "Cumulative paid out after step 1", False),
    ("x", "2. GP catch-up", True),
    ("d2", "Remaining after step 2", False),
    ("lps", "3. Split: to LPs", True),
    ("gps", "3. Split: carried interest to the GP", True),
    ("po", "Cumulative paid out", False),
    ("gpc", "Cumulative carried interest", False),
    None,
    ("lp", "LP distributions", True),
    ("gp", "GP carried interest", True),
    ("net", "Net LP cash flow (distributions − calls)", True),
    ("gross", "Gross fund cash flow (exit proceeds − investments)", True),
)
OUT_ROWS = (
    ("gross_proceeds", "Gross proceeds (exits at value + loan repayments)", "eur"),
    ("realised", "Realised (exit proceeds incl. secondary, and loan repayments)", "eur"),
    ("secondary_discount", "Secondary discount", "eur"),
    ("paid_in", "Paid-in capital", "eur"),
    ("mgmt_fees", "Management fees", "eur"),
    ("fund_expenses", "Fund expenses", "eur"),
    ("lp_distributions", "LP distributions", "eur"),
    ("carry", "Carried interest", "eur"),
    ("net_tvpi", "Net TVPI", "mult"),
    ("net_irr", "Net IRR", "pct0"),
    ("gross_irr", "Gross IRR", "pct0"),
    ("dpi_year6", "Net DPI by year 6", "mult"),
    ("dpi_year7", "Net DPI by year 7", "mult"),
    ("loans_multiple", "Loans: repaid ÷ lent", "mult2"),
    ("largest_exit", "Largest exit (after the case multiplier and cap)", "eur"),
    ("clawback", "GP clawback (must be zero)", "eur"),
)


def mirror_case(case):
    """Le miroir Python des formules de l'onglet Cash flows (meme ordre de calcul que run_case)."""
    n = len(YEARS)
    R = {k[0]: [0.0] * n for k in FLOW_ROWS if k}
    tail = TERMS["running_cost"] * max(0, FUND["term_years"] - HORIZON)
    sp_tot, sc_tot = 0.0, 0.0
    sleeve = sum(x.loan for x in fm.LINES)
    for line in fm.LINES:
        R["inv"][line.entry_year - 1] += line.first
        if line.buyback:
            R["inv"][line.buyback_year - 1] += line.buyback
        if line.follow:
            R["inv"][line.follow_year - 1] += line.follow
        if line.loan:
            R["inv"][line.loan_year - 1] += line.loan
            R["exitp"][line.loan_repay_year - 1] += fm.loan_repayment(line, case)
            R["cost"][line.loan_repay_year - 1] += line.loan
        sec, rest, sc = fm.secondary_split(line, case)
        sp_tot += sec
        sc_tot += sc
        R["exitp"][line.exit_year - 1] += rest
        R["cost"][line.exit_year - 1] += fm.equity_cost(line) - sc
    R["exitp"][SEC["year"] - 1] += sp_tot
    R["cost"][SEC["year"] - 1] += sc_tot
    R["tail"][HORIZON - 1] = -tail
    prev = {"nic": 0.0, "hb1": 0.0, "contrib": 0.0, "po": 0.0, "gpc": 0.0}
    carry, c_up = TERMS["carry_pct"], TERMS["catch_up_pct"]
    for i, year in enumerate(YEARS):
        R["dist"][i] = R["exitp"][i] + R["tail"][i]
        R["nic"][i] = prev["nic"] + R["inv"][i] - R["cost"][i]
        if year > HORIZON:
            R["mgmt"][i] = R["exp"][i] = 0.0
        else:
            R["mgmt"][i] = (TERMS["fee_ip_pct"] * (FUND["commitments"] - sleeve) + TERMS["fee_loan_pct"] * sleeve
                            if year <= FUND["investment_period_years"]
                            else TERMS["fee_post_pct"] * max(prev["nic"], 0.0))
            R["exp"][i] = TERMS["running_cost"] + (TERMS["setup_cost"] if year == 1 else 0)
        R["calls"][i] = R["inv"][i] + R["mgmt"][i] + R["exp"][i]
        R["hb0"][i] = prev["hb1"] * (1 + TERMS["hurdle_pct"]) + R["calls"][i]
        R["a"][i] = min(R["dist"][i], R["hb0"][i])
        R["hb1"][i] = R["hb0"][i] - R["a"][i]
        R["contrib"][i] = prev["contrib"] + R["calls"][i]
        R["d1"][i] = R["dist"][i] - R["a"][i]
        R["po1"][i] = prev["po"] + R["a"][i]
        R["x"][i] = (min(R["d1"][i], max(0.0, (carry * (R["po1"][i] - R["contrib"][i]) - prev["gpc"]) / (1 - carry)))
                     * c_up if R["d1"][i] > 0 else 0.0)
        R["d2"][i] = R["d1"][i] - R["x"][i]
        R["lps"][i] = (1 - carry) * R["d2"][i] if R["d2"][i] > 0 else 0.0
        R["gps"][i] = carry * R["d2"][i] if R["d2"][i] > 0 else 0.0
        R["po"][i] = R["po1"][i] + R["x"][i] + (R["d2"][i] if R["d2"][i] > 0 else 0.0)
        R["gpc"][i] = prev["gpc"] + R["x"][i] + R["gps"][i]
        R["lp"][i] = R["a"][i] + R["lps"][i]
        R["gp"][i] = R["x"][i] + R["gps"][i]
        R["net"][i] = R["lp"][i] - R["calls"][i]
        R["gross"][i] = R["exitp"][i] - R["inv"][i]
        for k in prev:
            prev[k] = R[k][i]
    gross = sum(fm.proceeds(x, case) for x in fm.LINES)
    lp_t, calls_t = sum(R["lp"]), sum(R["calls"])
    repaid = sum(fm.loan_repayment(x, case) for x in fm.LINES)
    out = {
        "gross_proceeds": gross,
        "realised": fm.money(sum(R["exitp"])),
        "paid_in": fm.money(calls_t),
        "mgmt_fees": fm.money(sum(R["mgmt"])),
        "fund_expenses": fm.money(sum(R["exp"]) + tail),
        "lp_distributions": fm.money(lp_t),
        "carry": fm.money(sum(R["gp"])),
        "net_tvpi": ratio(lp_t / calls_t, 1),
        "net_irr": ratio(fm.irr(R["net"]), 2),
        "gross_irr": ratio(fm.irr(R["gross"]), 2),
        "dpi_year6": ratio(sum(R["lp"][:6]) / sum(R["calls"][:6]), 1),
        "dpi_year7": ratio(sum(R["lp"][:7]) / sum(R["calls"][:7]), 1),
        "loans_multiple": ratio(repaid / sleeve, 2) if sleeve else 0.0,
        "largest_exit": fm.money(max(fm.exit_value(x, case) for x in fm.LINES if x.exit_value)),
        "clawback": max(0.0, R["gpc"][-1] - carry * max(0.0, R["po"][-1] - R["contrib"][-1])),
    }
    out["secondary_discount"] = gross - out["realised"]
    return R, out


class CFLayout:
    year_row = 6
    rows: dict = {}     # (cas, cle) -> rang
    out: dict = {}      # (cas, cle) -> rang


def sheet_cashflows(bk: Book) -> dict:
    ws = bk.sheet("Cash flows", grid=True)
    bk.title(ws, "Cash flows — yearly, per case",
             "Year 1 = year of the first closing; all flows at year end. Columns after the horizon stay at zero. "
             "Target (60%) and Stress (40%) apply a multiplier (and an optional cap) to every modelled exit value; the Upside is the modelled portfolio; loans repay as modelled.")
    ws.set_column(0, 0, 64)
    ws.set_column(1, 1, 15)
    ws.set_column(2, 1 + len(YEARS), 13)
    eur, eur_b = bk.f(num_format=EUR), bk.f(num_format=EUR, bold=True)
    muted = bk.f(num_format=EUR, font_color=MUTED)
    L = LinesLayout
    c_first, c_last = 2, 1 + len(YEARS)

    ws.write(3, 0, "Horizon (last exit year)")
    bk.formula(ws, 3, 1, f"MAX({L.col('exit_year')})", HORIZON, bk.f(num_format=YEAR, bold=True))
    bk.name("Horizon", "Cash flows", 3, 1)
    tail = TERMS["running_cost"] * max(0, FUND["term_years"] - HORIZON)
    ws.write(4, 0, "Running costs of the years after the horizon (set aside from the last distribution)")
    bk.formula(ws, 4, 1, "RunningCost*MAX(0,TermYears-Horizon)", tail, eur_b)
    bk.name("TailCost", "Cash flows", 4, 1)

    yr = CFLayout.year_row
    hd = bk.f(bold=True, bg_color=BAND, align="center", border=1, border_color=LINE, num_format='"Year "0')
    ws.write(yr, 0, "Euros", bk.f(bold=True, bg_color=BAND, border=1, border_color=LINE))
    ws.write(yr, 1, "Total", bk.f(bold=True, bg_color=BAND, align="center", border=1, border_color=LINE))
    for i, y in enumerate(YEARS):
        ws.write(yr, c_first + i, y, hd)

    outs = {}
    r = yr + 2
    band = bk.f(bold=True, font_color="#FFFFFF", bg_color=BLUE_DK)
    for case_id in CASE_IDS:
        case = CASES[case_id]
        nm = CASE_NAME[case_id]
        R, out = mirror_case(case)
        ref_case = DATA["cases"][case_id]
        for k, v in out.items():
            if k != "clawback" and v != ref_case[k]:
                raise SystemExit(f"miroir Python : {case_id} {k} = {v}, fund.json = {ref_case[k]}")
        if out["clawback"] >= 1:
            raise SystemExit(f"miroir Python : clawback {case_id}")
        outs[case_id] = {}
        # le titre du bloc suit les hypotheses : une formule, comme dans le classeur livre
        title = (f"{nm.upper()} CASE — exit values × {pct_txt(case.exit_mult)}"
                 + ("" if case.exit_cap is None else f", capped at €{case.exit_cap:,.0f}"))
        for c in range(0, c_last + 1):
            ws.write_blank(r, c, None, band)
        ws.set_row(r, 20)
        bk.formula(ws, r, 0, f'"{nm.upper()} CASE — exit values × "&TEXT(Mult{nm},"0%")'
                             f'&IF(ISNUMBER(Cap{nm}),", capped at €"&TEXT(Cap{nm},"#,##0"),"")', title, band)
        r += 1
        for spec in FLOW_ROWS:
            if spec is None:
                r += 1
                continue
            CFLayout.rows[(case_id, spec[0])] = r
            r += 1
        rows = {k: CFLayout.rows[(case_id, k)] for k in R}
        sp, ep = L.col(f"sp_{case_id}"), L.col(f"ep_{case_id}")
        sc, ec = L.col(f"sc_{case_id}"), L.col(f"ec_{case_id}")
        lrc = L.col(f"lr_{case_id}")
        for key, label_txt, total in (s for s in FLOW_ROWS if s):
            ws.write(rows[key], 0, ("     " if key in ("hb0", "hb1", "contrib", "d1", "po1", "d2", "po", "gpc", "nic")
                                    else "") + label_txt, bk.f(bold=key in ("calls", "dist", "lp", "gp", "net")))
        for i, year in enumerate(YEARS):
            c = c_first + i
            col = xl_col_to_name(c)
            pcol = xl_col_to_name(c - 1)
            first = i == 0
            Y = f"{col}${yr + 1}"

            def at(k, prev=False):
                return f"{pcol if prev else col}{rows[k] + 1}"

            def put(k, formula, fmt=eur):
                bk.formula(ws, rows[k], c, formula, R[k][i], fmt)

            put("inv", f"SUMIFS({L.col('first')},{L.col('entry_year')},{Y})"
                       f"+SUMIFS({L.col('buyback')},{L.col('buyback_year')},{Y})"
                       f"+SUMIFS({L.col('follow')},{L.col('follow_year')},{Y})"
                       f"+SUMIFS({L.col('loan')},{L.col('loan_year')},{Y})")
            put("exitp", f"SUMIFS({ep},{L.col('exit_year')},{Y})+IF({Y}=SecYear,SUM({sp}),0)"
                         f"+SUMIFS({lrc},{L.col('loan_repay_year')},{Y})")
            put("tail", f"IF({Y}=Horizon,-TailCost,0)")
            put("dist", f"{at('exitp')}+{at('tail')}", eur_b)
            put("cost", f"SUMIFS({ec},{L.col('exit_year')},{Y})+IF({Y}=SecYear,SUM({sc}),0)"
                        f"+SUMIFS({L.col('loan')},{L.col('loan_repay_year')},{Y})")
            put("nic", (f"{at('inv')}-{at('cost')}" if first else f"{at('nic', True)}+{at('inv')}-{at('cost')}"), muted)
            nic_prev = "0" if first else at("nic", True)
            put("mgmt", f"IF({Y}>Horizon,0,IF({Y}<=IPYears,FeeIP*(Commitments-LoanSleeve)+FeeLoan*LoanSleeve,"
                        f"FeePost*MAX({nic_prev},0)))")
            put("exp", f"IF({Y}>Horizon,0,RunningCost+IF({Y}=1,SetupCost,0))")
            put("calls", f"{at('inv')}+{at('mgmt')}+{at('exp')}", eur_b)
            put("hb0", (at("calls") if first else f"{at('hb1', True)}*(1+Hurdle)+{at('calls')}"), muted)
            put("a", f"MIN({at('dist')},{at('hb0')})")
            put("hb1", f"{at('hb0')}-{at('a')}", muted)
            put("contrib", (at("calls") if first else f"{at('contrib', True)}+{at('calls')}"), muted)
            put("d1", f"{at('dist')}-{at('a')}", muted)
            put("po1", (at("a") if first else f"{at('po', True)}+{at('a')}"), muted)
            gpc_prev = "0" if first else at("gpc", True)
            put("x", f"IF({at('d1')}>0,MIN({at('d1')},MAX(0,(Carry*({at('po1')}-{at('contrib')})-{gpc_prev})"
                     f"/(1-Carry)))*CatchUp,0)")
            put("d2", f"{at('d1')}-{at('x')}", muted)
            put("lps", f"IF({at('d2')}>0,(1-Carry)*{at('d2')},0)")
            put("gps", f"IF({at('d2')}>0,Carry*{at('d2')},0)")
            put("po", f"{at('po1')}+{at('x')}+IF({at('d2')}>0,{at('d2')},0)", muted)
            put("gpc", (f"{at('x')}+{at('gps')}" if first else f"{at('gpc', True)}+{at('x')}+{at('gps')}"), muted)
            put("lp", f"{at('a')}+{at('lps')}", eur_b)
            put("gp", f"{at('x')}+{at('gps')}", eur_b)
            put("net", f"{at('lp')}-{at('calls')}", eur_b)
            put("gross", f"{at('exitp')}-{at('inv')}")
        a, b = xl_col_to_name(c_first), xl_col_to_name(c_last)
        for key, _, total in (s for s in FLOW_ROWS if s):
            if total:
                rr = rows[key] + 1
                bk.formula(ws, rows[key], 1, f"SUM({a}{rr}:{b}{rr})", sum(R[key]), eur_b)
        # sorties : arrondies comme run_case (money sur les montants, ratio sur les ratios)
        r += 1
        bk.band(ws, r, f"Outputs — {nm} case", 0, 3, BLUE)
        r += 1
        fmts = {"eur": eur_b, "mult": bk.f(num_format=MULT, bold=True), "mult2": bk.f(num_format=MULT2, bold=True),
                "pct0": bk.f(num_format=PCT0, bold=True)}

        def row_sum(k, c0=a, c1=b):
            return f"SUM({c0}{rows[k] + 1}:{c1}{rows[k] + 1})"
        last = xl_col_to_name(c_last)
        y6, y7 = xl_col_to_name(c_first + 5), xl_col_to_name(c_first + 6)
        tot = LinesLayout.total + 1
        best = f"MAX({L.col('exit_value')})*Mult{nm}"
        formulas = {
            "gross_proceeds": f"Lines!{lc(f'p_{case_id}')}{tot}",
            "realised": xmoney(row_sum("exitp")),
            "paid_in": xmoney(row_sum("calls")),
            "mgmt_fees": xmoney(row_sum("mgmt")),
            "fund_expenses": xmoney(f"{row_sum('exp')}+TailCost"),
            "lp_distributions": xmoney(row_sum("lp")),
            "carry": xmoney(row_sum("gp")),
            "net_tvpi": f"ROUND({row_sum('lp')}/{row_sum('calls')},1)",
            "net_irr": f"ROUND(IRR({a}{rows['net'] + 1}:{b}{rows['net'] + 1}),2)",
            "gross_irr": f"ROUND(IRR({a}{rows['gross'] + 1}:{b}{rows['gross'] + 1}),2)",
            "dpi_year6": f"ROUND({row_sum('lp', a, y6)}/{row_sum('calls', a, y6)},1)",
            "dpi_year7": f"ROUND({row_sum('lp', a, y7)}/{row_sum('calls', a, y7)},1)",
            "loans_multiple": f"IF(Lines!{lc('loan')}{tot}=0,0,ROUND(Lines!{lc(f'lr_{case_id}')}{tot}"
                              f"/Lines!{lc('loan')}{tot},2))",
            "largest_exit": xmoney(f"IF(ISNUMBER(Cap{nm}),MIN({best},Cap{nm}),{best})"),
            "clawback": f"MAX(0,{last}{rows['gpc'] + 1}-Carry*MAX(0,{last}{rows['po'] + 1}-{last}{rows['contrib'] + 1}))",
        }
        for key, label_txt, kind in OUT_ROWS:
            ws.write(r, 0, label_txt)
            if key == "secondary_discount":
                ro = CFLayout.out
                formulas[key] = f"B{ro[(case_id, 'gross_proceeds')] + 1}-B{ro[(case_id, 'realised')] + 1}"
            bk.formula(ws, r, 1, formulas[key], out[key], fmts[kind])
            CFLayout.out[(case_id, key)] = r
            outs[case_id][key] = ref("Cash flows", r, 1)
            r += 1
        r += 2
    ws.freeze_panes(yr + 1, 2)
    return outs


# ── Performance ─────────────────────────────────────────────────────────────
def sheet_performance(bk: Book, outs: dict) -> None:
    ws = bk.sheet("Performance")
    bk.title(ws, "Fund performance — target returns, built line by line",
             "Net of fees, expenses and carried interest. The table shown on profund.vc/pitch.")
    ws.set_column(0, 0, 52)
    ws.set_column(1, 3, 16)
    ws.set_column(4, 4, 4)
    hd = bk.f(bold=True, font_color="#FFFFFF", bg_color=BLUE_DK, align="center")
    hd_l = bk.f(bold=True, font_color="#FFFFFF", bg_color=BLUE_DK)
    ws.write(3, 0, "Metric", hd_l)
    for j, case in enumerate(CASE_IDS):
        ws.write(3, 1 + j, CASE_NAME[case], hd)

    def fset(num):
        return {j: bk.f(num_format=num, bold=j == 0, bg_color=BAND if j == 0 else "#FFFFFF", bottom=1,
                        bottom_color=LINE) for j in range(3)}
    eur, mult, mult2, pct = fset(EUR), fset(MULT), fset(MULT2), fset(PCT0)
    neg = fset('-"€"#,##0;"€"#,##0;"–"')
    lab = bk.f(bottom=1, bottom_color=LINE)
    cons = ConsLayout
    cases = DATA["cases"]

    def out(key):
        return lambda c: (outs[c][key], cases[c][key])
    rows = [
        ("Fund size", lambda c: ("Commitments", FUND["commitments"]), eur),
        ("Gross proceeds (exits + loan repayments)", out("gross_proceeds"), eur),
        (f"Year-{SEC['year']} secondary discount", out("secondary_discount"), neg),
        ("Net TVPI", out("net_tvpi"), mult),
        ("Net IRR", out("net_irr"), pct),
        ("Net DPI by year 6", out("dpi_year6"), mult),
        ("Net DPI by year 7", out("dpi_year7"), mult),
        ("Loans: repaid ÷ lent", out("loans_multiple"), mult2),
        ("Largest exit", out("largest_exit"), eur),
    ] + [
        (f"Gross MOIC · {LAYER_NAME[layer]}",
         (lambda layer: lambda c: (ref("Construction", cons.layer_row[layer], cons.cols[f"m_{c}"]),
                                   DATA["layers"][layer]["moic"][c]))(layer), mult)
        for layer in fm.LAYERS
    ]
    r = 4
    for label, get, fmts in rows:
        ws.write(r, 0, label, lab)
        for j, case in enumerate(CASE_IDS):
            formula, value = get(case)
            bk.formula(ws, r, 1 + j, formula, value, fmts[j])
        r += 1
    r += 1
    ws.write(r, 0, "More outputs", bk.f(bold=True, font_color=BLUE_DK))
    r += 1
    for key, label in (("paid_in", "Paid-in capital"), ("lp_distributions", "LP distributions"),
                       ("carry", "Carried interest"), ("gross_irr", "Gross IRR")):
        ws.write(r, 0, label, lab)
        for j, case in enumerate(CASE_IDS):
            bk.formula(ws, r, 1 + j, outs[case][key], cases[case][key], (pct if key == "gross_irr" else eur)[j])
        r += 1
    ws.write(r, 0, "Loans deployed", lab)
    for j in range(3):
        bk.formula(ws, r, 1 + j, "LoanSleeve", DATA["allocation"]["loans"], eur[j])
    r += 2

    # Tests de resistance : des re-calculs complets du modele Python, une hypothese a la fois
    bk.band(ws, r, "Stress tests, Target case", 0, 3, BLUE)
    r += 1
    ws.write(r, 0, "Scenario", hd_l)
    ws.write(r, 1, "Net TVPI", hd)
    ws.write(r, 2, "Net IRR", hd)
    ws.write(r, 3, "", hd)
    r += 1
    PerfLayout.stress = {}
    for s in DATA["stress_tests"]:
        ws.write(r, 0, s["label"], lab)
        ws.write(r, 1, s["net_tvpi"], mult[0])
        ws.write(r, 2, s["net_irr"], pct[0])
        PerfLayout.stress[s["id"]] = r
        r += 1
    note = bk.f(font_color=MUTED, italic=True, text_wrap=True, valign="top")
    ws.merge_range(r, 0, r + 2, 3,
                   "Values, not live formulas: each row is a full re-run of scripts/fund_model.py (stress_tests) with "
                   "one assumption changed, everything else as published. Exits shifted later keep the loan "
                   "repayment schedule; the zombie case turns both S-01 lines into a 0.5× recovery with zombie loan "
                   "terms; loan losses lower the share of each loan repaid by 30 points.", note)
    r += 4
    t = TERMS
    largest = DATA["cases"]["target"]["largest_exit"]
    ws.merge_range(r, 0, r + 5, 3,
                   f"Net = after management fees ({pct_txt(t['fee_ip_pct'])} on commitments during the investment "
                   f"period, {pct_txt(t['fee_loan_pct'])} on the loan sleeve, then {pct_txt(t['fee_post_pct'])} on "
                   "invested capital incl. loans until repaid), fund expenses and carried interest (European "
                   "whole-of-fund waterfall with a hurdle and GP catch-up), before tax. Investments over "
                   f"{FUND['investment_period_years']} years, exits from year {min(x.exit_year for x in fm.LINES)} to "
                   f"year {HORIZON}. One portfolio in every case: Target and Stress multiply every exit value and lose "
                   "more of the loans (Assumptions). No partial secondary sale (set Lines column " + lc("partial") +
                   f" to 'yes' to test one). Largest exit in the Upside case: {eur_txt(largest)}, the unicorn. Targets are "
                   "model outputs, not a forecast or a guarantee.", note)
    ws.merge_range(r + 7, 0, r + 9, 3, PROJECTIONS, note)


class PerfLayout:
    stress: dict = {}


# ── Checks ──────────────────────────────────────────────────────────────────
def sheet_checks(bk: Book, outs: dict) -> list:
    ws = bk.sheet("Checks", tab=GREEN)
    bk.title(ws, "Checks — this workbook vs the published v3.3 values",
             "Every output recalculated here is compared with the published v3.3 values (column C: "
             "src/data/fund.json, written by scripts/fund_model.py, which the site and the fact sheet read): change "
             "an input and these checks turn red by design.")
    ws.set_column(0, 0, 60)
    ws.set_column(1, 3, 18)
    ws.set_column(4, 4, 10)
    hd = bk.f(bold=True, bg_color=BAND, border=1, border_color=LINE, align="center")
    ws.write_row(5, 0, ["Check", "This workbook", "Published v3.3 value", "Difference", "Status"], hd)
    st = bk.f(bold=True, align="center")
    sect = bk.f(bold=True, font_color=BLUE_DK)
    eur, mult, pct, num, txt = (bk.f(num_format=EUR), bk.f(num_format=MULT), bk.f(num_format="0.000"),
                                bk.f(num_format=INT), bk.f(align="right"))
    fmt_of = {"eur": eur, "mult": mult, "mult2": bk.f(num_format=MULT2), "pct0": pct}
    items = []          # (libelle, formule, valeur) ou ("§", titre) pour un intertitre

    def money_ref(sheet, rr, cc):
        return xmoney(ref(sheet, rr, cc))

    for case in CASE_IDS:
        items.append(("§", f"Cash flows · {CASE_NAME[case]}"))
        ref_case = DATA["cases"][case]
        for key, label, kind in OUT_ROWS:
            if key == "clawback":
                continue
            items.append((f"{CASE_NAME[case]} · {label}", outs[case][key], ref_case[key], fmt_of[kind]))
        for key, row_key, label in (("investments", "inv", "investments"), ("calls", "calls", "capital calls"),
                                    ("distributions", "dist", "distributions"), ("lp", "lp", "LP distributions"),
                                    ("gp", "gp", "carried interest")):
            for i, v in enumerate(ref_case["cashflows"][key]):
                rr, cc = CFLayout.rows[(case, row_key)], 2 + i
                items.append((f"{CASE_NAME[case]} · {label}, year {i + 1} (rounded)",
                               money_ref("Cash flows", rr, cc), v, eur))
    items.append(("§", "Construction"))
    C = ConsLayout
    for layer in fm.LAYERS:
        lay = DATA["layers"][layer]
        rr = C.layer_row[layer]
        nm = LAYER_NAME[layer]
        for key, label, val, fmt in (("companies", "companies", lay["companies"], num),
                                     ("positions", "positions", lay["positions"], num),
                                     ("first", "first cheques", lay["first"], eur),
                                     ("buy_follow", "buybacks and follow-ons", lay["buyback"] + lay["follow"], eur),
                                     ("invested", "invested incl. loans", lay["invested"], eur),
                                     ("loans", "loans", lay["loans"], eur),
                                     ("loans_pct", "loans, share of invested", lay["loans_pct"], pct)):
            items.append((f"{nm} · {label}", ref("Construction", rr, C.cols[key]), val, fmt))
        for case in CASE_IDS:
            items.append((f"{nm} · proceeds · {CASE_NAME[case]}", ref("Construction", rr, C.cols[f"p_{case}"]),
                          lay["proceeds"][case], eur))
            items.append((f"{nm} · gross MOIC · {CASE_NAME[case]}", ref("Construction", rr, C.cols[f"m_{case}"]),
                          lay["moic"][case], mult))
    for key, val in DATA["allocation"].items():
        fmt = pct if key.endswith("_pct") else eur
        if key == "loans_pct":
            items.append(("Allocation · loans pct", ref("Construction", C.total_row, C.cols["loans_pct"]), val, fmt))
            continue
        items.append((f"Allocation · {key.replace('_', ' ')}", ref("Construction", C.alloc[key], 1), val, fmt))
    items.append(("Loans · EuVECA cap", ref("Construction", C.loan_cap_row, 3), DATA["fund"]["loan_cap"], eur))
    for s in DATA["spv"]:
        rr = C.exposure[s["company"]]
        items.append((f"{s['company']} · invested by the fund", ref("Construction", rr, 1), s["fund"], eur))
        items.append((f"{s['company']} · SPV top-up", ref("Construction", rr, 5), s["spv"], eur))
    items.append(("SPV top-ups, total", ref("Construction", C.exposure["_spv_total"], 5), DATA["spv_total"], eur))
    fr = DATA["fund_returner"]
    items.append(("Fund returner · company", ref("Construction", C.returner["company"], 1), fr["company"], txt))
    items.append(("Fund returner · proceeds, all lines", ref("Construction", C.returner["proceeds"], 1),
                  fr["proceeds"], eur))
    items.append(("Fund returner · multiple of the fund", ref("Construction", C.returner["multiple"], 1),
                  fr["multiple_of_fund"], mult))
    items.append(("Max per company from the fund", "CompanyCap", DATA["fund"]["company_cap"], eur))
    items.append(("GP commitment, minimum", "GPCommitMin", DATA["terms"]["gp_commit_min"], eur))
    items.append(("§", "Lines"))
    for layer in fm.LAYERS:
        for lj in DATA["layers"][layer]["lines"]:
            line = next(x for x in fm.LINES if x.id == lj["id"])
            rr = LinesLayout.rows[line.id]
            rid = row_id(line)
            items.append((f"{rid} · entry stake (shown)",
                          ref("Lines", rr, COL["entry_pct" if line.first else "bought"]), lj["entry_pct"], pct))
            if lj["exit_pct"] is not None:
                items.append((f"{rid} · exit stake", ref("Lines", rr, COL["exit_pct"]), lj["exit_pct"], pct))
            items.append((f"{rid} · invested", ref("Lines", rr, COL["invested"]), lj["invested"], eur))
            items.append((f"{rid} · proceeds · Upside", ref("Lines", rr, COL["p_target"]), lj["proceeds"], eur))
            items.append((f"{rid} · MOIC · Upside", ref("Lines", rr, COL["m_target"]), lj["moic"], mult))
            for case in ("base", "stress"):
                v = fm.proceeds(line, CASES[case])
                items.append((f"{rid} · proceeds · {CASE_NAME[case]}", ref("Lines", rr, COL[f"p_{case}"]), v, eur))

    r = 6
    n_ok = 0
    first_row = r
    for it in items:
        if it[0] == "§":
            ws.write(r, 0, it[1], sect)
            r += 1
            continue
        label, formula, value, fmt = it
        x = r + 1
        ws.write(r, 0, label)
        cached = value
        bk.formula(ws, r, 1, formula, cached, fmt)
        ws.write(r, 2, value, fmt)
        if isinstance(value, str):
            bk.formula(ws, r, 4, f'IF(B{x}=C{x},"OK","CHECK")', "OK", st)
        else:
            bk.formula(ws, r, 3, f"B{x}-C{x}", 0, fmt)
            bk.formula(ws, r, 4, f'IF(ABS(D{x})<0.000001,"OK","CHECK")', "OK", st)
        n_ok += 1
        r += 1
    r += 1

    # invariants du modele (fund_model.validate)
    ws.write(r, 0, "Model rules", sect)
    r += 1
    L = LinesLayout
    B = AssLayout.bounds
    rules = [("Contingency is not negative", f"IF({ref('Construction', C.alloc['contingency'], 1)}>=0,\"OK\",\"CHECK\")")]
    for case in CASE_IDS:
        rules.append((f"{CASE_NAME[case]} · paid-in within commitments",
                      f"IF({outs[case]['paid_in']}<=Commitments,\"OK\",\"CHECK\")"))
        rules.append((f"{CASE_NAME[case]} · no GP clawback",
                      f"IF({ref('Cash flows', CFLayout.out[(case, 'clawback')], 1)}<1,\"OK\",\"CHECK\")"))
    e0, e1 = C.exposure_range
    rules.append(("Every company within the cap from the fund",
                  f"IF(COUNTIF({rng('Construction', e0, e1, 3)},\"CHECK\")=0,\"OK\",\"CHECK\")"))
    rules.append(("Loans within the EuVECA cap", ref("Construction", C.loan_cap_row, 5)))
    for j, layer in enumerate(fm.LAYERS[:2]):
        nm = LAYER_NAME[layer]
        lo, hi = ref("Assumptions", B[("own", 0)], 1 + j), ref("Assumptions", B[("own", 1)], 1 + j)
        rules.append((f"{nm} · entry stakes within the layer bounds",
                      f'IF(AND(_xlfn.MAXIFS({L.col("entry_pct")},{L.col("layer")},"{nm}")<={hi},'
                      f'_xlfn.MINIFS({L.col("entry_pct")},{L.col("layer")},"{nm}")>={lo}),"OK","CHECK")'))
    nm = LAYER_NAME["growth"]
    hi = ref("Assumptions", B[("own", 1)], 3)
    rules.append((f"{nm} · entry stakes (first cheque or buyback) within the layer maximum",
                  f'IF(AND(_xlfn.MAXIFS({L.col("bought")},{L.col("layer")},"{nm}")<={hi},'
                  f'_xlfn.MAXIFS({L.col("entry_pct")},{L.col("layer")},"{nm}")<={hi}),"OK","CHECK")'))
    # LE PACTE : un suivi en actions nouvelles suppose que le fondateur a leve ailleurs
    rules.append(("No new shares after the first cheque unless the founder raised elsewhere",
                  f'IF(COUNTIFS({L.col("follow")},">0",{L.col("dilution")},0)=0,"OK","CHECK")'))
    rules.append((f"Partial liquidity only on lines that exit after year {SEC['year']}",
                  f'IF(COUNTIFS({L.col("partial")},"yes",{L.col("exit_year")},"<="&SecYear)=0,"OK","CHECK")'))
    rules.append(("Fees on the loan sleeve not above the standard fee", 'IF(FeeLoan<=FeeIP,"OK","CHECK")'))
    for label, formula in rules:
        ws.write(r, 0, label)
        bk.formula(ws, r, 4, formula, "OK", st)
        r += 1
    last = r - 1

    status = rng("Checks", first_row, last, 4)
    bk.formula(ws, 3, 0, f'IF(COUNTIF({status},"CHECK")=0,"ALL CHECKS PASS","CHECK FAILED")', "ALL CHECKS PASS",
               bk.f(bold=True, font_size=13))
    bk.formula(ws, 3, 1, f'COUNTIF({status},"OK")', n_ok + len(rules), bk.f(num_format='0" checks OK"'))
    bk.name("ChecksStatus", "Checks", 3, 0)
    green = bk.wb.add_format({"bg_color": "#E5F3EA", "font_color": GREEN})
    red = bk.wb.add_format({"bg_color": "#FBE3DF", "font_color": RED})
    ws.conditional_format(f"E{first_row + 1}:E{last + 1}", {"type": "cell", "criteria": "==", "value": '"OK"',
                                                            "format": green})
    ws.conditional_format(f"E{first_row + 1}:E{last + 1}", {"type": "cell", "criteria": "==", "value": '"CHECK"',
                                                            "format": red})
    ws.conditional_format("A4", {"type": "text", "criteria": "containing", "value": "PASS", "format": green})
    ws.conditional_format("A4", {"type": "text", "criteria": "containing", "value": "FAILED", "format": red})
    ws.freeze_panes(6, 1)
    return [it for it in items if it[0] != "§"], rules


# ── Read me ─────────────────────────────────────────────────────────────────
def sheet_readme(bk: Book) -> None:
    ws = bk.sheet("Read me", tab=BLUE_DK)
    ws.set_column(0, 0, 24)
    ws.set_column(1, 1, 110)
    ws.set_row(0, 34)
    ws.write(0, 0, f"ProFund Fund I — Fund model ({fm.VERSION})", bk.f(bold=True, font_size=18))
    ws.write(1, 0, f"Model date {fm.MODEL_DATE} · Pre-seed to Growth · amounts in euros · "
                   "contact alexandre@profund.vc", bk.f(font_color=MUTED))
    box = bk.f(text_wrap=True, valign="top", bg_color=BAND, left=5, left_color=BLUE, font_size=10.5)
    ws.write(3, 0, "PRE-MARKETING", bk.f(bold=True, font_color=BLUE_DK))
    ws.write(3, 1, NOTICE, box)
    ws.set_row(3, 44)
    ws.write(4, 1, PROJECTIONS, bk.f(text_wrap=True, valign="top", font_color=MUTED))
    ws.set_row(4, 30)
    ws.write(5, 1, EXPENSES, bk.f(font_color=MUTED))

    ws.write(7, 0, "Status", bk.f(bold=True))
    bk.formula(ws, 7, 1, "ChecksStatus", "ALL CHECKS PASS", bk.f(bold=True, font_color=GREEN))
    r = 9
    bk.band(ws, r, "Tabs", c1=1, fill=BLUE)
    r += 1
    n = LAYER_NAME
    wrap = bk.f(text_wrap=True, valign="top")
    for tab, text in (
        ("Assumptions", "Fund size, terms and fees, the partial secondary sale, the multiplier and cap of each case, "
                        "layer bounds, the buyback discount and the loan cap."),
        ("Lines", f"The simulation lines ({n['seed']} S-, {n['venture']} V-, {n['growth']} G-): first cheque, buybacks, "
                  "loans, cancellations and outside rounds, exit inputs, then proceeds and MOIC per case, with layer "
                  f"subtotals. {n['seed']} lines carry their track: Lead ({SEED_TR['lead']['first']} to "
                  f"{SEED_TR['lead']['last']}) or Radar ({SEED_TR['radar']['first']} to {SEED_TR['radar']['last']})."),
        ("Construction", "Portfolio by layer, capital allocation (first cheques, buybacks, loans), loans vs the EuVECA "
                         "cap, exposure per company and the fund returner."),
        ("Cash flows", "Yearly flows per case: investments incl. loans, exits incl. the year-6 secondary, loan "
                       "repayments, fees, expenses, capital calls, the European waterfall step by step, LP and GP "
                       "flows; net TVPI, IRR and DPI."),
        ("Performance", "The Fund Performance table shown on profund.vc/pitch, linked to the tabs above, and the "
                        "stress tests of the Target case."),
        ("Checks", "Every output compared with the published v3.3 values: src/data/fund.json, written by "
                   "scripts/fund_model.py, the model the site and the fact sheet read. This workbook is generated "
                   "from the same model by scripts/fund_xlsx.py. Change an input and the checks turn red: the "
                   "workbook then shows your case, no longer the published one."),
    ):
        ws.write(r, 0, tab, bk.f(bold=True))
        ws.write(r, 1, text, wrap)
        r += 1
    r += 1
    bk.band(ws, r, "Conventions", c1=1, fill=BLUE)
    r += 1
    v, g = DATA["layers"]["venture"], DATA["layers"]["growth"]
    vr, gr = v["first_cheque_range"], g["position_range"]
    for k, text, fmt in (
        ("Blue", "Input: change it and the whole workbook recalculates (Excel, LibreOffice, Google Sheets).",
         bk.f(bold=True, font_color=INPUT)),
        ("Black", "Formula.", bk.f(bold=True)),
        ("Green", "Check against the published v3.3 values.", bk.f(bold=True, font_color=GREEN)),
        ("Years", "Year 1 = year of the first closing; all flows at year end.", bk.f(bold=True)),
        ("Rounding", "Every amount is rounded to its display grain (EUR 10K below EUR 1M, EUR 100K above) before "
                     "any sum; ratios at their display precision.", bk.f(bold=True)),
        ("v3 mechanics", "One equity round per company, then no new shares while the founder grows with ProFund. "
                         "Exposure grows by buybacks of existing shares at a discount; growth is financed by loans; "
                         "companies buy back and cancel shares. If the founder raises elsewhere, ProFund follows or "
                         f"leads in new shares. {n['growth']} also takes fresh growth deals in new shares. Loans stay "
                         f"within the EuVECA cap of {pct_txt(FUND['loan_cap_pct'])} of commitments, with a "
                         f"{pct_txt(TERMS['fee_loan_pct'])} fee.  v3.2: realistic timing (investments over "
                         f"{FUND['investment_period_years']} years, exits years {min(x.exit_year for x in fm.LINES)} "
                         f"to {HORIZON}), loans at "
                         f"{round(fm.LOAN_RATE * 100)}% a year in tranches (v3.4; v3.3 priced every loan at "
                         f"1.4×), {n['growth']} bought from structural "
                         f"sellers. v3.3: real {n['venture']} and {n['growth']} tickets ({eur_txt(vr[0])}–"
                         f"{eur_txt(vr[1])} Series A cheques; {eur_txt(gr[0])}–{eur_txt(gr[1])} growth positions, up "
                         f"to {eur_txt(FUND['company_max_with_spv'])} with SPVs), incl. a block bought in our own "
                         "breakout.", bk.f(bold=True)),
    ):
        ws.write(r, 0, k, fmt)
        ws.write(r, 1, text, wrap)
        r += 1
    ws.activate()


# ── controle independant ────────────────────────────────────────────────────
def _pycel_check(cache: dict) -> int:
    """Recalcule TOUTES les formules du fichier avec pycel et les compare a leur valeur en cache."""
    import types
    from pycel import ExcelCompiler
    from pycel import excelwrapper

    def defined_names(self):   # pycel 1.0b30 lit l'API d'openpyxl < 3.1
        if self.workbook is not None and self._defined_names is None:
            self._defined_names = {}
            for d in self.workbook.defined_names.values():
                dest = [(alias, ws) for ws, alias in d.destinations if ws in self.workbook]
                if dest:
                    self._defined_names[str(d.name)] = dest
        return self._defined_names
    excelwrapper.ExcelOpxWrapper.defined_names = property(defined_names)

    plug = types.ModuleType("profund_xl_plugins")

    def irr(values, guess=None):   # pycel n'a pas IRR : meme dichotomie que fund_model.irr
        flows = [float(v) for row in values for v in row if v not in (None, "")]
        return fm.irr(flows)
    plug.irr = irr
    sys.modules["profund_xl_plugins"] = plug

    xl = ExcelCompiler(filename=str(OUT), plugins=["profund_xl_plugins"])
    addrs = [f"'{s}'!{xl_rowcol_to_cell(r, c)}" if " " in s else f"{s}!{xl_rowcol_to_cell(r, c)}"
             for (s, r, c) in cache]
    for a in addrs:
        xl.evaluate(a)
    xl.recalculate()
    bad = []
    for a, ((s, r, c), want) in zip(addrs, cache.items()):
        got = xl.evaluate(a)
        if isinstance(want, str):
            ok = (got or "") == want
        else:
            ok = isinstance(got, (int, float)) and abs(got - want) <= 1e-6 * max(1.0, abs(want))
        if not ok:
            bad.append(f"{a}: pycel {got!r} != cache {want!r}")
    if bad:
        raise SystemExit("formules != valeurs en cache :\n  " + "\n  ".join(bad[:30]))
    status = xl.evaluate("Checks!A4")
    if status != "ALL CHECKS PASS":
        raise SystemExit(f"onglet Checks recalcule : {status}")
    return len(addrs)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    _layout_lines()                     # les rangs de Lines, cites par Assumptions
    bk = Book(OUT)
    sheet_readme(bk)
    sheet_assumptions(bk)
    sheet_lines(bk)
    outs = sheet_cashflows(bk)          # avant Construction : l'allocation lit les frais du cas cible
    sheet_construction(bk, outs)
    sheet_performance(bk, outs)
    items, rules = sheet_checks(bk, outs)
    bk.close()
    n = _pycel_check(bk.cache)
    t = DATA["cases"]["target"]
    print(f"fund_xlsx: {OUT.relative_to(ROOT)} ({OUT.stat().st_size} octets)")
    print(f"  {n} formulas recalculated by pycel = cached values; {bk.cache[('Checks', 3, 1)]} checks OK "
          f"({len(items)} vs fund.json, {len(rules)} model rules)")
    print(f"  target: net TVPI {t['net_tvpi']:.1f}x, net IRR {t['net_irr']:.0%}, DPI y6 {t['dpi_year6']:.1f}x, "
          f"y7 {t['dpi_year7']:.1f}x")


if __name__ == "__main__":
    main()
