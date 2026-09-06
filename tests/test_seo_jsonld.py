import atexit
import json
import pathlib
import re
import shutil
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"
FIXTURE_DIR = ROOT / "content" / "recommendations" / "_test_review_sample"


def _cleanup_fixture():
    if FIXTURE_DIR.exists():
        shutil.rmtree(FIXTURE_DIR, ignore_errors=True)


atexit.register(_cleanup_fixture)


class TestSeoJsonLd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _cleanup_fixture()
        # Ensure site is built
        if not (PUBLIC_DIR / "recommendations" / "bitwarden" / "index.html").exists():
            subprocess.run(["hugo", "--minify"], cwd=ROOT, check=True, capture_output=True)

    @classmethod
    def tearDownClass(cls):
        _cleanup_fixture()

    def test_bitwarden_article_jsonld(self):
        """Verify recommendation page outputs valid Article JSON-LD with dateModified."""
        html_path = PUBLIC_DIR / "recommendations" / "bitwarden" / "index.html"
        self.assertTrue(html_path.exists(), f"{html_path} must exist")
        content = html_path.read_text(encoding="utf-8")

        match = re.search(r'<script type=["\']?application/ld\+json["\']?>(.*?)</script>', content, re.DOTALL)
        self.assertIsNotNone(match, "Bitwarden page must contain application/ld+json script tag")

        data = json.loads(match.group(1))
        self.assertIn("@graph", data)
        article_nodes = [item for item in data["@graph"] if item.get("@type") == "Article"]
        self.assertEqual(len(article_nodes), 1, "Must contain exactly one Article object in @graph")

        article = article_nodes[0]
        self.assertEqual(article["headline"], "Bitwarden")
        self.assertIn("datePublished", article)
        self.assertIn("dateModified", article)
        self.assertRegex(article["datePublished"], r"^\d{4}-\d{2}-\d{2}$")
        self.assertRegex(article["dateModified"], r"^\d{4}-\d{2}-\d{2}$")

    def test_hugo_rendering_datemodified_precedence(self):
        """Verify Hugo template renders Article JSON-LD dateModified reflecting max(lastReviewed, lastmod)."""
        FIXTURE_DIR.mkdir(parents=True, exist_ok=True)
        fixture_file = FIXTURE_DIR / "index.md"

        try:
            # Case 1: lastReviewed is newer than lastmod -> dateModified should be lastReviewed
            fixture_file.write_text(
                "---\n"
                "title: Test Review Sample\n"
                "date: 2025-01-01\n"
                "lastmod: 2025-06-01\n"
                "lastReviewed: 2026-08-01\n"
                "description: Test fixture\n"
                "---\n"
                "# Test Review Sample\n",
                encoding="utf-8",
            )
            with tempfile.TemporaryDirectory() as tmp_dest:
                subprocess.run(
                    ["hugo", "--minify", "-d", tmp_dest],
                    cwd=ROOT,
                    check=True,
                    capture_output=True,
                )
                rendered_file = pathlib.Path(tmp_dest) / "recommendations" / "_test_review_sample" / "index.html"
                self.assertTrue(rendered_file.exists(), "Hugo must render fixture page")
                content = rendered_file.read_text(encoding="utf-8")
                match = re.search(r'<script type=["\']?application/ld\+json["\']?>(.*?)</script>', content, re.DOTALL)
                self.assertIsNotNone(match, "Rendered page must contain JSON-LD script")
                data = json.loads(match.group(1))
                articles = [item for item in data.get("@graph", []) if item.get("@type") == "Article"]
                self.assertEqual(len(articles), 1, "Must contain exactly one Article object")
                self.assertEqual(
                    articles[0]["dateModified"],
                    "2026-08-01",
                    "dateModified should use lastReviewed when it is newer than lastmod",
                )

            # Case 2: lastmod is newer than lastReviewed -> dateModified should be lastmod (avoids backdating)
            fixture_file.write_text(
                "---\n"
                "title: Test Review Sample\n"
                "date: 2025-01-01\n"
                "lastmod: 2026-09-01\n"
                "lastReviewed: 2026-08-01\n"
                "description: Test fixture\n"
                "---\n"
                "# Test Review Sample\n",
                encoding="utf-8",
            )
            with tempfile.TemporaryDirectory() as tmp_dest:
                subprocess.run(
                    ["hugo", "--minify", "-d", tmp_dest],
                    cwd=ROOT,
                    check=True,
                    capture_output=True,
                )
                rendered_file = pathlib.Path(tmp_dest) / "recommendations" / "_test_review_sample" / "index.html"
                self.assertTrue(rendered_file.exists(), "Hugo must render fixture page")
                content = rendered_file.read_text(encoding="utf-8")
                match = re.search(r'<script type=["\']?application/ld\+json["\']?>(.*?)</script>', content, re.DOTALL)
                self.assertIsNotNone(match, "Rendered page must contain JSON-LD script")
                data = json.loads(match.group(1))
                articles = [item for item in data.get("@graph", []) if item.get("@type") == "Article"]
                self.assertEqual(len(articles), 1, "Must contain exactly one Article object")
                self.assertEqual(
                    articles[0]["dateModified"],
                    "2026-09-01",
                    "dateModified should use lastmod when it is newer than lastReviewed (avoiding backdating)",
                )
        finally:
            _cleanup_fixture()


if __name__ == "__main__":
    unittest.main()

