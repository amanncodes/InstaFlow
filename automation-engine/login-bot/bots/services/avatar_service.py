from __future__ import annotations

from pathlib import Path
import re
from typing import Iterable, List

import requests


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

    data, _ = _call_json(
        f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
    )
    if data is None:
        data, _ = _call_json(
            f"https://www.instagram.com/{username}/?__a=1&__d=dis"
        )

    user = None
    if data:
        user = data.get("data", {}).get("user") or data.get("graphql", {}).get("user")

    if not user:
        r_html = requests.get(
            f"https://www.instagram.com/{username}/", headers=headers, timeout=20
        )
        r_html.raise_for_status()
        html = r_html.text
        m = re.search(r'"profile_pic_url_hd":"([^"]+)"', html)
        if m:
            pic_url = m.group(1).replace("\\u0026", "&").replace("\\/", "/")
            img = requests.get(
                pic_url, headers={"User-Agent": headers["User-Agent"]}, timeout=20
            )
            img.raise_for_status()
            return img.content
        html_un = html.replace("&amp;", "&")
        m = re.search(
            r'property="og:image" content="([^"]+)"',
            html_un,
            re.IGNORECASE | re.DOTALL,
        )
        if m:
            pic_url = m.group(1)
            img = requests.get(
                pic_url, headers={"User-Agent": headers["User-Agent"]}, timeout=20
            )
            img.raise_for_status()
            return img.content
        m = re.search(r'(https?://[^"]+\\.jpg[^"]*)', html_un, re.IGNORECASE)
        if m:
            pic_url = m.group(1).replace("\\u0026", "&").replace("\\/", "/")
            img = requests.get(
                pic_url, headers={"User-Agent": headers["User-Agent"]}, timeout=20
            )
            img.raise_for_status()
            return img.content
        raise RuntimeError("Could not parse Instagram profile response (HTML fallback failed)")

    pic_url = user.get("profile_pic_url_hd") or user.get("profile_pic_url")
    if not pic_url:
        raise RuntimeError("Profile picture URL not found")

    img = requests.get(
        pic_url, headers={"User-Agent": headers["User-Agent"]}, timeout=20
    )
    img.raise_for_status()
    return img.content


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _avatars_dir() -> Path:
    return _repo_root() / "backend" / "public" / "avatars"


def avatar_paths(account) -> List[Path]:
    names: List[str] = []
    if getattr(account, "username", None):
        names.append(str(account.username))
    if getattr(account, "id", None) is not None:
        names.append(str(account.id))
    # Keep legacy filename for compatibility if needed
    names.append("acc_001")

    unique: List[str] = []
    for name in names:
        if name and name not in unique:
            unique.append(name)

    return [(_avatars_dir() / f"{name}.jpg") for name in unique]


def avatar_exists(account) -> bool:
    return any(p.exists() for p in avatar_paths(account))


def fetch_and_save_avatar(account) -> Iterable[Path]:
    if not getattr(account, "cookies", None):
        raise RuntimeError("Account has no cookies; cannot fetch avatar.")

    cookie_header = build_cookie_header(account.cookies)
    if not cookie_header:
        raise RuntimeError("Account has no valid cookies; cannot fetch avatar.")

    img_bytes = fetch_profile_pic(account.username, cookie_header)

    avatars_dir = _avatars_dir()
    avatars_dir.mkdir(parents=True, exist_ok=True)

    paths = avatar_paths(account)
    primary = paths[0]
    primary.write_bytes(img_bytes)

    for path in paths[1:]:
        if path != primary:
            path.write_bytes(img_bytes)

    return paths
