"""Genere public/profund-fund-model.xlsx — le modele du fonds en Excel, vivant.

Le classeur se telecharge depuis /pitch (MODEL_XLSX_URL, src/lib/links.ts). Ce
n'est pas un export de chiffres : chaque sortie est une FORMULE qui se recalcule
dans Excel, LibreOffice ou Google Sheets quand on change une hypothese (police
bleue), et qui retombe exactement sur src/data/fund.json (cas Target, Base,
Stress). Chaque formule est ecrite AVEC sa valeur calculee : un apercu qui ne
recalcule pas (QuickLook, Gmail, Outlook, iOS) affiche donc les bons chiffres.

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
CASE_CAPS = dict(fm.CASES)
CASE_IDS = tuple(CASE_CAPS)
CASE_NAME = {"target": "Target", "base": "Base", "stress": "Stress"}
LAYER_NAME = {"seed": "Seed", "venture": "Venture", "growth": "Growth"}
HORIZON = max(x.exit_year for x in fm.LINES)
SHEETS = ("Read me", "Assumptions", "Lines", "Construction", "Cash flows", "Performance", "Checks")
YEARS = list(range(1, FUND["term_years"] + 1))   # colonnes annuelles : toute la duree du fonds

# Palette ProFund (src/index.css)
BLUE, BLUE_DK, BAND, INK, MUTED, LINE = "#627C99", "#4A6080", "#EEF2F7", "#15181D", "#646B77", "#D9DDE3"
INPUT, GREEN, RED = "#1D4ED8", "#1F8A4C", "#C0392B"
EUR, PCT0, PCT1, MULT, YEAR, INT = ('"€"#,##0;-"€"#,##0;"–"', "0%", "0.0%", '0.0"×"', "0", "#,##0")

NOTICE = ("This document is a pre-marketing communication within the meaning of Article 4a of "
          "Regulation (EU) No 345/2013 (EuVECA). The fund is not yet established and no units may be "
          "subscribed at this stage. For professional and eligible investors only.")
PROJECTIONS = ("All projections, targets, simulated portfolios, and return figures (IRR/DPI/MOIC) are "
               "indicative, hypothetical, and illustrative; actual results may differ materially.")
EXPENSES = "Fund expenses are an estimate pending the EuVECA manager's quote."

# Memes libelles que src/lib/fund.ts (outcomeTag)
OUTCOME = {
    "fund_returner": "Fund returner", "breakout": "Breakout", "strategic_exit": "Strategic exit",
    "early_exit": "Early exit (M&A)", "zombie": "Zombies (×{n})", "loss": "Losses (×{n})",
    "anchor": "Anchor", "strategic_win": "Strategic win", "base_hit": "Base hit",
    "breakout_follow_on": "Breakout ({company})", "pro_rata": "Pro-rata ({company})",
    "external_growth": "Direct growth entry", "downside_protected": "Downside, preference",
}


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


# ── formules ────────────────────────────────────────────────────────────────
def xmoney(e: str) -> str:
    """money() de fund_model en Excel : maille de 10 k sous 1 M, 100 k au-dessus."""
    g = f"IF(ABS({e})<1000000,10000,100000)"
    return f"ROUND(({e})/{g},0)*{g}"


def ratio(v, places):
    return fm.ratio(v, places)


def row_id(line) -> str:
    """S-01 ; S-07–09 pour trois societes ; V-05/06 pour deux (src/lib/fund.ts, rowId)."""
    if line.n == 1:
        return line.id
    prefix, num = line.id.split("-")
    last = str(int(num) + line.n - 1).zfill(len(num))
    return f"{line.id}/{last}" if line.n == 2 else f"{prefix}-{num}–{last}"


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
def sheet_assumptions(bk: Book) -> None:
    ws = bk.sheet("Assumptions")
    bk.title(ws, "Assumptions", "Blue cells are inputs: change one and the whole workbook recalculates.")
    ws.set_column(0, 0, 58)
    ws.set_column(1, 1, 16)
    ws.set_column(2, 4, 16)
    ws.set_column(5, 5, 60)
    inp = {k: bk.f(font_color=INPUT, num_format=v, align="right") for k, v in
           (("eur", EUR), ("pct0", PCT0), ("pct1", PCT1), ("pct2", "0.00%"), ("int", INT), ("txt", "@"))}
    out = {k: bk.f(num_format=v, align="right") for k, v in (("eur", EUR), ("pct0", PCT0))}
    note = bk.f(font_color=MUTED, italic=True)
    names = {}
    r = 3

    def put(label, name, value, kind, comment=""):
        nonlocal r
        ws.write(r, 0, label)
        ws.write(r, 1, value, inp[kind])
        if comment:
            ws.write(r, 5, comment, note)
        if name:
            bk.wb.define_name(name, "=" + ref("Assumptions", r, 1))
            names[name] = (r, 1)
        r += 1

    def calc(label, name, formula, value, kind, comment=""):
        nonlocal r
        ws.write(r, 0, label)
        bk.formula(ws, r, 1, formula, value, out[kind])
        if comment:
            ws.write(r, 5, comment, note)
        bk.wb.define_name(name, "=" + ref("Assumptions", r, 1))
        r += 1

    bk.band(ws, r, "Fund", c1=5)
    r += 1
    put("Commitments (target Fund I)", "Commitments", FUND["commitments"], "eur")
    put("Fund term (years)", "TermYears", FUND["term_years"], "int")
    put("Investment period (years)", "IPYears", FUND["investment_period_years"], "int",
        "Management fee on commitments during this period")
    put("Successive closings after the first (months)", "ClosingMonths", FUND["closing_months"], "int",
        "Information; flows start at year 1 = year of first closing")
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
    put("Hurdle (compounded annually)", "Hurdle", TERMS["hurdle_pct"], "pct0",
        "European whole-of-fund waterfall")
    put("GP catch-up", "CatchUp", TERMS["catch_up_pct"], "pct0")
    put("GP commitment, minimum (% of commitments)", "GPCommitPct", TERMS["gp_commit_min_pct"], "pct0", "Information")
    calc("GP commitment, minimum", "GPCommitMin", xmoney("GPCommitPct*Commitments"),
         DATA["terms"]["gp_commit_min"], "eur")
    r += 1

    bk.band(ws, r, "Early liquidity: partial secondary sale of the winners", c1=5)
    r += 1
    put("Share of the position sold", "SecShare", SEC["share"], "pct0")
    put("Year of the secondary sale", "SecYear", SEC["year"], "int",
        "Applies to every line of these companies that exits after this year")
    put("Price, % of the exit value", "SecPrice", SEC["price_pct"], "pct0")
    for i, co in enumerate(SEC["companies"], 1):
        put(f"Company {i} sold in part", f"SecCo{i}", co, "txt")
    r += 1

    bk.band(ws, r, "Cases: cap applied to every exit value, everything else unchanged", c1=5)
    r += 1
    for case, cap in fm.CASES:
        put(f"{CASE_NAME[case]} case, exit value cap", f"Cap{CASE_NAME[case]}",
            "none" if cap is None else cap, "txt" if cap is None else "eur",
            "Type an amount to cap, or 'none'" if cap is None else "")
    r += 1

    bk.band(ws, r, "Layer bounds (portfolio construction rules)", c1=5)
    r += 1
    ws.write_row(r, 0, ["", "Seed", "Venture", "Growth"], bk.f(bold=True, align="right"))
    ws.write(r, 0, "", bk.f(bold=True))
    r += 1
    for label, key, i, kind in (
        ("Initial ticket, minimum", "ticket", 0, "eur"), ("Initial ticket, maximum", "ticket", 1, "eur"),
        ("Entry post-money, minimum", "post", 0, "eur"), ("Entry post-money, maximum", "post", 1, "eur"),
        ("Entry stake, minimum", "own", 0, "pct1"), ("Entry stake, maximum", "own", 1, "pct1"),
    ):
        ws.write(r, 0, label)
        for j, layer in enumerate(fm.LAYERS):
            ws.write(r, 1 + j, fm.BOUNDS[layer][key][i], inp[kind])
        r += 1
    ws.write(r, 0, "Companies (new entries)")
    for j, layer in enumerate(fm.LAYERS):
        ws.write(r, 1 + j, fm.BOUNDS[layer]["companies"], inp["int"])
    r += 1
    ws.write(r, 0, "Growth: direct entries, minimum share of the layer")
    ws.write(r, 3, fm.BOUNDS["growth"]["direct_min_pct"], inp["pct0"])
    bk.wb.define_name("GrowthDirectMin", "=" + ref("Assumptions", r, 3))
    r += 2

    bk.band(ws, r, "Follow-on reserve policy (expected value)", c1=5)
    r += 1
    ws.write_row(r, 0, ["", "Seed", "Venture"], bk.f(bold=True, align="right"))
    ws.write(r, 0, "", bk.f(bold=True))
    r += 1
    for label, key, kind in (("Share of companies raising the next round", "graduation_pct", "pct0"),
                             ("Next round size", "next_round", "eur"),
                             ("Pro-rata stake", "pro_rata_pct", "pct1"),
                             ("Bridges", "bridges", "eur")):
        ws.write(r, 0, label)
        for j, layer in enumerate(("seed", "venture")):
            ws.write(r, 1 + j, fm.RESERVES[layer][key], inp[kind])
            bk.wb.define_name(f"Res{LAYER_NAME[layer]}_{key}", "=" + ref("Assumptions", r, 1 + j))
        r += 1
    ws.freeze_panes(3, 0)


# ── Lines ───────────────────────────────────────────────────────────────────
INPUT_COLS = ("id", "layer", "company", "n", "outcome", "kind", "initial", "entry_post", "follow_on",
              "invest_year", "follow_on_year", "exit_year", "exit_pct", "exit_value", "recovery")
CALC_COLS = ("invested", "perco", "entry_pct") + tuple(f"p_{c}" for c in CASE_IDS) + tuple(f"m_{c}" for c in CASE_IDS)
HELP_COLS = tuple(f"{k}_{c}" for c in CASE_IDS for k in ("sp", "ep", "sc", "ec"))
COL = {k: i for i, k in enumerate(INPUT_COLS + CALC_COLS + HELP_COLS)}
HEAD = {
    "id": "Deal ID", "layer": "Layer", "company": "Company (exit key)", "n": "Companies on the line",
    "outcome": "Outcome", "kind": "Kind", "initial": "Initial tickets (line total)",
    "entry_post": "Entry post-money (per company)", "follow_on": "Follow-on (line total)",
    "invest_year": "Entry year", "follow_on_year": "Follow-on year", "exit_year": "Exit year",
    "exit_pct": "Exit stake (diluted)", "exit_value": "Exit value (100%)",
    "recovery": "Recovery multiple (if no exit value)", "invested": "Invested", "perco": "Invested per company",
    "entry_pct": "Entry stake",
}
for _c in CASE_IDS:
    HEAD[f"p_{_c}"] = f"Proceeds · {CASE_NAME[_c]}"
    HEAD[f"m_{_c}"] = f"MOIC · {CASE_NAME[_c]}"
    HEAD[f"sp_{_c}"] = f"{CASE_NAME[_c]} · secondary sale proceeds"
    HEAD[f"ep_{_c}"] = f"{CASE_NAME[_c]} · proceeds at exit year"
    HEAD[f"sc_{_c}"] = f"{CASE_NAME[_c]} · cost sold in secondary"
    HEAD[f"ec_{_c}"] = f"{CASE_NAME[_c]} · cost at exit year"


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


def _cap_expr(case):
    name = f"Cap{CASE_NAME[case]}"
    return f"IF(ISNUMBER({name}),MIN({{v}},{name}),{{v}})"


def sheet_lines(bk: Book) -> None:
    ws = bk.sheet("Lines", grid=True)
    bk.title(ws, "Fund simulation — line by line",
             "Seed (S-), Venture (V-) and Growth (G-) lines. A line may group several companies (n): "
             "initial and follow-on are line totals. Blue = input, black = formula.")
    ws.set_column(0, 0, 10)
    ws.set_column(1, 2, 11)
    ws.set_column(3, 3, 11)
    ws.set_column(4, 4, 22)
    ws.set_column(5, 5, 10)
    ws.set_column(6, 8, 15)
    ws.set_column(9, 11, 10)
    ws.set_column(12, 12, 11)
    ws.set_column(13, 13, 15)
    ws.set_column(14, 14, 12)
    ws.set_column(15, 23, 14)
    ws.set_column(24, 24 + len(HELP_COLS) - 1, 15, None, {"level": 1})

    groups = (("INPUTS", 0, len(INPUT_COLS) - 1, BLUE_DK), ("FORMULAS", COL["invested"], COL["m_stress"], BLUE),
              ("CASH-FLOW HELPERS (used by the Cash flows tab)", COL["sp_target"], len(COL) - 1, MUTED))
    for text, c0, c1, fill in groups:
        bk.band(ws, 3, text, c0, c1, fill)
    ws.set_row(4, 42)
    hd = bk.f(bold=True, bg_color=BAND, text_wrap=True, align="center", border=1, border_color=LINE)
    for key, c in COL.items():
        ws.write(4, c, HEAD[key], hd)

    fmts = {
        "id": bk.f(font_color=INPUT, bold=True), "layer": bk.f(font_color=INPUT),
        "company": bk.f(font_color=INPUT), "n": bk.f(font_color=INPUT, num_format=INT, align="center"),
        "outcome": bk.f(font_color=INPUT), "kind": bk.f(font_color=INPUT),
        "initial": bk.f(font_color=INPUT, num_format=EUR), "entry_post": bk.f(font_color=INPUT, num_format=EUR),
        "follow_on": bk.f(font_color=INPUT, num_format=EUR),
        "invest_year": bk.f(font_color=INPUT, num_format=YEAR, align="center"),
        "follow_on_year": bk.f(font_color=INPUT, num_format=YEAR, align="center"),
        "exit_year": bk.f(font_color=INPUT, num_format=YEAR, align="center"),
        "exit_pct": bk.f(font_color=INPUT, num_format=PCT1), "exit_value": bk.f(font_color=INPUT, num_format=EUR),
        "recovery": bk.f(font_color=INPUT, num_format=MULT),
    }
    eur, pct1, mult = bk.f(num_format=EUR), bk.f(num_format=PCT1), bk.f(num_format=MULT)
    helper = bk.f(num_format=EUR, font_color=MUTED)
    sub_txt = bk.f(bold=True, bg_color=BAND)
    sub_eur, sub_mult = bk.f(bold=True, bg_color=BAND, num_format=EUR), bk.f(bold=True, bg_color=BAND, num_format=MULT)

    # rangs : les lignes de chaque etage, puis sa ligne SUB
    r = LinesLayout.first
    for layer in fm.LAYERS:
        for line in (x for x in fm.LINES if x.layer == layer):
            LinesLayout.rows[line.id] = r
            r += 1
        LinesLayout.sub[layer] = r
        r += 1
    LinesLayout.last = r - 1
    LinesLayout.total = r

    sec_test = "OR(" + ",".join(f"$C{{r}}=SecCo{i}" for i in range(1, len(SEC["companies"]) + 1)) + ")"
    for line in fm.LINES:
        r = LinesLayout.rows[line.id]
        x = r + 1                                    # numero de ligne Excel
        values = {
            "id": row_id(line), "layer": LAYER_NAME[line.layer], "company": line.company, "n": line.n,
            "outcome": OUTCOME[line.outcome].format(n=line.n, company=line.company), "kind": line.kind,
            "initial": line.initial, "entry_post": line.entry_post, "follow_on": line.follow_on,
            "invest_year": line.invest_year, "follow_on_year": line.follow_on_year, "exit_year": line.exit_year,
            "exit_pct": line.exit_pct, "exit_value": line.exit_value, "recovery": line.recovery,
        }
        for key in INPUT_COLS:
            v = values[key]
            if v is None:
                ws.write_blank(r, COL[key], None, fmts[key])
            else:
                ws.write(r, COL[key], v, fmts[key])
        inv = fm.invested(line)
        bk.formula(ws, r, COL["invested"], f"G{x}+I{x}", inv, eur)
        bk.formula(ws, r, COL["perco"], f"P{x}/D{x}", inv / line.n, eur)
        bk.formula(ws, r, COL["entry_pct"], f"ROUND(G{x}/D{x}/H{x},3)", ratio(line.initial / line.n / line.entry_post, 3),
                   pct1)
        for case in CASE_IDS:
            capped = _cap_expr(case).format(v=f"$N{x}")
            value = fm.proceeds(line, CASE_CAPS[case])
            pc = xl_col_to_name(COL[f"p_{case}"])
            bk.formula(ws, r, COL[f"p_{case}"], f"IF(ISNUMBER($O{x}),{xmoney(f'$O{x}*$P{x}')},{xmoney(f'$M{x}*{capped}')})",
                       value, eur)
            bk.formula(ws, r, COL[f"m_{case}"], f"ROUND({pc}{x}/$P{x},1)", ratio(value / inv, 1), mult)
            # secondaire partiel : fund_model.split_secondary
            parts, share = fm.split_secondary(line, value)
            sp = parts[0][1] if share else 0
            ep = parts[-1][1]
            sc = share * inv
            flag = f"AND({sec_test.format(r=x)},$L{x}>SecYear,{pc}{x}<>0)"
            spc, scc = xl_col_to_name(COL[f"sp_{case}"]), xl_col_to_name(COL[f"sc_{case}"])
            bk.formula(ws, r, COL[f"sp_{case}"], f"IF({flag},{xmoney(f'SecShare*SecPrice*{pc}{x}')},0)", sp, helper)
            bk.formula(ws, r, COL[f"ep_{case}"], f"IF({flag},{xmoney(f'(1-SecShare)*{pc}{x}')},{pc}{x})", ep, helper)
            bk.formula(ws, r, COL[f"sc_{case}"], f"IF({flag},SecShare*$P{x},0)", sc, helper)
            bk.formula(ws, r, COL[f"ec_{case}"], f"$P{x}-{scc}{x}", inv - sc, helper)

    for layer in fm.LAYERS:
        r = LinesLayout.sub[layer]
        lines = [x for x in fm.LINES if x.layer == layer]
        r0, r1 = LinesLayout.rows[lines[0].id] + 1, LinesLayout.rows[lines[-1].id] + 1
        lay = DATA["layers"][layer]
        for c in range(len(INPUT_COLS) + len(CALC_COLS)):
            ws.write_blank(r, c, None, sub_txt)
        ws.write(r, 0, "SUB", sub_txt)
        ws.write(r, COL["outcome"], f"({LAYER_NAME[layer]})", sub_txt)
        for key, val in (("initial", lay["initial"]), ("follow_on", lay["follow_on"]), ("invested", lay["invested"])):
            cl = xl_col_to_name(COL[key])
            bk.formula(ws, r, COL[key], f"SUM({cl}{r0}:{cl}{r1})", val, sub_eur)
        for case in CASE_IDS:
            cl = xl_col_to_name(COL[f"p_{case}"])
            bk.formula(ws, r, COL[f"p_{case}"], f"SUM({cl}{r0}:{cl}{r1})", lay["proceeds"][case], sub_eur)
            bk.formula(ws, r, COL[f"m_{case}"], f"ROUND({cl}{r + 1}/P{r + 1},1)", lay["moic"][case], sub_mult)

    r = LinesLayout.total
    tot_txt = bk.f(bold=True, top=2, top_color=INK)
    tot_eur, tot_mult = bk.f(bold=True, top=2, top_color=INK, num_format=EUR), bk.f(bold=True, top=2, top_color=INK,
                                                                                     num_format=MULT)
    for c in range(len(INPUT_COLS) + len(CALC_COLS)):
        ws.write_blank(r, c, None, tot_txt)
    ws.write(r, 0, "TOTAL", tot_txt)
    subs = [LinesLayout.sub[x] + 1 for x in fm.LAYERS]
    a = DATA["allocation"]
    for key, val in (("initial", sum(DATA["layers"][x]["initial"] for x in fm.LAYERS)),
                     ("follow_on", sum(DATA["layers"][x]["follow_on"] for x in fm.LAYERS)),
                     ("invested", a["invested"])):
        cl = xl_col_to_name(COL[key])
        bk.formula(ws, r, COL[key], "+".join(f"{cl}{s}" for s in subs), val, tot_eur)
    for case in CASE_IDS:
        cl = xl_col_to_name(COL[f"p_{case}"])
        bk.formula(ws, r, COL[f"p_{case}"], "+".join(f"{cl}{s}" for s in subs), DATA["cases"][case]["gross_exits"],
                   tot_eur)
        inv_total = a["invested"]
        bk.formula(ws, r, COL[f"m_{case}"], f"ROUND({cl}{r + 1}/P{r + 1},1)",
                   ratio(DATA["cases"][case]["gross_exits"] / inv_total, 1), tot_mult)
    ws.write(r + 2, 0, "Proceeds = exit stake × exit value (capped in Base and Stress), or recovery multiple × "
                       "invested; rounded to EUR 10K below EUR 1M and EUR 100K above, before any sum. "
                       "Proceeds are shown at exit value; the year-6 partial secondary sale is in the helpers "
                       "and the Cash flows tab.", bk.f(font_color=MUTED, italic=True))
    ws.freeze_panes(5, 1)


# ── Construction ────────────────────────────────────────────────────────────
class ConsLayout:
    layer_row: dict = {}
    total_row = 0
    cols: dict = {}
    alloc: dict = {}
    returner: dict = {}
    exposure: dict = {}
    reserve: dict = {}


def sheet_construction(bk: Book, cf_out: dict) -> None:
    ws = bk.sheet("Construction")
    bk.title(ws, "Portfolio construction", "Per layer, capital allocation, reserve policy and exposure per company.")
    ws.set_column(0, 0, 44)
    ws.set_column(1, 14, 14)
    hd = bk.f(bold=True, bg_color=BAND, text_wrap=True, align="center", border=1, border_color=LINE)
    eur, mult, pct0, num = bk.f(num_format=EUR), bk.f(num_format=MULT), bk.f(num_format=PCT0), bk.f(num_format=INT)
    bold = {k: bk.f(bold=True, top=1, top_color=INK, num_format=v) for k, v in
            (("eur", EUR), ("mult", MULT), ("pct0", PCT0), ("int", INT), ("txt", "@"))}
    L = LinesLayout

    r = 3
    bk.band(ws, r, "Portfolio by layer", c1=14)
    r += 1
    cols = ["companies", "positions", "initial", "follow_on", "invested", "internal", "direct_pct"] + \
        [f"p_{c}" for c in CASE_IDS] + [f"m_{c}" for c in CASE_IDS]
    heads = ["Companies (new entries)", "Positions (lines)", "Initial tickets", "Follow-on", "Invested",
             "Of which in our breakouts", "Direct entries"] + \
        [f"Proceeds · {CASE_NAME[c]}" for c in CASE_IDS] + [f"Gross MOIC · {CASE_NAME[c]}" for c in CASE_IDS]
    ConsLayout.cols = {k: 1 + i for i, k in enumerate(cols)}
    ws.set_row(r, 32)
    ws.write(r, 0, "Layer", hd)
    for i, h in enumerate(heads):
        ws.write(r, 1 + i, h, hd)
    r += 1
    for layer in fm.LAYERS:
        ConsLayout.layer_row[layer] = r
        x, crit = r + 1, f'"{LAYER_NAME[layer]}"'
        lay = DATA["layers"][layer]
        lines = [l for l in fm.LINES if l.layer == layer]
        internal = sum(fm.invested(l) for l in lines if l.kind == "follow_on")
        ws.write(r, 0, LAYER_NAME[layer], bk.f(bold=True))
        C = ConsLayout.cols
        cl = {k: xl_col_to_name(v) for k, v in C.items()}
        bk.formula(ws, r, C["companies"], f'SUMIFS({L.col("n")},{L.col("layer")},{crit},{L.col("kind")},"new")',
                   lay["companies"], num)
        bk.formula(ws, r, C["positions"], f"COUNTIF({L.col('layer')},{crit})", lay["positions"], num)
        for key in ("initial", "follow_on", "invested"):
            bk.formula(ws, r, C[key], f"SUMIF({L.col('layer')},{crit},{L.col(key)})", lay[key], eur)
        bk.formula(ws, r, C["internal"],
                   f'SUMIFS({L.col("invested")},{L.col("layer")},{crit},{L.col("kind")},"follow_on")', internal, eur)
        bk.formula(ws, r, C["direct_pct"], f"ROUND(({cl['invested']}{x}-{cl['internal']}{x})/{cl['invested']}{x},2)",
                   ratio((lay["invested"] - internal) / lay["invested"], 2), pct0)
        for case in CASE_IDS:
            bk.formula(ws, r, C[f"p_{case}"], f"SUMIF({L.col('layer')},{crit},{L.col(f'p_{case}')})",
                       lay["proceeds"][case], eur)
            bk.formula(ws, r, C[f"m_{case}"], f"ROUND({cl[f'p_{case}']}{x}/{cl['invested']}{x},1)",
                       lay["moic"][case], mult)
        r += 1
    ConsLayout.total_row = r
    r0, r1 = ConsLayout.layer_row["seed"] + 1, ConsLayout.layer_row["growth"] + 1
    ws.write(r, 0, "Total", bold["txt"])
    C = ConsLayout.cols
    tot_internal = DATA["layers"]["growth"]["internal"]
    totals = {"companies": DATA["fund"]["companies"], "positions": len(fm.LINES),
              "initial": sum(DATA["layers"][x]["initial"] for x in fm.LAYERS),
              "follow_on": sum(DATA["layers"][x]["follow_on"] for x in fm.LAYERS),
              "invested": DATA["allocation"]["invested"], "internal": tot_internal}
    for key, val in totals.items():
        cl = xl_col_to_name(C[key])
        bk.formula(ws, r, C[key], f"SUM({cl}{r0}:{cl}{r1})", val, bold["int" if key in ("companies", "positions") else "eur"])
    cl_inv, cl_int = xl_col_to_name(C["invested"]), xl_col_to_name(C["internal"])
    bk.formula(ws, r, C["direct_pct"], f"ROUND(({cl_inv}{r + 1}-{cl_int}{r + 1})/{cl_inv}{r + 1},2)",
               ratio((totals["invested"] - tot_internal) / totals["invested"], 2), bold["pct0"])
    for case in CASE_IDS:
        cl = xl_col_to_name(C[f"p_{case}"])
        gross = DATA["cases"][case]["gross_exits"]
        bk.formula(ws, r, C[f"p_{case}"], f"SUM({cl}{r0}:{cl}{r1})", gross, bold["eur"])
        bk.formula(ws, r, C[f"m_{case}"], f"ROUND({cl}{r + 1}/{cl_inv}{r + 1},1)",
                   ratio(gross / totals["invested"], 1), bold["mult"])
    r += 3

    # Allocation : les frais du cas cible (Cash flows), la reserve tombe juste
    bk.band(ws, r, "Capital allocation", c1=3)
    r += 1
    a = DATA["allocation"]
    lr = ConsLayout.layer_row
    inv_cell = xl_col_to_name(C["invested"])
    items = [
        ("seed", "Seed — invested", f"{inv_cell}{lr['seed'] + 1}", a["seed"], eur),
        ("venture", "Venture — invested", f"{inv_cell}{lr['venture'] + 1}", a["venture"], eur),
        ("growth", "Growth — invested", f"{inv_cell}{lr['growth'] + 1}", a["growth"], eur),
        ("invested", "Invested", None, a["invested"], bold["eur"]),
        ("initial", "  of which initial tickets in new companies",
         f'SUMIFS({L.col("initial")},{L.col("kind")},"new")', a["initial"], eur),
        ("follow_on", "  of which follow-ons (reserves and our breakouts)", None, a["follow_on"], eur),
        ("follow_on_pct", "  follow-on share of invested capital", None, a["follow_on_pct"], pct0),
        ("mgmt_fees", "Management fees (Target case)", cf_out["target"]["mgmt_fees"], a["mgmt_fees"], eur),
        ("fund_expenses", "Fund expenses, incl. set-up (Target case)", cf_out["target"]["fund_expenses"],
         a["fund_expenses"], eur),
        ("contingency", "Contingency", None, a["contingency"], eur),
        ("total", "Total commitments", "Commitments", a["total"], bold["eur"]),
    ]
    for key, label, formula, value, fmt in items:
        ConsLayout.alloc[key] = r
        ws.write(r, 0, label, bk.f(bold=True) if fmt in (bold["eur"],) else None)
        if key == "invested":
            formula = "+".join(f"B{ConsLayout.alloc[k] + 1}" for k in ("seed", "venture", "growth"))
        elif key == "follow_on":
            formula = f"B{ConsLayout.alloc['invested'] + 1}-B{ConsLayout.alloc['initial'] + 1}"
        elif key == "follow_on_pct":
            formula = f"ROUND(B{ConsLayout.alloc['follow_on'] + 1}/B{ConsLayout.alloc['invested'] + 1},2)"
        elif key == "contingency":
            al = ConsLayout.alloc
            formula = xmoney(f"Commitments-B{al['invested'] + 1}-B{al['mgmt_fees'] + 1}-B{al['fund_expenses'] + 1}")
        bk.formula(ws, r, 1, formula, value, fmt)
        r += 1
    r += 2

    # Politique de reserves : le suivi modelise doit rester a 5 % de l'esperance
    bk.band(ws, r, "Follow-on reserves vs policy (expected value)", c1=5)
    r += 1
    for i, h in enumerate(("Layer", "Companies", "Expected follow-on", "Modelled follow-on", "Gap", "Within 5%")):
        ws.write(r, i, h, hd)
    r += 1
    for layer in ("seed", "venture"):
        n, lay = DATA["layers"][layer]["companies"], LAYER_NAME[layer]
        x = r + 1
        ws.write(r, 0, lay, bk.f(bold=True))
        bk.formula(ws, r, 1, f"{xl_col_to_name(C['companies'])}{lr[layer] + 1}", n, num)
        exp = DATA["reserve_policy"][layer]["expected"]
        bk.formula(ws, r, 2, xmoney(f"B{x}*Res{lay}_graduation_pct*Res{lay}_pro_rata_pct*Res{lay}_next_round"
                                    f"+Res{lay}_bridges"), exp, eur)
        fo = DATA["layers"][layer]["follow_on"]
        bk.formula(ws, r, 3, f"{xl_col_to_name(C['follow_on'])}{lr[layer] + 1}", fo, eur)
        bk.formula(ws, r, 4, f"D{x}-C{x}", fo - exp, eur)
        bk.formula(ws, r, 5, f'IF(ABS(E{x})<=0.05*C{x},"OK","CHECK")', "OK" if abs(fo - exp) <= 0.05 * exp else "CHECK",
                   bk.f(align="center", bold=True))
        ConsLayout.reserve[layer] = r
        r += 1
    r += 2

    # Exposition par societe (toutes lignes) et fund returner
    bk.band(ws, r, "Exposure per company (all lines, per company) and fund returner", c1=6)
    r += 1
    for i, h in enumerate(("Company", "Invested by the fund", "Cap from the fund", "Within cap",
                           "Proceeds · Target (all lines)", "SPV top-up to the max per company")):
        ws.write(r, i, h, hd)
    ws.set_row(r, 32)
    r += 1
    expo = fm.exposures()
    by_co: dict[str, int] = {}
    for line in fm.LINES:
        by_co[line.company] = by_co.get(line.company, 0) + fm.proceeds(line, None)
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
    ws.write(r, 0, "SPV top-ups, total (outside the fund)", bk.f(bold=True))
    bk.formula(ws, r, 5, f"SUM(F{first + 1}:F{last + 1})", DATA["spv_total"], bold["eur"])
    ConsLayout.exposure["_spv_total"] = r
    r += 2
    fr = DATA["fund_returner"]
    for key, label, formula, value, fmt in (
        ("company", "Fund returner (largest proceeds, Target)",
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
    ("inv", "Investments (initial tickets and follow-ons)", True),
    ("exitp", "Exit proceeds received, incl. the partial secondary sale", True),
    ("tail", "Running costs of the years after the horizon, set aside", True),
    ("dist", "Distributable proceeds", True),
    ("cost", "Cost of the positions sold", True),
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
    ("gross_exits", "Gross exit value", "eur"),
    ("realised", "Realised (exit proceeds incl. secondary)", "eur"),
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
    ("clawback", "GP clawback (must be zero)", "eur"),
)


def mirror_case(cap):
    """Le miroir Python des formules de l'onglet Cash flows (meme ordre de calcul que run_case)."""
    n = len(YEARS)
    z = lambda: [0.0] * n  # noqa: E731
    R = {k[0]: z() for k in FLOW_ROWS if k}
    tail = TERMS["running_cost"] * max(0, FUND["term_years"] - HORIZON)
    sp_tot, sc_tot = 0.0, 0.0
    for line in fm.LINES:
        inv = fm.invested(line)
        R["inv"][line.invest_year - 1] += line.initial
        if line.follow_on:
            R["inv"][line.follow_on_year - 1] += line.follow_on
        value = fm.proceeds(line, cap)
        parts, share = fm.split_secondary(line, value)
        if share:
            sp_tot += parts[0][1]
            sc_tot += share * inv
        R["exitp"][line.exit_year - 1] += parts[-1][1]
        R["cost"][line.exit_year - 1] += inv - share * inv
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
            R["mgmt"][i] = (TERMS["fee_ip_pct"] * FUND["commitments"] if year <= FUND["investment_period_years"]
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
    gross_exits = sum(fm.proceeds(x, cap) for x in fm.LINES)
    lp_t, calls_t = sum(R["lp"]), sum(R["calls"])
    out = {
        "gross_exits": gross_exits,
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
        "clawback": max(0.0, R["gpc"][-1] - carry * max(0.0, R["po"][-1] - R["contrib"][-1])),
    }
    out["secondary_discount"] = gross_exits - out["realised"]
    return R, out


class CFLayout:
    year_row = 6
    rows: dict = {}     # (cas, cle) -> rang
    out: dict = {}      # (cas, cle) -> rang


def sheet_cashflows(bk: Book) -> dict:
    ws = bk.sheet("Cash flows", grid=True)
    bk.title(ws, "Cash flows — yearly, per case",
             "Year 1 = year of the first closing; all flows at year end. Columns after the horizon stay at zero. "
             "Base and Stress cap every exit value; everything else is unchanged.")
    ws.set_column(0, 0, 60)
    ws.set_column(1, 1, 15)
    ws.set_column(2, 1 + len(YEARS), 13)
    eur, eur_b = bk.f(num_format=EUR), bk.f(num_format=EUR, bold=True)
    muted = bk.f(num_format=EUR, font_color=MUTED)
    L = LinesLayout
    c_first, c_last = 2, 1 + len(YEARS)

    ws.write(3, 0, "Horizon (last exit year)")
    bk.formula(ws, 3, 1, f"MAX({L.col('exit_year')})", HORIZON, bk.f(num_format=YEAR, bold=True))
    bk.wb.define_name("Horizon", "=" + ref("Cash flows", 3, 1))
    tail = TERMS["running_cost"] * max(0, FUND["term_years"] - HORIZON)
    ws.write(4, 0, "Running costs of the years after the horizon (set aside from the last distribution)")
    bk.formula(ws, 4, 1, "RunningCost*MAX(0,TermYears-Horizon)", tail, eur_b)
    bk.wb.define_name("TailCost", "=" + ref("Cash flows", 4, 1))

    yr = CFLayout.year_row
    hd = bk.f(bold=True, bg_color=BAND, align="center", border=1, border_color=LINE, num_format='"Year "0')
    ws.write(yr, 0, "Euros", bk.f(bold=True, bg_color=BAND, border=1, border_color=LINE))
    ws.write(yr, 1, "Total", bk.f(bold=True, bg_color=BAND, align="center", border=1, border_color=LINE))
    for i, y in enumerate(YEARS):
        ws.write(yr, c_first + i, y, hd)

    outs = {}
    r = yr + 2
    for case in CASE_IDS:
        cap = CASE_CAPS[case]
        R, out = mirror_case(cap)
        ref_case = DATA["cases"][case]
        for k, v in out.items():
            if k != "clawback" and v != ref_case[k]:
                raise SystemExit(f"miroir Python : {case} {k} = {v}, fund.json = {ref_case[k]}")
        if out["clawback"] >= 1:
            raise SystemExit(f"miroir Python : clawback {case}")
        outs[case] = {}
        label = {"target": "TARGET CASE — exit values uncapped",
                 "base": "BASE CASE — every exit value capped (Assumptions)",
                 "stress": "STRESS CASE — every exit value capped lower (Assumptions)"}[case]
        bk.band(ws, r, label, 0, c_last, BLUE_DK)
        r += 1
        for spec in FLOW_ROWS:
            if spec is None:
                r += 1
                continue
            CFLayout.rows[(case, spec[0])] = r
            r += 1
        rows = {k: CFLayout.rows[(case, k)] for k in R}
        # formules, colonne par colonne
        sp, ep = L.col(f"sp_{case}"), L.col(f"ep_{case}")
        sc, ec = L.col(f"sc_{case}"), L.col(f"ec_{case}")
        for key, label_txt, total in (s for s in FLOW_ROWS if s):
            rr = rows[key]
            ws.write(rr, 0, ("     " if key in ("hb0", "hb1", "contrib", "d1", "po1", "d2", "po", "gpc", "nic") else "")
                     + label_txt, bk.f(bold=key in ("calls", "dist", "lp", "gp", "net")))
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

            put("inv", f"SUMIFS({L.col('initial')},{L.col('invest_year')},{Y})"
                       f"+SUMIFS({L.col('follow_on')},{L.col('follow_on_year')},{Y})")
            put("exitp", f"SUMIFS({ep},{L.col('exit_year')},{Y})+IF({Y}=SecYear,SUM({sp}),0)")
            put("tail", f"IF({Y}=Horizon,-TailCost,0)")
            put("dist", f"{at('exitp')}+{at('tail')}", eur_b)
            put("cost", f"SUMIFS({ec},{L.col('exit_year')},{Y})+IF({Y}=SecYear,SUM({sc}),0)")
            put("nic", (f"{at('inv')}-{at('cost')}" if first else f"{at('nic', True)}+{at('inv')}-{at('cost')}"), muted)
            nic_prev = "0" if first else at("nic", True)
            put("mgmt", f"IF({Y}>Horizon,0,IF({Y}<=IPYears,FeeIP*Commitments,FeePost*MAX({nic_prev},0)))")
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
        bk.band(ws, r, f"Outputs — {CASE_NAME[case]} case", 0, 3, BLUE)
        r += 1
        fmts = {"eur": eur_b, "mult": bk.f(num_format=MULT, bold=True), "pct0": bk.f(num_format=PCT0, bold=True)}

        def row_sum(k, c0=a, c1=b):
            return f"SUM({c0}{rows[k] + 1}:{c1}{rows[k] + 1})"
        last = xl_col_to_name(c_last)
        y6 = xl_col_to_name(c_first + 5)
        formulas = {
            "gross_exits": f"{xl_col_to_name(COL[f'p_{case}'])}{LinesLayout.total + 1}",
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
            "clawback": f"MAX(0,{last}{rows['gpc'] + 1}-Carry*MAX(0,{last}{rows['po'] + 1}-{last}{rows['contrib'] + 1}))",
        }
        for key, label_txt, kind in OUT_ROWS:
            ws.write(r, 0, label_txt)
            if key == "gross_exits":
                formulas[key] = "Lines!" + formulas[key]
            if key == "secondary_discount":
                ro = CFLayout.out
                formulas[key] = f"B{ro[(case, 'gross_exits')] + 1}-B{ro[(case, 'realised')] + 1}"
            bk.formula(ws, r, 1, formulas[key], out[key], fmts[kind])
            CFLayout.out[(case, key)] = r
            outs[case][key] = ref("Cash flows", r, 1)
            r += 1
        r += 2
    ws.freeze_panes(yr + 1, 2)
    return outs


# ── Performance ─────────────────────────────────────────────────────────────
def sheet_performance(bk: Book, outs: dict) -> None:
    ws = bk.sheet("Performance")
    bk.title(ws, "Fund performance — target returns, built line by line",
             "Net of fees, expenses and carried interest. The table shown on profund.vc/pitch.")
    ws.set_column(0, 0, 40)
    ws.set_column(1, 3, 16)
    ws.set_column(4, 4, 4)
    hd = bk.f(bold=True, font_color="#FFFFFF", bg_color=BLUE_DK, align="center")
    ws.write(3, 0, "Metric", bk.f(bold=True, font_color="#FFFFFF", bg_color=BLUE_DK))
    for j, case in enumerate(CASE_IDS):
        ws.write(3, 1 + j, CASE_NAME[case], hd)
    eur = {j: bk.f(num_format=EUR, bold=j == 0, bg_color=BAND if j == 0 else "#FFFFFF", bottom=1, bottom_color=LINE)
           for j in range(3)}
    mult = {j: bk.f(num_format=MULT, bold=j == 0, bg_color=BAND if j == 0 else "#FFFFFF", bottom=1, bottom_color=LINE)
            for j in range(3)}
    pct = {j: bk.f(num_format=PCT0, bold=j == 0, bg_color=BAND if j == 0 else "#FFFFFF", bottom=1, bottom_color=LINE)
           for j in range(3)}
    neg = {j: bk.f(num_format='-"€"#,##0;"€"#,##0;"–"', bold=j == 0, bg_color=BAND if j == 0 else "#FFFFFF",
                   bottom=1, bottom_color=LINE) for j in range(3)}
    lab = bk.f(bottom=1, bottom_color=LINE)
    cons = ConsLayout
    rows = [
        ("Fund size", lambda c: ("Commitments", FUND["commitments"]), eur),
        ("Gross exit value", lambda c: (outs[c]["gross_exits"], DATA["cases"][c]["gross_exits"]), eur),
        (f"Year-{SEC['year']} secondary discount",
         lambda c: (outs[c]["secondary_discount"], DATA["cases"][c]["secondary_discount"]), neg),
        ("Net TVPI", lambda c: (outs[c]["net_tvpi"], DATA["cases"][c]["net_tvpi"]), mult),
        ("Net IRR", lambda c: (outs[c]["net_irr"], DATA["cases"][c]["net_irr"]), pct),
        ("Net DPI by year 6", lambda c: (outs[c]["dpi_year6"], DATA["cases"][c]["dpi_year6"]), mult),
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
            bk.formula(ws, r, 1 + j, outs[case][key], DATA["cases"][case][key],
                       (pct if key == "gross_irr" else eur)[j])
        r += 1
    r += 1
    note = bk.f(font_color=MUTED, italic=True, text_wrap=True, valign="top")
    ws.merge_range(r, 0, r + 4, 3,
                   "Net = after management fees (on commitments during the investment period, then on invested "
                   "capital), fund expenses and carried interest (European whole-of-fund waterfall with a hurdle and "
                   "GP catch-up), before tax. The Target case assumes one fund returner and a partial secondary sale "
                   "of the two largest winners (see Assumptions). Base and Stress cap every exit value; everything "
                   "else is unchanged. Targets are model outputs, not a forecast or a guarantee.", note)
    ws.merge_range(r + 6, 0, r + 8, 3, PROJECTIONS, note)


# ── Checks ──────────────────────────────────────────────────────────────────
def sheet_checks(bk: Book, outs: dict) -> list:
    ws = bk.sheet("Checks", tab=GREEN)
    bk.title(ws, "Checks — this workbook vs the Python model",
             "Every output recalculated here is compared with the published model, scripts/fund_model.py "
             "(src/data/fund.json): change an input and these checks turn red by design.")
    ws.set_column(0, 0, 52)
    ws.set_column(1, 3, 18)
    ws.set_column(4, 4, 10)
    hd = bk.f(bold=True, bg_color=BAND, border=1, border_color=LINE, align="center")
    ws.write_row(5, 0, ["Check", "This workbook", "Python model (fund.json)", "Difference", "Status"], hd)
    st = bk.f(bold=True, align="center")
    r = 6
    items = []          # (libelle, formule, valeur, reference, format)

    def money_ref(sheet, rr, cc):
        return xmoney(ref(sheet, rr, cc))

    eur, mult, pct, num, txt = (bk.f(num_format=EUR), bk.f(num_format=MULT), bk.f(num_format="0.00"),
                                bk.f(num_format=INT), bk.f(align="right"))
    fmt_of = {"eur": eur, "mult": mult, "pct0": pct}
    for case in CASE_IDS:
        ref_case = DATA["cases"][case]
        for key, label, kind in OUT_ROWS:
            if key == "clawback":
                continue
            items.append((f"{CASE_NAME[case]} · {label}", outs[case][key], ref_case[key], ref_case[key], fmt_of[kind]))
        for key, row_key, label in (("calls", "calls", "capital calls"), ("distributions", "dist", "distributions"),
                                    ("lp", "lp", "LP distributions"), ("gp", "gp", "carried interest")):
            for i, v in enumerate(ref_case["cashflows"][key]):
                rr, cc = CFLayout.rows[(case, row_key)], 2 + i
                items.append((f"{CASE_NAME[case]} · {label}, year {i + 1} (rounded)", money_ref("Cash flows", rr, cc),
                              v, v, eur))
    C = ConsLayout
    for layer in fm.LAYERS:
        lay = DATA["layers"][layer]
        rr = C.layer_row[layer]
        for key, label, fmt in (("companies", "companies", num), ("positions", "positions", num),
                                ("initial", "initial tickets", eur), ("follow_on", "follow-on", eur),
                                ("invested", "invested", eur)):
            items.append((f"{LAYER_NAME[layer]} · {label}", ref("Construction", rr, C.cols[key]), lay[key], lay[key], fmt))
        for case in CASE_IDS:
            items.append((f"{LAYER_NAME[layer]} · proceeds {CASE_NAME[case]}",
                          ref("Construction", rr, C.cols[f"p_{case}"]), lay["proceeds"][case], lay["proceeds"][case], eur))
            items.append((f"{LAYER_NAME[layer]} · gross MOIC {CASE_NAME[case]}",
                          ref("Construction", rr, C.cols[f"m_{case}"]), lay["moic"][case], lay["moic"][case], mult))
    g, rg = DATA["layers"]["growth"], C.layer_row["growth"]
    items.append(("Growth · in our breakouts", ref("Construction", rg, C.cols["internal"]), g["internal"], g["internal"],
                  eur))
    items.append(("Growth · direct entries", ref("Construction", rg, C.cols["direct_pct"]), g["direct_pct"],
                  g["direct_pct"], pct))
    for key, val in DATA["allocation"].items():
        items.append((f"Allocation · {key.replace('_', ' ')}", ref("Construction", C.alloc[key], 1), val, val,
                      pct if key == "follow_on_pct" else eur))
    for line in fm.LINES:
        lj = next(x for layer in fm.LAYERS for x in DATA["layers"][layer]["lines"] if x["id"] == line.id)
        rr = LinesLayout.rows[line.id]
        for key, col, fmt in (("entry_pct", "entry_pct", pct), ("proceeds", "p_target", eur), ("moic", "m_target", mult)):
            items.append((f"{row_id(line)} · {key.replace('_', ' ')}", ref("Lines", rr, COL[col]), lj[key], lj[key], fmt))
    for layer in ("seed", "venture"):
        v = DATA["reserve_policy"][layer]["expected"]
        items.append((f"{LAYER_NAME[layer]} · expected follow-on (reserve policy)", ref("Construction", C.reserve[layer], 2),
                      v, v, eur))
    for s in DATA["spv"]:
        rr = C.exposure[s["company"]]
        items.append((f"{s['company']} · invested by the fund", ref("Construction", rr, 1), s["fund"], s["fund"], eur))
        items.append((f"{s['company']} · SPV top-up", ref("Construction", rr, 5), s["spv"], s["spv"], eur))
    items.append(("SPV top-ups, total", ref("Construction", C.exposure["_spv_total"], 5), DATA["spv_total"],
                  DATA["spv_total"], eur))
    fr = DATA["fund_returner"]
    items.append(("Fund returner · proceeds", ref("Construction", C.returner["proceeds"], 1), fr["proceeds"],
                  fr["proceeds"], eur))
    items.append(("Fund returner · multiple of the fund", ref("Construction", C.returner["multiple"], 1),
                  fr["multiple_of_fund"], fr["multiple_of_fund"], mult))
    items.append(("Max per company from the fund", "CompanyCap", DATA["fund"]["company_cap"],
                  DATA["fund"]["company_cap"], eur))
    items.append(("GP commitment, minimum", "GPCommitMin", DATA["terms"]["gp_commit_min"], DATA["terms"]["gp_commit_min"],
                  eur))

    for label, formula, value, refv, fmt in items:
        x = r + 1
        ws.write(r, 0, label)
        bk.formula(ws, r, 1, formula, value, fmt)
        ws.write(r, 2, refv, fmt)
        bk.formula(ws, r, 3, f"B{x}-C{x}", value - refv, fmt)
        bk.formula(ws, r, 4, f'IF(ABS(D{x})<0.000001,"OK","CHECK")', "OK" if abs(value - refv) < 1e-6 else "CHECK", st)
        r += 1
    # le fund returner est un texte
    x = r + 1
    ws.write(r, 0, "Fund returner · company")
    bk.formula(ws, r, 1, ref("Construction", C.returner["company"], 1), fr["company"], txt)
    ws.write(r, 2, fr["company"], txt)
    bk.formula(ws, r, 4, f'IF(B{x}=C{x},"OK","CHECK")', "OK", st)
    r += 2

    # invariants du modele (fund_model.validate)
    ws.write(r, 0, "Model rules", bk.f(bold=True, font_color=BLUE_DK))
    r += 1
    rules = [("Contingency is not negative", f"IF({ref('Construction', C.alloc['contingency'], 1)}>=0,\"OK\",\"CHECK\")")]
    for case in CASE_IDS:
        rules.append((f"{CASE_NAME[case]} · paid-in within commitments",
                      f"IF({outs[case]['paid_in']}<=Commitments,\"OK\",\"CHECK\")"))
        rules.append((f"{CASE_NAME[case]} · no GP clawback",
                      f"IF({ref('Cash flows', CFLayout.out[(case, 'clawback')], 1)}<1,\"OK\",\"CHECK\")"))
    exp_rows = [C.exposure[co] for co in fm.exposures()]
    rules.append(("Every company within the cap from the fund",
                  f"IF(COUNTIF({rng('Construction', min(exp_rows), max(exp_rows), 3)},\"CHECK\")=0,\"OK\",\"CHECK\")"))
    rules.append(("Growth · direct entries at least the minimum",
                  f"IF({ref('Construction', rg, C.cols['direct_pct'])}>=GrowthDirectMin,\"OK\",\"CHECK\")"))
    for layer in ("seed", "venture"):
        rules.append((f"{LAYER_NAME[layer]} · follow-on within 5% of the reserve policy",
                      ref("Construction", C.reserve[layer], 5)))
    for label, formula in rules:
        ws.write(r, 0, label)
        bk.formula(ws, r, 4, formula, "OK", st)
        r += 1
    last = r - 1

    status = rng("Checks", 6, last, 4)
    bk.formula(ws, 3, 0, f'IF(COUNTIF({status},"CHECK")=0,"ALL CHECKS PASS","CHECK FAILED")', "ALL CHECKS PASS",
               bk.f(bold=True, font_size=13))
    bk.formula(ws, 3, 1, f'COUNTIF({status},"OK")', len(items) + 1 + len(rules), bk.f(num_format='0" checks OK"'))
    bk.wb.define_name("ChecksStatus", "=" + ref("Checks", 3, 0))
    green = bk.wb.add_format({"bg_color": "#E5F3EA", "font_color": GREEN})
    red = bk.wb.add_format({"bg_color": "#FBE3DF", "font_color": RED})
    ws.conditional_format(f"E7:E{last + 1}", {"type": "cell", "criteria": "==", "value": '"OK"', "format": green})
    ws.conditional_format(f"E7:E{last + 1}", {"type": "cell", "criteria": "==", "value": '"CHECK"', "format": red})
    ws.conditional_format("A4", {"type": "text", "criteria": "containing", "value": "PASS", "format": green})
    ws.conditional_format("A4", {"type": "text", "criteria": "containing", "value": "FAILED", "format": red})
    ws.freeze_panes(6, 1)
    return items


# ── Read me ─────────────────────────────────────────────────────────────────
def sheet_readme(bk: Book) -> None:
    ws = bk.sheet("Read me", tab=BLUE_DK)
    ws.set_column(0, 0, 24)
    ws.set_column(1, 1, 100)
    ws.set_row(0, 34)
    ws.write(0, 0, f"ProFund Fund I — Fund model ({fm.VERSION})", bk.f(bold=True, font_size=18))
    ws.write(1, 0, f"Model date {fm.MODEL_DATE} · Seed to Growth · amounts in euros · "
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
    for tab, text in (
        ("Assumptions", "Fund size, terms and fees, the partial secondary sale, the cap of each case, layer bounds "
                        "and the follow-on reserve policy."),
        ("Lines", "The simulation lines (Seed S-, Venture V-, Growth G-): entry, follow-on and exit inputs, then "
                  "proceeds and MOIC per case, with layer subtotals."),
        ("Construction", "Portfolio by layer, capital allocation, reserves vs policy, exposure per company and the "
                         "fund returner."),
        ("Cash flows", "Yearly flows per case: investments, exits incl. the year-6 secondary, fees, expenses, capital "
                       "calls, the European waterfall step by step, LP and GP flows; net TVPI, IRR and DPI."),
        ("Performance", "The Fund Performance table shown on profund.vc/pitch, linked to the tabs above."),
        ("Checks", "Every output compared with the Python model the site and the fact sheet read "
                   "(scripts/fund_model.py → src/data/fund.json). Change an input and they turn red: "
                   "the workbook then shows your case, no longer the published one."),
    ):
        ws.write(r, 0, tab, bk.f(bold=True))
        ws.write(r, 1, text, bk.f(text_wrap=True))
        r += 1
    r += 1
    bk.band(ws, r, "Conventions", c1=1, fill=BLUE)
    r += 1
    for k, text, fmt in (
        ("Blue", "Input: change it and the whole workbook recalculates (Excel, LibreOffice, Google Sheets).",
         bk.f(bold=True, font_color=INPUT)),
        ("Black", "Formula.", bk.f(bold=True)),
        ("Green", "Check against the Python model.", bk.f(bold=True, font_color=GREEN)),
        ("Years", "Year 1 = year of the first closing; all flows at year end.", bk.f(bold=True)),
        ("Rounding", "Every amount is rounded to its display grain (EUR 10K below EUR 1M, EUR 100K above) before "
                     "any sum, as in the Python model; ratios at their display precision.", bk.f(bold=True)),
    ):
        ws.write(r, 0, k, fmt)
        ws.write(r, 1, text, bk.f(text_wrap=True))
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
            ok = got == want
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
    bk = Book(OUT)
    sheet_readme(bk)
    sheet_assumptions(bk)
    sheet_lines(bk)
    outs = sheet_cashflows(bk)          # avant Construction : l'allocation lit les frais du cas cible
    sheet_construction(bk, outs)
    sheet_performance(bk, outs)
    items = sheet_checks(bk, outs)
    bk.close()
    n = _pycel_check(bk.cache)
    t = DATA["cases"]["target"]
    print(f"fund_xlsx: {OUT.relative_to(ROOT)} ({OUT.stat().st_size} octets)")
    print(f"  {n} formulas recalculated by pycel = cached values; {bk.cache[('Checks', 3, 1)]} checks "
          f"({len(items) + 1} vs fund.json, the rest model rules): all OK")
    print(f"  target: net TVPI {t['net_tvpi']:.1f}x, net IRR {t['net_irr']:.0%}, DPI y6 {t['dpi_year6']:.1f}x")


if __name__ == "__main__":
    main()
