import os
import numpy as np
from PIL import Image

logo = Image.open("scripts/perfect_logo.png")

os.makedirs("public/images", exist_ok=True)
logo.save("public/logo.png", format="PNG", optimize=True)
logo.save("public/images/logo.png", format="PNG", optimize=True)

# Radar Icon alone: crop x from 0 to 275
radar_crop = logo.crop((10, 0, 275, logo.height))
bbox = radar_crop.getbbox()
radar_crop = radar_crop.crop(bbox)

rw, rh = radar_crop.size
side = max(rw, rh) + 24
radar_sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
radar_sq.paste(radar_crop, ((side - rw) // 2, (side - rh) // 2))
radar_sq.save("public/logo-icon.png", format="PNG", optimize=True)
print("Saved public/logo-icon.png (size:", radar_sq.size, ")")

fav_806 = Image.open("scripts/fav_squircle_806.png")

# 512x512
fav_512 = fav_806.resize((512, 512), Image.Resampling.LANCZOS)
fav_512.save("public/icon-512x512.png", format="PNG", optimize=True)
fav_512.save("app/icon.png", format="PNG", optimize=True)

# 192x192
fav_192 = fav_806.resize((192, 192), Image.Resampling.LANCZOS)
fav_192.save("public/icon-192x192.png", format="PNG", optimize=True)

# 180x180 (Apple touch icon)
fav_180 = fav_806.resize((180, 180), Image.Resampling.LANCZOS)
fav_180.save("public/apple-touch-icon.png", format="PNG", optimize=True)
fav_180.save("app/apple-icon.png", format="PNG", optimize=True)

# Multi-resolution ICO: 16x16, 32x32, 48x48
fav_16 = fav_806.resize((16, 16), Image.Resampling.LANCZOS)
fav_32 = fav_806.resize((32, 32), Image.Resampling.LANCZOS)
fav_48 = fav_806.resize((48, 48), Image.Resampling.LANCZOS)

fav_32.save(
    "public/favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[fav_16, fav_48]
)
fav_32.save(
    "app/favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[fav_16, fav_48]
)

print("All assets updated perfectly!")
