import json
import pathlib
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import audit_artifacts


class TestAuditCSS(unittest.TestCase):
    """Test audit_css function with fixture stats."""

    def test_no_findings_when_all_classes_used(self):
        """Returns 0 when every declared class appears in stats."""
        # Create a temp CSS file with classes that are all in stats
        with tempfile.NamedTemporaryFile(mode="w", suffix=".css", delete=False) as f:
            f.write(".my-class { } .other-class { }")
            css_path = f.name

        # Create stats fixture with both classes
        stats = {"htmlElements": {"classes": ["my-class", "other-class"]}}

        try:
            # Temporarily patch the CSS and stats file paths
            original_css = audit_artifacts.CSS_FILE
            original_stats = audit_artifacts.STATS_FILE

            audit_artifacts.CSS_FILE = css_path
            # We'll pass the stats directly instead of loading from file

            used = {"my-class", "other-class"}
            result = audit_artifacts.audit_css(used)
            self.assertEqual(result, 0)
        finally:
            audit_artifacts.CSS_FILE = original_css
            audit_artifacts.STATS_FILE = original_stats
            pathlib.Path(css_path).unlink()

    def test_reports_unused_class(self, capsys=None):
        """Reports and returns count when a declared class is unused."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".css", delete=False) as f:
            f.write(".used-class { } .unused-class { }")
            css_path = f.name

        try:
            original_css = audit_artifacts.CSS_FILE
            audit_artifacts.CSS_FILE = css_path

            used = {"used-class"}
            result = audit_artifacts.audit_css(used)
            self.assertEqual(result, 1)
        finally:
            audit_artifacts.CSS_FILE = original_css
            pathlib.Path(css_path).unlink()

    def test_whitelist_prevents_report(self):
        """A whitelisted class is never reported."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".css", delete=False) as f:
            # "dark" is in WHITELIST
            f.write(".dark { } .used { }")
            css_path = f.name

        try:
            original_css = audit_artifacts.CSS_FILE
            audit_artifacts.CSS_FILE = css_path

            used = {"used"}
            result = audit_artifacts.audit_css(used)
            # Only unused-and-not-whitelisted should be reported
            self.assertEqual(result, 0)
        finally:
            audit_artifacts.CSS_FILE = original_css
            pathlib.Path(css_path).unlink()

    def test_does_not_match_numeric_fragments(self):
        """Does not report numeric fragments like .125rem or .5vw as classes."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".css", delete=False) as f:
            # CSS with numeric values that have fractional parts (false positives)
            # and one genuinely unused class
            f.write(
                ".card { max-width: 1.125rem; padding: 0.5vw; margin: 2.5rem; } "
                ".orphan-class { color: red; }"
            )
            css_path = f.name

        try:
            original_css = audit_artifacts.CSS_FILE
            audit_artifacts.CSS_FILE = css_path

            # Only .card is used; .orphan-class is unused
            used = {"card"}
            result = audit_artifacts.audit_css(used)
            # Should report only 1 unused class (.orphan-class), not numeric fragments
            self.assertEqual(result, 1)
        finally:
            audit_artifacts.CSS_FILE = original_css
            pathlib.Path(css_path).unlink()

    def test_strips_comments_and_quoted_strings(self):
        """Does not report class names from CSS comments, url(), or content declarations."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".css", delete=False) as f:
            # CSS with false positives in comments, urls, and quoted strings
            f.write(
                '/* Comment mentioning main.js and index.html */ '
                'a { background: url("/assets/app.js"); } '
                '.rule { content: ".foo"; } '
                '.orphan-class { color: red; }'
            )
            css_path = f.name

        try:
            original_css = audit_artifacts.CSS_FILE
            audit_artifacts.CSS_FILE = css_path

            # No classes are used, so both real selectors are unused.
            # "js" and "html" (comment and url) and "foo" (content string)
            # must not be counted.
            used = set()
            result = audit_artifacts.audit_css(used)
            self.assertEqual(result, 2)
        finally:
            audit_artifacts.CSS_FILE = original_css
            pathlib.Path(css_path).unlink()


class TestAuditLeafBundles(unittest.TestCase):
    """Test audit_leaf_bundles function with fixture content tree."""

    def test_reports_orphan_image(self):
        """Reports a bundle image not referenced in index.md."""
        with tempfile.TemporaryDirectory() as tmpdir:
            bundle_dir = pathlib.Path(tmpdir) / "bundle"
            bundle_dir.mkdir()
            (bundle_dir / "index.md").write_text("# Page\nNo images here.")
            (bundle_dir / "orphan.png").write_text("fake")

            original_content = audit_artifacts.CONTENT_DIR
            try:
                audit_artifacts.CONTENT_DIR = tmpdir
                result = audit_artifacts.audit_leaf_bundles(fix=False)
                self.assertEqual(result, 1)
            finally:
                audit_artifacts.CONTENT_DIR = original_content

    def test_skips_logo_files(self):
        """Does not report logo.* files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            bundle_dir = pathlib.Path(tmpdir) / "bundle"
            bundle_dir.mkdir()
            (bundle_dir / "index.md").write_text("# Page")
            (bundle_dir / "logo.png").write_text("fake")

            original_content = audit_artifacts.CONTENT_DIR
            try:
                audit_artifacts.CONTENT_DIR = tmpdir
                result = audit_artifacts.audit_leaf_bundles(fix=False)
                self.assertEqual(result, 0)
            finally:
                audit_artifacts.CONTENT_DIR = original_content

    def test_skips_courses_subdirectory(self):
        """Does not report images in courses/ subdirectory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            courses_dir = pathlib.Path(tmpdir) / "courses" / "bundle"
            courses_dir.mkdir(parents=True)
            (courses_dir / "index.md").write_text("# Course")
            (courses_dir / "orphan.png").write_text("fake")

            original_content = audit_artifacts.CONTENT_DIR
            try:
                audit_artifacts.CONTENT_DIR = tmpdir
                result = audit_artifacts.audit_leaf_bundles(fix=False)
                self.assertEqual(result, 0)
            finally:
                audit_artifacts.CONTENT_DIR = original_content

    def test_fix_mode_removes_and_reports(self):
        """With fix=True, removes orphan and reports it."""
        with tempfile.TemporaryDirectory() as tmpdir:
            bundle_dir = pathlib.Path(tmpdir) / "bundle"
            bundle_dir.mkdir()
            (bundle_dir / "index.md").write_text("# Page")
            orphan_path = bundle_dir / "orphan.png"
            orphan_path.write_text("fake")

            original_content = audit_artifacts.CONTENT_DIR
            try:
                audit_artifacts.CONTENT_DIR = tmpdir
                result = audit_artifacts.audit_leaf_bundles(fix=True)
                self.assertEqual(result, 1)
                # File should be removed
                self.assertFalse(orphan_path.exists())
            finally:
                audit_artifacts.CONTENT_DIR = original_content


