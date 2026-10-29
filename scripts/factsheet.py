"""Genere public/profund-factsheet.pdf — la fiche du fonds, deux pages A4.

Mise en page calquee sur https://maximum-insurance.com/fiche-individuel.pdf :
filet d'accent en tete, chapeaux de section en capitales couleur, bande de
chiffres sur fond noir, cartes a en-tete plein, tableaux a filets fins, bloc
d'appel sombre, mentions en pied. Palette ProFund (src/index.css :root).

REGLE EDITORIALE : construction detaillee, tickets et rendements cibles
vivent ICI (et sur /pitch). L'accueil porte la these en une phrase, SANS
AUCUN MONTANT, et renvoie a cette fiche.

CHIFFRES : tous lus dans src/data/fund.json, genere par scripts/fund_model.py
(la meme source que /pitch). Aucun chiffre du fonds ne se tape ici. Le script
refuse de produire la fiche si fund.json n'est plus a jour.

TOUT LE TEXTE RENDU EST EN ASCII : les polices Helvetica de base de reportlab
sont en WinAnsi et rendent un carre blanc sur « EUR », « — » ou les guillemets
typographiques. On ecrit donc "EUR", "-" et "'". AsciiCanvas le verifie.

La page ne doit jamais deborder sur le pied : chaque page renvoie sa plus basse
ligne et main() echoue si elle passe sous le filet du pied.

Regenerer a la main apres toute modification (npm run build ne le fait PAS) :

    python scripts/fund_model.py
    python scripts/factsheet.py
"""

import io
import json
import sys
from pathlib import Path

import segno
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo.png"
PHOTO = ROOT / "public" / "gp-photo-sheet.jpg"
# Vraie capture de profund.vc/dealflow (vue LP marque blanche du cockpit), pas
# une maquette. A refaire si l'ecran change.
COCKPIT = ROOT / "public" / "dealflow-cockpit.jpg"
OUT = ROOT / "public" / "profund-factsheet.pdf"
FUND_JSON = ROOT / "src" / "data" / "fund.json"
# Logos du portefeuille, passes en gris a la generation (comme sur l'accueil).
# Maximum Insurance n'existe qu'en SVG cote site : reportlab ne lit pas le SVG,
# d'ou sa version PNG dans scripts/assets/.
PORTFOLIO = (
    ("Proplace", "AI harness for corporate development", ROOT / "public" / "portfolio-proplace.png"),
    ("Maximum Insurance", "Swiss travel insurtech & travel risk management platform",
     ROOT / "scripts" / "assets" / "portfolio-maximum-insurance.png"),
    ("Sosuites", "AI-assisted personalised art prints", ROOT / "public" / "portfolio-sosuites.png"),
)

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
FOOTER_RULE = 9 * mm + 11      # filet du pied (cf. _footer), en points depuis le bas
MONTHS = ("January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December")


# ── donnees du fonds ────────────────────────────────────────────────────────
def _load_fund():
    data = json.loads(FUND_JSON.read_text(encoding="utf-8"))
    sys.path.insert(0, str(ROOT / "scripts"))
    import fund_model
    if json.loads(fund_model.render(fund_model.build())) != data:
        raise SystemExit("src/data/fund.json n'est plus a jour : lancer python scripts/fund_model.py")
    return data


DATA = _load_fund()
FUND = DATA["fund"]
TERMS = DATA["terms"]
LAYERS = DATA["layers"]
CASES = DATA["cases"]
ALLOC = DATA["allocation"]
SECONDARY = DATA["secondary"]


# ── formats (meme logique que src/lib/fund.ts, en ASCII) ────────────────────
def _eur(v, mode="table"):
    """table : EUR 750K / EUR 27.6M ; val : EUR 45M / EUR 1.5B ; tile : EUR 100M."""
    if v == 0:
        return "EUR 0"
    if mode == "val":
        if v >= 1e9:
            return f"EUR {v / 1e9:.1f}B"
        if v >= 1e7:
            return f"EUR {v / 1e6:.0f}M"
    if mode == "tile" and v >= 1e6 and v % 1_000_000 == 0:
        return f"EUR {v // 1_000_000}M"
    if v < 1e6:
        return f"EUR {v / 1e3:.0f}K"
    return f"EUR {v / 1e6:.1f}M"


def _short(v):
    if v < 1e6:
        return f"{v / 1e3:.0f}K"
    if v % 1_000_000 == 0:
        return f"{v // 1_000_000}M"
    return f"{v / 1e6:.1f}M"


def _rng(a, b):
    """EUR 150K-1.5M"""
    return f"EUR {_short(a)}-{_short(b)}"


def _mult(x):
    return f"{x:.1f}x"


