"""Moteur de dessin de la fiche PDF — repris de maximum-insurance fiches_v5.py.

Le meme modele que les fiches V5 de Maximum Insurance (Archivo, cartes arrondies,
ombres douces, icones vectorielles, QR net a toute taille), en couleurs ProFund.
Ce sont de vrais PDF vectoriels : texte selectionnable, liens cliquables.

Repere : la page A4 en px CSS (794 x 1123, 1 px = 0,75 pt), v vers le bas, comme
une maquette HTML. Une carte inclinee est un repere enfant tourne autour de son
centre (Frame(..., rot=...)), comme `transform: rotate()`.

Autonome : aucune dependance au depot Maximum. Les polices Archivo (OFL) sont dans
scripts/assets/fonts/ ; sans elles le script echoue (pas de repli Helvetica : il
rendrait un carre blanc sur « € » ou « — »).

GLYPHES : tout texte dessine passe par check_glyphs() — un caractere absent
d'Archivo fait echouer la fiche au lieu d'imprimer un carre blanc.
"""

from __future__ import annotations

import html
import math
import re
from functools import lru_cache
from pathlib import Path
from xml.sax.saxutils import escape as _xml

from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph

FONTS = Path(__file__).resolve().parent / "assets" / "fonts"

PX = 0.75                 # 1 px CSS = 0,75 pt
PW, PH = 794, 1123        # la page, en px CSS (A4)
M = 46                    # marges
W = PW - 2 * M            # largeur utile
BOTTOM = 1032.0           # le bas du contenu (le filet du pied est a 1054)
FOOT_RULE = 1054.0
NBSP = " "

# ── Palette ProFund (la meme que le site, src/index.css) ─────────────────────
BLUE, BLUE_DK, BLUE_SOFT, BLUE_TINT = "#627C99", "#4A6080", "#EEF2F7", "#F6F8FB"
BLUE_GRAD = [("#8EA6C0", 0.0), ("#627C99", 0.55), ("#4A6080", 1.0)]
GLOW = "#9FB6CF"
INK, INK2, MUTED, SOFT = "#15181D", "#363B44", "#646B77", "#9AA1AD"
LINE, LINE2, WARM = "#E7E9ED", "#D9DDE3", "#F3F4F6"
GREEN, GREEN_SOFT = "#1F8A4C", "#E5F3EA"
RED, RED_SOFT = "#C0392B", "#FDF0EE"
NIGHT, NIGHT2, NIGHT_LINE, NIGHT_TXT = "#0F1216", "#181C22", "#2A3038", "#B4BBC6"
WHITE = "#FFFFFF"

# ── Polices ──────────────────────────────────────────────────────────────────
_ROLES = {"reg": "Archivo-Regular", "med": "Archivo-Medium", "semi": "Archivo-SemiBold",
          "gras": "Archivo-Bold", "xgras": "Archivo-ExtraBold"}
_CMAP: set = set()


def fonts() -> None:
    """Enregistre Archivo une fois ; echoue si une police manque."""
    if _CMAP:
        return
    for name in _ROLES.values():
        path = FONTS / f"{name}.ttf"
        if not path.is_file():
            raise SystemExit(f"police manquante : {path}")
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily("Archivo-Regular", normal="Archivo-Regular", bold="Archivo-Bold",
                                  italic="Archivo-Regular", boldItalic="Archivo-Bold")
    for name in _ROLES.values():
        cmap = set(pdfmetrics.getFont(name).face.charToGlyph)
        _CMAP.update(cmap) if not _CMAP else _CMAP.intersection_update(cmap)


def P(role: str) -> str:
    return _ROLES[role]


_TAG = re.compile(r"<[^>]+>")


def check_glyphs(text: str) -> None:
    """Echoue si un caractere n'a pas de glyphe dans Archivo (sinon : carre blanc)."""
    fonts()
    missing = sorted({ch for ch in text if ch not in "\n\t" and ord(ch) not in _CMAP})
    if missing:
        raise SystemExit("glyphe absent d'Archivo : " + ", ".join(f"U+{ord(c):04X}" for c in missing)
                         + f" dans {text[:80]!r}")


