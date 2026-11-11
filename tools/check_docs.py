#!/usr/bin/env python3
"""Check documentation sources without installing dependencies or building."""

import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
errors = []
links = 0
blocks = 0


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def check_json(text, label):
    global blocks
    try:
        json.loads(text, object_pairs_hook=unique_object)
        blocks += 1
    except (ValueError, json.JSONDecodeError) as error:
        errors.append(f"{label}: {error}")


def check_link(source, target):
    global links
    target = target.strip("<>")
    parsed = urlsplit(target)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return
    path = unquote(parsed.path)
    if path.startswith("/"):
        relative = path.removeprefix("/B-box-docs/").lstrip("/")
        candidate = DOCS / relative
        public = DOCS / "public" / relative
        if public.is_file():
            links += 1
            return
    else:
        candidate = source.parent / path
    if candidate.suffix == ".html":
        candidate = candidate.with_suffix(".md")
    elif not candidate.suffix:
        candidate = candidate / "index.md" if path.endswith("/") else candidate.with_suffix(".md")
    if not candidate.is_file():
        errors.append(f"{source.relative_to(ROOT)}: missing link target {target}")
    links += 1


pages = sorted(p for p in DOCS.rglob("*.md") if ".vitepress" not in p.parts)
for page in pages:
    text = page.read_text(encoding="utf-8")
    if not re.search(r"^description: .+", text, re.M):
        errors.append(f"{page.relative_to(ROOT)}: missing description")
    for number, match in enumerate(re.finditer(r"^```json[^\n]*\n(.*?)^```\s*$", text, re.M | re.S), 1):
        check_json(match.group(1), f"{page.relative_to(ROOT)} JSON block {number}")
    prose = re.sub(r"^```[^\n]*\n.*?^```\s*$", "", text, flags=re.M | re.S)
    for target in re.findall(r"\[[^\]]+\]\(([^\s)]+)\)", prose):
        check_link(page, target)
    for snippet in re.findall(r"^<<<\s+(@/[^\s{]+)", text, re.M):
        if not (DOCS / snippet[2:]).is_file():
            errors.append(f"{page.relative_to(ROOT)}: missing snippet {snippet}")

for fixture in [ROOT / "vercel.json", ROOT / "package.json", *(DOCS / "public/examples").glob("*.json")]:
    check_json(fixture.read_text(encoding="utf-8"), str(fixture.relative_to(ROOT)))

for source in [DOCS / ".vitepress/config.mts", DOCS / ".vitepress/theme/GuideHome.vue"]:
    for target in re.findall(r"(?:link:\s*|withBase\()['\"](/[^'\"]+)['\"]", source.read_text(encoding="utf-8")):
        check_link(source, target)

script_data = json.loads((DOCS / "public/examples/http-scripts.json").read_text())
cron_data = json.loads((DOCS / "public/examples/cron-cache.json").read_text())
grpc_data = json.loads((DOCS / "public/examples/grpc-scripts.json").read_text())
mirrors = {
    "response.js": script_data["experimental"]["scripts"]["resources"]["response.js"]["data"],
    "dynamic-mock.js": script_data["experimental"]["scripts"]["http"][0]["source"],
    "cron-cache.js": cron_data["experimental"]["scripts"]["cron"][0]["source"],
    "grpc-unary.js": grpc_data["experimental"]["scripts"]["resources"]["grpc-unary.js"]["data"],
}
for filename, embedded in mirrors.items():
    readable = (DOCS / "public/examples" / filename).read_text().strip()
    if readable != embedded.strip():
        errors.append(f"{filename}: downloadable JavaScript and embedded source differ")

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"OK: {len(pages)} pages, {blocks} JSON documents/blocks, {links} local links, snippets and script mirrors")