def _pct(x, dp=0):
    return f"{x * 100:.{dp}f}%"


class AsciiCanvas(canvas.Canvas):
    """Refuse tout texte non ASCII (sinon carre blanc avec Helvetica WinAnsi)."""

    def _ascii(self, text):
        if not str(text).isascii():
            raise SystemExit(f"texte non ASCII dans la fiche : {text!r}")

    def drawString(self, x, y, text, *a, **k):
        self._ascii(text)
        return super().drawString(x, y, text, *a, **k)

    def drawRightString(self, x, y, text, *a, **k):
        self._ascii(text)
        return super().drawRightString(x, y, text, *a, **k)

    def drawCentredString(self, x, y, text, *a, **k):
        self._ascii(text)
        return super().drawCentredString(x, y, text, *a, **k)

    def setTitle(self, title):
        self._ascii(title)
        return super().setTitle(title)

    def setSubject(self, subject):
        self._ascii(subject)
        return super().setSubject(subject)


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


def _section(c, y, label, color=BLUE, x=M):
    """Chapeau : capitales, gras, interlettrees — le signe du modele MI."""
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 9.6)
    c.drawString(x, y, label.upper())
    return y - 17


def _section_note(c, lab_y, label, plain, bold=""):
    """Phrase posee sur la ligne du chapeau, derriere un filet vertical : elle ne
    coute aucune hauteur a une page deja pleine."""
    lx = M + c.stringWidth(label.upper(), "Helvetica-Bold", 9.6) + 4 * mm
    c.setStrokeColor(LINE)
    c.setLineWidth(0.8)
    c.line(lx - 2 * mm, lab_y - 1.5, lx - 2 * mm, lab_y + 7.5)
    c.setFillColor(SUB)
    c.setFont("Helvetica", 8.4)
    c.drawString(lx, lab_y, plain)
    if bold:
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8.4)
        c.drawString(lx + c.stringWidth(plain, "Helvetica", 8.4), lab_y, bold)
    end = lx + c.stringWidth(plain, "Helvetica", 8.4) + c.stringWidth(bold, "Helvetica-Bold", 8.4)
    if end > W - M:
        raise SystemExit(f"note de chapeau trop longue : {plain}{bold!r}")


def _stat_band(c, y, items, h=23 * mm):
    """Bande de chiffres sur fond encre, filets verticaux clairs."""
    top = y
    c.setFillColor(INK)
    c.rect(M, top - h, CW, h, stroke=0, fill=1)
    cell = CW / len(items)
    wrapped = [_wrap_lines(c, lab, cell - 20, "Helvetica", 7.4) for _, lab in items]
    if any(len(w) > 2 for w in wrapped):
        raise SystemExit("bande de chiffres : libelle sur plus de 2 lignes")
    # 29/10 — bloc (chiffre + libelle) centre verticalement dans la bande : hauteur
    # = capitale du chiffre (11.6 pt) + ecart + lignes du libelle (capitale 5.4 pt).
    n_max = max(len(w) for w in wrapped)
    block = 11.6 + 7.5 + 5.4 + 9 * (n_max - 1)
    num_y = top - (h - block) / 2 - 11.6
    for i, ((num, _), lines) in enumerate(zip(items, wrapped)):
        x = M + i * cell
        if i:
            c.setStrokeColor(colors.HexColor("#3A3A3A"))
            c.setLineWidth(0.7)
            c.line(x, top - h + 6 * mm, x, top - 6 * mm)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 10, num_y, num)
        c.setFillColor(colors.HexColor("#B8B8B8"))
        c.setFont("Helvetica", 7.4)
        for j, ln in enumerate(lines):
            c.drawString(x + 10, num_y - 7.5 - 5.4 - j * 9, ln)
    return top - h - 5.5 * mm


TIER_HEAD = {"seed": ("SEED", "LAYER 1", INK), "venture": ("VENTURE", "LAYER 2", BLUE_DK),
             "growth": ("GROWTH", "LAYER 3", BLUE)}


def _tier_rows(layer):
    x = LAYERS[layer]
    moic = f"{_mult(x['moic']['target'])} MOIC"
    entry = _rng(x["entry_post_min"], x["entry_post_max"])
    if layer == "seed":
        return [("STAGE", "Pre-seed / seed"), ("ROLE", "Lead or co-lead"), ("ENTRY POST", entry),
                ("COMPANIES", str(x["companies"])), ("INVESTED", _eur(x["invested"])),
                ("TARGET GROSS", moic)]
    if layer == "venture":
        return [("STAGE", "Seed+ / Series A"), ("ROLE", "Direct, at the inflection"), ("ENTRY POST", entry),
                ("COMPANIES", f"{x['companies']} direct entries"), ("INVESTED", _eur(x["invested"])),
                ("TARGET GROSS", moic)]
    follow = x["positions"] - x["companies"]
    return [("STAGE", "Series B and beyond"), ("ROLE", "Direct + our breakouts"), ("ENTRY POST", entry),
            ("POSITIONS", f"{x['companies']} direct + {follow} follow-ons"), ("INVESTED", _eur(x["invested"])),
            ("TARGET GROSS", moic)]


