import os
import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_css_size.js"


class TestCSSBudget(unittest.TestCase):
    """Test CSS budget enforcement against a committed baseline."""

    def setUp(self):
        """Set up temp directories for CSS and baseline fixtures."""
        self.css_dir = tempfile.TemporaryDirectory()
        self.css_dir_path = pathlib.Path(self.css_dir.name)
        self.css_file = self.css_dir_path / "tailwind.css"
        self.baseline_file = self.css_dir_path / "baseline.txt"

    def tearDown(self):
        """Clean up temp directories."""
        self.css_dir.cleanup()

    def _invoke_script(self, css_kib, baseline_kib=None, css_budget_env=None, extra_args=None):
        """
        Invoke check_css_size.js with fixture CSS and baseline files.

        Args:
            css_kib: CSS file size in KiB
            baseline_kib: baseline size in KiB (None = don't create baseline)
            css_budget_env: CSS_BUDGET_KIB env override
            extra_args: list of extra command-line arguments

        Returns:
            (returncode, stdout, stderr)
        """
        # Write CSS file with specific size
        css_bytes = int(css_kib * 1024)
        self.css_file.write_bytes(b"x" * css_bytes)

        # Write baseline if provided
        if baseline_kib is not None:
            self.baseline_file.write_text(str(baseline_kib))

        # Build command
        cmd = ["node", str(SCRIPT)]
        if extra_args:
            cmd.extend(extra_args)

        # Build environment with CSS path overrides
        env = os.environ.copy()
        env["CSS_FILE"] = str(self.css_file)
        env["CSS_BASELINE_FILE"] = str(self.baseline_file)
        if css_budget_env is not None:
            env["CSS_BUDGET_KIB"] = css_budget_env

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=env,
        )
        return result.returncode, result.stdout, result.stderr

    def test_size_equal_to_baseline_passes(self):
        """Measured size equal to baseline passes."""
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=37.0,
        )
        self.assertEqual(rc, 0)
        self.assertIn("within budget", stdout)

    def test_size_at_boundary_passes(self):
        """Measured size at exactly baseline * 1.15 passes."""
        rc, stdout, stderr = self._invoke_script(
            css_kib=42.55,
            baseline_kib=37.0,
        )
        self.assertEqual(rc, 0)

    def test_size_above_budget_exits_1_and_names_numbers(self):
        """Measured size just above baseline * 1.15 exits 1 and names both."""
        rc, stdout, stderr = self._invoke_script(
            css_kib=42.6,
            baseline_kib=37.0,
        )
        self.assertEqual(rc, 1)
        self.assertIn("42.6", stderr)
        self.assertIn("exceeds budget", stderr)

    def test_size_well_below_baseline_passes(self):
        """Measured size well below baseline passes."""
        rc, stdout, stderr = self._invoke_script(
            css_kib=30.0,
            baseline_kib=37.0,
        )
        self.assertEqual(rc, 0)
        self.assertIn("within budget", stdout)

    def test_missing_baseline_exits_nonzero_with_instruction(self):
        """Missing baseline file exits non-zero with regeneration instruction."""
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=None,
        )
        self.assertEqual(rc, 2)
        self.assertIn("Baseline file not found", stderr)

    def test_malformed_baseline_empty_exits_nonzero(self):
        """Empty baseline file exits non-zero."""
        self.baseline_file.write_text("")
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=None,
        )
        self.assertEqual(rc, 2)

    def test_malformed_baseline_abc_exits_nonzero(self):
        """Non-numeric baseline ('abc') exits non-zero."""
        self.baseline_file.write_text("abc")
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=None,
        )
        self.assertEqual(rc, 2)
        self.assertIn("Malformed baseline", stderr)

    def test_malformed_baseline_negative_exits_nonzero(self):
        """Negative baseline value exits non-zero."""
        self.baseline_file.write_text("-5.0")
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=None,
        )
        self.assertEqual(rc, 2)

    def test_css_budget_env_overrides_baseline(self):
        """CSS_BUDGET_KIB env var overrides baseline."""
        rc, stdout, stderr = self._invoke_script(
            css_kib=50.0,
            baseline_kib=37.0,
            css_budget_env="60.0",
        )
        self.assertEqual(rc, 0)
        self.assertIn("within budget", stdout)

    def test_print_flag_exits_0_and_emits_size(self):
        """--print flag emits bare size and exits 0."""
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=37.0,
            extra_args=["--print"],
        )
        self.assertEqual(rc, 0)
        self.assertIn("KiB", stdout)
        self.assertIn("37.0", stdout)


if __name__ == "__main__":
    unittest.main()
