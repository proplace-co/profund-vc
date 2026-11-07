"""Genere public/profund-factsheet.pdf — la fiche du fonds (v3), quatre pages A4.

Mise en page reprise des fiches V5 de Maximum Insurance (fiche entreprise :
https://maximum-insurance.com/entreprises) avec leur moteur de dessin
(scripts/sheet_engine.py) : Archivo, chapeaux en capitales espacees, grands
titres serres, cartes arrondies a ombre douce, tuiles d'icones en degrade,
tableau a colonne mise en avant, bande d'appel sombre avec un grand QR.
Palette ProFund (gris bleu), la meme que le site.

    page 1  la these et la structure : titre, ligne forte, manifeste, quatre
            lois, le pacte des fondateurs, la bande de chiffres
    page 2  la construction du fonds, les termes, l'allocation, « Everyone
            wins » (le tableau a 250 M EUR), conflits et filet de securite
    page 3  l'avantage (deux moteurs), l'equipe, le track record, la preuve,
            le contact (QR)
    page 4  meme societe, meme sortie (le tableau des fondateurs), la
            simulation ligne a ligne, la performance et les tests de resistance

Texte : la fiche v3 d'Antoine (05/11). La copie de la these (manifeste,
lois, moteurs, preuve) est la meme que src/components/Thesis.tsx : les changer
ensemble.

CHIFFRES : tous lus dans src/data/fund.json, genere par scripts/fund_model.py
(la meme source que le site). Aucun chiffre du fonds ne se tape ici. Le script
refuse de produire la fiche si fund.json n'est plus a jour.

TEXTE : Archivo est embarquee, « € », « × » sont permis. Un caractere sans
glyphe dans Archivo fait echouer la fiche (sheet_engine.check_glyphs). Pas de
tiret long dans le texte visible (regle du 30/10). La mention de
pre-commercialisation (encadre de tete et pied) est la meme que dans le pied
de l'accueil et du popup : les changer ensemble.

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

from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sheet_engine import (  # noqa: E402
    ARROW, BLUE, BLUE_DK, BLUE_SOFT, BLUE_TINT, BOTTOM, CHECK, FOOT_RULE, GLOW, GREEN, GREEN_SOFT,
    INK, INK2, LINE, LINE2, M, MUTED, NIGHT, NIGHT_LINE, NIGHT_TXT, PH, PW, PX, RED, RED_SOFT, SOFT, W, WARM,
    WHITE, Frame, x,
)

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo.png"
PHOTO = ROOT / "public" / "gp-photo-sheet.jpg"
# Captures 3x du deal flow ProFund (vue LP de profund.vc/dealflow, 30/10) : (fichier, hauteur / largeur).
MAP_SHOT = (ROOT / "public" / "dealflow-map.jpg", 1212 / 2000)
PIPE_SHOT = (ROOT / "public" / "dealflow-pipeline.jpg", 937 / 1500)
OUT = ROOT / "public" / "profund-factsheet.pdf"
FUND_JSON = ROOT / "src" / "data" / "fund.json"

SITE = "https://profund.vc"
DEALFLOW = "https://profund.vc/#dealflow"      # ce hash ouvre le popup d'abonnement de l'accueil
DEALFLOW_TXT = "profund.vc/dealflow"
MAIL = "alexandre@profund.vc"
PHONE = "+33 6 83 10 72 86"
PAGES = 4
MONTHS = ("January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December")

# Les societes que le GP opere avec ses agents, hors du fonds (detenues a 100 %).
# Memes accroches que l'accueil (src/components/Thesis.tsx). Maximum Insurance
# n'existe qu'en SVG cote site : reportlab ne lit pas le SVG, d'ou sa version
# PNG dans scripts/assets/.
PORTFOLIO = (
    ("Proplace", "Autonomous AI operating system for corporate development & M&A.",
     ROOT / "public" / "portfolio-proplace.png", "https://proplace.co"),
    ("Maximum Insurance", "Travel insurance and duty of care for companies and their teams abroad.",
     ROOT / "scripts" / "assets" / "portfolio-maximum-insurance.png", "https://maximum-insurance.com"),
    ("Sosuites", "AI-assisted personalised art prints to share.",
     ROOT / "public" / "portfolio-sosuites.png", "https://www.sosuites.com"),
)


# ── donnees du fonds ────────────────────────────────────────────────────────
def _load_fund():
    data = json.loads(FUND_JSON.read_text(encoding="utf-8"))
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
FOUNDERS = DATA["founder_math"]
STRESS = DATA["stress_tests"]
LAYER_IDS = ("seed", "venture", "growth")
CASE_IDS = ("target", "base", "stress")
LAYER_NAME = {"seed": "Seed", "venture": "Venture", "growth": "Growth"}
ALL_LINES = [ln for k in LAYER_IDS for ln in LAYERS[k]["lines"]]


# ── formats (meme logique que src/lib/fund.ts) ──────────────────────────────
def eur(v, mode="table"):
    """table : €750K / €27.6M ; val : €45M / €1.5B ; tile : €100M."""
    if v == 0:
        return "€0"
    if mode == "val":
        if v >= 1e9:
            return f"€{v / 1e9:.1f}B" if v % 1e9 else f"€{v // 1_000_000_000}B"
        if v >= 1e7:
            return f"€{v / 1e6:.0f}M"
    if mode == "tile" and v >= 1e6 and v % 1_000_000 == 0:
        return f"€{v // 1_000_000}M"
    if v < 1e6:
        return f"€{v / 1e3:.0f}K"
    return f"€{v / 1e6:.1f}M"


def eur_cost(v):
    """Montant investi d'une ligne : €2.25M quand le total n'est pas sur la maille de 100 K."""
    if v >= 1e6 and v % 100_000:
        return f"€{v / 1e6:.2f}M"
    return eur(v)


def rng(a, b, mode="tile"):
    """€150K–€1.5M"""
    return f"{eur(a, mode)}–{eur(b, mode)}"


def mult(v, dp=1):
    return f"{v:.{dp}f}×"


def pct(v, dp=0):
    return f"{v * 100:.{dp}f}%"


def dash(v, fmt):
    return "–" if not v else fmt(v)


def row_id(line):
    """S-01 ; S-08–10 pour trois societes ; V-05/06 pour deux (src/lib/fund.ts, rowId)."""
    if line["n"] == 1:
        return line["id"]
    prefix, num = line["id"].split("-")
    last = str(int(num) + line["n"] - 1).zfill(len(num))
    return f"{line['id']}/{last}" if line["n"] == 2 else f"{prefix}-{num}–{last}"


def lst(items):
    """« a, b and c »"""
    items = list(items)
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " and " + items[-1]


TONE = {"green": (GREEN, GREEN_SOFT), "blue": (BLUE_DK, BLUE_SOFT), "grey": (MUTED, WARM), "red": (RED, RED_SOFT)}
# couleur du « Fund return » (site, TONE_COLOR)
TONE_TEXT = {"green": BLUE_DK, "blue": BLUE_DK, "grey": MUTED, "red": RED}
FUND_SIZE = eur(FUND["commitments"], "tile")


# ── le document ─────────────────────────────────────────────────────────────
class Doc:
    def __init__(self):
        self.buf = io.BytesIO()
        self.c = canvas.Canvas(self.buf, pagesize=(PW * PX, PH * PX), pageCompression=1)
        self.c.setTitle("ProFund · Fund fact sheet")
        self.c.setAuthor("ProFund")
        self.c.setSubject(f"Venture capital, pre-seed to growth · {FUND_SIZE} target Fund I · "
                          "pre-marketing communication")
        self.c.setCreator("ProFund · scripts/factsheet.py")
        self.num = 0
        self.F = None

    def page(self) -> Frame:
        if self.F is not None:
            self._footer()
            self.F.close()
            self.c.showPage()
        self.num += 1
        self.c.bookmarkPage(f"p{self.num}", fit="XYZ", top=PH * PX, left=0, zoom=0)
        self.F = Frame(self.c)
        self._header()
        return self.F

    def _header(self):
        """Logo ; VENTURE CAPITAL · PRE-SEED TO GROWTH · EUROPE · profund.vc/dealflow · Fact sheet n/4."""
        F = self.F
        lh = 25.0
        lw = lh * 351 / 93
        F.image(LOGO, M, 21, lw, lh)
        F.link(M, 18, lw, lh + 6, SITE)
        r = M + W
        r -= F.text(r, 30, f"{self.num}/{PAGES}", "xgras", 11, BLUE_DK, align="r") + 5
        r -= F.text(r, 30, "Fact sheet", "semi", 11, MUTED, align="r") + 9
        F.text(r, 31, "·", "semi", 10, SOFT, align="r")
        r -= 13
        wd = F.text(r, 31.5, DEALFLOW_TXT, "semi", 9.2, BLUE_DK, align="r")
        F.link(r - wd, 28, wd, 15, DEALFLOW)
        r -= wd + 9
        F.text(r, 31, "·", "semi", 10, SOFT, align="r")
        r -= 13
        F.text(r, 33, "VENTURE CAPITAL · PRE-SEED TO GROWTH · EUROPE", "xgras", 7.6, BLUE, 0.12, align="r")
        F.line(M, 60, M + W, 60, LINE2, 1)

    def _footer(self):
        F = self.F
        F.line(M, FOOT_RULE, M + W, FOOT_RULE, LINE2, 1)
        year, month, _ = DATA["model_date"].split("-")
        legal = ("EuVECA pre-marketing communication, eligible investors only. Not an offer to subscribe. "
                 f"Contact: {MAIL}")
        F.para(M, 1062, W - 180, x(legal), 7.6, "reg", SOFT, 1.5)
        # version et date : trace de ce qui a ete envoye a qui (regle des 18 mois)
        major = DATA["version"].split(".")[0]
        F.text(M, 1077, f"Fact sheet {major} · {MONTHS[int(month) - 1]} {year}", "semi", 7.6, SOFT)
        w1 = F.text(M + W, 1062, "profund.vc", "xgras", 10, INK, align="r")
        F.link(M + W - w1, 1060, w1, 14, SITE)
        w2 = F.text(M + W, 1078, MAIL, "reg", 9, MUTED, align="r")
        F.link(M + W - w2, 1076, w2, 13, "mailto:" + MAIL)

    def fin(self) -> bytes:
        self._footer()
        self.F.close()
        self.c.showPage()
        self.c.save()
        return self.buf.getvalue()


# ── les briques ─────────────────────────────────────────────────────────────
def kick(F, u, v, s, color=BLUE):
    return F.text(u, v, s.upper(), "xgras", 10, color, 0.14)


def title(F, u, v, w, s, size=30.0, color=INK, lead=1.08, markup=None):
    return F.para(u, v, w, markup or x(s), size, "gras", color, lead)


def card(F, u, v, w, h, r=16, fill=WHITE, stroke=LINE, depth=0.6, alpha=0.018):
    F.shadow(u, v, w, h, r, depth, alpha)
    F.rr(u, v, w, h, r, fill=fill, stroke=stroke, lw=1)


def micro(F, u, v, w, items, size=10.5):
    """Les petites coches vertes du heros."""
    px_, py_ = u, v
    for it in items:
        need = 16 + F.tw(it, "med", size) + 18
        if px_ + need - 18 > u + w and px_ > u:
            px_, py_ = u, py_ + size * 1.9
        F.svg(CHECK, px_, py_ - 0.5, 12.5, GREEN, vb=16)
        F.text(px_ + 16, py_, it, "med", size, MUTED)
        px_ += need
    return py_ + size * 1.3 - v


def grey_logo(path, darkness=0.6):
    """Logo recadre sur son trace et passe en gris (transparence gardee) — comme
    `filter: grayscale(1)` sur l'accueil. Niveaux normalises d'abord : le trace le
    plus sombre de chaque logo tombe sur le meme gris, les trois pesent pareil."""
    im = Image.open(path).convert("RGBA")
    box = im.getchannel("A").getbbox()
    if box:
        im = im.crop(box)
    lum = im.convert("L")
    alpha = im.getchannel("A")
    inked = [v for v, a in zip(lum.tobytes(), alpha.tobytes()) if a > 200]
    lo = min(inked) if inked else 0
    span = max(1, 255 - lo)
    g = lum.point(lambda v: int(255 - (255 - max(0, (v - lo) * 255 // span)) * darkness))
    out = Image.merge("RGBA", (g, g, g, im.getchannel("A")))
    return ImageReader(out), out.size


def browser(F, u, v, w, url=DEALFLOW_TXT):
    """La capture de la carte du deal flow dans un cadre de navigateur ; rend la hauteur."""
    ih = w * MAP_SHOT[1]
    F.shadow(u, v, w, ih + 26, 14, 0.8, 0.025)
    F.rr(u, v, w, ih + 26, 14, fill="#EEF0F3", stroke=LINE2, lw=1)
    for j, col in enumerate(("#E0664B", "#DC9A2C", "#58B17A")):
        F.circle(u + 14 + j * 11, v + 13, 3.6, fill=col)
    F.rr(u + 56, v + 6, w - 112, 14, 7, fill=WHITE)
    F.text(u + w / 2, v + 9, url, "reg", 7.8, MUTED, align="c")
    F.clip(u + 1, v + 1, w - 2, ih + 24, 13)
    F.image(MAP_SHOT[0], u + 1, v + 26, w - 2, ih - 1)
    F.unclip()
    F.link(u, v, w, ih + 26, DEALFLOW)
    return ih + 26


def snap(F, u, v, w, shot, r=9.0):
    """Une capture posee devant la fenetre, entiere ; rend la hauteur."""
    path, ratio = shot
    h = w * ratio
    F.shadow(u, v, w, h, r, 0.8, 0.03)
    F.rr(u, v, w, h, r, fill=WHITE, stroke=LINE2, lw=1)
    F.clip(u + 0.5, v + 0.5, w - 1, h - 1, r - 0.5)
    F.image(path, u + 0.5, v + 0.5, w - 1, (w - 1) * ratio)
    F.unclip()
    F.link(u, v, w, h, DEALFLOW)
    return h


def powers(F, u, v, w, names, draw=True):
    """« POWERS » puis les pastilles des societes, a la ligne si besoin ; rend la hauteur."""
    lab = F.tw("POWERS", "xgras", 7.4, 0.1) + 8
    if draw:
        F.text(u, v + 4, "POWERS", "xgras", 7.4, SOFT, 0.1)
    cx_, cy_ = u + lab, v
    for name_ in names:
        cw_ = F.tw(name_, "semi", 8.6) + 16
        if cx_ + cw_ > u + w:
            cx_, cy_ = u + lab, cy_ + 22
        if draw:
            pf = name_ == "ProFund"
            F.rr(cx_, cy_ + 1, cw_, 17, 8.5, fill=BLUE_SOFT if pf else WARM)
            F.text(cx_ + cw_ / 2, cy_ + 5, name_, "semi", 8.6, BLUE_DK if pf else INK2, align="c")
        cx_ += cw_ + 5
    return cy_ - v + 19


# Un tableau en carte : en-tete gris clair, colonne mise en avant (hl), cellules
# qui passent a la ligne. cols : (largeur relative, alignement "l" / "r" / "c").
# Une cellule : texte, ou (texte, graisse, couleur).
_AL = {"l": 0, "c": 1, "r": 2}


def grid(F, u, v, w, cols, head, rows, size=8.8, hsize=7.0, pad_y=4.6, hl=None, lead=1.3,
         strong_last=False, pad=12.0, draw=True, head_pad=None):
    tot = sum(c[0] for c in cols)
    xs, cx = [], u + pad
    for cw, _al in cols:
        xs.append((cx, cw * (w - 2 * pad) / tot))
        cx += cw * (w - 2 * pad) / tot

    def norm(c, i, last):
        if isinstance(c, tuple):
            return c
        if last and strong_last:
            return (c, "gras", INK)
        if i == 0:
            return (c, "semi", INK)
        return (c, "reg", INK2)

    def hgt(i, s, role, sz):
        return F.hpara(xs[i][1] - 6, x(s), sz, role, lead)

    hp = pad_y if head_pad is None else head_pad
    hh = max(hgt(i, h.upper(), "xgras", hsize) for i, h in enumerate(head)) + 2 * hp + 4
    rhs = []
    for k, r in enumerate(rows):
        cells = [norm(c, i, k == len(rows) - 1) for i, c in enumerate(r)]
        rhs.append(max(hgt(i, c[0], c[1], size) for i, c in enumerate(cells)) + 2 * pad_y)
    total = hh + sum(rhs)
    if not draw:
        return total
    card(F, u, v, w, total, 14)
    F.clip(u, v, w, total, 14)
    F.rr(u, v, w, hh, 0, fill="#FAFBFC")
    if hl is not None:
        x0, cw = xs[hl]
        x1 = u + w if hl == len(cols) - 1 else x0 + cw + 4   # derniere colonne : jusqu'au bord
        F.rr(x0 - 4, v, x1 - x0 + 4, total, 0, fill=BLUE_TINT)
        F.rr(x0 - 4, v, x1 - x0 + 4, hh, 0, fill=BLUE_SOFT)
        F.rr(x0 - 4, v, x1 - x0 + 4, 3, 0, fill=BLUE)
    if strong_last:
        F.rr(u, v + total - rhs[-1], w, rhs[-1], 0, fill=WARM)
    F.unclip()
    F.rr(u, v, w, total, 14, stroke=LINE2, lw=1)

    def put(i, yy, s, role, color, sz):
        x0, cw = xs[i]
        F.para(x0 + 3, yy, cw - 6, x(s), sz, role, color, lead, _AL[cols[i][1]])

    for i, h in enumerate(head):
        put(i, v + hp + 2, h.upper(), "xgras", BLUE_DK if i == hl else MUTED, hsize)
    y = v + hh
    for k, r in enumerate(rows):
        F.line(u, y, u + w, y, LINE2 if (strong_last and k == len(rows) - 1) else LINE, 1)
        for i, c in enumerate(r):
            s, role, color = norm(c, i, k == len(rows) - 1)
            if i == hl and not isinstance(c, tuple):
                role, color = ("gras", BLUE_DK)
            put(i, y + pad_y, s, role, color, size)
        y += rhs[k]
    return total


# ── page 1 : la these et la structure ───────────────────────────────────────
LAWS = (
    ("crown", "Visionary founders",
     "We back obsessive visionaries from Day 1. Founders who don't build org charts, but "
     "iterate directly with AI until the machine mirrors their exact ambition."),
    ("loop", "Self-improving systems",
     "We look for closed-loop architectures. Products that don't just automate a task, but compound in "
     "intelligence, precision, and autonomy with every single run."),
    ("globe", "Maximum impact. Minimum headcount.",
     "We invest in integral systems solving massive, painful problems in the world's largest "
     "markets, operated with near-zero marginal labor."),
    ("trend", "Fund-returning physics",
     "Every check we write backs a "
     f"company built to dominate its category globally and return our entire {FUND_SIZE} fund."),
)

PACT = (
    ("Equity, when the founder chooses.", "At most a 1× non-participating preference; never a pushed round."),
    ("An in-house Chief Fundraising Officer.", "Loans to raise from strength, then equity on the same "
                                               "terms when the founder asks and our committee agrees."),
    ("Buybacks and cancellations.", "We buy out angels, leavers and early funds, with the founder's "
                                    "agreement, and the company can cancel shares every year: each "
                                    "cancellation lifts both stakes."),
    ("Founder control.", "Our shares vote with the founder. One board seat, no veto on how they run, "
                         "raise or sell."),
    ("Capital protected.", "No sale below our money back without us, loans on lender terms, founder "
                           "lock-up and vesting. Protections wake up on default."),
)


def page_one(F):
    tw = 366.0
    y = 84.0
    y += title(F, M, y, tw, "", 27, lead=1.04, markup=x("Backing AI-native teams building self-improving AI systems."))
    y += 11 + F.para(M, y + 11, tw, x(f"Pre-seed to Growth. {FUND_SIZE}."), 13, "gras", INK, 1.4)
    y += 5 + F.para(M, y + 5, tw, x("We don't fund headcount. We back the clearest minds directing the most "
                                    "autonomous machines, in the world's largest markets."), 11.4, "reg", INK2, 1.48)
    # la ligne forte, en gras sous le sous-titre (06/11 : le positionnement LP)
    y += 12
    strong = (f"<b>{x('The terms the best founders negotiate, from their first cheque.')}</b> "
              + x("Seed to Series B, SPVs for the largest rounds. Every fund says founders come "
                  "first: we wrote it down."))
    hs = F.para(M + 13, y, tw - 13, strong, 11.4, "reg", INK, 1.45)
    F.rr(M, y + 1, 3.2, hs - 2, 1.6, fill=BLUE)
    y += hs
    y += 10 + micro(F, M, y + 12, tw, ["EuVECA fund"])

    # le visuel : la carte du deal flow dans la fenetre (06/11 : sans le pipeline pose devant)
    vw = 252.0
    vx = M + W - vw
    bh = browser(F, vx, 84, vw)
    y = max(y, 84 + bh + 4)

    # l'encadre de pre-commercialisation, en tete de document
    y += 12
    bh2 = 54.0
    F.rr(M, y, W, bh2, 14, fill=BLUE_TINT, stroke="#DCE3EC", lw=1)
    F.rr(M + 14, y + 12, 30, 30, 9, fill=BLUE_SOFT)
    F.icon("shield", M + 20, y + 18, 18, BLUE_DK)
    F.text(M + 56, y + 10, "PRE-MARKETING PHASE", "xgras", 8.4, BLUE_DK, 0.12)
    F.para(M + 56, y + 23, W - 72, x(
        "This document is a pre-marketing communication within the meaning of Article 4a of Regulation (EU) "
        "No 345/2013 (EuVECA). The fund is not yet established and no units may be subscribed at this stage. "
        "For professional and eligible investors only."), 9, "reg", INK2, 1.38)
    y += bh2 + 18

    # le manifeste
    lw = 214.0
    kick(F, M, y, "The manifesto")
    title(F, M, y + 18, lw, "The end of human friction.", 21, lead=1.1)
    rx = M + lw + 26
    rw = W - lw - 26
    sz, ld, gp = 9.5, 1.42, 5.5
    h1 = F.para(rx, y + 2, rw, x("For two centuries, scaling a company meant scaling human labor, hiring thousands "
                                 "of people to execute the vision of one. That era is over."), 11, "semi", INK, 1.42)
    yy = y + 2 + h1 + gp
    yy += gp + F.para(rx, yy, rw, x(
        "Today, a tight-knit team that knows how to challenge, direct, and iterate with AI can architect an "
        "integral, self-improving system in record time. AI frees humanity from mechanical execution, "
        "returning creation to pure thought."), sz, "reg", MUTED, ld)
    yy += gp + F.para(rx, yy, rw, x(
        "The future doesn't belong to the largest organizations. It belongs to the clearest minds directing "
        "the most autonomous machines."), sz, "semi", INK, ld)
    yy += F.para(rx, yy, rw, f"<b>{x('Capital is no longer scarce. Control is.')}</b> " + x(
        "A team that doesn't need an army doesn't need a round every 18 months. So we don't sell it one: "
        "we lend, we buy, and equity comes only when the founder chooses."), sz, "reg", BLUE_DK, ld)
    y = max(yy, y + 70) + 24

    # les quatre lois
    kick(F, M, y, "What we back")
    title(F, M, y + 17, W, "Four laws drive our thesis and our engines every morning.", 17)
    y += 44
    gap = 12.0
    cw = (W - 3 * gap) / 4
    pad = 12.0
    hs = [pad + 26 + 9 + F.hpara(cw - 2 * pad, x(t), 10.6, "gras", 1.2) + 4
          + F.hpara(cw - 2 * pad, x(d), 8.6, "reg", 1.4) + pad for _i, t, d in LAWS]
    th = max(hs)
    for i, (ic, t, d) in enumerate(LAWS):
        cx = M + i * (cw + gap)
        card(F, cx, y, cw, th)
        F.tile(cx + pad, y + pad, 26, 8)
        F.icon(ic, cx + pad + 5.5, y + pad + 5.5, 15, WHITE, sw=1.8)
        F.text(cx + cw - pad, y + pad + 1, f"{i + 1:02d}", "xgras", 10, SOFT, 0.06, "r")
        ht = F.para(cx + pad, y + pad + 35, cw - 2 * pad, x(t), 10.6, "gras", INK, 1.2)
        F.para(cx + pad, y + pad + 35 + ht + 4, cw - 2 * pad, x(d), 8.6, "reg", MUTED, 1.4)
    y += th + 26

    # le pacte des fondateurs (v3) : le titre a gauche, les cinq clauses a droite
    lw = 196.0
    kick(F, M, y, "How we back them")
    title(F, M, y + 17, lw, "The founders' pact.", 17)
    F.para(M, y + 40, lw - 16, x("The same for every company, and public."), 9.6, "reg", MUTED, 1.4)
    rx = M + lw
    rw = W - lw
    pad = 13.0
    rows_h = [F.hpara(rw - 2 * pad - 24, f"<b>{x(t)}</b> " + x(d), 8.9, "reg", 1.38) for t, d in PACT]
    ch = sum(rows_h) + 2 * pad + 10 * (len(PACT) - 1)
    card(F, rx, y - 4, rw, ch)
    py = y - 4 + pad
    for k, (t, d) in enumerate(PACT):
        if k:
            F.line(rx + pad + 24, py - 5, rx + rw - pad, py - 5, LINE, 1)
        F.check(rx + pad, py + 0.5, 14, fill=GREEN)
        F.para(rx + pad + 24, py, rw - 2 * pad - 24, f"<b>{x(t)}</b> " + x(d), 8.9, "reg", INK2, 1.38)
        py += rows_h[k] + 10
    y += max(ch - 4, 60) + 24

    # la bande de chiffres : cinq chiffres
    stats = [
        (FUND_SIZE, f"Target Fund I, closed-ended, closings over {FUND['closing_months']} months"),
        (f"{len(LAYER_IDS)} layers", f"Seed, Venture, Growth: {eur(LAYERS['seed']['ticket_min'])} to "
                                     f"{eur(FUND['company_cap'], 'tile')} per company"),
        (pct(DATA["allocation"]["after_first_pct"]), "Invested after the first cheque: follow-ons, buybacks, loans"),
        ("Every", "European seed round tracked by the Seed Radar, weekly"),
        ("6–18mo", "Detection lead before announcement"),
    ]
    eq = 40.0
    colw = (W - eq - 10) / len(stats)
    lab_h = max(F.hpara(colw - 18, x(lab), 8.1, "reg", 1.3) for _n, lab in stats)
    bh3 = 38 + lab_h + 13
    card(F, M, y, W, bh3, 18, fill=NIGHT, stroke=None, depth=0.8, alpha=0.03)
    F.glow(M + W - 60, y + 6, 160, BLUE, 16, 0.03, (M, y, W, bh3, 18))
    F.text(M + eq / 2 + 6, y + bh3 / 2 - 15, "=", "reg", 26, GLOW, align="c")
    for i, (num, lab) in enumerate(stats):
        sx = M + eq + 10 + i * colw
        if i:
            F.line(sx - 9, y + 14, sx - 9, y + bh3 - 14, NIGHT_LINE, 1)
        F.text(sx, y + 12, num, "gras", 17, WHITE, -0.01)
        F.para(sx, y + 36, colw - 18, x(lab), 8.1, "reg", NIGHT_TXT, 1.3)
    return y + bh3


# ── page 2 : la construction et les termes ──────────────────────────────────
KV_PAD, KV_ROW = 15.0, 18.2


def kv_height(rows):
    return KV_PAD + 26 + 8 + KV_ROW * len(rows) + KV_PAD - 6


def kv_card(F, u, v, w, head, icon, rows, bold_last=False, h=None):
    """Carte a lignes cle / valeur (termes, allocation) ; rend la hauteur."""
    pad, rh = KV_PAD, KV_ROW
    h = h or kv_height(rows)
    card(F, u, v, w, h)
    F.rr(u + pad, v + pad, 26, 26, 8, fill=BLUE_SOFT)
    F.icon(icon, u + pad + 5, v + pad + 5, 16, BLUE_DK)
    F.text(u + pad + 36, v + pad + 8.5, head.upper(), "xgras", 8.6, BLUE, 0.12)
    ry = v + pad + 26 + 8
    for i, (k, val) in enumerate(rows):
        last = bold_last and i == len(rows) - 1
        F.line(u + pad, ry, u + w - pad, ry, LINE2 if last else LINE, 1)
        F.text(u + pad, ry + 3.6, k, "semi" if last else "reg", 9.2, INK if last else INK2)
        F.text(u + w - pad, ry + 3.6, val, "gras", 9.2, INK, align="r")
        if F.tw(k, "reg", 9.2) + F.tw(val, "gras", 9.2) > w - 2 * pad - 10:
            raise SystemExit(f"carte {head} : ligne trop longue : {k} {val}")
        ry += rh
    return h


def construction_rows():
    s, v, g = (LAYERS[k] for k in LAYER_IDS)
    lead, radar = s["tracks"]["lead"], s["tracks"]["radar"]
    holds = [ln["exit_year"] - ln["entry_year"] for ln in g["lines"]]
    spv = eur(FUND["company_max_with_spv"], "tile")
    return [
        ("Ticket", f"{rng(s['ticket_min'], s['ticket_max'])}, first cheque, loan line reserved",
         f"{rng(v['ticket_min'], v['ticket_max'])}, first cheque or buyback, loan line reserved",
         f"{rng(g['ticket_min'], FUND['company_cap'])} from the fund, up to {spv} with SPVs"),
        ("Stage", s["stage"], v["stage"], g["stage"]),
        ("Role", "Lead + radar tickets", "Direct at the inflection, or buyback of angels and leavers",
         "Direct: blocks from end-of-life funds and fresh growth rounds. "
         "Our breakouts: blocks bought in our winners"),
        ("Entry post", rng(s["entry_post_min"], s["entry_post_max"]),
         rng(v["entry_post_min"], v["entry_post_max"]), rng(g["entry_post_min"], g["entry_post_max"])),
        ("Companies", f"{lead['companies']} leads + {radar['companies']} radar",
         f"{v['companies']} direct entries, {rng(*v['first_cheque_range'])} first cheques",
         f"{g['companies']} direct entries + {g['breakouts']} of our breakout{'s' if g['breakouts'] > 1 else ''}, "
         f"{rng(*g['position_range'])} each"),
        ("Invested, loans included", eur(s["invested"]), eur(v["invested"]), eur(g["invested"])),
        ("Target gross", f"{mult(s['moic']['base'])} MOIC, {mult(s['moic']['target'])} in the upside",
         f"{mult(v['moic']['base'])} MOIC, {mult(v['moic']['target'])} in the upside",
         f"{mult(g['moic']['base'])} MOIC, {pct(g['gross_irr']['base'])} gross IRR over "
         f"{min(holds)}–{max(holds)} year holds"),
    ]


def page_two(F):
    kick(F, M, 84, "Fund construction")
    y = 102 + title(F, M, 102, W, "", 19, lead=1.18, markup=(
        x("Two ways in at every layer: a first equity cheque, or a buyback of existing shares. ")
        + f'<font color="{BLUE}">{x("Then credit first, equity when the founder asks.")}</font>'))
    y += 20

    # le tableau des trois etages
    rows = construction_rows()
    cells = [[r[0]] + list(r[1:]) for r in rows]
    cells[-1] = [(cells[-1][0], "semi", INK)] + [(c, "gras", BLUE_DK) for c in cells[-1][1:]]
    cols = [(0.82, "l"), (1.3, "l"), (1.3, "l"), (1.42, "l")]
    th = grid(F, M, y, W, cols, ["", "", "", ""], cells, size=9.2, hsize=7.6, pad_y=6.6, lead=1.32,
              head_pad=19)
    # l'en-tete : « Layer n · Nom », en pastille numerotee (les cartes d'etage de la v2)
    tot = sum(c[0] for c in cols)
    cx = M + 12 + cols[0][0] * (W - 24) / tot
    for n, layer in enumerate(LAYER_IDS, 1):
        F.rr(cx + 3, y + 10, 24, 24, 7, fill=BLUE_SOFT)
        F.text(cx + 15, y + 15.8, str(n), "gras", 11.5, BLUE_DK, align="c")
        F.text(cx + 35, y + 10.5, f"LAYER {n}", "xgras", 7.4, BLUE, 0.12)
        F.text(cx + 35, y + 20.5, LAYER_NAME[layer], "gras", 12, INK)
        cx += cols[n][0] * (W - 24) / tot
    y += th + 7
    y += 14

    # termes | allocation
    half = (W - 16) / 2
    ip = FUND["investment_period_years"]
    terms = [
        ("Closed-ended EuVECA fund", f"{FUND['term_years']} years"),
        ("Successive closings", f"{FUND['closing_months']} months"),
        (f"Management fee, years 1–{ip}", pct(TERMS["fee_ip_pct"])),
        (f"On the loan sleeve, years 1–{ip}", pct(TERMS["fee_loan_pct"])),
        ("Then, on invested capital incl. loans until repaid", pct(TERMS["fee_post_pct"], 1)),
        ("Carried interest, European", pct(TERMS["carry_pct"])),
        ("Hurdle, with GP catch-up", pct(TERMS["hurdle_pct"])),
        ("Per company: fund / with SPVs",
         f"{eur(FUND['company_cap'], 'tile')} / {eur(FUND['company_max_with_spv'], 'tile')}"),
        ("Loans", f"Up to {pct(FUND['loan_cap_pct'])} of commitments (EuVECA)"),
    ]
    alloc = [
        ("First cheques, incl. fresh growth rounds", eur(ALLOC["first"])),
        ("Buybacks and follow-ons", eur(ALLOC["buyback_follow"])),
        ("Loans", eur(ALLOC["loans"])),
        (f"Invested ({pct(ALLOC['after_first_pct'])} after the first cheque)", eur(ALLOC["invested"])),
        ("Management fees", eur(ALLOC["mgmt_fees"])),
        ("Fund expenses, incl. set-up", eur(ALLOC["fund_expenses"])),
        ("Contingency", eur(ALLOC["contingency"])),
        ("Total commitments", eur(ALLOC["total"])),
    ]
    kh = max(kv_height(terms), kv_height(alloc))
    kv_card(F, M, y, half, "Key terms", "building", terms, h=kh)
    kv_card(F, M + half + 16, y, half, "Capital allocation", "layers", alloc, bold_last=True, h=kh)
    y += kh + 36

    # tout le monde y gagne (v3) : le texte a gauche, le tableau a 250 M EUR a droite
    t = CASES["base"]        # 07/11 : la cible affichee (sorties a 60 %) ; CASES["target"] est l'upside
    up = CASES["target"]
    # 07/11 : a 1 Md EUR, les memes tours sur tous les chemins ; chaque chemin dit ce qu'il leve
    row = next(r for r in FOUNDERS["rows"] if r["exit"] == 1_000_000_000)
    same_path = next(p for p in FOUNDERS["paths"] if p["id"] == "same")
    uni_same = next(s_ for s_ in STRESS if s_["id"] == "unicorn_same")
    lw = 268.0
    kick(F, M, y, "Everyone wins")
    ty = y + 19
    ty += F.para(M, ty, lw, x(
        "Our stake rises with the founder's: every buyback and cancellation lifts both. We never push for a "
        "new round, and every share a company does not issue protects the founder's stake and ours."),
        10.4, "reg", INK2, 1.52) + 12
    ty += F.para(M, ty, lw, x("All that disappears is the equity nobody needed to sell."),
                 10.6, "semi", BLUE_DK, 1.42)
    gx = M + lw + 20
    gw = W - lw - 20
    rows = [
        ["Founders", eur(row["founders_vc"], "tile"),
         f"{eur(row['founders_same'], 'tile')} on the same capital, {eur(row['founders_half'], 'tile')} on half of it, "
         f"{eur(row['founders_credit'], 'tile')} on credit alone"],
        ["Series A investor, equity multiple", mult(row["series_a_vc"]),
         f"{mult(row['series_a_same'])}, {mult(row['series_a_half'])} and {mult(row['series_a_credit'])} on the same "
         "paths (ProFund)"],
        ["Angels", "Wait for the exit", "Liquidity at year 2"],
        ["LPs", "A unicorn, diluted round after round",
         f"{mult(t['net_tvpi'])} net and {pct(t['net_irr'])} IRR target, {mult(up['net_tvpi'])} in the upside; the "
         f"unicorn grows on credit, {DATA['fund_returner']['stake_at_exit'] * 100:.1f}% owned at exit; "
         f"{mult(uni_same['net_tvpi'])} if it also sells {eur(same_path['equity'], 'tile')} of equity"],
    ]
    gh = grid(F, gx, y - 4, gw, [(1.0, "l"), (0.8, "l"), (1.9, "l")],
              [f"At a {eur(row['exit'], 'val')} exit", "VC path", "ProFund path"], rows, size=9.2,
              hsize=7.4, pad_y=7.4, hl=2)
    y = max(ty, y - 4 + gh) + 34

    # conflits et filet de securite
    txt = (f"<b>{x('Conflicts and fallback.')}</b> " + x(
        "Every buyback is priced by an independent valuer. ProFund's shares abstain on its own loans and "
        "buybacks; founder pay beyond budget, related-party deals and buybacks of founder shares need our "
        "director's approval. Fund-side conflicts go to the LP advisory committee. Fraud, gross misconduct, a "
        "material breach of the pact, a loan default not cured within 30 days or insolvency end the voting "
        "agreement and restore a classic lead's consents."))
    hb = F.hpara(W - 72, txt, 9.6, "reg", 1.5) + 30
    F.rr(M, y, W, hb, 14, fill=BLUE_TINT, stroke="#DCE3EC", lw=1)
    F.rr(M + 14, y + (hb - 30) / 2, 30, 30, 9, fill=BLUE_SOFT)
    F.icon("shield", M + 20, y + (hb - 30) / 2 + 6, 18, BLUE_DK)
    F.para(M + 56, y + 15, W - 72, txt, 9.6, "reg", INK2, 1.5)
    return y + hb


# ── page 3 : l'avantage, l'equipe, la preuve ────────────────────────────────
def page_three(F):
    kick(F, M, 84, "Our edge")
    title(F, M, 102, W, "Two autonomous AI engines.", 27)
    F.para(M, 136, W, x("We run on what we back."), 11.6, "reg", MUTED, 1.5)

    y = 164.0
    engines = (
        ("radar", "The External AI Growth Engine",
         "Scores every company against our thesis and flags inflection points before they become consensus. "
         "For our founders, it sources, assesses and qualifies every day the startups that could create the "
         "strongest synergies with their company.",
         ("ProFund", "Proplace", "Portfolio companies")),
        ("bot", "The Internal AI Growth Engine",
         "Autonomous AI agents running content, inbound and outbound. For our founders: a daily feed of "
         "LinkedIn and X posts and of intent-based leads with personalised sequences, ready to approve.",
         ("ProFund", "Proplace", "Maximum Insurance", "Sosuites", "Portfolio companies")),
    )
    gap = 16.0
    ew = (W - gap) / 2
    pad = 16.0
    th = max(F.hpara(ew - 2 * pad, x(t), 9.8, "reg", 1.48) for _i, _n, t, _p in engines)
    chips = max(powers(F, 0, 0, ew - 2 * pad, p_, draw=False) for _i, _n, _t, p_ in engines)
    eh = pad + 30 + 12 + th + 12 + chips + 3 + pad
    for i, (ic, name, text, names) in enumerate(engines):
        ex = M + i * (ew + gap)
        card(F, ex, y, ew, eh)
        F.tile(ex + pad, y + pad, 30, 9)
        F.icon(ic, ex + pad + 6.5, y + pad + 6.5, 17, WHITE)
        F.text(ex + pad + 42, y + pad + 7, name, "gras", 14, INK)
        F.para(ex + pad, y + pad + 42, ew - 2 * pad, x(text), 9.8, "reg", MUTED, 1.48)
        fy = y + eh - pad - chips
        if i == 0:
            # le lien du deal flow en direct, sur la ligne des pastilles (v3.15 : le nom du
            # moteur, plus long, occupe toute la ligne du titre)
            # (sur la seconde ligne de pastilles, vide pour ce moteur)
            ly = fy + chips - 15
            lx = ex + ew - pad - 12 - 5 - F.tw("Follow live deal flow", "semi", 9.6)
            F.circle(lx - 10, ly + 5, 5.5, fill=GREEN, alpha=0.18)
            F.circle(lx - 10, ly + 5, 3, fill=GREEN)
            wl = F.text(lx, ly, "Follow live deal flow", "semi", 9.6, BLUE_DK)
            F.svg(ARROW, lx + wl + 5, ly + 0.5, 12, BLUE_DK)
            F.link(lx - 18, ly - 5, wl + 40, 20, DEALFLOW)
        F.line(ex + pad, fy - 9, ex + ew - pad, fy - 9, LINE, 1)
        powers(F, ex + pad, fy, ew - 2 * pad, names)
    y += eh + 32

    # l'equipe | le track record
    half = (W - 16) / 2
    kick(F, M, y, "The GP")
    y += 20
    # Memes faits que le tableau Track Record de /pitch ; Deal-04 SANS multiple :
    # un cash-on-cash n'a pas de sens pour une acquisition a 100 % toujours detenue.
    deals = (
        ("Deal-01, exited 2007", "Entry 2006, 100% owned. Full exit in 2007.", "10.0×"),
        ("Deal-02, exited 2014", "Entry 2008 at 100%. Sold down to 40%, then full exit in 2014.", "20.0×"),
        ("Deal-03, LBO exit 2025",
         "Seed ticket €200K at €5.3M in 2014. LBO exit in Feb 2025 at €100M. "
         "Sourced 14 months before public announcement.", "19.0×"),
        ("Deal-04, acquired 2016",
         "100% acquisition, €45M buyout. Revenue growing ~20% YoY since acquisition.", "–"),
    )
    extras = ("A partner from venture debt will run the loan book (to be recruited).",
              "Investment committee and key-person clause.")
    roles = (
        "M&A Director, Leboncoin",
        "Senior Associate, Partech Ventures",
        "LBO Analyst, Ardian (ex-AXA PE)",
        "Key Account Manager assistant, Google",
        "Founder / Investor, Dreamzer Games",
        "Owner and CEO, Fadparis.com",
    )
    pw_ = 100.0
    ph_ = pw_ * 468 / 429
    top_h = 14 + max(ph_, 58 + 13.2 * len(roles)) + 10
    ex_h = sum(F.hpara(half - 56, x(e), 8.8, "reg", 1.35) + 12 for e in extras) + 4
    track_h = 30 + sum(12.5 + F.hpara(half - 28, x(d), 8.4, "reg", 1.3) + 6 for _h, d, _v in deals) + 18
    gh = max(top_h + ex_h, track_h)
    card(F, M, y, half, gh)
    F.image(PHOTO, M + 14, y + 14, pw_, ph_, 12)
    tx = M + 14 + pw_ + 16
    F.text(tx, y + 18, "Alexandre Busson", "gras", 14, INK)
    F.text(tx, y + 37, "Founding Partner", "reg", 9.6, MUTED)
    yy = y + 58
    for role in roles:
        F.circle(tx + 2.5, yy + 5.6, 1.8, fill=BLUE)
        F.text(tx + 10, yy, role, "reg", 9.2, INK2)
        yy += 13.2
    ey = y + top_h
    F.line(M + 14, ey - 4, M + half - 14, ey - 4, LINE, 1)
    for k, e in enumerate(extras):
        F.rr(M + 14, ey + 2, 20, 20, 6, fill=BLUE_SOFT)
        F.icon("layers" if k == 0 else "building", M + 17.5, ey + 5.5, 13, BLUE_DK)
        ey += 3 + F.para(M + 42, ey + 3, half - 56, x(e), 8.8, "reg", INK2, 1.35) + 9
    if ey > y + gh + 1:
        raise SystemExit("carte de l'equipe : le contenu depasse la carte")

    tx = M + half + 16
    card(F, tx, y, half, gh)
    F.text(tx + 14, y + 13, "TRACK RECORD, PRIOR TO THE FUND", "xgras", 8.2, BLUE, 0.12)
    ty = y + 32
    for i, (head, detail, val) in enumerate(deals):
        F.line(tx + 14, ty - 5, tx + half - 14, ty - 5, LINE, 1)
        F.text(tx + 14, ty, head, "semi", 9.8, INK)
        F.text(tx + half - 14, ty, val, "gras", 9.8, BLUE_DK if val != "–" else SOFT, align="r")
        ty += 12.5 + F.para(tx + 14, ty + 12.5, half - 28, x(detail), 8.4, "reg", MUTED, 1.3) + 6
    F.text(tx + 14, ty, "Companies anonymised. Names and references on request.", "reg", 7.8, SOFT)
    if ty + 10 > y + gh:
        raise SystemExit("carte du track record : le contenu depasse la carte")
    y += gh + 32

    # la preuve : les societes operees par le GP
    kick(F, M, y, "Proof of work")
    title(F, M, y + 17, W, "We live what we back.", 18)
    y += 44
    y += F.para(M, y, W, x("ProFund and the companies below are "
                           "operated almost entirely by our in-house engines and agents:"), 10, "reg", MUTED, 1.45) + 10
    gap = 12.0
    pcw = (W - 2 * gap) / 3
    pch = 60.0
    for i, (name, tagline, path, href) in enumerate(PORTFOLIO):
        px_ = M + i * (pcw + gap)
        F.rr(px_, y, pcw, pch, 13, fill=WARM)
        ir, (iw_, ih_) = grey_logo(path)
        lh = 15.0
        lwid = lh * iw_ / ih_
        if lwid > pcw - 28:
            lwid, lh = pcw - 28, (pcw - 28) * ih_ / iw_
        F.image(ir, px_ + 14, y + 12 + (15 - lh) / 2, lwid, lh)
        F.para(px_ + 14, y + 33, pcw - 28, x(tagline), 8.8, "reg", INK2, 1.3)
        F.link(px_, y, pcw, pch, href)
    y += pch + 18
    return cta(F, y)


def cta(F, ymin):
    """Contact : trois gestes, un grand QR (bande sombre des fiches Maximum)."""
    actions = (
        ("radar", "Follow our deal flow live", ("Every evening, the companies we reviewed.",), DEALFLOW),
        ("mail", "Request LP access", (MAIL, PHONE), "mailto:" + MAIL),
        ("sheet", "Fund model (Excel)", ("On request.",), "mailto:" + MAIL + "?subject=ProFund%20fund%20model"),
    )
    qs, pad = 88.0, 24.0
    inner = W - pad * 2 - qs - 30
    col = inner / len(actions)

    def small(lines):
        return "<br/>".join(x(part) for part in lines)
    hs = [F.hpara(col - 50, x(lab), 11, "semi", 1.25) + 2 + F.hpara(col - 50, small(sm), 9, "reg", 1.35)
          for _ic, lab, sm, _u in actions]
    h = max(60 + max(hs) + 22, pad + qs + 30)
    v = max(ymin, BOTTOM - h)
    card(F, M, v, W, h, 22, fill=NIGHT, stroke=None, depth=0.8, alpha=0.03)
    F.glow(M + W - 80, v + 10, 190, BLUE, 16, 0.03, (M, v, W, h, 22))
    F.text(M + pad, v + 22, "Contact", "gras", 20, WHITE, -0.01)
    for i, (ic, lab, sm, url) in enumerate(actions):
        ax = M + pad + i * col
        F.tile(ax, v + 62, 34, 10)
        F.icon(ic, ax + 8, v + 70, 18, WHITE)
        hl = F.para(ax + 46, v + 62, col - 50, x(lab), 11, "semi", WHITE, 1.25)
        F.para(ax + 46, v + 64 + hl, col - 50, small(sm), 9, "reg", NIGHT_TXT, 1.35)
        F.link(ax, v + 58, col - 8, max(hs) + 10, url)
    qu, qv = M + W - pad - qs, v + pad - 8
    F.rr(qu - 6, qv - 6, qs + 12, qs + 12, 13, fill=WHITE)
    F.qr(DEALFLOW, qu, qv, qs)
    F.link(qu - 6, qv - 6, qs + 12, qs + 12, DEALFLOW)
    F.text(qu + qs / 2, qv + qs + 12, "Scan to follow live", "semi", 8.8, NIGHT_TXT, align="c")
    return v + h


# ── page 4 : la simulation et la performance ────────────────────────────────
SIM_COLS = (  # (titre, largeur relative, alignement)
    (("DEAL ID",), 46, "l"), (("STATUS",), 214, "l"), (("FIRST", "CHEQUE"), 46, "r"),
    (("BUYBACKS",), 48, "r"), (("FOLLOW-ON",), 48, "r"), (("LOAN",), 40, "r"),
    (("ENTRY", "STAKE"), 38, "r"), (("STAKE", "AT EXIT"), 40, "r"), (("EXIT", "VALUE"), 40, "r"),
    (("FUND", "RETURN"), 46, "r"), (("MOIC",), 34, "r"),
)


def seed_band():
    s = LAYERS["seed"]
    lead, radar = s["tracks"]["lead"], s["tracks"]["radar"]
    a, b = s["entry_years"]
    return (f"{s['companies']} companies: {lead['companies']} leads ({lead['first']} to {lead['last']}) + "
            f"{radar['companies']} radar tickets ({radar['first']} to {radar['last']}), entries years {a}–{b}")


def venture_band():
    v = LAYERS["venture"]
    a, b = v["entry_years"]
    return (f"{v['companies']} companies, first cheques of {rng(*v['first_cheque_range'])} at seed+ or Series A, "
            f"entries years {a}–{b}")


def growth_band():
    g = LAYERS["growth"]
    a, b = g["entry_years"]
    disc = max(ln["discount"] or 0 for ln in g["lines"])
    holds = [ln["exit_year"] - ln["entry_year"] for ln in g["lines"]]
    return (f"{rng(*g['position_range'])} per position: blocks bought from end-of-life funds at a {pct(disc)} "
            "discount, fresh growth rounds, and a block in our own breakout; "
            f"entries years {a}–{b}, exits {min(holds)}–{max(holds)} years later")


BAND = {"seed": seed_band, "venture": venture_band, "growth": growth_band}


def sim_table(F, u, v, w):
    pad = 10.0
    scale = (w - 2 * pad) / sum(c[1] for c in SIM_COLS)
    xs, cx = [], u + pad
    for _t, cw, _a in SIM_COLS:
        xs.append((cx, cw * scale))
        cx += cw * scale
    head, rh, sub, fs = 22.0, 11.5, 13.0, 7.9
    band_w = w - 2 * pad - 4
    bands = {}
    for layer in LAYER_IDS:
        t = LAYERS[layer]
        n = LAYER_IDS.index(layer) + 1
        lab = f"LAYER {n} · {LAYER_NAME[layer].upper()}"
        lw_ = F.tw(lab, "xgras", 7.2, 0.12) + 10
        bh = max(15.0, F.hpara(band_w - lw_, x(BAND[layer]()), 7.6, "reg", 1.3) + 6)
        bands[layer] = (lab, lw_, bh)
    n_lines = len(ALL_LINES)
    total = head + sum(b[2] for b in bands.values()) + 3 * sub + n_lines * rh + sub + 2
    card(F, u, v, w, total, 14)
    F.clip(u, v, w, total, 14)
    F.rr(u, v, w, head, 0, fill="#FAFBFC")
    F.unclip()

    def cell(i, yy, s, role="reg", size=fs, color=INK2):
        x0, cw = xs[i]
        if SIM_COLS[i][2] == "r":
            F.text(x0 + cw - 3, yy, s, role, size, color, align="r")
        else:
            F.text(x0 + 2, yy, s, role, size, color)

    for i, (lines, _cw, _al) in enumerate(SIM_COLS):
        top = v + (head - len(lines) * 8.4) / 2 + 0.6
        for j, ln in enumerate(lines):
            cell(i, top + j * 8.4, ln, "xgras", 6.5, MUTED)
    y = v + head
    for layer in LAYER_IDS:
        t = LAYERS[layer]
        lab, lw_, bh = bands[layer]
        F.rr(u + 1, y, w - 2, bh, 0, fill=BLUE_TINT)
        F.line(u, y, u + w, y, LINE2, 1)
        F.text(u + pad + 2, y + 4.4, lab, "xgras", 7.2, BLUE, 0.12)
        F.para(u + pad + 2 + lw_, y + 3.2, band_w - lw_, x(BAND[layer]()), 7.6, "reg", INK2, 1.3)
        y += bh
        for k, line in enumerate(t["lines"]):
            if k:
                edge = line["track"] != t["lines"][k - 1]["track"]   # leads -> radar
                F.line(u + pad, y, u + w - pad, y, LINE2 if edge else LINE, 1.2 if edge else 0.7)
            fg, bg = TONE[line["tone"]]
            strong = line["tone"] in ("green", "blue")
            ty = y + (rh - fs) / 2 + 0.3
            cell(0, ty, row_id(line) + ("*" if line["partial"] else ""), "semi", fs, INK)
            label = line["status"]
            ps = 7.0
            pw_ = F.tw(label, "semi", ps) + 11
            if pw_ > xs[1][1] - 2:
                raise SystemExit(f"statut trop long pour sa colonne : {label}")
            F.rr(xs[1][0] + 1, y + (rh - 10.4) / 2, pw_, 10.4, 5.2, fill=bg)
            F.text(xs[1][0] + 1 + pw_ / 2, y + (rh - 10.4) / 2 + 2.0, label, "semi", ps, fg, align="c")
            cell(2, ty, dash(line["first"], eur_cost))
            cell(3, ty, dash(line["buyback"], eur_cost))
            cell(4, ty, dash(line["follow"], eur_cost))
            cell(5, ty, dash(line["loan"], eur_cost))
            cell(6, ty, pct(line["entry_pct"], 1) if line["n"] == 1 and line["entry_pct"] else "–")
            cell(7, ty, "–" if line["exit_pct"] is None else pct(line["exit_pct"], 1))
            cell(8, ty, "–" if line["exit_value"] is None else eur(line["exit_value"], "val"))
            cell(9, ty, eur(line["proceeds"]), "gras" if strong else "reg", fs, TONE_TEXT[line["tone"]])
            cell(10, ty, mult(line["moic"]), "gras", fs, BLUE_DK if strong else TONE_TEXT[line["tone"]])
            y += rh
        F.rr(u + 1, y, w - 2, sub, 0, fill=WARM)
        F.line(u, y, u + w, y, LINE2, 1)
        ty = y + (sub - fs) / 2 + 0.3
        cell(1, ty, f"Subtotal {LAYER_NAME[layer]}", "gras", fs, INK)
        for i, key in ((2, "first"), (3, "buyback"), (4, "follow"), (5, "loans")):
            cell(i, ty, dash(t[key], eur), "gras", fs, INK)
        for i in (6, 7, 8):
            cell(i, ty, "–", "reg", fs, SOFT)
        cell(9, ty, eur(t["proceeds"]["target"]), "gras", fs, BLUE_DK)
        cell(10, ty, mult(t["moic"]["target"]), "gras", fs, BLUE_DK)
        y += sub
    # le total du fonds
    F.clip(u, v, w, total, 14)
    F.rr(u, y, w, total - (y - v), 0, fill=BLUE_SOFT)
    F.unclip()
    F.line(u, y, u + w, y, BLUE, 1.2)
    ty = y + (sub - fs) / 2 + 1
    cell(1, ty, "Total", "xgras", fs, INK)
    tot = {k: sum(LAYERS[l][k] for l in LAYER_IDS) for k in ("first", "buyback", "follow", "loans")}
    for i, key in ((2, "first"), (3, "buyback"), (4, "follow"), (5, "loans")):
        cell(i, ty, eur(tot[key]), "xgras", fs, INK)
    for i in (6, 7, 8):
        cell(i, ty, "–", "reg", fs, SOFT)
    cell(9, ty, eur(CASES["target"]["gross_proceeds"]), "xgras", fs, BLUE_DK)
    cell(10, ty, mult(CASES["target"]["gross_moic"]), "xgras", fs, BLUE_DK)
    F.rr(u, v, w, total, 14, stroke=LINE2, lw=1)
    return total


def founder_table(F, u, v, w):
    # 07/11 : les quatre chemins, chacun dit ce qu'il leve (la note a cote)
    ids = [p["id"] for p in FOUNDERS["paths"]]
    rows = []
    for r in FOUNDERS["rows"]:
        cells = [(eur(r["exit"], "val"), "gras", INK)]
        for key, fmt in (("founders", lambda v: eur(v, "tile")), ("series_a", mult)):
            for i in ids:
                val = fmt(r[f"{key}_{i}"])
                cells.append(val if i == "vc" else (val, "gras", BLUE_DK))
        rows.append(cells)
    head = ["Exit", "Founders: VC path", "Same capital", "Half the capital", "Credit alone",
            "Series A: VC path", "Same capital", "Half the capital", "Credit alone"]
    return grid(F, u, v, w, [(0.7, "l")] + [(1, "r")] * 8, head, rows, size=8.8, hsize=6.8, pad_y=3.6)


def perf_table(F, u, v, w):
    """La table Fund performance : la colonne Target mise en avant."""
    cases = [CASES[k] for k in ("base", "target", "stress")]   # 07/11 : la cible, l'upside, le stress
    sec = SECONDARY
    rows = [
        ["Fund size"] + [FUND_SIZE] * 3,
        ["Gross proceeds, exits and loans"] + [eur(c["gross_proceeds"]) for c in cases],
        ["Net TVPI"] + [mult(c["net_tvpi"]) for c in cases],
        ["Net IRR"] + [pct(c["net_irr"]) for c in cases],
        [f"Net DPI by year {sec['year']}"] + [mult(c["dpi_year6"]) for c in cases],
        [f"Net DPI by year {sec['year'] + 1}"] + [mult(c["dpi_year7"]) for c in cases],
        ["Loans: repaid ÷ lent"] + [mult(c["loans_multiple"], 2) for c in cases],
        ["Largest exit"] + [eur(c["largest_exit"], "val") for c in cases],
    ]
    return grid(F, u, v, w, [(2.05, "l"), (1, "c"), (1, "c"), (1, "c")], ["Metric", "Target", "Upside", "Stress"],
                rows, size=8.5, hsize=6.9, pad_y=2.5, hl=1, lead=1.2)


def stress_table(F, u, v, w, height=None):
    rows = [[(s["label"], "reg", INK2 if k else INK), mult(s["net_tvpi"]), pct(s["net_irr"])]
            for k, s in enumerate(STRESS)]
    cols = [(3.0, "l"), (0.8, "c"), (0.8, "c")]
    head = ["Stress test, Target case", "Net TVPI", "Net IRR"]
    pad_y = 2.5
    if height:   # meme hauteur que la table de performance a cote
        h0 = grid(F, u, v, w, cols, head, rows, size=8.3, hsize=6.9, pad_y=pad_y, lead=1.2, draw=False)
        pad_y += max(0.0, height - h0) / (2 * len(rows))
    return grid(F, u, v, w, cols, head, rows, size=8.3, hsize=6.9, pad_y=pad_y, lead=1.2, head_pad=2.5)


def net_note():
    t, b, s = CASES["target"], CASES["base"], CASES["stress"]
    lm = DATA["loan_multiples"]
    exits = [ln["exit_year"] for ln in ALL_LINES]
    disc = sorted({ln["discount"] for ln in ALL_LINES if ln["discount"]})
    structural = max(disc)
    winners = [d for d in disc if d < structural]
    followed = [ln["id"] for ln in ALL_LINES if ln["follow"]]
    fresh = [ln["id"] for ln in LAYERS["growth"]["lines"] if ln["first"]]
    brk = [ln for ln in ALL_LINES if ln["kind"] == "breakout"]
    zombie = sorted({ln["recovery"] for ln in ALL_LINES if ln["tone"] == "grey" and ln["recovery"]})
    extra = lst([pct(round(1 - c["loan_repaid"], 2)) for c in (b, t, s)])
    ip = FUND["investment_period_years"]
    s_ = (
        f"Net = after management fees ({pct(TERMS['fee_ip_pct'])} on commitments for {ip} years, "
        f"{pct(TERMS['fee_loan_pct'])} on the loan sleeve, then {pct(TERMS['fee_post_pct'], 1)} on invested "
        "capital, loans included until repaid), fund expenses and carried interest "
        f"({pct(TERMS['carry_pct'])} over an {pct(TERMS['hurdle_pct'])} hurdle, European whole-of-fund waterfall "
        "with GP catch-up), before tax. "
        f"Investments over {ip} years, exits from year {min(exits)} to year {max(exits)}. "
        f"Target: every exit at {pct(b['exit_mult'])} of its modelled value. Upside: modelled values. "
        f"Stress: every exit at {pct(s['exit_mult'])}. "
        f"Loans priced at {pct(DATA['loan_rate'])} a year on healthy companies ({mult(lm['performing_min'], 2)}"
        f" to {mult(lm['performing_max'], 2)} by tenor, no warrants), drawn in tranches; zombies repay "
        f"{mult(lm['zombie'])}, plus {extra} further losses on every loan in the target, upside and stress cases. "
        f"Buybacks priced {pct(min(winners))}–{pct(max(winners))} below the valuation of the time on winners "
        f"and angels, {pct(structural)} below from structural sellers (end-of-life funds). "
        f"When a founder raises elsewhere, ProFund follows in new shares ({', '.join(followed)}). "
        f"{lst(fresh)} are fresh growth rounds in new shares; first cheques carry a 1× non-participating "
        "preference, outside small seed rounds. "
        + "".join(f"{ln['id']} is a block bought in {ln['company']}, counted as one company with it. " for ln in brk)
        + f"Zombies return {mult(zombie[0])} of the equity invested. "
        f"Any growth position can be topped up to {eur(FUND['company_max_with_spv'], 'tile')} with SPVs, "
        "outside the fund. Net TVPI on paid-in capital. Loan recycling not included. "
        "Targets are model outputs, not a forecast or a guarantee."
    )
    return s_


def page_four(F):
    # meme societe, meme sortie (v3)
    fm = FOUNDERS
    seed_pref = next(h["pref"] for h in fm["holders"] if h["id"] == "seed")
    a_pref = next(h["pref"] for h in fm["holders"] if h["id"] == "series_a")

    def after(rid):
        return f"{next(st['founders'] for st in fm['vc_stakes'] if st['round'] == rid) * 100:.1f}%"
    kick(F, M, 80, "The equity you don't sell is the company you keep")
    fw = 470.0
    same = next(p for p in fm["paths"] if p["id"] == "same")
    half = next(p for p in fm["paths"] if p["id"] == "half")
    fh = founder_table(F, M, 98, fw)
    F.para(M + fw + 16, 98, W - fw - 16, x(
        f"VC path, on Carta medians (not specific to Europe): {eur(seed_pref, 'tile')} seed, {eur(a_pref, 'tile')} Series A, "
        f"founders at {fm['founders'] * 100:.1f}%, then {eur(fm['vc_equity'], 'tile')} of equity with bridges and pool "
        f"refreshes: {after('B')}, {after('C')} and {after('D')} after the B, C and D. With us, same valuations and "
        f"{eur(fm['loans'], 'tile')} of loans, at {pct(fm['loan_share']['min'])} to {pct(fm['loan_share']['max'])} of the "
        f"last round (usual range: 20% to 40%), subject to partner lenders. Same capital: {eur(same['equity'], 'tile')} of "
        f"equity, founders at {same['stake'] * 100:.1f}%. Half: {eur(half['equity'], 'tile')} of equity, "
        f"{half['stake'] * 100:.1f}%. Credit alone: no further round, {fm['founders'] * 100:.1f}%. Illustrative. Sources: "
        "Carta; SaaStr; First Citizens."),
        7.6, "reg", MUTED, 1.38)
    y = 98 + fh + 12

    # la simulation ligne a ligne
    kick(F, M, y, "Fund simulation")
    title(F, M, y + 16, W, "Line-by-line entry, buybacks, loans & exit.", 15.5)
    y += 37
    y += F.para(M, y, W, x(
        "Modelled exit values (the upside), every position of the three layers. Ownership at exit is higher than at entry on every "
        "line where the founder grows with us: buybacks and cancellations lift our stake with theirs."),
        8.6, "reg", MUTED, 1.4) + 7
    y += sim_table(F, M, y, W) + 5
    sec = SECONDARY
    y += F.para(M, y, W, x(
        "Fund return at exit value, equity plus loan repayment."),
        7.3, "reg", SOFT, 1.35) + 9

    # la performance
    kick(F, M, y, "Fund performance")
    F.text(M + F.tw("FUND PERFORMANCE", "xgras", 10, 0.14) + 14, y - 0.5,
           "Target returns, built line by line. Net of fees, expenses and carry.", "semi", 9.4, INK)
    y += 18
    t, b, s = CASES["target"], CASES["base"], CASES["stress"]
    no_uni = next(x_ for x_ in STRESS if x_["id"] == "best_zombie")
    fr = DATA["fund_returner"]   # la loi 04 chiffree
    tiles = [
        (pct(b["net_irr"]), "Target net IRR", f"Upside {pct(t['net_irr'])}, stress case {pct(s['net_irr'])}"),
        (mult(b["net_tvpi"]), "Target net TVPI",
         f"Upside {mult(t['net_tvpi'])}, stress case {mult(s['net_tvpi'])}"),
        (mult(b["dpi_year7"]), f"Net DPI by year {sec['year'] + 1}",
         "Loans and Growth exits bring cash back early; the unicorn sells in year "
         + str(max(l["exit_year"] for l in LAYERS["seed"]["lines"] if l.get("company") == fr["company"]))),
        (eur(fr["fund_returning_exit"], "val"), "One company returns the fund",
         f"A {eur(fr['fund_returning_exit'], 'val')} sale of {fr['company']} returns it alone; at its modelled "
         f"{eur(t['largest_exit'], 'val')}, {mult(fr['multiple_of_fund'])}. Without it, {mult(no_uni['net_tvpi'])} net"),
    ]
    gap = 10.0
    tw_ = (W - 3 * gap) / 4
    dh = max(F.hpara(tw_ - 22, x(d), 7.6, "reg", 1.3) for _n, _l, d in tiles)
    sh = 35 + dh + 9
    for i, (num, lab, det) in enumerate(tiles):
        sx = M + i * (tw_ + gap)
        if i == 0:
            card(F, sx, y, tw_, sh, 13, fill=NIGHT, stroke=None, depth=0.6, alpha=0.03)
            F.glow(sx + tw_ - 20, y + 6, 90, BLUE, 12, 0.035, (sx, y, tw_, sh, 13))
        else:
            F.rr(sx, y, tw_, sh, 13, fill=WARM)
        wn = F.text(sx + 11, y + 9, num, "gras", 18, WHITE if i == 0 else BLUE_DK, -0.01)
        F.para(sx + 11 + wn + 8, y + 9.5, tw_ - 30 - wn, x(lab), 8.6, "semi", WHITE if i == 0 else INK, 1.2)
        F.para(sx + 11, y + 35, tw_ - 22, x(det), 7.6, "reg", NIGHT_TXT if i == 0 else MUTED, 1.3)
    y += sh + 8

    lw_ = 372.0
    ph = perf_table(F, M, y, lw_)
    sh2 = stress_table(F, M + lw_ + 12, y, W - lw_ - 12, height=ph)
    y += max(ph, sh2) + 7
    y += F.para(M, y, W, x(net_note()), 6.9, "reg", SOFT, 1.32)
    return y


def main():
    doc = Doc()
    lows = []
    for page in (page_one, page_two, page_three, page_four):
        F = doc.page()
        lows.append(page(F))
    pdf = doc.fin()
    for n, low in enumerate(lows, 1):
        spare = (FOOT_RULE - low) * PX / 72 * 25.4
        print(f"factsheet: page {n}, {spare:.1f} mm above the footer rule")
        if spare < 1.5:
            raise SystemExit(f"page {n} deborde sur le pied ({spare:.1f} mm)")
    OUT.write_bytes(pdf)
    print(f"factsheet: {OUT} ({OUT.stat().st_size} octets)")


if __name__ == "__main__":
    main()
