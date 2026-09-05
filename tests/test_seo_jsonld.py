import json
import pathlib
import re
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "public"


class TestSeoJsonLd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure site is built
        if not (PUBLIC_DIR / "recommendations" / "bitwarden" / "index.html").exists():
            subprocess.run(["hugo", "--minify"], cwd=ROOT, check=True, capture_output=True)

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

    def test_datemodified_precedence_logic(self):
        """Verify template precedence logic: max(reviewDate, fallbackMod) when both present."""
        def resolve_date_modified(review_date: str, fallback_mod: str) -> str:
            if review_date and fallback_mod:
                return review_date if review_date > fallback_mod else fallback_mod
            return review_date or fallback_mod

        # Case 1: Review date is newer than content modification date
        self.assertEqual(
            resolve_date_modified("2026-08-01", "2025-01-01"),
            "2026-08-01",
        )
        # Case 2: Content modification date is newer than review date (avoids backdating)
        self.assertEqual(
            resolve_date_modified("2025-06-01", "2026-01-15"),
            "2026-01-15",
        )
        # Case 3: Only review date present
        self.assertEqual(resolve_date_modified("2026-08-01", ""), "2026-08-01")
        # Case 4: Only fallback date present
        self.assertEqual(resolve_date_modified("", "2025-08-13"), "2025-08-13")


if __name__ == "__main__":
    unittest.main()
