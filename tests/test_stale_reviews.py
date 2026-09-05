import datetime
import json
import pathlib
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import check_stale_reviews


class TestStaleReviews(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.rec_dir = pathlib.Path(self.temp_dir.name)
        self.ref_date = datetime.date(2026, 9, 4)

    def tearDown(self):
        self.temp_dir.cleanup()

    def _create_bundle(self, slug: str, content: str):
        bundle_dir = self.rec_dir / slug
        bundle_dir.mkdir(parents=True, exist_ok=True)
        index_file = bundle_dir / "index.md"
        index_file.write_text(content, encoding="utf-8")
        return index_file

    def test_overdue_and_fresh_entries(self):
        """Verify items older than 90 days are flagged as overdue, while fresh items are not."""
        # 95 days before 2026-09-04 is 2026-06-01
        self._create_bundle(
            "old-tool",
            "---\ntitle: Old Tool\ndate: 2026-06-01\n---\nBody text\n",
        )
        # 45 days before 2026-09-04 is 2026-07-21
        self._create_bundle(
            "fresh-tool",
            "---\ntitle: Fresh Tool\ndate: 2026-07-21\n---\nBody text\n",
        )

        results = check_stale_reviews.scan_recommendations(
            self.rec_dir, current_date=self.ref_date, threshold_days=90
        )
        res_by_slug = {r["slug"]: r for r in results}

        self.assertTrue(res_by_slug["old-tool"]["is_overdue"])
        self.assertEqual(res_by_slug["old-tool"]["days_elapsed"], 95)
        self.assertFalse(res_by_slug["fresh-tool"]["is_overdue"])
        self.assertEqual(res_by_slug["fresh-tool"]["days_elapsed"], 45)

    def test_last_reviewed_overrides_date(self):
        """Verify lastReviewed takes precedence over date when both are present."""
        self._create_bundle(
            "updated-tool",
            "---\ntitle: Updated Tool\ndate: 2024-01-01\nlastReviewed: 2026-08-15\n---\nBody text\n",
        )

        results = check_stale_reviews.scan_recommendations(
            self.rec_dir, current_date=self.ref_date, threshold_days=90
        )
        self.assertEqual(len(results), 1)
        item = results[0]
        self.assertEqual(item["source_field"], "lastReviewed")
        self.assertEqual(item["effective_date"], "2026-08-15")
        self.assertEqual(item["days_elapsed"], 20)
        self.assertFalse(item["is_overdue"])

    def test_fallback_to_date_when_last_reviewed_missing(self):
        """Verify fallback to date when lastReviewed is omitted."""
        self._create_bundle(
            "fallback-tool",
            "---\ntitle: Fallback Tool\ndate: 2025-08-13\n---\nBody text\n",
        )

        results = check_stale_reviews.scan_recommendations(
            self.rec_dir, current_date=self.ref_date, threshold_days=90
        )
        self.assertEqual(len(results), 1)
        item = results[0]
        self.assertEqual(item["source_field"], "date")
        self.assertEqual(item["effective_date"], "2025-08-13")
        self.assertTrue(item["is_overdue"])

    def test_markdown_report_formatting(self):
        """Verify format_markdown_report outputs table when overdue items exist, and clean message when none."""
        self._create_bundle(
            "stale-item",
            "---\ntitle: Stale Item\ndate: 2025-01-01\n---\nBody text\n",
        )
        results = check_stale_reviews.scan_recommendations(
            self.rec_dir, current_date=self.ref_date, threshold_days=90
        )
        report = check_stale_reviews.format_markdown_report(
            results, threshold_days=90, current_date=self.ref_date
        )
        self.assertIn("Recommendation Review Watchdog Report", report)
        self.assertIn("| `stale-item` | 2025-01-01 | date |", report)
        self.assertIn("**Overdue items:** 1", report)

        # Empty overdue report
        clean_results = [
            {
                "slug": "clean-item",
                "effective_date": "2026-09-01",
                "source_field": "date",
                "days_elapsed": 3,
                "is_overdue": False,
            }
        ]
        clean_report = check_stale_reviews.format_markdown_report(
            clean_results, threshold_days=90, current_date=self.ref_date
        )
        self.assertIn("All recommendations have been reviewed within the 90-day window.", clean_report)

        custom_report = check_stale_reviews.format_markdown_report(
            clean_results, threshold_days=45, current_date=self.ref_date
        )
        self.assertIn("All recommendations have been reviewed within the 45-day window.", custom_report)

    def test_review_watchdog_workflow_configuration(self):
        """Verify .github/workflows/review-watchdog.yml contains required permissions and trigger."""
        wf_path = ROOT / ".github" / "workflows" / "review-watchdog.yml"
        self.assertTrue(wf_path.exists(), "review-watchdog.yml workflow must exist")
        text = wf_path.read_text(encoding="utf-8")
        self.assertIn("issues: write", text)
        self.assertIn("contents: read", text)
        self.assertIn("cron: '0 8 * * 1'", text)
        self.assertIn("workflow_dispatch:", text)
        self.assertIn("review-overdue", text)

    def test_cli_report_file_with_json(self):
        """Verify CLI --report-file writes markdown report while --json outputs JSON to stdout."""
        import subprocess

        self._create_bundle(
            "cli-tool",
            "---\ntitle: CLI Tool\ndate: 2025-01-01\n---\nBody text\n",
        )
        report_file = self.rec_dir / "output_report.md"
        cmd = [
            sys.executable,
            str(ROOT / "scripts" / "check_stale_reviews.py"),
            "--content-dir",
            str(self.rec_dir),
            "--reference-date",
            self.ref_date.isoformat(),
            "--report-file",
            str(report_file),
            "--json",
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        self.assertTrue(report_file.exists(), "--report-file must be created")
        report_text = report_file.read_text(encoding="utf-8")
        self.assertIn("Recommendation Review Watchdog Report", report_text)
        self.assertIn("`cli-tool`", report_text)

        data = json.loads(proc.stdout)
        self.assertEqual(data["total_scanned"], 1)
        self.assertEqual(data["overdue_count"], 1)

    def test_lowercase_lastreviewed_key(self):
        """Verify lowercase 'lastreviewed:' key is recognized identically to 'lastReviewed:'."""
        self._create_bundle(
            "lowercase-tool",
            "---\ntitle: Lowercase Tool\ndate: 2024-01-01\nlastreviewed: 2026-08-15\n---\nBody text\n",
        )
        results = check_stale_reviews.scan_recommendations(
            self.rec_dir, current_date=self.ref_date, threshold_days=90
        )
        self.assertEqual(len(results), 1)
        item = results[0]
        self.assertEqual(item["source_field"], "lastReviewed")
        self.assertEqual(item["effective_date"], "2026-08-15")
        self.assertFalse(item["is_overdue"])

    def test_invalid_date_logs_warning_and_falls_back(self):
        """Verify invalid calendar date in lastReviewed logs warning and falls back to publish date."""
        import io

        self._create_bundle(
            "invalid-date-tool",
            "---\ntitle: Invalid Date Tool\ndate: 2026-07-01\nlastReviewed: 2026-02-31\n---\nBody text\n",
        )
        old_stderr = sys.stderr
        sys.stderr = io.StringIO()
        try:
            results = check_stale_reviews.scan_recommendations(
                self.rec_dir, current_date=self.ref_date, threshold_days=90
            )
            stderr_val = sys.stderr.getvalue()
        finally:
            sys.stderr = old_stderr

        self.assertIn("Warning: invalid date", stderr_val)
        self.assertEqual(len(results), 1)
        item = results[0]
        self.assertEqual(item["source_field"], "date")
        self.assertEqual(item["effective_date"], "2026-07-01")

    def test_review_watchdog_workflow_safe_null_and_single_scanner(self):
        """Verify review-watchdog.yml queries open issues and uses single scanner execution."""
        wf_path = ROOT / ".github" / "workflows" / "review-watchdog.yml"
        text = wf_path.read_text(encoding="utf-8")
        self.assertIn(".[].number", text)
        self.assertIn("--report-file", text)
        self.assertNotIn("subprocess.check_output", text)


if __name__ == "__main__":
    unittest.main()
