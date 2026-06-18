from PIL import Image, ImageDraw
import math

GREEN = (21, 128, 61)      # #15803D deep green
GREEN_DK = (15, 91, 52)    # vein / depth
WHITE = (255, 255, 255)

def rounded(size, radius_frac=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * radius_frac)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=GREEN)
    return img, d

def leaf_mask(size):
    # vesica-piscis leaf from two overlapping circles, then rotate slightly
    m = Image.new("L", (size, size), 0)
    dm = ImageDraw.Draw(m)
    r = int(size * 0.30)            # circle radius
    cx, cy = size // 2, size // 2
    sep = int(r * 0.62)            # horizontal half-separation -> vertical lens
    dm.ellipse([cx - sep - r, cy - r, cx - sep + r, cy + r], fill=255)
    m2 = Image.new("L", (size, size), 0)
    dm2 = ImageDraw.Draw(m2)
    dm2.ellipse([cx + sep - r, cy - r, cx + sep + r, cy + r], fill=255)
    from PIL import ImageChops
    lens = ImageChops.multiply(m, m2)   # intersection = leaf
    lens = lens.rotate(-22, resample=Image.BICUBIC, center=(cx, cy))
    return lens

def make(size):
    img, d = rounded(size)
    mask = leaf_mask(size)
    white = Image.new("RGBA", (size, size), WHITE + (255,))
    img.paste(white, (0, 0), mask)
    # vein: a slim line along the leaf's long axis (rotated -22deg)
    cx, cy = size / 2, size / 2
    ang = math.radians(-22 - 90)  # long axis of a vertical lens is vertical, then rotated
    L = size * 0.155
    x1, y1 = cx - L * math.cos(ang), cy - L * math.sin(ang)
    x2, y2 = cx + L * math.cos(ang), cy + L * math.sin(ang)
    d.line([(x1, y1), (x2, y2)], fill=GREEN_DK, width=max(2, size // 64))
    return img

for s in (512, 192):
    make(s).save(f"icon-{s}.png")
# small favicon
make(64).save("icon-64.png")
print("icons written")
