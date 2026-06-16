#!/usr/bin/env python3
"""Download all Wix CDN images referenced by scraped site data."""

from __future__ import annotations

import requests

from image_assets import ASSETS_DIR, HEADERS, download_all_images, download_image

# Named assets used directly in templates (logo, favicon, etc.)
KEY_ASSETS = {
    "favicon.png": "https://static.wixstatic.com/media/9a8771_b7141d8709c54fe6b8da55c9e41efa99~mv2.png/v1/fill/w_32,h_32,lg_1,usm_0.66_1.00_0.01/9a8771_b7141d8709c54fe6b8da55c9e41efa99~mv2.png",
    "logo.png": "https://static.wixstatic.com/media/9a8771_df05eef3a2a94d5bbd9d4f08dcef0334~mv2.png/v1/fill/w_280,h_52,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Screen%2520Shot%25202021-01-20%2520at%252022_15_.png",
    "logo-icon.png": "https://static.wixstatic.com/media/9a8771_eda8789aeee7474dae92ab0c7b0d64b5~mv2.png/v1/crop/x_31,y_15,w_225,h_225/fill/w_44,h_44,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/bullet_ball_green_edited.png",
    "hero-product.png": "https://static.wixstatic.com/media/9a8771_9a27f8af7a704effbc7d20a5eb8c82c4~mv2.png/v1/fill/w_421,h_421,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ELNet-GR-PQ.png",
    "hero-bg.jpg": "https://static.wixstatic.com/media/422dc5_38073d395d004d5bb035fae027a974ff~mv2.jpg/v1/fill/w_1920,h_600,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/422dc5_38073d395d004d5bb035fae027a974ff~mv2.jpg",
}


def download_key_assets() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    for filename, url in KEY_ASSETS.items():
        dest = ASSETS_DIR / filename
        if dest.exists():
            print(f"  Exists: {filename}")
            continue
        if download_image(url, dest):
            print(f"  Downloaded: {filename} ({dest.stat().st_size} bytes)")
        else:
            print(f"  FAILED: {filename}")


def main() -> None:
    print("Downloading template assets...")
    download_key_assets()
    print("\nDownloading scraped media files...")
    download_all_images()


if __name__ == "__main__":
    main()