def _tier_card(c, x, y, w, h, layer):
    """Carte d'etage : bandeau plein, fourchette de ticket en grand, six mini-lignes."""
    lay = LAYERS[layer]
    name, tag, bg = TIER_HEAD[layer]
    hh = 7.5 * mm
    pad = 3.6 * mm
    c.setStrokeColor(LINE)
    c.setLineWidth(0.8)
    c.rect(x, y - h, w, h, stroke=1, fill=0)
    c.setFillColor(bg)
    c.rect(x, y - hh, w, hh, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9.4)
    c.drawString(x + pad, y - hh + 7.4, name)
    c.setFont("Helvetica", 6.8)
    c.drawRightString(x + w - pad, y - hh + 7.6, tag)

    if layer == "growth":
        big = _rng(lay["ticket_min"], FUND["company_cap"])
        caption = f"from the fund, up to {_eur(FUND['company_max_with_spv'], 'tile')} with SPVs"
    else:
        big = _rng(lay["ticket_min"], lay["ticket_max"])
        caption = "initial ticket, pro-rata reserved"
    yy = y - hh - 7.4 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(x + pad, yy, big)
    c.setFillColor(MID)
    c.setFont("Helvetica", 7.2)
    c.drawString(x + pad, yy - 10, caption)

    ry = yy - 10 - 6.4 * mm
    rows = _tier_rows(layer)
    for i, (label, value) in enumerate(rows):
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 6.4)
        c.drawString(x + pad, ry, label)
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8)
        c.drawRightString(x + w - pad, ry, value)
        lw = c.stringWidth(label, "Helvetica-Bold", 6.4) + c.stringWidth(value, "Helvetica", 8)
        if lw > w - 2 * pad - 6:
            raise SystemExit(f"carte {layer} : ligne trop longue : {label} {value}")
        if i < len(rows) - 1:
            _rule(c, ry - 3.6, x + pad, x + w - pad, LINE, 0.5)
        ry -= 10.5
    if ry + 10.5 - 3 < y - h:
        raise SystemExit(f"carte {layer} : le contenu depasse la carte")


def _kv(c, x, y, w, rows, head=None, head_color=INK, extra=14, last_rule=True, rule_off=12):
    if head:
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 9.2)
        c.drawString(x, y, head.upper())
        y -= 6
        _rule(c, y, x, x + w, head_color, 1.4)
        y -= 13
    n_rows = len(rows)
    for i, (k, v) in enumerate(rows):
        vlines = _wrap_lines(c, v, w * 0.34, "Helvetica-Bold", 8.6)
        klines = _wrap_lines(c, k, w * 0.62, "Helvetica", 8.6)
        n = max(len(vlines), len(klines))
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8.6)
        for j, ln in enumerate(klines):
            c.drawString(x, y - j * 10.5, ln)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8.6)
        for j, ln in enumerate(vlines):
            c.drawRightString(x + w, y - j * 10.5, ln)
        y -= n * 10.5 + extra
        if i < n_rows - 1 or last_rule:
            _rule(c, y + rule_off, x, x + w)
    return y


def _labeled(c, y, items, width, label_w=26 * mm, size=8.3, leading=11, gap=2.5 * mm):
    """Label a gauche (capitales bleues), texte a droite — plus lisible qu'un mur."""
    for lab, body in items:
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(M, y, lab.upper())
        y = _para(c, M + label_w, y, body, width - label_w, size=size, leading=leading) - gap
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
    """Crisp QR (segno) on a white quiet zone. (x, y) is bottom-left of the pad."""
    qr = segno.make(url, error="M")
    buf = io.BytesIO()
    qr.save(buf, kind="png", scale=8, border=2, dark="#0A0A0A", light="white")
    buf.seek(0)
    c.setFillColor(WHITE)
    c.roundRect(x, y, size, size, 1.8, stroke=0, fill=1)
    pad = 2.0 * mm
    c.drawImage(ImageReader(buf), x + pad, y + pad,
                width=size - 2 * pad, height=size - 2 * pad, mask="auto")
    c.linkURL(url, (x, y, x + size, y + size), relative=0, thickness=0)


