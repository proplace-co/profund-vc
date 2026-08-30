"""Génère public/profund-factsheet.pdf — la fiche du fonds téléchargeable en bas
de l'accueil.

⚠️ SOURCE UNIQUE DES CHIFFRES : ce fichier, src/components/HomepageLite.tsx et
src/components/ProFundPage.tsx doivent rester d'accord. Ne jamais modifier un
montant, un multiple ou une date ici sans le répercuter dans les deux autres —
c'est une communication destinée à des investisseurs.

Le PDF n'est PAS régénéré par `npm run build` : il est commité dans public/.
Le régénérer à la main après toute modification :

    python scripts/factsheet.py
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo.png"
OUT = ROOT / "public" / "profund-factsheet.pdf"

# Jetons du site (src/index.css :root) — une seule palette.
INK = colors.HexColor("#0A0A0A")
SUB = colors.HexColor("#444444")
MID = colors.HexColor("#777777")
LITE = colors.HexColor("#AAAAAA")
LINE = colors.HexColor("#E8E8E4")
BLUE = colors.HexColor("#627C99")
BLUE_DK = colors.HexColor("#4A6080")
BG = colors.HexColor("#F6F6F3")

W, H = A4
M = 20 * mm          # marge
CW = W - 2 * M       # largeur utile


def _text(c, x, y, s, font="Helvetica", size=9.5, color=SUB, leading=None):
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, y, s)
    return y - (leading or size + 4)


def _wrap(c, x, y, s, width, font="Helvetica", size=9.5, color=SUB, leading=13.5):
    """Rendu multi-lignes avec césure aux espaces. Renvoie le y final."""
    c.setFillColor(color)
    c.setFont(font, size)
    words, line = s.split(), ""
    for w in words:
        probe = f"{line} {w}".strip()
        if c.stringWidth(probe, font, size) <= width:
            line = probe
        else:
            c.drawString(x, y, line)
            y -= leading
            line = w
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def _eyebrow(c, x, y, label):
    """Chapeau à filet bleu — le même signe que sur le site."""
    c.setStrokeColor(BLUE)
    c.setLineWidth(1.6)
    c.line(x, y + 3, x + 16, y + 3)
    c.setFillColor(MID)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 23, y, label.upper())
    return y - 20


def _rule(c, y, x0=M, x1=W - M):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.line(x0, y, x1, y)


def _stat_band(c, y, items, cols=4):
    """Bande de chiffres : grand nombre bleu + libellé gris, filets 1 px."""
    cell = CW / cols
    top, h = y, 30 * mm
    c.setFillColor(BG)
    c.rect(M, top - h, CW, h, stroke=0, fill=1)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.rect(M, top - h, CW, h, stroke=1, fill=0)
    for i, (num, lab) in enumerate(items):
        x = M + i * cell
        if i:
            c.line(x, top - h, x, top)
        c.setFillColor(BLUE_DK)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(x + 9, top - 15 * mm + 12, num)
        _wrap(c, x + 9, top - 15 * mm - 2, lab, cell - 18,
              size=7.4, color=MID, leading=9.6)
    return top - h - 12 * mm


def _table(c, y, title, subtitle, rows, x, width):
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x, y, title)
    y -= 13
    c.setFillColor(BLUE_DK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x, y, subtitle)
    y -= 14
    for k, v in rows:
        _rule(c, y + 8, x, x + width)
        c.setFillColor(MID)
        c.setFont("Helvetica", 8.4)
        c.drawString(x, y, k)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8.4)
        c.drawRightString(x + width, y, v)
        y -= 15
    return y


def _footer(c, page):
    y = 14 * mm
    _rule(c, y + 9)
    c.setFillColor(LITE)
    c.setFont("Helvetica", 7)
    c.drawString(M, y, "ProFund · alexandre@profund.vc · profund.vc")
    c.drawRightString(W - M, y, f"{page}/2")


def page_one(c):
    y = H - M

    if LOGO.exists():
        c.drawImage(str(LOGO), M, y - 11 * mm, height=9 * mm, width=30 * mm,
                    preserveAspectRatio=True, anchor="sw", mask="auto")
    c.setFillColor(MID)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - M, y - 6 * mm, "Fund fact sheet")
    y -= 22 * mm

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(M, y, "Backing Europe's next")
    y -= 28
    c.setFillColor(BLUE)
    c.drawString(M, y, "category winners.")
    y -= 22

    y = _wrap(
        c, M, y,
        "A EUR 35M early-stage fund investing in 21 European companies. Investors and "
        "builders: we built and scaled companies first, and we extend that operating "
        "experience to investment - with a platform that reads every weak signal in an "
        "emerging category before it is obvious.",
        CW, size=10, color=SUB, leading=15,
    )
    y -= 10 * mm

    y = _stat_band(c, y, [
        ("EUR 35M", "Target fund size, incl. follow-on reserves"),
        ("21", "Deals: 12 Scout + 9 Core"),
        ("26%", "Target net IRR (15% base case)"),
        ("6-18mo", "Detection lead before announcement"),
    ])

    y = _eyebrow(c, M, y, "Fund construction")
    y = _wrap(
        c, M, y,
        "Two-tier construction. Scout tickets buy asymmetric exposure at pre-seed, where the "
        "platform's detection lead is worth the most. Core tickets concentrate capital on "
        "validated conviction at Seed+ and Series A. The best Scout bets graduate to Core.",
        CW, size=9.2, color=SUB, leading=13.5,
    )
    y -= 8 * mm

    col = (CW - 10 * mm) / 2
    y_scout = _table(c, y, "Scout portfolio", "12 DEALS  ·  EUR 1.8M INITIAL + EUR 7.5M FOLLOW-ON", [
        ("Ticket", "EUR 150K initial"),
        ("Entry valuation", "EUR 4M - 6M post"),
        ("Stage", "Pre-seed"),
        ("Graduation", "3 of 12 to Core"),
        ("Target MOIC", "2.5x  ·  EUR 23.7M"),
    ], M, col)
    y_core = _table(c, y, "Core portfolio", "9 DEALS  ·  EUR 9.9M INITIAL + EUR 14M FOLLOW-ON", [
        ("Ticket", "EUR 1.1M"),
        ("Entry valuation", "EUR 25M - 35M pre"),
        ("Stage", "Seed+ / Series A"),
        ("Portfolio", "9 direct + 3 graduates"),
        ("Target MOIC", "3.1x  ·  EUR 74.9M"),
    ], M + col + 10 * mm, col)
    y = min(y_scout, y_core) - 8 * mm

    _stat_band(c, y, [
        ("EUR 1.8M", "Scout initial tickets"),
        ("EUR 9.9M", "Core initial tickets"),
        ("EUR 21.5M", "Follow-on reserves"),
        ("EUR 98.6M", "Target gross exit value"),
    ])

    _footer(c, 1)


def page_two(c):
    y = H - M

    c.setFillColor(MID)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - M, y - 6 * mm, "Fund fact sheet")
    y -= 18 * mm

    y = _eyebrow(c, M, y, "Target returns")
    y = _table(c, y, "Fund-level scenarios", "ON EUR 35M DEPLOYED", [
        ("Gross exit value (target)", "EUR 98.6M"),
        ("Gross exit value (base case)", "EUR 65M - 75M"),
        ("Net IRR (target)", "26%"),
        ("Net IRR (base case)", "15%"),
        ("Net DPI (target)", "~2.8x"),
        ("Net DPI (base case)", "1.9x - 2.1x"),
    ], M, CW)
    y -= 8 * mm

    y = _eyebrow(c, M, y, "Strategy")
    for line in (
        "Paris first, then Europe. Early-stage only.",
        "Thesis recalibrated weekly - detection parameters updated every Monday.",
        "Human time reserved for the top 1% of signals; every other signal processed automatically.",
        "Fund administration fully externalised. Reporting automated, daily and weekly.",
        "5% GP commitment on management fees. One person accountable.",
    ):
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(M, y, "-")
        y = _wrap(c, M + 12, y, line, CW - 12, size=9.2, color=SUB, leading=13.5) - 3
    y -= 6 * mm

    y = _eyebrow(c, M, y, "GP track record")
    y = _table(c, y, "Selected positions", "PRIOR TO THE FUND", [
        ("Deal-01  ·  exited 2007", "10.0x"),
        ("Deal-02  ·  exited 2014", "20.0x"),
        ("Deal-03  ·  seed 2014, LBO exit Feb 2025", "19.0x"),
        ("Deal-04  ·  buyout 2016, ongoing", "2.5x CoC"),
    ], M, CW)
    y -= 8 * mm

    y = _eyebrow(c, M, y, "Portfolio today")
    y = _table(c, y, "Two companies built and held", "OPERATING", [
        ("Proplace", "AI-native sourcing platform for funds"),
        ("Maximum Insurance", "Swiss travel insurtech, duty of care"),
    ], M, CW)
    y -= 10 * mm

    _rule(c, y)
    y -= 14
    y = _wrap(
        c, M, y,
        "This document is a summary prepared for information purposes only. It does not "
        "constitute an offer to sell or a solicitation to buy any interest in any fund, nor "
        "investment advice. Target returns are objectives, not forecasts, and are not "
        "guaranteed; past performance does not predict future results. Any investment in a "
        "venture capital fund carries a risk of total capital loss and is illiquid. Interests "
        "are offered to qualified investors only.",
        CW, size=7.4, color=LITE, leading=10.5,
    )
    y -= 6
    _wrap(c, M, y, "Contact: alexandre@profund.vc  ·  profund.vc/legal  ·  profund.vc/privacy",
          CW, size=7.4, color=LITE, leading=10.5)

    _footer(c, 2)


def main():
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("ProFund — Fund Fact Sheet")
    c.setAuthor("ProFund")
    c.setSubject("Early-stage venture capital fund — EUR 35M target")
    page_one(c)
    c.showPage()
    page_two(c)
    c.showPage()
    c.save()
    print(f"factsheet: {OUT} ({OUT.stat().st_size} octets)")


if __name__ == "__main__":
    main()