def x(text) -> str:
    """Texte brut -> balisage de paragraphe (echappe, glyphes verifies)."""
    s = re.sub(r"[ \t\r\n]+", " ", str(text or ""))
    check_glyphs(s)
    return _xml(s)


@lru_cache(maxsize=1024)
def _style(size: float, role: str, color: str, leading: float, align: int) -> ParagraphStyle:
    return ParagraphStyle(f"pf-{size}-{role}-{color}-{leading}-{align}", fontName=P(role), fontSize=size,
                          leading=leading, textColor=HexColor(color), alignment=align,
                          splitLongWords=True, allowWidows=1, allowOrphans=1)


# ── Icones (SVG du site, en vecteurs) ────────────────────────────────────────
_NUM = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
_EL = re.compile(r"<(path|rect|circle)\b([^>]*?)/?>")
_ATTR = re.compile(r'([\w:-]+)="([^"]*)"')


def _arc(x1, y1, rx, ry, phi, fa, fs, x2, y2) -> list:
    """Un arc SVG (parametrage par extremites) en courbes de Bezier cubiques."""
    if (x1, y1) == (x2, y2):
        return []
    rx, ry = abs(rx), abs(ry)
    if not rx or not ry:
        return [("L", x2, y2)]
    p = math.radians(phi)
    cp, sp = math.cos(p), math.sin(p)
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry)
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    co = math.sqrt(max(0.0, num / den)) if den else 0.0
    if fa == fs:
        co = -co
    cxp, cyp = co * rx * y1p / ry, -co * ry * x1p / rx
    cx, cy = cp * cxp - sp * cyp + (x1 + x2) / 2, sp * cxp + cp * cyp + (y1 + y2) / 2

    def ang(ux, uy, vx, vy):
        return math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not fs and dt > 0:
        dt -= 2 * math.pi
    elif fs and dt < 0:
        dt += 2 * math.pi
    n = max(1, int(math.ceil(abs(dt) / (math.pi / 2) - 1e-9)))
    d, out = dt / n, []

    def tr(px, py):
        return cx + rx * px * cp - ry * py * sp, cy + rx * px * sp + ry * py * cp
    for i in range(n):
        a1, a2 = t1 + i * d, t1 + (i + 1) * d
        k = 4 / 3 * math.tan((a2 - a1) / 4)
        out.append(("C",) + tr(math.cos(a1) - k * math.sin(a1), math.sin(a1) + k * math.cos(a1))
                   + tr(math.cos(a2) + k * math.sin(a2), math.sin(a2) - k * math.cos(a2))
                   + tr(math.cos(a2), math.sin(a2)))
    return out