def _pillars(c, y, items, head=None):
    """Encadre deux colonnes (Investment | Operations), repris de l'accueil :
    en-tete « Our edge » sur toute la largeur, puis par colonne chapeau, nom,
    texte et ligne « Powers » calee en bas (alignee d'une colonne a l'autre)."""
    pad = 5 * mm
    hd_h = 8 * mm if head else 0
    colw = CW / len(items)
    tw = colw - 2 * pad
    size, lead = 8.6, 11.4
    n = max(len(_wrap_lines(c, t, tw, "Helvetica", size)) for _, _, t, _ in items)
    h = hd_h + pad + 9.4 + 7 + n * lead + pad - 12 + 13 + 22
    c.setStrokeColor(LINE)
    c.setLineWidth(0.8)
    c.rect(M, y - h, CW, h, stroke=1, fill=0)
    if head:
        kicker, sentence = head
        hy = y - 5.2 * mm
        c.setFillColor(BLUE)
        c.rect(M + pad, hy + 2.2, 4.6 * mm, 1.5, stroke=0, fill=1)
        c.setFillColor(BLUE_DK)
        c.setFont("Helvetica-Bold", 7.2)
        kx = M + pad + 4.6 * mm + 5
        c.drawString(kx, hy, kicker.upper())
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 9.4)
        c.drawString(kx + c.stringWidth(kicker.upper(), "Helvetica-Bold", 7.2) + 4 * mm, hy, sentence)
        c.line(M, y - hd_h, M + CW, y - hd_h)
    for i, (kicker, title, text, powers) in enumerate(items):
        x = M + i * colw
        if i:
            c.line(x, y - h, x, y - hd_h)
        ty = y - hd_h - pad - 7
        # chapeau = l'avantage (filet bleu + capitales), puis le nom = le modele
        c.setFillColor(BLUE)
        c.rect(x + pad, ty + 2.2, 4.6 * mm, 1.5, stroke=0, fill=1)
        c.setFillColor(BLUE_DK)
        c.setFont("Helvetica-Bold", 7.2)
        c.drawString(x + pad + 4.6 * mm + 5, ty, kicker.upper())
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + pad, ty - 14, title)
        _para(c, x + pad, ty - 27, text, tw, size=size, leading=lead)
        # « Powers » : qui tourne sur ce moteur — ProFund en bleu
        py = y - h + pad - 1
        c.setFillColor(MID)
        c.setFont("Helvetica-Bold", 6.6)
        c.drawString(x + pad, py, "POWERS")
        px = x + pad + c.stringWidth("POWERS", "Helvetica-Bold", 6.6) + 2.5 * mm
        for j, name in enumerate(powers):
            sep = ", " if j else ""
            c.setFillColor(SUB)
            c.setFont("Helvetica", 8)
            c.drawString(px, py, sep)
            px += c.stringWidth(sep, "Helvetica", 8)
            bold = name == "ProFund"
            c.setFillColor(BLUE_DK if bold else SUB)
            c.setFont("Helvetica-Bold" if bold else "Helvetica", 8)
            c.drawString(px, py, name)
            px += c.stringWidth(name, "Helvetica-Bold" if bold else "Helvetica", 8)
    return y - h - 5 * mm


def _grey_logo(path):
    """Logo recadre sur son trace et passe en gris clair, transparence gardee —
    l'equivalent de `filter: grayscale(1); opacity: .42` de l'accueil."""
    from PIL import Image
    im = Image.open(path).convert("RGBA")
    box = im.getchannel("A").getbbox()
    if box:
        im = im.crop(box)
    g = im.convert("L").point(lambda v: int(255 - (255 - v) * 0.5))
    out = Image.merge("RGBA", (g, g, g, im.getchannel("A")))
    return ImageReader(out), out.size


def _portfolio(c, y, items, logo_h=3.8 * mm, lead=10):
    """Bandeau en colonnes : mini logo gris et accroche (2 lignes au plus).
    Plus de statut « Operating » sous chaque societe (05/10 : plus propre)."""
    cell = CW / len(items)
    widths = [cell - (10 * mm if i else 5 * mm) for i in range(len(items))]
    wraps = [_wrap_lines(c, t, w, "Helvetica", 8)[:2] for (_, t, _), w in zip(items, widths)]
    extra = (max(len(w) for w in wraps) - 1) * lead
    for i, (name, tagline, path) in enumerate(items):
        x0 = M + i * cell
        x = x0 + (5 * mm if i else 0)
        maxw = widths[i]
        if i:
            c.setStrokeColor(LINE)
            c.setLineWidth(0.7)
            c.line(x0, y - 9.5 * mm - extra, x0, y + 1 * mm)
        if path.exists():
            ir, (iw, ih) = _grey_logo(path)
            lw, lh = logo_h * iw / float(ih), logo_h
            if lw > maxw:
                lw, lh = maxw, maxw * ih / float(iw)
            c.drawImage(ir, x, y - lh, width=lw, height=lh, mask="auto")
        else:
            c.setFillColor(LITE)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(x, y - logo_h + 1, name)
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8)
        for j, ln in enumerate(wraps[i]):
            c.drawString(x, y - logo_h - 4.6 * mm - j * lead, ln)
    return y - 10.5 * mm - extra


