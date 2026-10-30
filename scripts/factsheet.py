"""Genere public/profund-factsheet.pdf — la fiche du fonds, trois pages A4.

Mise en page reprise des fiches V5 de Maximum Insurance (fiche entreprise :
https://maximum-insurance.com/entreprises) avec leur moteur de dessin
(scripts/sheet_engine.py) : Archivo, chapeaux en capitales espacees, grands
titres serres, cartes arrondies a ombre douce, tuiles d'icones en degrade,
tableau a colonne mise en avant, bande d'appel sombre avec un grand QR.
Palette ProFund (gris bleu), la meme que le site.

    page 1  la vision : titre, manifeste, quatre lois, construction du fonds
    page 2  l'avantage (deux moteurs), termes, le GP, la preuve, l'appel (QR)
    page 3  la simulation ligne a ligne et la performance du fonds

REGLE EDITORIALE : construction detaillee, tickets et rendements cibles vivent
ICI (et sur /pitch). L'accueil ne porte que la taille du fonds et renvoie ici.

CHIFFRES : tous lus dans src/data/fund.json, genere par scripts/fund_model.py
(la meme source que /pitch). Aucun chiffre du fonds ne se tape ici. Le script
refuse de produire la fiche si fund.json n'est plus a jour.

TEXTE : Archivo est embarquee, « € », « — », « × » sont permis. Un caractere
sans glyphe dans Archivo fait echouer la fiche (sheet_engine.check_glyphs).
La mention de pre-commercialisation (encadre de tete et pied) est la meme que
dans le pied de l'accueil et du popup : les changer ensemble.

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
    ARROW, BLUE, BLUE_DK, BLUE_GRAD, BLUE_SOFT, BLUE_TINT, BOTTOM, CHECK, FOOT_RULE, GLOW, GREEN, GREEN_SOFT,
    INK, INK2, LINE, LINE2, M, MUTED, NIGHT, NIGHT_LINE, NIGHT_TXT, PH, PW, PX, RED, RED_SOFT, SOFT, W, WARM,
    WHITE, Frame, x,
)

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo.png"
PHOTO = ROOT / "public" / "gp-photo-sheet.jpg"
# Vraie capture de profund.vc/dealflow (vue LP marque blanche du cockpit), pas
# une maquette. A refaire si l'ecran change.
COCKPIT = ROOT / "public" / "dealflow-cockpit.jpg"
OUT = ROOT / "public" / "profund-factsheet.pdf"
FUND_JSON = ROOT / "src" / "data" / "fund.json"

SITE = "https://profund.vc"
DEALFLOW = "https://profund.vc/#dealflow"      # ce hash ouvre le popup d'abonnement de l'accueil
MAIL = "alexandre@profund.vc"
PHONE = "+33 6 83 10 72 86"
PAGES = 3
MONTHS = ("January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December")

# Les societes que le GP opere avec ses agents, hors du fonds (detenues a 100 %).
# Memes accroches que l'accueil (src/components/HomepageLite.tsx). Maximum
# Insurance n'existe qu'en SVG cote site : reportlab ne lit pas le SVG, d'ou sa
# version PNG dans scripts/assets/.
PORTFOLIO = (
    ("Proplace", "Autonomous AI operating system for corporate development & M&A.",
     ROOT / "public" / "portfolio-proplace.png", "https://proplace.co"),
    ("Maximum Insurance", "Travel Insurtech.",
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
LAYER_IDS = ("seed", "venture", "growth")
CASE_IDS = ("target", "base", "stress")


# ── formats (meme logique que src/lib/fund.ts) ──────────────────────────────
def eur(v, mode="table"):
    """table : €750K / €27.6M ; val : €45M / €1.5B ; tile : €100M."""
    if v == 0:
        return "€0"
    if mode == "val":
        if v >= 1e9:
            return f"€{v / 1e9:.1f}B"
        if v >= 1e7:
            return f"€{v / 1e6:.0f}M"
    if mode == "tile" and v >= 1e6 and v % 1_000_000 == 0:
        return f"€{v // 1_000_000}M"
    if v < 1e6:
        return f"€{v / 1e3:.0f}K"
    return f"€{v / 1e6:.1f}M"


def rng(a, b):
    """€150K–€1.5M"""
    return f"{eur(a, 'tile')}–{eur(b, 'tile')}"


def mult(v):
    return f"{v:.1f}×"


def pct(v, dp=0):
    return f"{v * 100:.{dp}f}%"


def row_id(line):
    """S-01 ; S-07–09 pour trois societes ; V-05/06 pour deux (src/lib/fund.ts, rowId)."""
    if line["n"] == 1:
        return line["id"]
    prefix, num = line["id"].split("-")
    last = str(int(num) + line["n"] - 1).zfill(len(num))
    return f"{line['id']}/{last}" if line["n"] == 2 else f"{prefix}-{num}–{last}"


# Libelle et ton du statut d'une ligne (src/lib/fund.ts, outcomeTag).
def outcome_tag(line):
    n, co = line["n"], line["company"]
    return {
        "fund_returner": ("Fund returner", "green"), "breakout": ("Breakout", "green"),
        "strategic_exit": ("Strategic exit", "blue"), "early_exit": ("Early exit (M&A)", "blue"),
        "zombie": (f"Zombies (×{n})", "grey"), "loss": (f"Losses (×{n})", "red"),
        "anchor": ("Anchor", "green"), "strategic_win": ("Strategic win", "blue"),
        "base_hit": ("Base hit", "grey"), "breakout_follow_on": (f"Breakout ({co})", "green"),
        "pro_rata": (f"Pro-rata ({co})", "blue"), "external_growth": ("Direct growth entry", "blue"),
        "downside_protected": ("Downside, preference", "grey"),
    }[line["outcome"]]


TONE = {"green": (GREEN, GREEN_SOFT), "blue": (BLUE_DK, BLUE_SOFT), "grey": (MUTED, WARM), "red": (RED, RED_SOFT)}
# couleur du « Fund return » (ProFundPage.tsx, TONE_COLOR)
TONE_TEXT = {"green": BLUE_DK, "blue": BLUE_DK, "grey": MUTED, "red": RED}
FUND_SIZE = eur(FUND["commitments"], "tile")


# ── le document ─────────────────────────────────────────────────────────────
class Doc:
    def __init__(self):
        self.buf = io.BytesIO()
        self.c = canvas.Canvas(self.buf, pagesize=(PW * PX, PH * PX), pageCompression=1)
        self.c.setTitle("ProFund — Fund Fact Sheet")
        self.c.setAuthor("ProFund")
        self.c.setSubject(f"Venture capital, seed to growth — {FUND_SIZE} target Fund I — "
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
        F = self.F
        lh = 25.0
        lw = lh * 351 / 93
        F.image(LOGO, M, 21, lw, lh)
        F.link(M, 18, lw, lh + 6, SITE)
        wn = F.text(M + W, 30, f"{self.num} / {PAGES}", "xgras", 11, BLUE_DK, align="r")
        F.text(M + W - wn - 14, 30, "Fact sheet", "semi", 11, MUTED, align="r")
        F.line(M, 60, M + W, 60, LINE2, 1)

    def _footer(self):
        F = self.F
        F.line(M, FOOT_RULE, M + W, FOOT_RULE, LINE2, 1)
        year, month, _ = DATA["model_date"].split("-")
        legal = ("EuVECA pre-marketing communication, eligible investors only. Not an offer to subscribe. "
                 f"Contact: {MAIL}")
        F.para(M, 1062, W - 180, x(legal), 7.6, "reg", SOFT, 1.5)
        # version et date : trace de ce qui a ete envoye a qui (regle des 18 mois)
        F.text(M, 1077, f"Fact sheet {DATA['version']} · {MONTHS[int(month) - 1]} {year}", "semi", 7.6, SOFT)
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


def browser(F, u, v, w, url="profund.vc/dealflow"):
    """La capture du cockpit dans un cadre de navigateur ; rend la hauteur."""
    ih = w * 900 / 1600
    F.shadow(u, v, w, ih + 26, 14, 0.8, 0.025)
    F.rr(u, v, w, ih + 26, 14, fill="#EEF0F3", stroke=LINE2, lw=1)
    for j, col in enumerate(("#E0664B", "#DC9A2C", "#58B17A")):
        F.circle(u + 14 + j * 11, v + 13, 3.6, fill=col)
    F.rr(u + 56, v + 6, w - 112, 14, 7, fill=WHITE)
    F.text(u + w / 2, v + 9, url, "reg", 7.8, MUTED, align="c")
    F.clip(u + 1, v + 1, w - 2, ih + 24, 13)
    F.image(COCKPIT, u + 1, v + 26, w - 2, ih - 1)
    F.unclip()
    F.link(u, v, w, ih + 26, DEALFLOW)
    return ih + 26


def fund_card(F, xx, yy, w, rot=-6.0):
    """La carte « ProFund · Fund I » : la carte Pass des fiches Maximum, en bleu nuit.
    Repere local : 100 unites = la largeur de la carte."""
    hl = 100 / 1.586
    with Frame(F.c, xx, yy, k=w / 100.0, rot=rot, w=100, h=hl, parent=F) as C:
        for i in range(8):
            sp, dy = 0.8 + i * 1.25, 1.6 + i * 1.15
            C.rr(-sp / 2, dy - sp / 2, 100 + sp, hl + sp, 4.74 + sp / 2, fill=INK, alpha=0.035)
        r = 4.74
        C.grad(0, 0, 100, hl, r, [("#6F88A5", 0.0), ("#4A6080", 0.5), ("#26344A", 1.0)], 135)
        C.glow(88, 6, 46, "#9FB6CF", 12, 0.035, (0, 0, 100, hl, r))
        # le reflet (bande blanche diagonale)
        C.clip(0, 0, 100, hl, r)
        c = C.c
        for j in range(10):
            t = 0.30 + j * 0.03
            peak = 1 - abs(t + 0.015 - 0.45) / 0.15
            c.saveState()
            c.setFillColorRGB(1, 1, 1)
            c.setFillAlpha(max(0.0, 0.16 * peak))
            pth = c.beginPath()
            pts = [(t * 160 - 30, -5), ((t + 0.03) * 160 - 30, -5), ((t + 0.03) * 160 - 60, hl + 5), (t * 160 - 60, hl + 5)]
            pth.moveTo(*C.pt(*pts[0]))
            for pu, pv in pts[1:]:
                pth.lineTo(*C.pt(pu, pv))
            pth.close()
            c.drawPath(pth, stroke=0, fill=1)
            c.restoreState()
        C.unclip()
        u = 5.6
        u += C.text(u, 5.2, "PROFUND", "xgras", 4.4, WHITE, 0.02) + 1.6
        C.text(u, 5.2, "FUND I", "xgras", 4.4, GLOW, 0.02)
        C.text(5.6, 11.2, "SEED · VENTURE · GROWTH", "semi", 2.3, WHITE, 0.1, alpha=0.82)
        C.text(100 - 5.6, 5.6, "EUVECA · LUXEMBOURG", "xgras", 2.2, WHITE, 0.08, "r", alpha=0.85)
        C.text(100 - 5.6, 9.0, f"CLOSED-ENDED · {FUND['term_years']} YEARS", "semi", 2.2, WHITE, 0.08, "r", alpha=0.7)
        # la puce
        C.grad(5.6, 22, 10.5, 7.6, 1.6, [("#E7EAEE", 0.0), ("#B9C0C9", 1.0)], 135)
        C.rr(5.6 + 2.1, 22 + 1.58, 10.5 - 4.2, 7.6 - 3.16, 0.7, stroke="#8E97A3", lw=0.22)
        C.text(5.6, hl - 21.5, FUND_SIZE, "gras", 11.5, WHITE, -0.01)
        C.text(5.6, hl - 8.4, "TARGET FUND SIZE", "semi", 2.4, WHITE, 0.1, alpha=0.75)
        q = 21.5
        qu, qv = 100 - 4.2 - q, hl - 4.2 - q
        C.rr(qu, qv, q, q, 2.4, fill=WHITE)
        C.qr(DEALFLOW, qu + 1.4, qv + 1.4, q - 2.8, quiet=0)
        C.link(qu, qv, q, q, DEALFLOW)
    return hl * w / 100


# ── page 1 : la vision ──────────────────────────────────────────────────────
LAWS = (
    ("crown", "Sovereign Architects, Not Managers",
     "We back obsessive, highly technical visionaries from Day 1. Founders who don't build org charts, but "
     "iterate directly with AI until the machine mirrors their exact ambition."),
    ("loop", "Self-Improving Systems",
     "We look for closed-loop architectures. Products that don't just automate a task, but compound in "
     "intelligence, precision, and autonomy with every single run."),
    ("globe", "Colossal Utility. Minimum Headcount.",
     "No gimmicks. We invest in integral systems solving massive, painful problems in the world's largest "
     "markets—operated with near-zero marginal labor."),
    ("trend", "Fund-Returning Physics",
     "We enter at Pre-Seed/Seed and double down at the exact inflection point. Every check we write backs a "
     f"company built to dominate its category globally and return our entire {FUND_SIZE} fund."),
)


def tier_rows(layer):
    t = LAYERS[layer]
    moic = f"{mult(t['moic']['target'])} MOIC"
    entry = rng(t["entry_post_min"], t["entry_post_max"])
    if layer == "seed":
        return [("STAGE", "Pre-seed / seed"), ("ROLE", "Lead or co-lead"), ("ENTRY POST", entry),
                ("COMPANIES", str(t["companies"])), ("INVESTED", eur(t["invested"])),
                ("TARGET GROSS", moic)]
    if layer == "venture":
        return [("STAGE", "Seed+ / Series A"), ("ROLE", "Direct, at the inflection"), ("ENTRY POST", entry),
                ("COMPANIES", f"{t['companies']} direct entries"), ("INVESTED", eur(t["invested"])),
                ("TARGET GROSS", moic)]
    follow = t["positions"] - t["companies"]
    return [("STAGE", "Series B and beyond"), ("ROLE", "Direct + our breakouts"), ("ENTRY POST", entry),
            ("POSITIONS", f"{t['companies']} direct + {follow} follow-ons"), ("INVESTED", eur(t["invested"])),
            ("TARGET GROSS", moic)]


def tier_card(F, u, v, w, h, layer, n):
    t = LAYERS[layer]
    card(F, u, v, w, h)
    pad = 15.0
    F.rr(u + pad, v + pad, 26, 26, 8, fill=BLUE_SOFT)
    F.text(u + pad + 13, v + pad + 6.6, str(n), "gras", 12, BLUE_DK, align="c")
    F.text(u + pad + 36, v + pad + 1.5, f"LAYER {n}", "xgras", 8.2, BLUE, 0.12)
    F.text(u + pad + 36, v + pad + 12.5, layer.capitalize(), "gras", 12.5, INK)
    if layer == "growth":
        big = rng(t["ticket_min"], FUND["company_cap"])
        cap = f"from the fund, up to {eur(FUND['company_max_with_spv'], 'tile')} with SPVs"
    else:
        big = rng(t["ticket_min"], t["ticket_max"])
        cap = "initial ticket, pro-rata reserved"
    F.text(u + pad, v + 50, big, "gras", 18, INK, -0.01)
    F.text(u + pad, v + 72, cap, "reg", 8.6, MUTED)
    ry = v + 91
    rows = tier_rows(layer)
    for i, (label, value) in enumerate(rows):
        F.line(u + pad, ry - 5, u + w - pad, ry - 5, LINE, 1)
        F.text(u + pad, ry + 0.8, label, "xgras", 7, SOFT, 0.08)
        F.text(u + w - pad, ry, value, "semi", 9.2, INK, align="r")
        if F.tw(label, "xgras", 7, 0.08) + F.tw(value, "semi", 9.2) > w - 2 * pad - 8:
            raise SystemExit(f"carte {layer} : ligne trop longue : {label} {value}")
        ry += 14.6
    if ry - 2 > v + h:
        raise SystemExit(f"carte {layer} : le contenu depasse la carte")


def page_one(F):
    kick(F, M, 84, "Venture capital · Seed to Growth · Europe")
    tw = 360.0
    y = 102 + title(F, M, 102, tw, "", 37, lead=1.04,
                    markup=f'{x("Pure Vision.")}<br/><font color="{BLUE}">{x("Autonomous Scale.")}</font>')
    y += 12 + F.para(M, y + 12, tw, x(f"Seed to Growth. {FUND_SIZE} for the architects turning AI into "
                                      "self-improving systems."), 12.2, "reg", INK2, 1.5)
    y += 6 + F.para(M, y + 6, tw, x("Stop managing armies. Start directing intelligence."), 12.2, "gras", INK, 1.4)
    y += 12 + micro(F, M, y + 14, tw, ["One GP, zero analysts", "Two autonomous engines", "EuVECA fund, Luxembourg"])

    # le visuel : la capture du cockpit, la carte du fonds posee devant
    vw = 262.0
    vx = M + W - vw
    bh = browser(F, vx, 82, vw)
    fund_card(F, vx - 54, 82 + bh - 67, 172, rot=-7)
    y = max(y, 82 + bh + 46)

    # l'encadre de pre-commercialisation, en tete de document
    y += 14
    bh2 = 58.0
    F.rr(M, y, W, bh2, 14, fill=BLUE_TINT, stroke="#DCE3EC", lw=1)
    F.rr(M + 14, y + 14, 30, 30, 9, fill=BLUE_SOFT)
    F.icon("shield", M + 20, y + 20, 18, BLUE_DK)
    F.text(M + 56, y + 12, "PRE-MARKETING PHASE", "xgras", 8.4, BLUE_DK, 0.12)
    F.para(M + 56, y + 25, W - 72, x(
        "This document is a pre-marketing communication within the meaning of Article 4a of Regulation (EU) "
        "No 345/2013 (EuVECA). The fund is not yet established and no units may be subscribed at this stage. "
        "For professional and eligible investors only."), 9, "reg", INK2, 1.4)
    y += bh2 + 22

    # le manifeste
    lw = 214.0
    kick(F, M, y, "The manifesto")
    title(F, M, y + 18, lw, "The end of human friction.", 21, lead=1.1)
    rx = M + lw + 26
    rw = W - lw - 26
    h1 = F.para(rx, y + 2, rw, x("For two centuries, scaling a company meant scaling human labor—hiring thousands "
                                 "of people to execute the vision of one. That era is over."), 11.2, "semi", INK, 1.45)
    h2 = F.para(rx, y + 2 + h1 + 7, rw, x(
        "Today, a single visionary who knows how to challenge, direct, and iterate with AI can architect an "
        "integral, self-improving system in record time. AI frees humanity from mechanical execution, "
        "returning creation to pure thought. We don't fund headcount. We back sovereign founders building "
        "autonomous giants with colossal real-world utility."), 9.8, "reg", MUTED, 1.45)
    y += max(2 + h1 + 7 + h2, 70) + 20

    # les quatre lois
    kick(F, M, y, "What we back")
    title(F, M, y + 17, W, "Four laws drive our thesis—and our Deal Engine every morning.", 18)
    y += 46
    gap = 12.0
    cw = (W - 3 * gap) / 4
    pad = 13.0
    hs = [pad + 28 + 10 + F.hpara(cw - 2 * pad, x(t), 11, "gras", 1.2) + 5
          + F.hpara(cw - 2 * pad, x(d), 8.9, "reg", 1.42) + pad for _i, t, d in LAWS]
    th = max(hs)
    for i, (ic, t, d) in enumerate(LAWS):
        cx = M + i * (cw + gap)
        card(F, cx, y, cw, th)
        F.tile(cx + pad, y + pad, 28, 9)
        F.icon(ic, cx + pad + 6, y + pad + 6, 16, WHITE, sw=1.8)
        F.text(cx + cw - pad, y + pad + 1, f"{i + 1:02d}", "xgras", 10, SOFT, 0.06, "r")
        ht = F.para(cx + pad, y + pad + 38, cw - 2 * pad, x(t), 11, "gras", INK, 1.2)
        F.para(cx + pad, y + pad + 38 + ht + 5, cw - 2 * pad, x(d), 8.9, "reg", MUTED, 1.42)
    y += th + 20

    # la construction : Seed + Venture + Growth = le fonds
    kick(F, M, y, "Fund construction")
    F.text(M + W, y, "Two ways in at every layer: direct entries in top rounds, and our own breakouts.",
           "reg", 9.8, MUTED, align="r")
    y += 22
    opw = 22.0
    tcw = (W - 2 * opw) / 3
    tch = 178.0
    for i, layer in enumerate(LAYER_IDS):
        tier_card(F, M + i * (tcw + opw), y, tcw, tch, layer, i + 1)
    for i in range(2):
        F.text(M + tcw * (i + 1) + opw * i + opw / 2, y + tch / 2 - 13, "+", "reg", 22, SOFT, align="c")
    y += tch + 12

    # = le fonds : bande sombre, quatre chiffres (l'ancienne bande de chiffres)
    seed = LAYERS["seed"]
    stats = [
        (FUND_SIZE, f"Target Fund I, closed-ended, closings over {FUND['closing_months']} months"),
        ("3 layers", f"Seed, Venture, Growth: {eur(seed['ticket_min'])} to "
                     f"{eur(FUND['company_max_with_spv'], 'tile')} per company"),
        ("Every", "European seed round tracked by the Seed Radar, weekly"),
        ("6–18mo", "Detection lead before announcement"),
    ]
    bh3 = 68.0
    card(F, M, y, W, bh3, 18, fill=NIGHT, stroke=None, depth=0.8, alpha=0.03)
    F.glow(M + W - 60, y + 6, 160, BLUE, 16, 0.03, (M, y, W, bh3, 18))
    eq = 46.0
    F.text(M + eq / 2 + 6, y + bh3 / 2 - 15, "=", "reg", 26, GLOW, align="c")
    colw = (W - eq - 10) / 4
    for i, (num, lab) in enumerate(stats):
        sx = M + eq + 10 + i * colw
        if i:
            F.line(sx - 10, y + 16, sx - 10, y + bh3 - 16, NIGHT_LINE, 1)
        F.text(sx, y + 13, num, "gras", 19 if i == 0 else 17, WHITE, -0.01)
        F.para(sx, y + 38, colw - 22, x(lab), 8.4, "reg", NIGHT_TXT, 1.3)
    return y + bh3


# ── page 2 : l'avantage, les termes, le GP, la preuve ───────────────────────
KV_PAD, KV_ROW = 15.0, 17.0


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
        F.text(u + pad, ry + 3.9, k, "semi" if last else "reg", 9.6, INK if last else INK2)
        F.text(u + w - pad, ry + 3.9, val, "gras", 9.6, INK, align="r")
        if F.tw(k, "reg", 9.6) + F.tw(val, "gras", 9.6) > w - 2 * pad - 10:
            raise SystemExit(f"carte {head} : ligne trop longue : {k} {val}")
        ry += rh
    return h


def page_two(F):
    kick(F, M, 84, "Our edge")
    title(F, M, 102, W, "One GP. Zero Analysts. Two Autonomous Engines.", 27)
    F.para(M, 136, W, x("We run on what we back."), 11.6, "reg", MUTED, 1.5)

    # les deux moteurs, cote a cote (la capture du cockpit est dans le heros, page 1)
    y = 164.0
    engines = (
        ("radar", "The Deal Engine",
         "Reads every European seed round, key engineering move, and product launch in real time. It scores "
         "every founder against our thesis and flags inflection points before they become consensus."),
        ("bot", "The Growth Engine",
         "Autonomous AI agents running content, inbound, and outbound end-to-end. They operate our fund and the "
         "GP's companies today—and plug directly into the founders we back tomorrow."),
    )
    gap = 16.0
    ew = (W - gap) / 2
    pad = 16.0
    eh = pad + 30 + 12 + max(F.hpara(ew - 2 * pad, x(t), 9.8, "reg", 1.48) for _i, _n, t in engines) + 12 + 22 + pad
    for i, (ic, name, text) in enumerate(engines):
        ex = M + i * (ew + gap)
        card(F, ex, y, ew, eh)
        F.tile(ex + pad, y + pad, 30, 9)
        F.icon(ic, ex + pad + 6.5, y + pad + 6.5, 17, WHITE)
        F.text(ex + pad + 42, y + pad + 7, name, "gras", 14, INK)
        F.para(ex + pad, y + pad + 42, ew - 2 * pad, x(text), 9.8, "reg", MUTED, 1.48)
        fy = y + eh - pad - 20
        F.line(ex + pad, fy - 8, ex + ew - pad, fy - 8, LINE, 1)
        if i == 0:
            # le lien du deal flow en direct
            F.circle(ex + pad + 4, fy + 9, 6, fill=GREEN, alpha=0.18)
            F.circle(ex + pad + 4, fy + 9, 3.2, fill=GREEN)
            wl = F.text(ex + pad + 16, fy + 3, "Follow live deal flow", "semi", 10.2, BLUE_DK)
            F.svg(ARROW, ex + pad + 16 + wl + 5, fy + 3.5, 12, BLUE_DK)
            F.link(ex + pad - 2, fy, wl + 40, 20, DEALFLOW)
        else:
            # qui tourne sur ce moteur (les « Powers » de l'ancienne fiche)
            cx_ = ex + pad + F.text(ex + pad, fy + 4, "POWERS", "xgras", 7.4, SOFT, 0.1) + 8
            for name_ in ("ProFund", "Proplace", "Maximum Insurance", "Sosuites"):
                pf = name_ == "ProFund"
                cw_ = F.tw(name_, "semi", 8.6) + 16
                F.rr(cx_, fy + 1, cw_, 17, 8.5, fill=BLUE_SOFT if pf else WARM)
                F.text(cx_ + cw_ / 2, fy + 5, name_, "semi", 8.6, BLUE_DK if pf else INK2, align="c")
                cx_ += cw_ + 5
    y += eh + 22

    # termes | allocation
    half = (W - 16) / 2
    growth = LAYERS["growth"]
    seed = LAYERS["seed"]
    terms = [
        ("Closed-ended EuVECA fund (Lux.)", f"{FUND['term_years']} years"),
        ("Successive closings", f"{FUND['closing_months']} months"),
        (f"Management fee, years 1–{FUND['investment_period_years']}", pct(TERMS["fee_ip_pct"])),
        ("Then, on invested capital", pct(TERMS["fee_post_pct"], 1)),
        ("Carried interest, European", pct(TERMS["carry_pct"])),
        ("Hurdle, with GP catch-up", pct(TERMS["hurdle_pct"])),
        ("Per company: fund / with SPVs",
         f"{eur(FUND['company_cap'], 'tile')} / {eur(FUND['company_max_with_spv'], 'tile')}"),
    ]
    alloc = [
        (f"Seed – {seed['companies']} companies", eur(ALLOC["seed"])),
        (f"Venture – {LAYERS['venture']['companies']} companies", eur(ALLOC["venture"])),
        (f"Growth – {growth['companies']} direct + {growth['positions'] - growth['companies']} follow-ons",
         eur(ALLOC["growth"])),
        (f"Invested ({pct(ALLOC['follow_on_pct'])} in follow-ons)", eur(ALLOC["invested"])),
        ("Management fees", eur(ALLOC["mgmt_fees"])),
        ("Fund expenses, incl. set-up", eur(ALLOC["fund_expenses"])),
        ("Contingency", eur(ALLOC["contingency"])),
        ("Total commitments", eur(ALLOC["total"])),
    ]
    kh = max(kv_height(terms), kv_height(alloc))
    kv_card(F, M, y, half, "Key terms", "building", terms, h=kh)
    kv_card(F, M + half + 16, y, half, "Capital allocation", "layers", alloc, bold_last=True, h=kh)
    y += kh + 22

    # le GP | le track record
    kick(F, M, y, "The GP")
    kick(F, M + half + 16, y, "Track record, prior to the fund")
    y += 20
    # Memes faits que le tableau Track Record de /pitch (ProFundPage.tsx) ; seul
    # Deal-04 porte en plus la croissance depuis l'acquisition (05/10), et SANS
    # multiple : un 2.5x cash-on-cash n'a pas de sens pour une acquisition a
    # 100 % toujours detenue (decision d'Antoine, 05/10).
    deals = (
        ("Deal-01 – exited 2007", "Entry 2006, 100% owned. Full exit in 2007.", "10.0×"),
        ("Deal-02 – exited 2014", "Entry 2008 at 100%. Sold down to 40%, then full exit in 2014.", "20.0×"),
        ("Deal-03 – LBO exit 2025",
         "Seed ticket €200K at €5.3M in 2014. LBO exit in Feb 2025 at €100M. "
         "Sourced 14 months before public announcement.", "19.0×"),
        ("Deal-04 – acquired 2016",
         "100% acquisition, €45M buyout. Revenue growing ~20% YoY since acquisition.", ""),
    )
    track_h = 13 + sum(12.5 + F.hpara(half - 28, x(d), 8.4, "reg", 1.3) + 5.5 for _h, d, _v in deals) + 12
    gh = max(146.0, track_h)
    card(F, M, y, half, gh)
    pw_ = 104.0
    ph_ = pw_ * 468 / 429
    F.image(PHOTO, M + 14, y + 14, pw_, ph_, 12)
    tx = M + 14 + pw_ + 16
    F.text(tx, y + 18, "Alexandre Busson", "gras", 14, INK)
    F.text(tx, y + 37, "Founding Partner", "reg", 9.6, MUTED)
    yy = y + 58
    # Memes intitules que /pitch (ProFundPage.tsx, GP) - confirmes par Alexandre le 29/10.
    for role in (
        "M&A Director, Leboncoin",
        "Senior Associate, Partech Ventures",
        "LBO Analyst, Ardian (ex-AXA PE)",
        "Key Account Manager assistant, Google",
        "Founder / Investor, Dreamzer Games",
        "Owner and CEO, Fadparis.com",
    ):
        F.circle(tx + 2.5, yy + 5.6, 1.8, fill=BLUE)
        F.text(tx + 10, yy, role, "reg", 9.2, INK2)
        yy += 13.4
    if max(yy, y + 14 + ph_) > y + gh:
        raise SystemExit("carte du GP : le contenu depasse la carte")

    tx = M + half + 16
    card(F, tx, y, half, gh)
    ty = y + 13
    for i, (head, detail, val) in enumerate(deals):
        if i:
            F.line(tx + 14, ty - 5, tx + half - 14, ty - 5, LINE, 1)
        F.text(tx + 14, ty, head, "semi", 9.8, INK)
        if val:
            F.text(tx + half - 14, ty, val, "gras", 9.8, BLUE_DK, align="r")
        ty += 12.5 + F.para(tx + 14, ty + 12.5, half - 28, x(detail), 8.4, "reg", MUTED, 1.3) + 5.5
    F.text(tx + 14, ty - 1, "Companies anonymised. Names and references on request.", "reg", 7.8, SOFT)
    if ty + 10 > y + gh:
        raise SystemExit("carte du track record : le contenu depasse la carte")
    y += gh + 22

    # la preuve : les societes operees par le GP
    kick(F, M, y, "Proof of work")
    title(F, M, y + 17, W, "We live what we back.", 18)
    note = "Outside the fund, 100% owned by the GP"
    nw = F.tw(note, "semi", 8.8) + 22
    F.rr(M + W - nw, y + 18, nw, 20, 10, fill=BLUE_SOFT)
    F.text(M + W - nw / 2, y + 23, note, "semi", 8.8, BLUE_DK, align="c")
    y += 44
    y += F.para(M, y, W, x("Before funding autonomous companies, we built our own. The companies below are "
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
    y += pch + 14
    return cta(F, y)


def cta(F, ymin):
    """« Follow our deal flow live » : trois gestes, un grand QR (bande sombre des fiches Maximum)."""
    actions = (
        ("radar", "Follow live deal flow", ("Every evening, the companies we reviewed",), DEALFLOW),
        ("mail", "Request LP access", (MAIL, PHONE), "mailto:" + MAIL),
        ("sheet", "Fund model (Excel)", ("On request",), "mailto:" + MAIL + "?subject=ProFund%20fund%20model"),
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
    F.text(M + pad, v + 22, "Follow our deal flow live", "gras", 20, WHITE, -0.01)
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


# ── page 3 : la simulation et la performance ────────────────────────────────
SIM_COLS = (  # (titre, largeur relative, alignement)
    (("DEAL ID",), 52, "l"), (("STATUS",), 116, "l"), (("INITIAL", "TICKET"), 56, "r"),
    (("ENTRY VAL", "(POST)"), 62, "r"), (("ENTRY %",), 50, "r"), (("FOLLOW-ON",), 62, "r"),
    (("EXIT %", "(DILUTED)"), 58, "r"), (("EXIT VAL",), 56, "r"), (("FUND", "RETURN"), 62, "r"),
    (("MOIC",), 44, "r"),
)
SIM_TITLE = {"seed": ("Layer 1", "The Seed Layer", "companies"), "venture": ("Layer 2", "The Venture Layer", "companies"),
             "growth": ("Layer 3", "The Growth Layer", "positions")}


def sim_table(F, u, v, w):
    pad = 12.0
    scale = (w - 2 * pad) / sum(c[1] for c in SIM_COLS)
    xs, cx = [], u + pad
    for _t, cw, _a in SIM_COLS:
        xs.append((cx, cw * scale))
        cx += cw * scale
    head, band, rh, sub = 32.0, 24.0, 17.6, 20.0
    n_lines = sum(len(LAYERS[k]["lines"]) for k in LAYER_IDS)
    total = head + 3 * (band + sub) + n_lines * rh + 4
    card(F, u, v, w, total)
    F.clip(u, v, w, total, 16)
    F.rr(u, v, w, head, 0, fill="#FAFBFC")
    F.unclip()
    F.rr(u, v, w, total, 16, stroke=LINE2, lw=1)

    def cell(i, yy, s, role="reg", size=8.8, color=INK2):
        x0, cw = xs[i]
        al = SIM_COLS[i][2]
        if al == "r":
            F.text(x0 + cw - 6, yy, s, role, size, color, align="r")
        else:
            F.text(x0 + 2, yy, s, role, size, color)

    for i, (lines, _cw, _al) in enumerate(SIM_COLS):
        top = v + (head - len(lines) * 9.4) / 2 + 0.6
        for j, ln in enumerate(lines):
            cell(i, top + j * 9.4, ln, "xgras", 7.1, MUTED)
    y = v + head
    secondary = set(SECONDARY["companies"])
    for n, layer in enumerate(LAYER_IDS):
        t = LAYERS[layer]
        tag, name, unit = SIM_TITLE[layer]
        count = t["positions"] if layer == "growth" else t["companies"]
        F.rr(u + 1, y, w - 2, band, 0, fill=BLUE_TINT)
        F.line(u, y, u + w, y, LINE, 1)
        wt = F.text(u + pad + 2, y + 8.2, tag.upper(), "xgras", 7.6, BLUE, 0.12)
        F.text(u + pad + 2 + wt + 10, y + 6.4, f"{name} · {count} {unit.capitalize()}", "gras", 10, INK)
        y += band
        for k, line in enumerate(t["lines"]):
            if k:
                F.line(u + pad, y, u + w - pad, y, LINE, 0.8)
            label, tone = outcome_tag(line)
            fg, bg = TONE[tone]
            strong = tone in ("green", "blue")
            ty = y + (rh - 8.8) / 2 + 0.4
            cell(0, ty, row_id(line) + ("*" if line["company"] in secondary else ""), "semi", 8.8, INK)
            pw_ = F.tw(label, "semi", 7.6) + 14
            F.rr(xs[1][0] + 1, y + (rh - 13) / 2, pw_, 13, 6.5, fill=bg)
            F.text(xs[1][0] + 1 + pw_ / 2, y + (rh - 13) / 2 + 2.8, label, "semi", 7.6, fg, align="c")
            cell(2, ty, eur(line["initial"]))
            cell(3, ty, eur(line["entry_post"], "val"))
            cell(4, ty, pct(line["entry_pct"], 1))
            cell(5, ty, eur(line["follow_on"]))
            cell(6, ty, "—" if line["exit_pct"] is None else pct(line["exit_pct"], 1))
            cell(7, ty, "—" if line["exit_value"] is None else eur(line["exit_value"], "val"))
            cell(8, ty, eur(line["proceeds"]), "gras" if strong else "reg", 8.8, TONE_TEXT[tone])
            cell(9, ty, mult(line["moic"]), "gras", 8.8, BLUE_DK if strong else TONE_TEXT[tone])
            y += rh
        F.rr(u + 1, y, w - 2, sub, 0, fill=WARM)
        F.line(u, y, u + w, y, LINE2, 1)
        ty = y + (sub - 8.8) / 2 + 0.4
        cell(0, ty, "SUB", "gras", 8.8, INK)
        cell(1, ty, f"({layer.capitalize()})", "gras", 8.8, INK)
        cell(2, ty, eur(t["initial"]), "gras", 8.8, INK)
        for i in (3, 4, 6, 7):
            cell(i, ty, "—", "reg", 8.8, SOFT)
        cell(5, ty, eur(t["follow_on"]), "gras", 8.8, INK)
        cell(8, ty, eur(t["proceeds"]["target"]), "gras", 8.8, BLUE_DK)
        cell(9, ty, mult(t["moic"]["target"]), "gras", 8.8, BLUE_DK)
        y += sub
        if n < 2:
            F.line(u, y, u + w, y, LINE2, 1)
    return total


def perf_table(F, u, v, w):
    """La table Fund Performance de /pitch : la colonne Target mise en avant."""
    cases = [CASES[k] for k in CASE_IDS]
    c1 = w * 0.43
    cw = (w - c1) / 3
    head, rh = 34.0, 20.5
    rows = [
        ("Fund size", [FUND_SIZE] * 3),
        ("Gross exit value", [eur(c["gross_exits"], "tile") for c in cases]),
        (f"Year-{SECONDARY['year']} secondary discount", [f"−{eur(c['secondary_discount'])}" for c in cases]),
        ("Net TVPI", [mult(c["net_tvpi"]) for c in cases]),
        ("Net IRR", [pct(c["net_irr"]) for c in cases]),
        (f"Net DPI by year {SECONDARY['year']}", [mult(c["dpi_year6"]) for c in cases]),
    ] + [(f"Gross MOIC · {k.capitalize()}", [mult(LAYERS[k]["moic"][c]) for c in CASE_IDS]) for k in LAYER_IDS]
    total = head + rh * len(rows)
    card(F, u, v, w, total)
    F.clip(u, v, w, total, 16)
    F.rr(u + c1, v, cw, total, 0, fill=BLUE_TINT)
    F.rr(u, v, c1, head, 0, fill="#FAFBFC")
    F.rr(u + c1 + cw, v, 2 * cw, head, 0, fill="#FAFBFC")
    F.rr(u + c1, v, cw, head, 0, fill=BLUE_SOFT)
    F.rr(u + c1, v, cw, 3, 0, fill=BLUE)
    F.unclip()
    F.rr(u, v, w, total, 16, stroke=LINE2, lw=1)
    F.text(u + 14, v + 13, "METRIC", "xgras", 7.6, MUTED, 0.1)
    for j, name in enumerate(("Target", "Base", "Stress")):
        F.text(u + c1 + cw * j + cw / 2, v + 12, name, "gras", 10.6, BLUE_DK if j == 0 else INK, align="c")
    y = v + head
    for lab, vals in rows:
        F.line(u, y, u + w, y, LINE, 1)
        F.text(u + 14, y + 5.6, lab, "semi", 9.4, INK)
        for j, val in enumerate(vals):
            F.text(u + c1 + cw * j + cw / 2, y + 5.6, val, "gras" if j == 0 else "semi", 9.6,
                   BLUE_DK if j == 0 else INK2, align="c")
        y += rh
    return total


def page_three(F):
    kick(F, M, 84, "Fund simulation")
    title(F, M, 102, W, "Line-by-line entry, follow-on & exit.", 25)
    F.text(M + W, 110, "Target case · every position of the three layers", "reg", 9.8, MUTED, align="r")
    y = 144.0
    y += sim_table(F, M, y, W) + 8
    sec = SECONDARY
    y += F.para(M, y, W, x(
        "Positions with a company in brackets are follow-ons in our own breakouts; the direct growth entries are "
        "made alongside leading growth funds, with a liquidation preference. "
        f"* Fund Return shown at exit value. In the fund model, {pct(sec['share'])} of this position is sold in a "
        f"year-{sec['year']} secondary at {pct(sec['price_pct'])} of its exit value (see Fund Performance)."),
        7.8, "reg", SOFT, 1.4) + 20

    kick(F, M, y, "Fund performance")
    title(F, M, y + 17, W, "Target returns, built line by line.", 18)
    F.text(M + W, y + 22, "Net of fees, expenses and carry", "reg", 9.8, MUTED, align="r")
    y += 48
    tw_ = 404.0
    th = perf_table(F, M, y, tw_)
    rx = M + tw_ + 16
    rw = W - tw_ - 16
    # les quatre chiffres de /pitch (FundPerformance, colonne de droite)
    t, b, s = CASES["target"], CASES["base"], CASES["stress"]
    fr = DATA["fund_returner"]
    base_cap = eur(b["exit_cap"], "val")
    stats = [
        (pct(t["net_irr"]), "Target net IRR", f"Base case {pct(b['net_irr'])} with no exit above {base_cap}."),
        (mult(t["net_tvpi"]), "Target net TVPI", f"Base case {mult(b['net_tvpi'])}, stress case {mult(s['net_tvpi'])}."),
        (mult(t["dpi_year6"]), f"Net DPI by year {sec['year']}", "Partial secondaries on our winners return capital early."),
        (mult(fr["multiple_of_fund"]), "One fund returner", f"{fr['company']} returns the fund across its Seed and Growth lines."),
    ]
    gap = 10.0
    sw = (rw - gap) / 2
    sh = 72.0
    for i, (num, lab, det) in enumerate(stats):
        sx = rx + (i % 2) * (sw + gap)
        sy = y + (i // 2) * (sh + gap)
        F.rr(sx, sy, sw, sh, 13, fill=WARM)
        F.text(sx + 12, sy + 10, num, "gras", 18, BLUE_DK, -0.01)
        F.text(sx + 12, sy + 33, lab, "semi", 9, INK)
        F.para(sx + 12, sy + 45, sw - 22, x(det), 7.6, "reg", MUTED, 1.28)
    # le modele Excel, sur demande
    ey = y + 2 * sh + gap + 12
    eh = y + th - ey
    F.grad(rx, ey, rw, eh, 14, BLUE_GRAD, 120)
    F.rr(rx + 14, ey + (eh - 34) / 2, 34, 34, 10, fill=WHITE, alpha=0.18)
    F.icon("sheet", rx + 22, ey + (eh - 34) / 2 + 8, 18, WHITE)
    F.text(rx + 60, ey + eh / 2 - 13, "Full fund model (Excel)", "gras", 11.5, WHITE)
    F.text(rx + 60, ey + eh / 2 + 3, f"On request · {MAIL}", "reg", 8.8, "#E6EDF5")
    F.link(rx, ey, rw, eh, "mailto:" + MAIL + "?subject=ProFund%20fund%20model")
    y += th + 10

    # Meme note que /pitch (ProFundPage.tsx, FundPerformance) : les memes faits.
    y += F.para(M, y, W, x(
        f"Net = after management fees ({pct(TERMS['fee_ip_pct'])} on commitments for "
        f"{FUND['investment_period_years']} years, then {pct(TERMS['fee_post_pct'], 1)} on invested capital), "
        f"fund expenses and carried interest ({pct(TERMS['carry_pct'])} over an {pct(TERMS['hurdle_pct'])} hurdle, "
        "European whole-of-fund waterfall with GP catch-up), before tax. The target assumes one fund returner "
        f"({fr['company']}, returning {mult(fr['multiple_of_fund'])} the fund across its Seed and Growth lines) and "
        f"a year-{sec['year']} secondary sale of {pct(sec['share'])} of the two largest winners at "
        f"{pct(sec['price_pct'])} of their exit value. Base caps every exit value at {base_cap}, Stress at "
        f"{eur(s['exit_cap'], 'val')}; everything else is unchanged. Targets are model outputs, not a forecast or "
        "a guarantee."), 7.8, "reg", SOFT, 1.4)
    return y


def main():
    doc = Doc()
    lows = []
    for page in (page_one, page_two, page_three):
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
