import pathlib
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
        ci_section = self.readme_text.split(
            "### On every push and pull request (`.github/workflows/ci.yml`)"
        )[1].split("## CSP rollout")[0]
        self.assertIn(
            "scripts/audit.sh",
            ci_section,
            "README.md CI section must document audit execution via scripts/audit.sh",
        )


if __name__ == "__main__":
    unittest.main()
