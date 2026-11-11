#!/usr/bin/env python3
"""Verify generated links, metadata and assets for each deployment in CI."""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import posixpath
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="/B-box-docs/")
parser.add_argument("--origin", default="https://giturass.github.io")
parser.add_argument("--no-index", action="store_true")
args = parser.parse_args()

ROOT = Path(__file__).resolve().parents[1] / "docs/.vitepress/dist"
BASE = args.base
ORIGIN = args.origin.rstrip("/")


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []
        self.canonicals = []
        self.og_urls = []
        self.robots = []
        self.feed(text)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href"))
        if tag == "meta" and attrs.get("property") == "og:url":
            self.og_urls.append(attrs.get("content"))
        if tag == "meta" and attrs.get("name") == "robots":
            self.robots.append(attrs.get("content", ""))
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for attribute in ("href", "src"):
            if attrs.get(attribute):
                self.links.append(attrs[attribute])


pages = {path.relative_to(ROOT).as_posix(): Page(path.read_text()) for path in ROOT.rglob("*.html")}
errors = []
checked = 0
canonical_urls = set()
for filename, page in pages.items():
    public_path = filename.removesuffix("index.html") if filename == "index.html" or filename.endswith("/index.html") else filename
    expected_url = ORIGIN + BASE + public_path
    canonical_urls.add(expected_url)
    if page.canonicals != [expected_url] or page.og_urls != [expected_url]:
        errors.append(f"{filename}: canonical/og:url must both be {expected_url}")
    if filename != "404.html" and any("noindex" in value for value in page.robots) != args.no_index:
        errors.append(f"{filename}: unexpected robots indexing policy")
    for link in page.links:
        parts = urlsplit(link)
        if parts.scheme or parts.netloc:
            continue
        path = unquote(parts.path)
        if path.startswith("/"):
            if not path.startswith(BASE):
                errors.append(f"{filename}: URL escaped deployment base {BASE}: {link}")
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

sitemap = ROOT / "sitemap.xml"
if args.no_index:
    if sitemap.exists():
        errors.append("Preview builds must not publish a sitemap")
else:
    if not sitemap.is_file():
        errors.append("Missing production sitemap")
    else:
        locations = [node.text for node in ET.parse(sitemap).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
        if not locations:
            errors.append("Production sitemap is empty")
        for location in locations:
            if location not in canonical_urls:
                errors.append(f"Sitemap URL does not match a generated page: {location}")
if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"OK: {len(pages)} HTML pages, {checked} links/assets/anchors inside {BASE}, metadata for {ORIGIN}")