def _track(c, x, y, w, rows):
    """Track record : tete en gras, multiple a droite, detail en petit dessous."""
    for i, (head, detail, val) in enumerate(rows):
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8.6)
        c.drawString(x, y, head)
        c.drawRightString(x + w, y, val)
        y = _para(c, x, y - 10.5, detail, w, size=7.4, color=MID, leading=9.2)
        _rule(c, y + 4.5, x, x + w)
        y -= 7
    return y


def _footer(c):
    y = 9 * mm
    _rule(c, y + 11)
    line = ("EuVECA pre-marketing communication, eligible investors only. "
            "Not an offer to subscribe. Contact: alexandre@profund.vc")
    c.setFillColor(LITE)
    c.setFont("Helvetica", 7)
    c.drawString(M, y + 1.5, line)
    mail = "alexandre@profund.vc"
    x0 = M + c.stringWidth(line[: line.rfind(mail)], "Helvetica", 7)
    c.linkURL("mailto:alexandre@profund.vc",
              (x0, y - 1, x0 + c.stringWidth(mail, "Helvetica", 7), y + 9),
              relative=0, thickness=0)
    # version et date : trace de ce qui a ete envoye a qui (regle des 18 mois)
    year, month, _ = DATA["model_date"].split("-")
    c.drawRightString(W - M, y + 1.5, f"Fact sheet {DATA['version']} - {MONTHS[int(month) - 1]} {year}")