@lru_cache(maxsize=512)
def _path_ops(d: str) -> tuple:
    """Le trace SVG en operations absolues M / L / C / Z (M L H V C S Q T A Z, absolus et relatifs)."""
    ops, i, n = [], 0, len(d)
    cmd = None
    cx = cy = sx = sy = 0.0
    lc = lq = None

    def skip():
        nonlocal i
        while i < n and d[i] in " ,\t\r\n":
            i += 1

    def num():
        nonlocal i
        skip()
        hit = _NUM.match(d, i)
        if not hit:
            raise ValueError("svg: nombre attendu dans " + d[i:i + 12])
        i = hit.end()
        return float(hit.group())

    def flag():
        nonlocal i
        skip()
        ch = d[i]
        i += 1
        return ch == "1"
    while True:
        skip()
        if i >= n:
            break
        if d[i].isalpha():
            cmd = d[i]
            i += 1
            if cmd in "Zz":
                ops.append(("Z",))
                cx, cy = sx, sy
                lc = lq = None
                continue
        elif cmd is None:
            break
        up, rel = cmd.upper(), cmd.islower()
        ox, oy = (cx, cy) if rel else (0.0, 0.0)
        if up == "M":
            px_, py_ = num() + ox, num() + oy
            ops.append(("M", px_, py_))
            cx, cy, sx, sy = px_, py_, px_, py_
            cmd = "l" if rel else "L"
            lc = lq = None
        elif up == "L":
            px_, py_ = num() + ox, num() + oy
            ops.append(("L", px_, py_))
            cx, cy = px_, py_
            lc = lq = None
        elif up == "H":
            px_ = num() + (cx if rel else 0.0)
            ops.append(("L", px_, cy))
            cx = px_
            lc = lq = None
        elif up == "V":
            py_ = num() + (cy if rel else 0.0)
            ops.append(("L", cx, py_))
            cy = py_
            lc = lq = None
        elif up == "C":
            x1, y1, x2, y2, px_, py_ = (num() + ox, num() + oy, num() + ox, num() + oy, num() + ox, num() + oy)
            ops.append(("C", x1, y1, x2, y2, px_, py_))
            lc, lq = (x2, y2), None
            cx, cy = px_, py_
        elif up == "S":
            x2, y2, px_, py_ = num() + ox, num() + oy, num() + ox, num() + oy
            x1, y1 = (2 * cx - lc[0], 2 * cy - lc[1]) if lc else (cx, cy)
            ops.append(("C", x1, y1, x2, y2, px_, py_))
            lc, lq = (x2, y2), None
            cx, cy = px_, py_
        elif up in ("Q", "T"):
            if up == "Q":
                qx, qy = num() + ox, num() + oy
            else:
                qx, qy = (2 * cx - lq[0], 2 * cy - lq[1]) if lq else (cx, cy)
            px_, py_ = num() + ox, num() + oy
            ops.append(("C", cx + 2 / 3 * (qx - cx), cy + 2 / 3 * (qy - cy),
                        px_ + 2 / 3 * (qx - px_), py_ + 2 / 3 * (qy - py_), px_, py_))
            lq, lc = (qx, qy), None
            cx, cy = px_, py_
        elif up == "A":
            rx, ry, rot = num(), num(), num()
            fa, fs = flag(), flag()
            px_, py_ = num() + ox, num() + oy
            ops.extend(_arc(cx, cy, rx, ry, rot, fa, fs, px_, py_))
            cx, cy = px_, py_
            lc = lq = None
        else:
            raise ValueError("svg: commande non prise en charge " + cmd)
    return tuple(ops)


# Icones au trait, grille 24 (style Lucide / site Maximum V5).
ICONS = {
    "crown": '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.29l4.27-3.66a.5.5 0 0 1 .8.52l-2.83 10.25a1 1 0 0 1-.96.73H5.81a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.66a1 1 0 0 0 1.52-.29Z"/><path d="M5 21h14"/>',
    "loop": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    "globe": '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.8 5.4 3.8 8.5s-1.3 5.9-3.8 8.5c-2.5-2.6-3.8-5.4-3.8-8.5S9.5 6.1 12 3.5Z"/>',
    "trend": '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    "radar": '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    "bot": '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
    "shield": '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6Z"/><path d="M12 8v4.5"/><path d="M12 16h.01"/>',
    "mail": '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m21.5 7.5-8.5 5.6a1.9 1.9 0 0 1-2 0L2.5 7.5"/>',
    "sheet": '<path d="M15 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7Z"/><path d="M14.5 2.5v4a1.5 1.5 0 0 0 1.5 1.5h3.5"/><path d="M8 12.5h8M8 16.5h8M12 10.5v8"/>',
    "layers": '<path d="M12 3 2.5 8 12 13l9.5-5Z"/><path d="m2.5 12.5 9.5 5 9.5-5"/><path d="m2.5 16.5 9.5 5 9.5-5"/>',
    "building": '<path d="M4 20.5h16M6 20.5V5.5A1.5 1.5 0 0 1 7.5 4h9A1.5 1.5 0 0 1 18 5.5v15"/><path d="M9.5 8h1M13.5 8h1M9.5 11.5h1M13.5 11.5h1M9.5 15h1M13.5 15h1"/>',
}
CHECK = '<path d="m3.8 8.4 2.7 2.7 5.7-6" stroke-width="2"/>'      # grille 16
ARROW = '<path d="M5 12h14M13 6l6 6-6 6" stroke-width="2"/>'


