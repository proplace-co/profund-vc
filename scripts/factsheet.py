"""Genere public/profund-factsheet.pdf — la fiche du fonds, deux pages A4.

Mise en page calquee sur https://maximum-insurance.com/fiche-individuel.pdf :
filet d'accent en tete, chapeaux de section en capitales couleur, bande de
chiffres sur fond noir, cartes a en-tete plein, tableaux a filets fins, bloc
d'appel sombre, mentions en pied. Palette ProFund (src/index.css :root).

REGLE EDITORIALE : construction detaillee, tickets et rendements cibles
vivent ICI (et sur /pitch). L'accueil porte la these en une phrase
(EUR 35M, Lead at seed / co-invest Series A) et renvoie a cette fiche.

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

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo.png"
PHOTO = ROOT / "public" / "gp-photo-sheet.jpg"
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
    return top - h - 7 * mm


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


def _kv(c, x, y, w, rows, head=None, head_color=INK, extra=14):
    if head:
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 9.2)
        c.drawString(x, y, head.upper())
        y -= 6
        _rule(c, y, x, x + w, head_color, 1.4)
        y -= 13
    for k, v in rows:
        vlines = _wrap_lines(c, v, w * 0.34, "Helvetica-Bold", 8.6)
        klines = _wrap_lines(c, k, w * 0.62, "Helvetica", 8.6)
        n = max(len(vlines), len(klines))
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8.6)
        for i, ln in enumerate(klines):
            c.drawString(x, y - i * 10.5, ln)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8.6)
        for i, ln in enumerate(vlines):
            c.drawRightString(x + w, y - i * 10.5, ln)
        y -= n * 10.5 + extra
        _rule(c, y + 12, x, x + w)
    return y


def _accent_and_header(c, page):
    c.setFillColor(BLUE)
    c.rect(0, H - 3.2 * mm, W, 3.2 * mm, stroke=0, fill=1)
    y = H - 15 * mm
    if LOGO.exists():
        c.drawImage(str(LOGO), M, y - 5 * mm, height=9 * mm, width=34 * mm,
                    preserveAspectRatio=True, anchor="sw", mask="auto")
    c.setFillColor(BLUE_DK)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(W - M, y, "profund.vc")
    c.setFillColor(MID)
    c.setFont("Helvetica", 7.6)
    c.drawRightString(W - M, y - 11, f"alexandre@profund.vc   .   {page} / 2")
    return y - 13 * mm


def _qr(c, x, y, size, url):
    """QR on a white quiet zone. (x, y) is the bottom-left of the pad."""
    pad = 1.5 * mm
    inner = size - 2 * pad
    c.setFillColor(WHITE)
    c.roundRect(x, y, size, size, 1.4, stroke=0, fill=1)
    widget = QrCodeWidget(url, barLevel="M")
    b0, b1, b2, b3 = widget.getBounds()
    bw, bh = b2 - b0, b3 - b1
    d = Drawing(inner, inner, transform=[inner / bw, 0, 0, inner / bh, 0, 0])
    d.add(widget)
    renderPDF.draw(d, c, x + pad, y + pad)
    c.linkURL(url, (x, y, x + size, y + size), relative=0, thickness=0)


def _numbered(c, x, y, items, width, size=8.6, leading=11.4, gap=4):
    for i, it in enumerate(items, 1):
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", size)
        num = f"{i}/"
        c.drawString(x, y, num)
        nw = c.stringWidth(num + " ", "Helvetica-Bold", size)
        y = _para(c, x + nw, y, it, width - nw, size=size, leading=leading) - gap
    return y


def _footer(c):
    y = 9 * mm
    _rule(c, y + 11)
    line = ("Pre-marketing communication, professional investors only. "
            "Not an offer to subscribe. Contact: alexandre@profund.vc")
    c.setFillColor(LITE)
    c.setFont("Helvetica", 7)
    c.drawString(M, y + 1.5, line)
    mail = "alexandre@profund.vc"
    x0 = M + c.stringWidth(line[: line.rfind(mail)], "Helvetica", 7)
    c.linkURL("mailto:alexandre@profund.vc",
              (x0, y - 1, x0 + c.stringWidth(mail, "Helvetica", 7), y + 9),
              relative=0, thickness=0)


# ── pages ───────────────────────────────────────────────────────────────────
def page_one(c):
    y = _accent_and_header(c, 1) - 5 * mm   # le titre est gros : il lui faut de l'air sous le logo

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(M, y, "ProFund builds and invests in")
    y -= 27
    c.drawString(M, y, "AI-native companies")
    y -= 17
    c.setFillColor(MID)
    c.setFont("Helvetica", 11)
    c.drawString(M, y, "Lead at seed. Co-invest Series A.")
    y -= 12
    _rule(c, y, color=INK, w=2.2)
    y -= 16

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
    y -= box_h + 7 * mm

    y = _section(c, y, "In one sentence")
    for s in (
        "A EUR 35M early-stage fund acting as Lead investor at seed stage and co-investing in Series A.",
        "Targeting domain-specific AI harness with self-improving loops built by highly technical AI-native teams.",
        "Powered by an in-house AI platform that reads 24/7 weak signals in emerging categories and detects founders matching our thesis before they become obvious to the category.",
    ):
        y = _para(c, M, y, s, CW, size=9.8, leading=13.4)
        y -= 2.6 * mm
    y -= 1 * mm

    y = _stat_band(c, y, [
        ("EUR 35M", "Target fund size, incl. reserves"),
        ("9 + 12", "Core Series A co-invest + Scout seed lead"),
        ("Lead", "At seed. Co-invest Series A"),
        ("6-18mo", "Detection lead before announcement"),
    ])

    y = _section(c, y, "Fund construction")
    y = _para(c, M, y,
              "Scout is twelve seed tickets where we act as Lead - the detection lead is worth "
              "the most. Core is nine Series A tickets. The best Scout bets graduate to Core.",
              CW, leading=13)
    y -= 3 * mm

    col = (CW - 8 * mm) / 2
    y1 = _card(c, M, y, col, "Core portfolio", BLUE_DK, "EUR 1.1M", "per deal, 9 deals", [
        "Series A co-invest, entry at EUR 25M - 35M pre-money.",
        "EUR 9.9M initial + EUR 14M follow-on reserved.",
        "Target 3.1x MOIC - EUR 74.9M exit value.",
    ])
    y2 = _card(c, M + col + 8 * mm, y, col, "Scout portfolio", INK, "EUR 150K", "per deal, 12 deals", [
        "Lead investor at seed, entry at EUR 4M - 6M post-money.",
        "EUR 1.8M initial + EUR 7.5M follow-on reserved.",
        "3 of 12 graduate to Core at Series A.",
        "Target 2.5x MOIC - EUR 23.7M exit value.",
    ])
    y = min(y1, y2) - 5 * mm

    y = _section(c, y, "Capital allocation")
    _rule(c, y + 9, M, W - M, INK, 1.4)
    _kv(c, M, y, CW, [
        ("Core initial tickets - 9 deals at EUR 1.1M", "EUR 9.9M"),
        ("Scout initial tickets - 12 deals at EUR 150K", "EUR 1.8M"),
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
        y -= 16
        _rule(c, y + 10)
    y -= 3.2 * mm

    y = _section(c, y, "Strategy")
    for s in (
        "Lead at seed. Co-invest Series A. Targeting domain-specific AI harness with "
        "self-improving loops, built by highly technical AI-native teams.",
        "Our in-house AI Venture Platform processes automatically hundreds of startups "
        "and founders daily to detect the ones matching our thesis. Human time is reserved "
        "for the top 1 percent that get a CALL recommendation by Stan, our AI Principal. The reason "
        "every other signal was discarded is written down. Thesis parameters that drive our "
        "sourcing, investment analysis and due diligence efforts are recalibrated every day "
        "based on our feedback. We judge every day how Stan, our AI Principal, is sourcing "
        "and qualifying investment opportunities.",
        "The same platform already books dozens of meetings for our portfolio companies "
        "Proplace and Maximum Insurance.",
        "We deliver a standard investment memo and financial model for every company matching "
        "our thesis, and a highly detailed investment memo, AI-powered due diligence and "
        "human conviction statement for companies we want to invest in.",
        "Fund administration fully externalised.",
        "5 percent GP commitment on management fees.",
    ):
        y = _para(c, M, y, s, CW, size=8.5, leading=11.3)
        y -= 2.2 * mm
    y -= 1.2 * mm

    y = _section(c, y, "How we source")
    y = _numbered(c, M, y, [
        "Physical network and human interactions with top founders.",
        "In-house sourcing platform, gathering more than 25 custom sourcing engines "
        "detecting signals such as SSL certificate registrations, Pappers legal filings, "
        "GitHub repositories, leadership at Tier 1 startups changing jobs, LinkedIn job "
        "posts, semantic search, grandes ecoles alumni networks... to which we add new "
        "custom engines every month in the form of innovative ideas or startups which "
        "made sourcing their core focus.",
    ], CW) - 2.5 * mm

    # The GP (photo + short CV) | prior track record
    split = CW * 0.54
    rx = M + split + 6 * mm
    rw = CW - split - 6 * mm
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 9.6)
    c.drawString(M, y, "THE GP")
    c.drawString(rx, y, "TRACK RECORD, PRIOR TO THE FUND")
    y -= 16

    ph, pw = 36 * mm, 26 * mm
    if PHOTO.exists():
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.rect(M, y - ph, pw, ph, stroke=1, fill=0)
        c.drawImage(str(PHOTO), M + 0.4, y - ph + 0.4, width=pw - 0.8, height=ph - 0.8,
                    preserveAspectRatio=True, anchor="c", mask="auto")

    tx = M + pw + 5 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(tx, y - 10, "Alexandre Busson")
    c.setFillColor(MID)
    c.setFont("Helvetica", 8)
    c.drawString(tx, y - 21, "Founding Partner")
    yy = y - 34
    for role in (
        "Principal, Schibsted Growth",
        "Associate, Partech Ventures",
        "Founder / Investor, Dreamzer Games",
        "Investment Analyst, AXA Private Equity",
        "Owner and CEO, Fadparis.com",
    ):
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8.2)
        c.drawString(tx, yy, role)
        yy -= 10.5

    y_kv = _kv(c, rx, y, rw, [
        ("Deal-01 - exited 2007", "10.0x"),
        ("Deal-02 - exited 2014", "20.0x"),
        ("Deal-03 - LBO 2025", "19.0x"),
        ("Deal-04 - held", "2.5x"),
    ], extra=8)
    y = min(y - ph, y_kv) - 4 * mm

    y = _section(c, y, "Portfolio today")
    y = _kv(c, M, y, CW, [
        ("Proplace - Your AI Corporate Developer", "Operating"),
        ("Maximum Insurance - Swiss Travel Insurtech", "Operating"),
    ]) - 3 * mm

    SITE = "https://profund.vc"
    qr_s = 20 * mm
    bh = 26 * mm
    c.setFillColor(INK)
    c.rect(M, y - bh, CW, bh, stroke=0, fill=1)

    btn_h = 10 * mm
    btn_w = 72 * mm
    btn_x = M + 14
    btn_y = y - bh + (bh - btn_h) / 2
    c.setFillColor(BLUE)
    c.roundRect(btn_x, btn_y, btn_w, btn_h, 2.6, stroke=0, fill=1)
    label = "Follow our deal flow live"
    size = 10.5
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", size)
    c.drawCentredString(btn_x + btn_w / 2, btn_y + btn_h / 2 - size * 0.35, label)
    c.linkURL(SITE, (btn_x, btn_y, btn_x + btn_w, btn_y + btn_h), relative=0, thickness=0)

    _qr(c, W - M - 5 * mm - qr_s, y - bh + (bh - qr_s) / 2, qr_s, SITE)

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