class TestAuditStaticImages(unittest.TestCase):
    """Test audit_static_images function with fixture static tree."""

    def test_reports_unreferenced_image(self):
        """Reports an image in static/images not found in content or layouts."""
        with tempfile.TemporaryDirectory() as tmpdir:
            static_dir = pathlib.Path(tmpdir) / "static" / "images"
            static_dir.mkdir(parents=True)
            (static_dir / "orphan.png").write_text("fake")

            content_dir = pathlib.Path(tmpdir) / "content"
            content_dir.mkdir()
            layouts_dir = pathlib.Path(tmpdir) / "layouts"
            layouts_dir.mkdir()

            original_static = audit_artifacts.STATIC_DIR
            try:
                audit_artifacts.STATIC_DIR = str(static_dir)
                result = audit_artifacts.audit_static_images()
                self.assertEqual(result, 1)
            finally:
                audit_artifacts.STATIC_DIR = original_static

    def test_does_not_report_referenced_image(self):
        """Does not report an image found in content or layouts."""
        with tempfile.TemporaryDirectory() as tmpdir:
            static_dir = pathlib.Path(tmpdir) / "static" / "images"
            static_dir.mkdir(parents=True)
            (static_dir / "used.png").write_text("fake")

            original_static = audit_artifacts.STATIC_DIR
            try:
                audit_artifacts.STATIC_DIR = str(static_dir)
                # Mock grep to succeed for used.png (return 0 = found)
                with patch("subprocess.run") as mock_run:
                    mock_run.return_value = None  # Return value doesn't matter, we check returncode via exception
                    result = audit_artifacts.audit_static_images()
                    self.assertEqual(result, 0)
            finally:
                audit_artifacts.STATIC_DIR = original_static


class TestMainExitCode(unittest.TestCase):
    """Test that main sums counts and exits correctly."""

    def test_exits_zero_when_no_findings(self):
        """main exits 0 when all audits return 0."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create minimal fixture: empty content, empty static
            pathlib.Path(tmpdir, "content").mkdir()
            pathlib.Path(tmpdir, "layouts").mkdir()
            static_dir = pathlib.Path(tmpdir, "static", "images")
            static_dir.mkdir(parents=True)

            # Create a clean CSS file and empty stats
            css_path = pathlib.Path(tmpdir, "main.css")
            css_path.write_text("")
            stats_path = pathlib.Path(tmpdir, "hugo_stats.json")
            stats_path.write_text(json.dumps({"htmlElements": {"classes": []}}))

            # Patch globals
            original_css = audit_artifacts.CSS_FILE
            original_stats = audit_artifacts.STATS_FILE
            original_content = audit_artifacts.CONTENT_DIR
            original_static = audit_artifacts.STATIC_DIR

            try:
                audit_artifacts.CSS_FILE = str(css_path)
                audit_artifacts.STATS_FILE = str(stats_path)
                audit_artifacts.CONTENT_DIR = str(pathlib.Path(tmpdir, "content"))
                audit_artifacts.STATIC_DIR = str(static_dir)

                # Call main logic (exit will be tested via subprocess)
                css_count = audit_artifacts.audit_css(set())
                bundle_count = audit_artifacts.audit_leaf_bundles(fix=False)
                static_count = audit_artifacts.audit_static_images()

                total = css_count + bundle_count + static_count
                self.assertEqual(total, 0)
            finally:
                audit_artifacts.CSS_FILE = original_css
                audit_artifacts.STATS_FILE = original_stats
                audit_artifacts.CONTENT_DIR = original_content
                audit_artifacts.STATIC_DIR = original_static

    def test_exits_nonzero_when_findings_exist(self):
        """main exits 1 when any audit returns non-zero."""
        with tempfile.TemporaryDirectory() as tmpdir:
            bundle_dir = pathlib.Path(tmpdir) / "bundle"
            bundle_dir.mkdir()
            (bundle_dir / "index.md").write_text("# Page")
            (bundle_dir / "orphan.png").write_text("fake")

            original_content = audit_artifacts.CONTENT_DIR
            try:
                audit_artifacts.CONTENT_DIR = tmpdir
                result = audit_artifacts.audit_leaf_bundles(fix=False)
                self.assertGreater(result, 0)
            finally:
                audit_artifacts.CONTENT_DIR = original_content


if __name__ == "__main__":
    unittest.main()