# ── pages ───────────────────────────────────────────────────────────────────
def page_one(c):
    y = _accent_and_header(c, 1) - 3.5 * mm   # le titre est gros : il lui faut de l'air sous le logo

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(M, y, "Turning AI into")
    y -= 27
    c.drawString(M, y, "unfair leverage")
    y -= 17
    c.setFillColor(MID)
    c.setFont("Helvetica", 11)
    c.drawString(M, y, f"Seed to Growth. {_eur(FUND['commitments'], 'tile')} for the founders turning AI "
                       "into unfair leverage.")
    y -= 10
    _rule(c, y, color=INK, w=2.2)
    y -= 14

    # Le cadre de pre-commercialisation, en tete de document.
    box_h = 17 * mm
    c.setFillColor(BG)
    c.rect(M, y - box_h, CW, box_h, stroke=0, fill=1)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2.4)
    c.line(M, y - box_h, M, y)
    c.setFillColor(BLUE_DK)
    c.setFont("Helvetica-Bold", 9.2)
    c.drawString(M + 12, y - 7.5 * mm, "PRE-MARKETING PHASE")
    _para(c, M + 12, y - 11.5 * mm,
          "This document is a pre-marketing communication within the meaning of Article 4a of "
          "Regulation (EU) No 345/2013 (EuVECA). The fund is not yet established and no units may be "
          "subscribed at this stage. For professional and eligible investors only.",
          CW - 24, size=8, color=SUB, leading=10.5)
    y -= box_h + 7 * mm

    # Les deux plateformes maison — meme encadre, memes noms et meme texte que
    # l'accueil (src/components/HomepageLite.tsx, PILLARS).
    y = _pillars(c, y + 2 * mm, [
        ("Investment", "Deal Engine",
         "Reads every European seed round, every senior hire and every launch, around the "
         "clock. It scores each founder against our thesis and flags the inflection point "
         "before it becomes obvious.",
         ["ProFund"]),
        ("Operations", "Growth Engine",
         "AI agents that run content, inbound and outbound, end to end. They operate the fund "
         "and the GP's companies today, and they work for the founders we back.",
         ["ProFund", "Proplace", "Maximum Insurance", "Sosuites"]),
    ], head=("Our edge", "We run on what we back: two in-house AI engines, one GP and his agents."))

    seed = LAYERS["seed"]
    y = _stat_band(c, y, h=20 * mm, items=[
        (_eur(FUND["commitments"], "tile"),
         f"Target Fund I, closed-ended, closings over {FUND['closing_months']} months"),
        ("3 layers", f"Seed, Venture, Growth: {_eur(seed['ticket_min'])} to "
                     f"{_eur(FUND['company_max_with_spv'], 'tile')} per company"),
        ("Every", "European seed round tracked by the Seed Radar, weekly"),
        ("6-18mo", "Detection lead before announcement"),
    ])

    lab_y = y
    y = _section(c, y, "Fund construction")
    _section_note(c, lab_y, "Fund construction",
                  "Two ways in at every layer: direct entries in top rounds, and our own ", "breakouts.")
    y += 2 * mm

    gap = 5 * mm
    cw3 = (CW - 2 * gap) / 3
    card_h = 46 * mm
    for i, layer in enumerate(("seed", "venture", "growth")):
        _tier_card(c, M + i * (cw3 + gap), y, cw3, card_h, layer)
    y -= card_h + 5.5 * mm

    # Allocation | termes : deux blocs cote a cote.
    half = (CW - 8 * mm) / 2
    x2 = M + half + 8 * mm
    ys = _section(c, y, "Capital allocation")
    _section(c, y, "Key terms", x=x2)
    _rule(c, ys + 9, M, M + half, INK, 1.4)
    _rule(c, ys + 9, x2, x2 + half, INK, 1.4)
    growth = LAYERS["growth"]
    y1 = _kv(c, M, ys, half, [
        (f"Seed - {seed['companies']} companies", _eur(ALLOC["seed"])),
        (f"Venture - {LAYERS['venture']['companies']} companies", _eur(ALLOC["venture"])),
        (f"Growth - {growth['companies']} direct + {growth['positions'] - growth['companies']} follow-ons",
         _eur(ALLOC["growth"])),
        (f"Invested ({_pct(ALLOC['follow_on_pct'])} in follow-ons)", _eur(ALLOC["invested"])),
        ("Management fees", _eur(ALLOC["mgmt_fees"])),
        ("Fund expenses, incl. set-up", _eur(ALLOC["fund_expenses"])),
        ("Contingency", _eur(ALLOC["contingency"])),
        ("Total commitments", _eur(ALLOC["total"])),
    ], extra=4, rule_off=9.5, last_rule=False)   # filet centre ; pas de double filet sur le pied
    y2 = _kv(c, x2, ys, half, [
        ("Closed-ended EuVECA fund (Lux.)", f"{FUND['term_years']} years"),
        ("Successive closings", f"{FUND['closing_months']} months"),
        (f"Management fee, years 1-{FUND['investment_period_years']}", _pct(TERMS["fee_ip_pct"])),
        ("Then, on invested capital", _pct(TERMS["fee_post_pct"], 1)),
        ("Carried interest, European", _pct(TERMS["carry_pct"])),
        ("Hurdle, with GP catch-up", _pct(TERMS["hurdle_pct"])),
        ("Per company: fund / with SPVs",
         f"{_eur(FUND['company_cap'], 'tile')} / {_short(FUND['company_max_with_spv'])}"),
    ], extra=4, rule_off=9.5, last_rule=False)

    _footer(c)
    return min(y1, y2)


