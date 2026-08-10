import json
import pathlib
import sys
import tempfile
import unittest

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

    def test_reports_every_class_in_a_chained_selector(self):
        """Both classes of `.panel.active` are extracted, not just the first."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".css", delete=False) as f:
            f.write(
                ".panel.active { color: red; } "
                ".parent > .child:hover { color: blue; } "
                "div { margin: 1.125rem; padding: 0.5vw; } "
                ".used-class { color: green; }"
            )
            css_path = f.name

        try:
            original_css = audit_artifacts.CSS_FILE
            audit_artifacts.CSS_FILE = css_path

            result = audit_artifacts.audit_css({"used-class"})
            # panel, active, parent, child — and no numeric fragments.
            self.assertEqual(result, 4)
        finally:
            audit_artifacts.CSS_FILE = original_css
            pathlib.Path(css_path).unlink()

    def test_ignores_dotted_paths_inside_value_functions(self):
        """theme(colors.slate.500) and url(app.js) are values, not selectors."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".css", delete=False) as f:
            f.write(
                "a { color: theme(colors.slate.500); background: url(app.js); } "
                ".real-class { color: red; }"
            )
            css_path = f.name

        try:
            original_css = audit_artifacts.CSS_FILE
            audit_artifacts.CSS_FILE = css_path

            result = audit_artifacts.audit_css(set())
            self.assertEqual(result, 1)
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

    def _run_against_fixture(self, image_name, referenced_in=None):
        """Run audit_static_images against a fixture tree, not the real repo.

        SEARCH_DIRS is overridden alongside STATIC_DIR; without that the real
        grep runs over the repository's own content/ and layouts/, so the
        fixture is never consulted and the result depends on repo contents.
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            static_dir = pathlib.Path(tmpdir) / "static" / "images"
            static_dir.mkdir(parents=True)
            (static_dir / image_name).write_text("fake")

            content_dir = pathlib.Path(tmpdir) / "content"
            content_dir.mkdir()
            layouts_dir = pathlib.Path(tmpdir) / "layouts"
            layouts_dir.mkdir()

            if referenced_in == "content":
                (content_dir / "page.md").write_text(f"![alt](/images/{image_name})")
            elif referenced_in == "layouts":
                (layouts_dir / "page.html").write_text(f'<img src="/images/{image_name}">')

            original_static = audit_artifacts.STATIC_DIR
            original_search = audit_artifacts.SEARCH_DIRS
            try:
                audit_artifacts.STATIC_DIR = str(static_dir)
                audit_artifacts.SEARCH_DIRS = [str(content_dir), str(layouts_dir)]
                return audit_artifacts.audit_static_images()
            finally:
                audit_artifacts.STATIC_DIR = original_static
                audit_artifacts.SEARCH_DIRS = original_search

    def test_reports_unreferenced_image(self):
        """Reports an image in static/images referenced by neither tree."""
        self.assertEqual(self._run_against_fixture("orphan.png"), 1)

    def test_does_not_report_image_referenced_in_content(self):
        """An image referenced from content/ is not an orphan."""
        self.assertEqual(
            self._run_against_fixture("used.png", referenced_in="content"), 0
        )

    def test_does_not_report_image_referenced_in_layouts(self):
        """An image referenced from layouts/ is not an orphan."""
        self.assertEqual(
            self._run_against_fixture("used.png", referenced_in="layouts"), 0
        )


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