# ── Le repere de dessin ──────────────────────────────────────────────────────
class Frame:
    """Un repere local : (u, v) avec v vers le bas, 1 unite = `k` px CSS du parent.
    La page est le repere racine ; une carte inclinee est un repere enfant tourne
    autour de son centre, comme `transform: rotate()` en CSS."""

    def __init__(self, c, x: float = 0.0, y: float = 0.0, k: float = 1.0, rot: float = 0.0,
                 w: float = 0.0, h: float = 0.0, parent: "Frame | None" = None):
        fonts()
        self.c = c
        ps = parent.s if parent else PX
        self.s = ps * k
        c.saveState()
        if parent is None:
            c.translate(0, PH * PX)
        if rot:
            c.translate((x + w * k / 2) * ps, -(y + h * k / 2) * ps)
            c.rotate(-rot)
            c.translate(-(w / 2) * self.s, (h / 2) * self.s)
        else:
            c.translate(x * ps, -y * ps)

    def close(self) -> None:
        self.c.restoreState()

    def __enter__(self):
        return self

    def __exit__(self, *_a):
        self.close()

    def pt(self, u: float, v: float) -> tuple:
        return u * self.s, -v * self.s

    # formes
    def rr(self, u, v, w, h, r=0.0, fill=None, stroke=None, lw=1.0, alpha=None, salpha=None) -> None:
        c = self.c
        c.saveState()
        if fill:
            c.setFillColor(HexColor(fill))
        if stroke:
            c.setStrokeColor(HexColor(stroke))
            c.setLineWidth(lw * self.s)
        if alpha is not None:
            c.setFillAlpha(alpha)
        if salpha is not None:
            c.setStrokeAlpha(salpha)
        x0, y0 = self.pt(u, v + h)
        r = min(r, w / 2, h / 2)
        if r > 0:
            c.roundRect(x0, y0, w * self.s, h * self.s, r * self.s, stroke=1 if stroke else 0, fill=1 if fill else 0)
        else:
            c.rect(x0, y0, w * self.s, h * self.s, stroke=1 if stroke else 0, fill=1 if fill else 0)
        c.restoreState()

    def clip(self, u, v, w, h, r=0.0) -> None:
        c = self.c
        c.saveState()
        p = c.beginPath()
        x0, y0 = self.pt(u, v + h)
        r = min(r, w / 2, h / 2)
        if r > 0:
            p.roundRect(x0, y0, w * self.s, h * self.s, r * self.s)
        else:
            p.rect(x0, y0, w * self.s, h * self.s)
        c.clipPath(p, stroke=0, fill=0)

    def unclip(self) -> None:
        self.c.restoreState()

    def grad(self, u, v, w, h, r, stops, angle=135.0) -> None:
        """Un degrade lineaire a la mode CSS (0deg vers le haut, 90deg vers la droite)."""
        self.clip(u, v, w, h, r)
        a = math.radians(angle)
        dx, dy = math.sin(a), -math.cos(a)
        ln = abs(w * dx) + abs(h * dy)
        cu, cv = u + w / 2, v + h / 2
        x0, y0 = self.pt(cu - dx * ln / 2, cv - dy * ln / 2)
        x1, y1 = self.pt(cu + dx * ln / 2, cv + dy * ln / 2)
        self.c.linearGradient(x0, y0, x1, y1, [HexColor(col) for col, _ in stops], [p for _, p in stops], extend=True)
        self.unclip()

    def circle(self, u, v, r, fill=None, stroke=None, lw=1.0, alpha=None) -> None:
        c = self.c
        c.saveState()
        if fill:
            c.setFillColor(HexColor(fill))
        if stroke:
            c.setStrokeColor(HexColor(stroke))
            c.setLineWidth(lw * self.s)
        if alpha is not None:
            c.setFillAlpha(alpha)
        px_, py_ = self.pt(u, v)
        c.circle(px_, py_, r * self.s, stroke=1 if stroke else 0, fill=1 if fill else 0)
        c.restoreState()

    def line(self, u1, v1, u2, v2, color, lw=1.0, dash=None, cap=1, alpha=None) -> None:
        c = self.c
        c.saveState()
        c.setStrokeColor(HexColor(color))
        c.setLineWidth(lw * self.s)
        c.setLineCap(cap)
        if alpha is not None:
            c.setStrokeAlpha(alpha)
        if dash:
            c.setDash([d * self.s for d in dash])
        c.line(*self.pt(u1, v1), *self.pt(u2, v2))
        c.restoreState()

    def shadow(self, u, v, w, h, r, depth=1.0, alpha=0.02) -> None:
        """Une ombre douce, posee sous la carte (plusieurs couches tres claires)."""
        for i in range(7):
            sp = (1.0 + i * 2.4) * depth
            dy = (3.0 + i * 1.7) * depth
            self.rr(u - sp / 2, v + dy - sp / 2, w + sp, h + sp, r + sp / 2, fill=INK, alpha=alpha)

    def glow(self, cu, cv, rmax, color=BLUE, steps=14, alpha=0.035, box=None) -> None:
        if box:
            self.clip(*box)
        for i in range(steps):
            self.circle(cu, cv, rmax * (1 - i / steps), fill=color, alpha=alpha)
        if box:
            self.unclip()

    def tile(self, u, v, size, r=None) -> None:
        """La tuile d'icone en degrade bleu (le carre rouge des fiches Maximum)."""
        self.grad(u, v, size, size, r if r is not None else size * 0.3, BLUE_GRAD, 140)

    # texte
    def tw(self, s, role="reg", size=12.0, sp=0.0) -> float:
        s = str(s)
        fs = size * self.s
        return (pdfmetrics.stringWidth(s, P(role), fs) + sp * fs * max(0, len(s) - 1)) / self.s

    def text(self, u, v, s, role="reg", size=12.0, color=INK, sp=0.0, align="l", alpha=None) -> float:
        """Une ligne sans retour ; v = haut de la ligne ; rend la largeur."""
        s = str(s)
        if not s:
            return 0.0
        check_glyphs(s)
        wl = self.tw(s, role, size, sp)
        u0 = u - wl if align == "r" else (u - wl / 2 if align == "c" else u)
        fs = size * self.s
        c = self.c
        c.saveState()
        if alpha is not None:
            c.setFillAlpha(alpha)
        to = c.beginText()
        to.setTextOrigin(*self.pt(u0, v + size * 0.80))
        to.setFont(P(role), fs)
        to.setFillColor(HexColor(color))
        if sp:
            to.setCharSpace(sp * fs)
        to.textOut(s)
        c.drawText(to)
        c.restoreState()
        return wl

    def para(self, u, v, w, markup, size=12.0, role="reg", color=INK2, lead=1.5, align=0) -> float:
        """Un paragraphe (balisage deja echappe, cf. x()) dont le haut est en v ; rend sa hauteur."""
        if not markup:
            return 0.0
        check_glyphs(html.unescape(_TAG.sub("", markup)))
        st = _style(round(size * self.s, 3), role, color, round(size * lead * self.s, 3), align)
        p = Paragraph(markup, st)
        _, h = p.wrap(w * self.s, 100000)
        px_, py_ = self.pt(u, v)
        p.drawOn(self.c, px_, py_ - h)
        return h / self.s

    def hpara(self, w, markup, size=12.0, role="reg", lead=1.5) -> float:
        if not markup:
            return 0.0
        p = Paragraph(markup, _style(round(size * self.s, 3), role, INK, round(size * lead * self.s, 3), 0))
        return p.wrap(w * self.s, 100000)[1] / self.s

    # icones, QR, images, liens
    def svg(self, svg: str, u, v, size, color, sw=None, vb=24.0) -> None:
        """Une icone SVG (traces, rectangles, cercles) en vecteurs."""
        k = size / vb
        default_sw = sw if sw is not None else 1.8
        c = self.c
        for kind, raw in _EL.findall(svg):
            a = dict(_ATTR.findall(raw))
            filled = a.get("fill") == "currentColor"
            lw = float(a.get("stroke-width") or default_sw)
            c.saveState()
            c.setStrokeColor(HexColor(color))
            c.setFillColor(HexColor(color))
            c.setLineCap(1)
            c.setLineJoin(1)
            c.setLineWidth(lw * k * self.s)
            p = c.beginPath()
            if kind == "path":
                for op in _path_ops(a.get("d", "")):
                    if op[0] == "M":
                        p.moveTo(*self.pt(u + op[1] * k, v + op[2] * k))
                    elif op[0] == "L":
                        p.lineTo(*self.pt(u + op[1] * k, v + op[2] * k))
                    elif op[0] == "C":
                        p.curveTo(*self.pt(u + op[1] * k, v + op[2] * k), *self.pt(u + op[3] * k, v + op[4] * k),
                                  *self.pt(u + op[5] * k, v + op[6] * k))
                    else:
                        p.close()
            elif kind == "rect":
                rx_, ry_ = float(a.get("x", 0)), float(a.get("y", 0))
                w, h = float(a.get("width", 0)), float(a.get("height", 0))
                rr_ = float(a.get("rx", 0))
                x0, y0 = self.pt(u + rx_ * k, v + (ry_ + h) * k)
                if rr_:
                    p.roundRect(x0, y0, w * k * self.s, h * k * self.s, rr_ * k * self.s)
                else:
                    p.rect(x0, y0, w * k * self.s, h * k * self.s)
            else:
                p.circle(*self.pt(u + float(a.get("cx", 0)) * k, v + float(a.get("cy", 0)) * k),
                         float(a.get("r", 0)) * k * self.s)
            c.drawPath(p, stroke=0 if filled else 1, fill=1 if filled else 0)
            c.restoreState()

    def icon(self, name: str, u, v, size, color, sw=None) -> None:
        self.svg(ICONS[name], u, v, size, color, sw=sw)

    def qr(self, url: str, u, v, size, quiet: int = 1, error: str = "m", color=INK) -> None:
        """Le QR en modules vectoriels (net a toute taille), sur fond blanc."""
        import segno
        mat = [list(r) for r in segno.make(url, error=error, boost_error=False).matrix]
        n = len(mat)
        mod = size / (n + 2 * quiet)
        self.rr(u, v, size, size, fill=WHITE)
        c = self.c
        c.saveState()
        c.setFillColor(HexColor(color))
        p = c.beginPath()
        e = 0.02
        for i, row in enumerate(mat):
            j = 0
            while j < n:
                if row[j]:
                    k = j
                    while k < n and row[k]:
                        k += 1
                    x0, y0 = self.pt(u + (j + quiet) * mod, v + (i + quiet + 1) * mod)
                    p.rect(x0, y0 - e, ((k - j) * mod) * self.s + e, mod * self.s + e)
                    j = k
                else:
                    j += 1
        c.drawPath(p, stroke=0, fill=1)
        c.restoreState()

    def image(self, src, u, v, w, h, r=0.0) -> None:
        """Une image (chemin ou ImageReader), rognee aux coins arrondis."""
        if isinstance(src, Path):
            if not src.is_file():
                raise SystemExit(f"image manquante : {src}")
            src = ImageReader(str(src))
        self.clip(u, v, w, h, r)
        x0, y0 = self.pt(u, v + h)
        self.c.drawImage(src, x0, y0, w * self.s, h * self.s, mask="auto")
        self.unclip()

    def link(self, u, v, w, h, url: str) -> None:
        if not url:
            return
        x0, y0 = self.pt(u, v + h)
        x1, y1 = self.pt(u + w, v)
        self.c.linkURL(url, (x0, y0, x1, y1), relative=1, thickness=0)

    # petits elements
    def check(self, u, v, d, fill=GREEN, color=WHITE) -> None:
        self.circle(u + d / 2, v + d / 2, d / 2, fill=fill)
        self.svg(CHECK, u + d * 0.18, v + d * 0.18, d * 0.64, color, vb=16)
