import pathlib
import re
import tomllib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class TestDocTruth(unittest.TestCase):
    def setUp(self):
        self.readme_text = (ROOT / "README.md").read_text(encoding="utf-8")
        self.hugo_toml_text = (ROOT / "hugo.toml").read_text(encoding="utf-8")
        self.responsive_image_text = (
            ROOT / "layouts" / "partials" / "responsive-image.html"
        ).read_text(encoding="utf-8")
        self.ci_workflow_text = (
            ROOT / ".github" / "workflows" / "ci.yml"
        ).read_text(encoding="utf-8")

    def test_goldmark_unsafe_parity(self):
        """Assert hugo.toml configures unsafe = false and README.md documents it accurately."""
        self.assertIn(
            "unsafe = false",
            self.hugo_toml_text,
            "hugo.toml must configure unsafe = false for Goldmark renderer",
        )
        self.assertIn(
            "unsafe = false",
            self.readme_text,
            "README.md must document Goldmark configured with unsafe = false",
        )
        self.assertNotIn(
            "unsafe = true",
            self.readme_text,
            "README.md must not state Goldmark is configured with unsafe = true",
        )

    def test_image_format_parity(self):
        """Assert responsive-image.html does not generate AVIF and README.md does not claim AVIF."""
        self.assertNotIn(
            "image/avif",
            self.responsive_image_text,
            "layouts/partials/responsive-image.html does not generate AVIF",
        )
        self.assertIn(
            "image/webp",
            self.responsive_image_text,
            "layouts/partials/responsive-image.html must generate WebP",
        )
        self.assertNotIn(
            "AVIF/WebP",
            self.readme_text,
            "README.md must not claim AVIF/WebP image generation when AVIF is not generated",
        )
        self.assertIn(
            "WebP",
            self.readme_text,
            "README.md must document WebP image generation",
        )

    def test_audit_ci_parity(self):
        """Assert README.md documents that scripts/audit.sh runs in CI."""
        self.assertIn(
            "scripts/audit.sh",
            self.ci_workflow_text,
            ".github/workflows/ci.yml must execute scripts/audit.sh",
        )
        heading = "### On every push and pull request (`.github/workflows/ci.yml`)"
        self.assertIn(
            heading,
            self.readme_text,
            f"README.md must contain heading '{heading}'",
        )
        ci_tail = self.readme_text.split(heading)[1]
        ci_section = re.split(r"(?m)^#{1,3}\s+", ci_tail)[0]
        self.assertIn(
            "scripts/audit.sh",
            ci_section,
            "README.md CI section must document audit execution via scripts/audit.sh",
        )

    def test_readme_title_matches_site_title(self):
        """Assert the README H1 is the site title from hugo.toml."""
        site_title = tomllib.loads(self.hugo_toml_text)["title"]
        first_line = self.readme_text.splitlines()[0]
        self.assertEqual(
            first_line,
            f"# {site_title}",
            "README.md H1 must equal the title in hugo.toml",
        )

    def test_removed_claims_stay_removed(self):
        """Assert README.md does not repeat claims the site does not meet."""
        removed_claims = [
            "Yet Another Educational Resource",
            "Dark mode is the default",
            "WCAG 2.2",
            "noindex",
            "report-only",
            "report-uri",
            "prefetch-nav",
            "`Article` (every page)",
        ]
        for claim in removed_claims:
            with self.subTest(claim=claim):
                self.assertNotIn(claim, self.readme_text)

    def test_readme_has_no_known_gaps_heading(self):
        """Assert README.md does not replace deleted claims with a gaps list."""
        gap_heading = re.search(
            r"(?mi)^#{1,6}\s+.*(known gaps|limitations)", self.readme_text
        )
        self.assertIsNone(gap_heading, "README.md must not list known gaps")


if __name__ == "__main__":
    unittest.main()