def page_two(c):
    y = _accent_and_header(c, 2)

    y = _section(c, y, "Target returns")
    cols = (0.44, 0.62, 0.81)
    c.setFillColor(MID)
    c.setFont("Helvetica-Bold", 7.6)
    for x, head in zip(cols, ("TARGET", "BASE", "STRESS")):
        c.drawString(M + CW * x, y, head)
    y -= 6
    _rule(c, y, M, W - M, INK, 1.4)
    y -= 13
    cases = [CASES[k] for k in ("target", "base", "stress")]
    keys = ("target", "base", "stress")
    for label, values in (
        (f"Gross exit value, {_eur(FUND['commitments'], 'tile')} fund",
         [_eur(x["gross_exits"], "tile") for x in cases]),
        ("Net TVPI", [_mult(x["net_tvpi"]) for x in cases]),
        ("Net IRR", [_pct(x["net_irr"]) for x in cases]),
        (f"Net DPI by year {SECONDARY['year']}", [_mult(x["dpi_year6"]) for x in cases]),
        ("Gross MOIC - Seed / Venture / Growth",
         [" / ".join(_mult(LAYERS[l]["moic"][k]) for l in ("seed", "venture", "growth")) for k in keys]),
    ):
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8.8)
        c.drawString(M, y, label)
        for i, (x, v) in enumerate(zip(cols, values)):
            c.setFillColor(INK if i == 0 else SUB)
            c.setFont("Helvetica-Bold" if i == 0 else "Helvetica", 8.8)
            c.drawString(M + CW * x, y, v)
        y -= 12.5
        _rule(c, y + 9)
    y = _para(c, M, y - 1, (
        f"Net = after management fees, fund expenses and carried interest ({_pct(TERMS['carry_pct'])} over an "
        f"{_pct(TERMS['hurdle_pct'])} hurdle, European waterfall), before tax. Base and Stress cap every exit "
        f"at {_eur(CASES['base']['exit_cap'], 'tile')} and {_eur(CASES['stress']['exit_cap'], 'tile')}. Target: "
        f"one fund returner and a year-{SECONDARY['year']} secondary sale of {_pct(SECONDARY['share'])} of the "
        f"two largest winners at {_pct(SECONDARY['price_pct'])} of exit value. Model outputs, not a forecast."),
        CW, size=6.8, color=LITE, leading=8.6) - 2.2 * mm

    # 29/10 (Alexandre) — la vision, puis la these du fonds en clair (memes cinq
    # criteres que l'accueil et /pitch, issus de theses/profund_vc/v2.json du monorepo).
    y = _section(c, y, "Strategy")
    y = _labeled(c, y, [
        ("Vision",
         "An age of abundance is starting. With AI, a handful of people can build what once took "
         "thousands, and founders who direct AI agents will realise their ambitions in record time. "
         "We believe AI will first free humanity from material needs, then give people time for "
         "what matters most."),
        ("One fund",
         "AI-native companies go from seed to growth in months. One fund follows them from "
         f"{_eur(LAYERS['seed']['ticket_min'])} to {_eur(FUND['company_max_with_spv'], 'tile')} per "
         "company, ideally just before the exponential. It uses AI everywhere."),
        ("We live it",
         "One GP and a team of AI agents run the fund and three companies: we live what we back."),
    ], CW, gap=1.4 * mm) - 0.6 * mm

    y = _section(c, y, "What we back - our fund thesis")
    y = _labeled(c, y, [
        ("01 Founders",
         "Exceptional, highly technical founders, found before their first round."),
        ("02 Seed Radar",
         "Every European seed round of the last 24 months, re-scored on dated growth signals."),
        ("03 Inflection",
         "We double down when the curve bends: ARR x3 in 12 months, record revenue per employee."),
        ("04 Returners",
         "Category leaders in Europe with global ambition, TAM above EUR 10B, winner-take-most."),
        ("05 Autonomy",
         "Self-improving AI loops at the core; small teams that pilot agents with maximum leverage."),
    ], CW, gap=0.9 * mm) - 0.6 * mm

    y = _section(c, y, "How we source")
    y = _labeled(c, y, [
        ("Deal Engine",
         "25+ in-house engines read weak signals daily (GitHub, tier-1 departures, job posts, "
         "alumni networks), plus warm introductions from top-tier founders and VCs. A memo and a "
         "model for every match, human time for the top 1 percent. Third-party EuVECA manager."),
    ], CW, gap=1.4 * mm) - 1.6 * mm

    # The GP (photo + short CV) | prior track record
    split = CW * 0.5
    rx = M + split + 6 * mm
    rw = CW - split - 6 * mm
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 9.6)
    c.drawString(M, y, "THE GP")
    c.drawString(rx, y, "TRACK RECORD, PRIOR TO THE FUND")
    y -= 16

    # Full portrait, no zoom: box follows the photo's aspect ratio.
    ir = ImageReader(str(PHOTO)) if PHOTO.exists() else None
    iw, ih = ir.getSize() if ir else (1, 1)
    pw = 28 * mm
    ph = pw * (ih / float(iw))
    if PHOTO.exists():
        c.drawImage(str(PHOTO), M, y - ph, width=pw, height=ph,
                    preserveAspectRatio=True, anchor="c", mask="auto")

    tx = M + pw + 5 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(tx, y - 10, "Alexandre Busson")
    c.setFillColor(MID)
    c.setFont("Helvetica", 8)
    c.drawString(tx, y - 21, "Founding Partner")
    yy = y - 34
    # Memes intitules que /pitch (ProFundPage.tsx, GP) - confirmes par Alexandre le 29/10.
    for role in (
        "M&A Director, Leboncoin",
        "Senior Associate, Partech Ventures",
        "LBO Analyst, Ardian (ex-AXA PE)",
        "Key Account Manager assistant, Google",
        "Founder / Investor, Dreamzer Games",
        "Owner and CEO, Fadparis.com",
    ):
        c.setFillColor(SUB)
        c.setFont("Helvetica", 8.2)
        c.drawString(tx, yy, role)
        yy -= 10.5

    # Memes faits que le tableau Track Record de /pitch (ProFundPage.tsx) ; seul
    # Deal-04 porte en plus la croissance depuis l'acquisition (05/10), et SANS
    # multiple : un 2.5x cash-on-cash n'a pas de sens pour une acquisition a
    # 100 % toujours detenue (decision d'Antoine, 05/10).
    y_kv = _track(c, rx, y, rw, [
        ("Deal-01 - exited 2007",
         "Entry 2006, 100% owned. Full exit in 2007.", "10.0x"),
        ("Deal-02 - exited 2014",
         "Entry 2008 at 100%. Sold down to 40%, then full exit in 2014.", "20.0x"),
        ("Deal-03 - LBO exit 2025",
         "Seed ticket EUR 200K at EUR 5.3M in 2014. LBO exit in Feb 2025 at EUR 100M. "
         "Sourced 14 months before public announcement.", "19.0x"),
        ("Deal-04 - acquired 2016",
         "100% acquisition, EUR 45M buyout. Revenue growing ~20% YoY since "
         "acquisition.", ""),
    ])
    c.setFillColor(LITE)
    c.setFont("Helvetica", 6.8)
    c.drawString(rx, y_kv + 1, "Companies anonymised. Names and references on request.")
    y = min(y - ph, y_kv - 1 * mm) - 3.5 * mm

    lab_y = y
    y = _section(c, y, "Operated by the GP")
    # 29/10 — hors du fonds : detenues a 100 % par le GP, operees par ses agents IA
    _section_note(c, lab_y, "Operated by the GP",
                  "Outside the fund, 100% owned by the GP: run almost autonomously by ", "AI agents.")
    y = _portfolio(c, y + 1.5 * mm, PORTFOLIO) - 6 * mm

    SITE = "https://profund.vc"
    MAIL = "alexandre@profund.vc"
    PHONE = "+33 6 83 10 72 86"

    y = _section(c, y, "Live deal flow")
    box_h = 33 * mm
    c.setFillColor(BG)
    c.rect(M, y - box_h, CW, box_h, stroke=0, fill=1)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2.4)
    c.line(M, y - box_h, M, y)

    img_h = box_h - 7 * mm
    img_w = img_h * (1280 / 720.0)
    if COCKPIT.exists():
        c.drawImage(str(COCKPIT), M + 4 * mm, y - box_h + 3.5 * mm,
                    width=img_w, height=img_h, preserveAspectRatio=True, anchor="sw", mask="auto")
        # filet autour de la capture : son fond blanc se fondait dans le gris
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.rect(M + 4 * mm, y - box_h + 3.5 * mm, img_w, img_h, stroke=1, fill=0)
        c.linkURL(SITE, (M + 4 * mm, y - box_h + 3.5 * mm,
                         M + 4 * mm + img_w, y - 3.5 * mm), relative=0, thickness=0)

    rx = M + 4 * mm + img_w + 6 * mm
    qr_s = 22 * mm
    qr_x = W - M - 5 * mm - qr_s
    _qr(c, qr_x, y - 5 * mm - qr_s, qr_s, SITE)

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(rx, y - 8 * mm, "Follow our deal flow live")
    c.linkURL(SITE, (rx, y - 11 * mm, qr_x - 3 * mm, y - 4 * mm), relative=0, thickness=0)
    c.setFillColor(MID)
    c.setFont("Helvetica", 7.4)
    c.drawString(rx, y - 12.5 * mm, "Scan, or tap. The companies we detect, every evening.")

    contacts = (
        ("profund.vc", SITE),
        (PHONE, "tel:+33683107286"),
        (MAIL, "mailto:" + MAIL),
    )
    cy = y - 18.5 * mm
    for val, href in contacts:
        c.setFillColor(BLUE_DK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(rx, cy, val)
        tw = c.stringWidth(val, "Helvetica-Bold", 8)
        c.linkURL(href, (rx, cy - 2, rx + tw + 2, cy + 8), relative=0, thickness=0)
        cy -= 5.2 * mm
    if cy + 5.2 * mm - 2 < y - box_h:
        raise SystemExit("encadre deal flow : les contacts depassent le cadre")

    _footer(c)
    return y - box_h


def main():
    c = AsciiCanvas(str(OUT), pagesize=A4)
    c.setTitle("ProFund - Fund Fact Sheet")
    c.setAuthor("ProFund")
    c.setSubject(f"Venture capital, seed to growth - {_eur(FUND['commitments'], 'tile')} target "
                 f"Fund I - pre-marketing communication")
    for n, page in enumerate((page_one, page_two), 1):
        low = page(c)
        spare = (low - FOOTER_RULE) / mm
        print(f"factsheet: page {n}, {spare:.1f} mm above the footer rule")
        if spare < 1.5:
            raise SystemExit(f"page {n} deborde sur le pied ({spare:.1f} mm)")
        c.showPage()
    c.save()
    print(f"factsheet: {OUT} ({OUT.stat().st_size} octets)")


if __name__ == "__main__":
    main()
