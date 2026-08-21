#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys

# Configuration
CONTENT_DIR = "content/recommendations"
STATIC_DIR = "static/images"
# Roots searched for references to a static image. Module-level so tests can
# point them at a fixture tree instead of the real repository.
SEARCH_DIRS = ["content", "layouts"]
STATS_FILE = "hugo_stats.json"
CSS_FILE = "assets/css/main.css"
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".svg", ".webp"}

# Classes added by JS or Hugo internals that might not be in stats
WHITELIST = {
    "dark", "ui-ready", "js-focused", "prose", "card",
    "is-active", "has-submenu", "visually-hidden",
}

def run_build() -> None:
    """Triggers a Hugo production build to refresh stats."""
    try:
        subprocess.run(["npm", "run", "build"], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        sys.exit(1)

def get_used_classes() -> set[str]:
    """Extracts used classes from hugo_stats.json."""
    if not os.path.exists(STATS_FILE):
        # Without the stats file every class looks unused, which would report
        # the whole stylesheet as dead rather than admit the input is missing.
        print(f"{STATS_FILE} not found. Run 'npm run build' first.", file=sys.stderr)
        sys.exit(2)

    with open(STATS_FILE) as f:
        data = json.load(f)

    return set(data.get("htmlElements", {}).get("classes", []))

def audit_css(used_classes: set[str]) -> int:
    """Checks custom CSS for unused classes."""
    if not os.path.exists(CSS_FILE):
        return 0

    with open(CSS_FILE) as f:
        content = f.read()

    # Comments, url() targets, and quoted strings hold file extensions
    # (main.js, index.html) and content values that look like selectors.
    selectors = re.sub(r"/\*.*?\*/", " ", content, flags=re.DOTALL)
    # Value functions carry dotted paths — url(app.js), theme(colors.slate.500)
    # — that are not selectors. The selector functions are excluded because
    # :not(.foo) and :is(.a, .b) really do contain class names.
    selectors = re.sub(
        r"(?<![\w-])(?!(?:not|is|where|has)\()[a-zA-Z-]+\([^()]*\)", " ", selectors
    )
    selectors = re.sub(r"\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'", " ", selectors)

    # A class name cannot start with a digit, which is what rules out decimal
    # fractions such as 1.125rem without needing a lookbehind. A lookbehind
    # here would also reject the second class of a chained `.card.active`.
    found_definitions = re.findall(
        r"\.(-?[_a-zA-Z][\w-]*)(?=[\s,{:.>+~\[)]|$)", selectors
    )

    unused = []
    for cls in set(found_definitions):
        if cls not in used_classes and cls not in WHITELIST:
            unused.append(cls)

    for cls in sorted(unused):
        print(f"unused CSS class: {cls}")

    return len(unused)

def audit_leaf_bundles(fix: bool = False) -> int:
    """Checks Leaf Bundles for unreferenced images."""
    if not os.path.isdir(CONTENT_DIR):
        # os.walk on a missing directory yields nothing, which would report a
        # clean tree rather than admit it never looked at one.
        print(f"{CONTENT_DIR} not found.", file=sys.stderr)
        sys.exit(2)

    total_orphans = 0

    for root, _dirs, files in os.walk(CONTENT_DIR):
        if "index.md" in files:
            index_path = os.path.join(root, "index.md")
            with open(index_path, encoding="utf-8") as f:
                content = f.read()

            bundle_images = [f for f in files if os.path.splitext(f)[1].lower() in IMAGE_EXTS]

            for img in bundle_images:
                # Is it a standard 'logo.*' used by the responsive-image partial?
                if img.startswith("logo."):
                    continue

                # Check for other images used in the bundle (e.g. course images)
                # Courses often use the filename directly in frontmatter or layout
                if not re.search(re.escape(img), content):
                    # Special check: some bundles use the folder name as the image filename (legacy)
                    # or the image is pulled in automatically by a layout (e.g. courses)
                    if "courses" in root:
                        continue

                    img_path = os.path.join(root, img)
                    total_orphans += 1
                    if fix:
                        os.remove(img_path)
                        print(f"removed orphan image: {img_path}")
                    else:
                        print(f"orphan bundle image: {img_path}")

    return total_orphans

def audit_static_images() -> int:
    """Checks static images for project-wide reachability."""
    if not os.path.exists(STATIC_DIR):
        return 0

    static_images = [f for f in os.listdir(STATIC_DIR) if os.path.splitext(f)[1].lower() in IMAGE_EXTS]
    orphans = []

    for img in static_images:
        found = False
        try:
            subprocess.run(["grep", "-r", img, *SEARCH_DIRS], check=True, capture_output=True)
            found = True
        except subprocess.CalledProcessError:
            pass

        if not found:
            orphans.append(os.path.join(STATIC_DIR, img))

    for path in sorted(orphans):
        print(f"orphan static image: {path}")

    return len(orphans)

if __name__ == "__main__":
    fix_mode = "--fix" in sys.argv

    run_build()
    used = get_used_classes()

    css_count = audit_css(used)
    bundle_count = audit_leaf_bundles(fix_mode)
    static_count = audit_static_images()

    total = css_count + bundle_count + static_count
    sys.exit(1 if total > 0 else 0)
