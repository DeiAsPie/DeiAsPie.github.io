#!/usr/bin/env python3
"""
check_stale_reviews.py
Scans recommendation page bundles under content/recommendations/ to identify
items that have not been reviewed within the specified threshold (default: 90 days).
Evaluates 'lastReviewed' from front matter, falling back to 'date'.
"""

import argparse
import datetime
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
REC_DIR = ROOT / "content" / "recommendations"
DATE_PATTERN = re.compile(r"(\d{4}-\d{2}-\d{2})")


def parse_frontmatter_dates(file_path: pathlib.Path):
    """
    Extracts (lastReviewed, publish_date) strings (YYYY-MM-DD) from front matter.
    """
    try:
        text = file_path.read_text(encoding="utf-8")
    except Exception as exc:
        print(f"Warning: failed to read {file_path}: {exc}", file=sys.stderr)
        return None, None

    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None, None

    last_reviewed = None
    publish_date = None

    for line in lines[1:]:
        stripped = line.strip()
        if stripped == "---":
            break
        if stripped.startswith("lastReviewed:"):
            val = stripped[len("lastReviewed:") :].strip().strip("\"'")
            m = DATE_PATTERN.search(val)
            if m:
                last_reviewed = m.group(1)
        elif stripped.startswith("date:"):
            val = stripped[len("date:") :].strip().strip("\"'")
            m = DATE_PATTERN.search(val)
            if m:
                publish_date = m.group(1)

    return last_reviewed, publish_date


def scan_recommendations(rec_dir: pathlib.Path, current_date: datetime.date, threshold_days: int = 90):
    """
    Scans rec_dir for index.md files and identifies stale reviews.
    """
    results = []
    files = sorted(rec_dir.glob("**/index.md"))

    for file_path in files:
        slug = str(file_path.parent.relative_to(rec_dir))
        last_reviewed, publish_date = parse_frontmatter_dates(file_path)

        source_field = "lastReviewed" if last_reviewed else ("date" if publish_date else None)
        effective_date_str = last_reviewed or publish_date

        if not effective_date_str:
            continue

        try:
            effective_date = datetime.date.fromisoformat(effective_date_str)
        except ValueError:
            continue

        days_elapsed = (current_date - effective_date).days
        is_overdue = days_elapsed > threshold_days

        try:
            file_rel = str(file_path.relative_to(ROOT))
        except ValueError:
            file_rel = str(file_path)

        results.append({
            "slug": slug,
            "file": file_rel,
            "last_reviewed": last_reviewed,
            "date": publish_date,
            "effective_date": effective_date_str,
            "source_field": source_field,
            "days_elapsed": days_elapsed,
            "is_overdue": is_overdue,
        })

    return results


def format_markdown_report(results, threshold_days: int, current_date: datetime.date) -> str:
    total = len(results)
    overdue = [r for r in results if r["is_overdue"]]
    overdue_count = len(overdue)

    lines = [
        "## Recommendation Review Watchdog Report",
        "",
        f"- **Audit date:** {current_date.isoformat()}",
        f"- **Threshold:** {threshold_days} days",
        f"- **Total recommendations scanned:** {total}",
        f"- **Overdue items:** {overdue_count}",
        "",
    ]

    if overdue_count == 0:
        lines.append("All recommendations have been reviewed within the 90-day window.")
        return "\n".join(lines) + "\n"

    lines.extend([
        "The following recommendation pages exceed the review threshold:",
        "",
        "| Recommendation | Effective Date | Source | Days Elapsed |",
        "|---|---|---|---|",
    ])

    # Sort by days elapsed descending (most overdue first)
    for item in sorted(overdue, key=lambda x: x["days_elapsed"], reverse=True):
        lines.append(
            f"| `{item['slug']}` | {item['effective_date']} | {item['source_field']} | {item['days_elapsed']} |"
        )

    lines.append("")
    lines.append(
        "_Note: To refresh an item, verify its recommendations and update `lastReviewed: YYYY-MM-DD` in its front matter._"
    )
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(
        description="Scan recommendation pages for stale review dates (> 90 days)."
    )
    parser.add_argument(
        "--days",
        type=int,
        default=90,
        help="Review threshold in days (default: 90)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in JSON format",
    )
    parser.add_argument(
        "--reference-date",
        type=str,
        default=None,
        help="Override current date (format: YYYY-MM-DD) for deterministic testing",
    )
    parser.add_argument(
        "--content-dir",
        type=str,
        default=None,
        help="Override content directory path for testing",
    )

    args = parser.parse_args()

    if args.reference_date:
        try:
            current_date = datetime.date.fromisoformat(args.reference_date)
        except ValueError:
            print(f"Error: invalid reference date format '{args.reference_date}' (expected YYYY-MM-DD)", file=sys.stderr)
            sys.exit(2)
    else:
        current_date = datetime.datetime.now(datetime.timezone.utc).date()

    rec_dir = pathlib.Path(args.content_dir).resolve() if args.content_dir else REC_DIR

    results = scan_recommendations(rec_dir, current_date=current_date, threshold_days=args.days)
    overdue = [r for r in results if r["is_overdue"]]

    if args.json:
        payload = {
            "audit_date": current_date.isoformat(),
            "threshold_days": args.days,
            "total_scanned": len(results),
            "overdue_count": len(overdue),
            "overdue": overdue,
        }
        print(json.dumps(payload, indent=2))
    else:
        report = format_markdown_report(results, threshold_days=args.days, current_date=current_date)
        print(report, end="")


if __name__ == "__main__":
    main()
