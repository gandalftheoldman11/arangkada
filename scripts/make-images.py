"""Draws every Arangkada icon and splash image (web, Android, iPhone). Run: python3 scripts/make-images.py (needs Pillow)."""
from PIL import Image, ImageDraw
import math, os

GRAPHITE, TRACK, AMBER, INK = (21, 27, 35, 255), (44, 54, 66, 255), (245, 165, 36, 255), (236, 231, 222, 255)

def mark(size, inset, background):
    """The Arangkada gauge mark. background: None, 'rounded', 'rounded-android', 'circle' or 'square'."""
    S = size * 4
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if background == 'rounded': d.rounded_rectangle([0, 0, S, S], radius=int(S*.22), fill=GRAPHITE)
    elif background == 'rounded-android': d.rounded_rectangle([0, 0, S-1, S-1], radius=int(S*.2), fill=GRAPHITE)
    elif background == 'circle': d.ellipse([0, 0, S-1, S-1], fill=GRAPHITE)
    elif background == 'square': d.rectangle([0, 0, S, S], fill=GRAPHITE)
    box = S*(1-2*inset); ox = S*inset
    cx, cy, r = ox + box/2, ox + box*0.56, box*0.40
    # segmented ring: 18 segments over 270 degrees, the first 13 lit
    n = 18; w = box*0.075
    for i in range(n):
        a = math.radians(135 + 270*(i+0.5)/n)
        r1, r2 = r - w*0.9, r + w*0.9
        p = (cx + r1*math.cos(a), cy + r1*math.sin(a)); q = (cx + r2*math.cos(a), cy + r2*math.sin(a))
        d.line([p, q], fill=AMBER if i < 13 else TRACK, width=max(2, int(box*0.045)))
    a = math.radians(-40); L = r*0.62
    d.line([(cx, cy), (cx + L*math.cos(a), cy + L*math.sin(a))], fill=INK, width=max(2, int(box*0.06)))
    h = box*0.055; d.ellipse([cx-h, cy-h, cx+h, cy+h], fill=INK)
    return im.resize((size, size), Image.LANCZOS)

def save(im, path, rgb=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    (im.convert('RGB') if rgb else im).save(path, optimize=True)

def splash(w, h):
    o = Image.new('RGB', (w, h), GRAPHITE[:3]); s = min(w, h)//4
    fg = mark(s*2, 0.2, None); o.paste(fg, ((w-2*s)//2, (h-2*s)//2), fg); return o

# Web (PWA)
save(mark(192, 0.0, 'rounded'), 'web/icon-192.png')
save(mark(512, 0.0, 'rounded'), 'web/icon-512.png')
save(mark(512, 0.14, 'square'), 'web/icon-maskable-512.png')

# Android launcher icons (adaptive foreground keeps the mark inside the safe zone)
RES = 'android/app/src/main/res'
for dens, (ic, fg) in {'mdpi': (48, 108), 'hdpi': (72, 162), 'xhdpi': (96, 216), 'xxhdpi': (144, 324), 'xxxhdpi': (192, 432)}.items():
    save(mark(ic, 0.1, 'rounded-android'), f'{RES}/mipmap-{dens}/ic_launcher.png')
    save(mark(ic, 0.1, 'circle'), f'{RES}/mipmap-{dens}/ic_launcher_round.png')
    save(mark(fg, 0.24, None), f'{RES}/mipmap-{dens}/ic_launcher_foreground.png')

# Android splash screens
for folder, (w, h) in {'drawable': (480, 320), 'drawable-land-mdpi': (480, 320), 'drawable-land-hdpi': (800, 480), 'drawable-land-xhdpi': (1280, 720),
                       'drawable-land-xxhdpi': (1600, 960), 'drawable-land-xxxhdpi': (1920, 1280), 'drawable-port-mdpi': (320, 480), 'drawable-port-hdpi': (480, 800),
                       'drawable-port-xhdpi': (720, 1280), 'drawable-port-xxhdpi': (960, 1600), 'drawable-port-xxxhdpi': (1280, 1920)}.items():
    save(splash(w, h), f'{RES}/{folder}/splash.png')

# iPhone app icon (no transparency allowed) and launch screen
XC = 'ios/App/App/Assets.xcassets'
save(mark(1024, 0.1, 'square'), f'{XC}/AppIcon.appiconset/AppIcon-512@2x.png', rgb=True)
for name in ('splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'):
    save(splash(2732, 2732), f'{XC}/Splash.imageset/{name}')
print('Images written')
