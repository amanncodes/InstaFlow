"""
Download the Instagram display picture (DP) for the first logged-in IG account
managed by login-bot. If no logged-in cookies exist, it will instruct you to
trigger a login via the Django admin “Launch login” action.

Output file:
    backend/public/avatars/<account_id>.jpg
"""

import os
import sys
from pathlib import Path
import shutil

import requests
import re

# Bootstrap Django from login-bot project
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "login-bot"))
sys.path.insert(0, str(BASE_DIR / "app"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
import django  # noqa: E402

django.setup()

from bots.models import SocialAccount  # noqa: E402
from typing import cast, Any


def build_cookie_header(cookies_list):
    if not cookies_list:
        return ""
    parts = []
    for c in cookies_list:
        name = c.get("name")
        value = c.get("value")
        if name and value:
            parts.append(f"{name}={value}")
    return "; ".join(parts)


def fetch_profile_pic(username: str, cookie_header: str) -> bytes:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": cookie_header,
        "Accept": "application/json",
        "Referer": f"https://www.instagram.com/{username}/",
        "X-IG-App-ID": "936619743392459",
    }

    def _call_json(url: str):
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code == 429:
            return None, r
        try:
            r.raise_for_status()
            return r.json(), r
        except Exception:
            return None, r

    data, r = _call_json(
        f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
    )
    if data is None:
        data, r = _call_json(
            f"https://www.instagram.com/{username}/?__a=1&__d=dis"
        )

    user = None
    if data:
        user = data.get("data", {}).get("user") or data.get("graphql", {}).get("user")

    if not user:
        # Try HTML scrape as last resort
        r_html = requests.get(f"https://www.instagram.com/{username}/", headers=headers, timeout=20)
        r_html.raise_for_status()
        html = r_html.text
        m = re.search(r'"profile_pic_url_hd":"([^"]+)"', html)
        if m:
            pic_url = m.group(1).replace("\\u0026", "&").replace("\\/", "/")
            img = requests.get(pic_url, headers={"User-Agent": headers["User-Agent"]}, timeout=20)
            img.raise_for_status()
            return img.content
        html_un = html.replace("&amp;", "&")
        m = re.search(r'property="og:image" content="([^"]+)"', html_un, re.IGNORECASE | re.DOTALL)
        if m:
            pic_url = m.group(1)
            img = requests.get(pic_url, headers={"User-Agent": headers["User-Agent"]}, timeout=20)
            img.raise_for_status()
            return img.content
        m = re.search(r'(https?://[^"]+\\.jpg[^"]*)', html_un, re.IGNORECASE)
        if m:
            pic_url = m.group(1).replace("\\u0026", "&").replace("\\/", "/")
            img = requests.get(pic_url, headers={"User-Agent": headers["User-Agent"]}, timeout=20)
            img.raise_for_status()
            return img.content
        raise RuntimeError("Could not parse Instagram profile response (HTML fallback failed)")

    pic_url = user.get("profile_pic_url_hd") or user.get("profile_pic_url")
    if not pic_url:
        raise RuntimeError("Profile picture URL not found")

    img = requests.get(pic_url, headers={"User-Agent": headers["User-Agent"]}, timeout=20)
    img.raise_for_status()
    return img.content


def main():
    username = None
    if len(sys.argv) > 1:
        for i, arg in enumerate(sys.argv):
            if arg in ("--username", "-u") and i + 1 < len(sys.argv):
                username = sys.argv[i + 1]

    account_qs = SocialAccount.objects.filter(platform="IG", logged_in=True)
    if username:
        account_qs = account_qs.filter(username=username)

    account = account_qs.order_by("-last_login").first()
    if not account:
        print("No logged-in Instagram account found. Please launch login via admin.")
        return

    cookie_header = build_cookie_header(account.cookies)
    if not cookie_header:
        print("Account has no cookies. Please re-login via login-bot.")
        return

    print(f"Fetching DP for @{account.username} ...")
    img_bytes = fetch_profile_pic(account.username, cookie_header)

    account_id = cast(Any, account).id  # type: ignore[attr-defined]

    # Write to the API server's public avatars directory (repo root /backend/public/avatars)
    repo_root = Path(__file__).resolve().parents[2]
    avatars_dir = repo_root / "backend" / "public" / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)
    out_path = avatars_dir / f"{account_id}.jpg"
    with open(out_path, "wb") as f:
        f.write(img_bytes)

    # Also write the username and legacy filenames for compatibility.
    legacy_path = avatars_dir / "acc_001.jpg"
    username_path = avatars_dir / f"{account.username}.jpg"
    for extra in (legacy_path, username_path):
        if extra != out_path:
            shutil.copyfile(out_path, extra)

    print(f"Saved DP to {out_path}")
    if legacy_path.exists():
        print(f"Saved legacy DP to {legacy_path}")
    if username_path.exists():
        print(f"Saved username DP to {username_path}")


if __name__ == "__main__":
    main()
