#!/usr/bin/env python3
"""Verify generated links, anchors and assets in CI, including the Pages base."""

from html.parser import HTMLParser
from pathlib import Path
import posixpath
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / "docs/.vitepress/dist"
BASE = "/B-box-docs/"


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []
        self.feed(text)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for attribute in ("href", "src"):
            if attrs.get(attribute):
                self.links.append(attrs[attribute])


pages = {path.relative_to(ROOT).as_posix(): Page(path.read_text()) for path in ROOT.rglob("*.html")}
errors = []
checked = 0
for filename, page in pages.items():
    for link in page.links:
        parts = urlsplit(link)
        if parts.scheme or parts.netloc:
            continue
        path = unquote(parts.path)
        if path.startswith("/"):
            if not path.startswith(BASE):
                errors.append(f"{filename}: URL escaped Pages base: {link}")
                continue
            target = path[len(BASE):]
        elif path:
            target = posixpath.normpath(posixpath.join(posixpath.dirname(filename), path))
        else:
            target = filename
        if not target or path.endswith("/"):
            target = target.rstrip("/") + "/index.html" if target else "index.html"
        if not (ROOT / target).is_file():
            errors.append(f"{filename}: missing asset/page {link}")
        elif parts.fragment and target in pages and unquote(parts.fragment) not in pages[target].ids:
            errors.append(f"{filename}: missing anchor {link}")
        checked += 1

if not pages:
    errors.append("No generated pages to check")
if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"OK: {len(pages)} HTML pages, {checked} links/assets/anchors inside {BASE}")
