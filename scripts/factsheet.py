"""Genere public/profund-factsheet.pdf — la fiche du fonds, deux pages A4.

Mise en page calquee sur https://maximum-insurance.com/fiche-individuel.pdf :
filet d'accent en tete, chapeaux de section en capitales couleur, bande de
chiffres sur fond noir, cartes a en-tete plein, tableaux a filets fins, bloc
d'appel sombre, mentions en pied. Palette ProFund (src/index.css :root).

REGLE EDITORIALE (decision d'Antoine, 30/08) : les MONTANTS et la mention de
PRE-COMMERCIALISATION vivent ICI et nulle part ailleurs. Le site public ne
porte plus un seul chiffre de levee.

⚠️ Les chiffres doivent rester identiques a ceux de
src/components/ProFundPage.tsx (/pitch). Ne jamais en modifier un ici sans le
repercuter la-bas.

TOUT LE TEXTE RENDU EST EN ASCII : les polices Helvetica de base de reportlab
sont en WinAnsi et rendent un carre blanc sur « EUR », « — » ou les guillemets
typographiques. On ecrit donc "EUR", "-" et "'".

Regenerer a la main apres toute modification (npm run build ne le fait PAS) :

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

INK = colors.HexColor("#0A0A0A")
SUB = colors.HexColor("#3A3A3A")
MID = colors.HexColor("#777777")
LITE = colors.HexColor("#9A9A9A")
LINE = colors.HexColor("#E2E2DE")
BLUE = colors.HexColor("#627C99")
BLUE_DK = colors.HexColor("#4A6080")
BG = colors.HexColor("#F6F6F3")
WHITE = colors.white

W, H = A4
M = 17 * mm
CW = W - 2 * M


# ── primitives ──────────────────────────────────────────────────────────────
def _wrap_lines(c, s, width, font, size):
    out, line = [], ""
    for w in s.split():
        probe = f"{line} {w}".strip()
        if c.stringWidth(probe, font, size) <= width:
            line = probe
        else:
            out.append(line)
            line = w
    if line:
        out.append(line)
    return out


def _para(c, x, y, s, width, font="Helvetica", size=9.6, color=SUB, leading=14):
    c.setFillColor(color)
    c.setFont(font, size)
    for ln in _wrap_lines(c, s, width, font, size):
        c.drawString(x, y, ln)
        y -= leading
    return y


def _rule(c, y, x0=M, x1=W - M, color=LINE, w=0.7):
    c.setStrokeColor(color)
    c.setLineWidth(w)
    c.line(x0, y, x1, y)


def _section(c, y, label, color=BLUE):
    """Chapeau : capitales, gras, interlettrees — le signe du modele MI."""
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 9.6)
    c.drawString(M, y, " ".join(label.upper()) if False else label.upper())
    return y - 17


def _bullets(c, x, y, items, width, size=8.8, leading=12, gap=3, color=SUB):
    for it in items:
        c.setFillColor(BLUE)
        c.rect(x, y + 2.4, 3.6, 3.6, stroke=0, fill=1)
        y = _para(c, x + 11, y, it, width - 11, size=size, color=color, leading=leading) - gap
    return y


def _stat_band(c, y, items, h=23 * mm):
    """Bande de chiffres sur fond encre, filets verticaux clairs."""
    top = y
    c.setFillColor(INK)
    c.rect(M, top - h, CW, h, stroke=0, fill=1)
    cell = CW / len(items)
    for i, (num, lab) in enumerate(items):
        x = M + i * cell
        if i:
            c.setStrokeColor(colors.HexColor("#3A3A3A"))
            c.setLineWidth(0.7)
            c.line(x, top - h + 6 * mm, x, top - 6 * mm)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 10, top - 11 * mm, num)
        c.setFillColor(colors.HexColor("#B8B8B8"))
        c.setFont("Helvetica", 7.4)
        for j, ln in enumerate(_wrap_lines(c, lab, cell - 20, "Helvetica", 7.4)[:2]):
            c.drawString(x + 10, top - 15.5 * mm - j * 9, ln)
    return top - h - 9 * mm


def _card(c, x, y, w, header, header_bg, big, big_unit, bullets, h=None):
    """Carte a en-tete plein : bandeau titre, grand chiffre, puces."""
    hh = 8.5 * mm
    body_lines = sum(len(_wrap_lines(c, b, w - 24, "Helvetica", 8.8)) for b in bullets)
    h = h or (hh + 13 * mm + body_lines * 12 + len(bullets) * 5 + 8 * mm)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.8)
    c.rect(x, y - h, w, h, stroke=1, fill=0)
    c.setFillColor(header_bg)
    c.rect(x, y - hh, w, hh, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 12, y - hh + 8, header.upper())

    yy = y - hh - 11 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(x + 12, yy, big)
    bw = c.stringWidth(big, "Helvetica-Bold", 22)
    c.setFillColor(MID)
    c.setFont("Helvetica", 9)
    c.drawString(x + 16 + bw, yy + 2, big_unit)

    yy -= 8 * mm
    for b in bullets:
        c.setFillColor(BLUE)
        c.rect(x + 12, yy + 2.2, 3.4, 3.4, stroke=0, fill=1)
        yy = _para(c, x + 22, yy, b, w - 34, size=8.8, color=SUB, leading=12) - 5
    return y - h


def _kv(c, x, y, w, rows, head=None, head_color=INK):
    if head:
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 9.2)
        c.drawString(x, y, head.upper())
        y -= 6
        _rule(c, y, x, x + w, head_color, 1.4)
        y -= 13
    for k, v in rows:
        vlines = _wrap_lines(c, v, w * 0.52, "Helvetica-Bold", 8.6)
        klines = _wrap_lines(c, k, w * 0.44, "Helvetica", 8.6)
        n = max(len(vlines), len(klines))
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8.6)
        for i, ln in enumerate(klines):
            c.drawString(x, y - i * 10.5, ln)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8.6)
        for i, ln in enumerate(vlines):
            c.drawRightString(x + w, y - i * 10.5, ln)
        y -= n * 10.5 + 5
        _rule(c, y + 5, x, x + w)
    return y


def _accent_and_header(c, page):
    c.setFillColor(BLUE)
    c.rect(0, H - 3.2 * mm, W, 3.2 * mm, stroke=0, fill=1)
    y = H - 15 * mm
    if LOGO.exists():
        c.drawImage(str(LOGO), M, y - 5 * mm, height=9 * mm, width=31 * mm,
                    preserveAspectRatio=True, anchor="sw", mask="auto")
    c.setFillColor(BLUE_DK)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(W - M, y, "profund.vc")
    c.setFillColor(MID)
    c.setFont("Helvetica", 7.6)
    c.drawRightString(W - M, y - 11, f"alexandre@profund.vc   .   {page} / 2")
    return y - 13 * mm


def _footer(c):
    y = 10 * mm
    _rule(c, y + 16)
    c.setFillColor(LITE)
    c.setFont("Helvetica", 6.6)
    c.drawString(M, y + 7, "ProFund - early-stage venture capital - Paris. Pre-marketing communication, "
                           "professional investors only. Not an offer to subscribe.")
    c.drawString(M, y - 1, "profund.vc/legal   .   profund.vc/privacy   .   alexandre@profund.vc")


# ── pages ───────────────────────────────────────────────────────────────────
def page_one(c):
    y = _accent_and_header(c, 1) - 5 * mm   # le titre est gros : il lui faut de l'air sous le logo

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(M, y, "Backing Europe's next")
    y -= 27
    c.drawString(M, y, "category winners.")
    y -= 17
    c.setFillColor(MID)
    c.setFont("Helvetica", 11)
    c.drawString(M, y, "Early-stage venture capital. Paris first, then Europe.")
    y -= 12
    _rule(c, y, color=INK, w=2.2)
    y -= 20

    # Le cadre de pre-commercialisation, en tete de document.
    box_h = 20 * mm
    c.setFillColor(BG)
    c.rect(M, y - box_h, CW, box_h, stroke=0, fill=1)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2.4)
    c.line(M, y - box_h, M, y)
    c.setFillColor(BLUE_DK)
    c.setFont("Helvetica-Bold", 9.2)
    c.drawString(M + 12, y - 7.5 * mm, "PRE-MARKETING PHASE")
    _para(c, M + 12, y - 11.5 * mm,
          "This document is a pre-marketing communication within the meaning of Article 30a of "
          "Directive 2011/61/EU (AIFMD). The fund is not yet established and no units may be "
          "subscribed at this stage. Addressed to professional investors only.",
          CW - 24, size=8, color=SUB, leading=10.5)
    y -= box_h + 9 * mm

    y = _section(c, y, "In one sentence")
    y = _para(c, M, y,
              "A EUR 35M early-stage fund investing in 21 European companies. Investors and builders: "
              "we built and scaled companies first, and we extend that operating experience to "
              "investment - with a platform that reads every weak signal in an emerging category, "
              "six to eighteen months before it is obvious.",
              CW, size=10, leading=14.5)
    y -= 8 * mm

    y = _stat_band(c, y, [
        ("EUR 35M", "Target fund size, incl. reserves"),
        ("21", "Deals: 12 Scout + 9 Core"),
        ("26%", "Target net IRR (15% base case)"),
        ("6-18mo", "Detection lead before announcement"),
    ])

    y = _section(c, y, "Fund construction")
    y = _para(c, M, y,
              "Two tiers. Scout tickets buy asymmetric exposure at pre-seed, where the detection lead "
              "is worth the most. Core tickets concentrate capital on validated conviction at Seed+ "
              "and Series A. The best Scout bets graduate to Core.",
              CW, leading=13.5)
    y -= 6 * mm

    col = (CW - 8 * mm) / 2
    y1 = _card(c, M, y, col, "Scout portfolio", INK, "EUR 150K", "per deal, 12 deals", [
        "Pre-seed, entry at EUR 4M - 6M post-money.",
        "EUR 1.8M initial + EUR 7.5M follow-on reserved.",
        "3 of 12 graduate to Core at Seed+ validation.",
        "Target 2.5x MOIC - EUR 23.7M exit value.",
    ])
    y2 = _card(c, M + col + 8 * mm, y, col, "Core portfolio", BLUE_DK, "EUR 1.1M", "per deal, 9 deals", [
        "Seed+ / Series A, entry at EUR 25M - 35M pre-money.",
        "EUR 9.9M initial + EUR 14M follow-on reserved.",
        "Co-investing alongside Tier 1 leads.",
        "Target 3.1x MOIC - EUR 74.9M exit value.",
    ])
    y = min(y1, y2) - 9 * mm

    y = _section(c, y, "Capital allocation")
    _rule(c, y + 9, M, W - M, INK, 1.4)
    _kv(c, M, y, CW, [
        ("Scout initial tickets - 12 deals at EUR 150K", "EUR 1.8M"),
        ("Core initial tickets - 9 deals at EUR 1.1M", "EUR 9.9M"),
        ("Scout follow-on reserves", "EUR 7.5M"),
        ("Core follow-on reserves", "EUR 14.0M"),
        ("Fees and reserves - balance", "EUR 1.8M"),
        ("Total fund", "EUR 35.0M"),
    ])

    _footer(c)


def page_two(c):
    y = _accent_and_header(c, 2)

    y = _section(c, y, "Target returns")
    c.setFillColor(MID)
    c.setFont("Helvetica-Bold", 7.6)
    c.drawString(M + CW * 0.44, y, "TARGET")
    c.drawString(M + CW * 0.64, y, "BASE CASE")
    c.drawString(M + CW * 0.84, y, "BENCHMARK")
    y -= 6
    _rule(c, y, M, W - M, INK, 1.4)
    y -= 14
    for k, a, b, d in (
        ("Gross exit value on EUR 35M deployed", "EUR 98.6M", "EUR 65M - 75M", "-"),
        ("Net IRR", "26%", "15%", "12% - 18%"),
        ("Net DPI", "~2.8x", "1.9x - 2.1x", "-"),
        ("Scout portfolio MOIC", "2.5x", "-", "-"),
        ("Core portfolio MOIC", "3.1x", "-", "-"),
    ):
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8.8)
        c.drawString(M, y, k)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8.8)
        c.drawString(M + CW * 0.44, y, a)
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8.8)
        c.drawString(M + CW * 0.64, y, b)
        c.drawString(M + CW * 0.84, y, d)
        y -= 14
        _rule(c, y + 4)
    y -= 6 * mm

    y = _section(c, y, "Strategy")
    y = _bullets(c, M, y, [
        "Paris first, then Europe. Early-stage only, from pre-seed to Series A.",
        "The thesis is recalibrated weekly: detection parameters are updated every Monday.",
        "Human time is reserved for the top 1% of signals. Every other signal is processed "
        "automatically, and the reason it was discarded is written down.",
        "A full investment memo and financial model are generated automatically for every "
        "high-conviction match.",
        "Fund administration fully externalised. Reporting automated, daily and weekly.",
        "5% GP commitment on management fees. No investment committee on Scout decisions - "
        "one person accountable.",
    ], CW) - 4 * mm

    y = _section(c, y, "How we source")
    y = _para(c, M, y,
              "Every signal is matched against the active themes, then qualified automatically against "
              "dozens of green and red flags weighted by their historical predictive accuracy. Only the "
              "top 1% surfaces as a CALL - the single verdict that requires human attention.",
              CW, size=8.8, leading=12) - 2
    y = _bullets(c, M, y, [
        "SSL certificate registrations, Pappers legal filings, GitHub repositories.",
        "LinkedIn job posts, Crunchbase API, semantic search, Google Alerts.",
        "VC portfolio additions and grandes ecoles alumni networks.",
    ], CW, gap=3) - 4 * mm

    y = _section(c, y, "GP track record, prior to the fund")
    y = _kv(c, M, y, CW, [
        ("Deal-01 - exited 2007", "10.0x"),
        ("Deal-02 - exited 2014", "20.0x"),
        ("Deal-03 - seed 2014 at EUR 5.3M post, LBO exit Feb 2025 at EUR 100M", "19.0x"),
        ("Deal-04 - buyout 2016 at EUR 45M, held, valued EUR 112.5M", "2.5x CoC"),
    ]) - 4 * mm

    y = _section(c, y, "Portfolio today")
    y = _kv(c, M, y, CW, [
        ("Proplace - AI-native sourcing platform for venture and private equity funds", "Operating"),
        ("Maximum Insurance - Swiss travel insurtech, duty of care", "Operating"),
    ]) - 5 * mm

    # Bloc d'appel sombre — l'equivalent du « Souscrire en 3 minutes » du modele.
    bh = 24 * mm
    c.setFillColor(INK)
    c.rect(M, y - bh, CW, bh, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(M + 14, y - 8.5 * mm, "Follow our deal flow, live.")
    c.setFillColor(colors.HexColor("#8FA6C0"))
    c.setFont("Helvetica-Bold", 13)
    c.drawString(M + 14, y - 14 * mm, "profund.vc")
    c.setFillColor(colors.HexColor("#B8B8B8"))
    c.setFont("Helvetica", 8.2)
    c.drawString(M + 14, y - 18.5 * mm,
                 "The companies our platform detects, every morning. You choose the rhythm, "
                 "the hour and the sections.")
    c.drawString(M + 14, y - 22 * mm, "Questions: alexandre@profund.vc")
    y -= bh + 6 * mm

    _para(c, M, y,
          "This document is a summary prepared for information purposes only, in the context of "
          "pre-marketing under Article 30a of Directive 2011/61/EU. It does not constitute an offer "
          "to sell or a solicitation to buy any interest in any fund, nor investment advice. The "
          "fund is not yet established and has not been authorised; the information presented may "
          "change and no subscription can be accepted at this stage. Target returns are objectives, "
          "not forecasts, and are not guaranteed. Past performance does not predict future results. "
          "Any investment in a venture capital fund carries a risk of total capital loss and is "
          "illiquid over a long horizon.",
          CW, size=7.2, color=LITE, leading=9.6)

    _footer(c)


def main():
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("ProFund - Fund Fact Sheet")
    c.setAuthor("ProFund")
    c.setSubject("Early-stage venture capital - EUR 35M target - pre-marketing communication")
    page_one(c)
    c.showPage()
    page_two(c)
    c.showPage()
    c.save()
    print(f"factsheet: {OUT} ({OUT.stat().st_size} octets)")


if __name__ == "__main__":
    main()
