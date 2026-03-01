#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys

# Configuration
CONTENT_DIR = "content/recommendations"
STATIC_DIR = "static/images"
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
        e.stderr.decode()
        sys.exit(1)

def get_used_classes() -> set[str]:
    """Extracts used classes from hugo_stats.json."""
    if not os.path.exists(STATS_FILE):
        return set()

    with open(STATS_FILE) as f:
        data = json.load(f)

    return set(data.get("htmlElements", {}).get("classes", []))

def audit_css(used_classes: set[str]) -> None:
    """Checks custom CSS for unused classes."""
    if not os.path.exists(CSS_FILE):
        return

    with open(CSS_FILE) as f:
        content = f.read()

    # Simple regex to find class definitions like .my-class
    found_definitions = re.findall(r"\.([a-zA-Z0-9_-]+)(?=[\s,{:])", content)

    unused = []
    for cls in set(found_definitions):
        if cls not in used_classes and cls not in WHITELIST:
            # Filter out Tailwind special cases or common numbers
            if not cls.isdigit() and len(cls) > 1:
                unused.append(cls)

    if unused:
        for cls in sorted(unused):
            pass
    else:
        pass

def audit_leaf_bundles(fix: bool = False) -> None:
    """Checks Leaf Bundles for unreferenced images."""
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

    if total_orphans == 0 or not fix:
        pass

def audit_static_images() -> None:
    """Checks static images for project-wide reachability."""
    if not os.path.exists(STATIC_DIR):
        return

    static_images = [f for f in os.listdir(STATIC_DIR) if os.path.splitext(f)[1].lower() in IMAGE_EXTS]
    orphans = []

    for img in static_images:
        found = False
        try:
            # Search in content/ and layouts/
            subprocess.run(["grep", "-r", img, "content", "layouts"], check=True, capture_output=True)
            found = True
        except subprocess.CalledProcessError:
            pass

        if not found:
            orphans.append(os.path.join(STATIC_DIR, img))

    if orphans:
        for _path in sorted(orphans):
            pass
    else:
        pass

if __name__ == "__main__":
    fix_mode = "--fix" in sys.argv

    run_build()
    used = get_used_classes()

    audit_css(used)
    audit_leaf_bundles(fix_mode)
    audit_static_images()
