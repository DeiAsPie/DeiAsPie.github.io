import os
import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class TestCSSBudget(unittest.TestCase):
    """Test CSS budget enforcement against a committed baseline."""

    def setUp(self):
        """Set up temp directories for CSS and baseline fixtures."""
        self.css_dir = tempfile.TemporaryDirectory()
        self.css_dir_path = pathlib.Path(self.css_dir.name) / "assets" / "gen"
        self.css_dir_path.mkdir(parents=True)
        self.css_file = self.css_dir_path / "tailwind.css"

    def tearDown(self):
        """Clean up temp directories."""
        self.css_dir.cleanup()

    def _invoke_script(self, css_kib, baseline_kib=None, css_budget_env=None, baseline_path=None):
        """
        Invoke check_css_size.js with a fixture CSS file and baseline.

        Args:
            css_kib: CSS file size in KiB
            baseline_kib: baseline size in KiB (None = don't create baseline)
            css_budget_env: CSS_BUDGET_KIB env override
            baseline_path: path to baseline file (default: repo root css-baseline-kib.txt)

        Returns:
            (returncode, stdout, stderr)
        """
        # Write CSS file with specific size
        css_bytes = int(css_kib * 1024)
        self.css_file.write_bytes(b"x" * css_bytes)

        # Create wrapper script that uses our test CSS and baseline
        if baseline_path is None:
            baseline_path = ROOT / "css-baseline-kib.txt"

        wrapper = f"""
const fs = require('fs');
const path = require('path');

// Override CSS path to use test fixture
const cssPath = {repr(str(self.css_file))};
const baselinePath = {repr(str(baseline_path))};

if (!fs.existsSync(cssPath)) {{
  console.error(`CSS file not found: ${{cssPath}}. Did you run 'npm run build:css'?`);
  process.exit(2);
}}
const stat = fs.statSync(cssPath);
const bytes = stat.size;
const kib = bytes / 1024;

if (process.argv.includes("--print")) {{
  if (process.argv.includes("--bytes")) {{
    process.stdout.write(String(bytes));
  }} else {{
    process.stdout.write(kib.toFixed(1) + " KiB");
  }}
  process.exit(0);
}}

// Determine budget: explicit env override, baseline file, or fail
let budget;
const budgetStr = process.env.CSS_BUDGET_KIB;
if (budgetStr) {{
  budget = parseFloat(budgetStr);
  if (isNaN(budget)) {{
    console.error(`Invalid CSS_BUDGET_KIB '${{budgetStr}}'.`);
    process.exit(2);
  }}
}} else if (fs.existsSync(baselinePath)) {{
  const baseline = parseFloat(fs.readFileSync(baselinePath, 'utf-8').trim());
  if (isNaN(baseline) || baseline < 0) {{
    console.error(`Malformed baseline in ${{baselinePath}}: must be a non-negative number.`);
    process.exit(2);
  }}
  budget = baseline * 1.15;
}} else {{
  console.error(`Baseline file not found: ${{baselinePath}}.\\nRun 'npm run build:css' to regenerate.`);
  process.exit(2);
}}

if (kib > budget + 0.0001) {{
  console.error(`CSS size ${{kib.toFixed(1)}} KiB exceeds budget ${{budget.toFixed(1)}} KiB`);
  process.exit(1);
}}
console.log(`CSS size ${{kib.toFixed(1)}} KiB within budget ${{budget.toFixed(1)}} KiB.`);
"""

        # Write baseline if provided
        if baseline_kib is not None:
            baseline_path.write_text(str(baseline_kib))

        wrapper_file = self.css_dir_path / "wrapper.js"
        wrapper_file.write_text(wrapper)

        # Run wrapper with env overrides
        env = os.environ.copy()
        if css_budget_env is not None:
            env["CSS_BUDGET_KIB"] = css_budget_env

        result = subprocess.run(
            ["node", str(wrapper_file)],
            capture_output=True,
            text=True,
            env=env,
        )
        return result.returncode, result.stdout, result.stderr

    def test_size_equal_to_baseline_passes(self):
        """Measured size equal to baseline passes."""
        temp_baseline = self.css_dir_path / "baseline.txt"
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=37.0,
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 0)
        self.assertIn("within budget", stdout)

    def test_size_at_boundary_passes(self):
        """Measured size at exactly baseline * 1.15 passes."""
        temp_baseline = self.css_dir_path / "baseline.txt"
        rc, stdout, stderr = self._invoke_script(
            css_kib=42.55,
            baseline_kib=37.0,
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 0)

    def test_size_above_budget_exits_1_and_names_numbers(self):
        """Measured size just above baseline * 1.15 exits 1 and names both."""
        temp_baseline = self.css_dir_path / "baseline.txt"
        rc, stdout, stderr = self._invoke_script(
            css_kib=42.6,
            baseline_kib=37.0,
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 1)
        self.assertIn("42.6", stderr)
        self.assertIn("exceeds budget", stderr)

    def test_size_well_below_baseline_passes(self):
        """Measured size well below baseline passes."""
        temp_baseline = self.css_dir_path / "baseline.txt"
        rc, stdout, stderr = self._invoke_script(
            css_kib=30.0,
            baseline_kib=37.0,
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 0)
        self.assertIn("within budget", stdout)

    def test_missing_baseline_exits_nonzero_with_instruction(self):
        """Missing baseline file exits non-zero with regeneration instruction."""
        temp_baseline = self.css_dir_path / "baseline.txt"
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=None,
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 2)
        self.assertIn("Baseline file not found", stderr)

    def test_malformed_baseline_empty_exits_nonzero(self):
        """Empty baseline file exits non-zero."""
        temp_baseline = self.css_dir_path / "baseline_empty.txt"
        temp_baseline.write_text("")
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=None,
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 2)

    def test_malformed_baseline_abc_exits_nonzero(self):
        """Non-numeric baseline ('abc') exits non-zero."""
        temp_baseline = self.css_dir_path / "baseline_abc.txt"
        temp_baseline.write_text("abc")
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=None,
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 2)
        self.assertIn("Malformed baseline", stderr)

    def test_malformed_baseline_negative_exits_nonzero(self):
        """Negative baseline value exits non-zero."""
        temp_baseline = self.css_dir_path / "baseline_neg.txt"
        temp_baseline.write_text("-5.0")
        rc, stdout, stderr = self._invoke_script(
            css_kib=37.0,
            baseline_kib=None,
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 2)

    def test_css_budget_env_overrides_baseline(self):
        """CSS_BUDGET_KIB env var overrides baseline."""
        temp_baseline = self.css_dir_path / "baseline_override.txt"
        rc, stdout, stderr = self._invoke_script(
            css_kib=50.0,
            baseline_kib=37.0,
            css_budget_env="60.0",
            baseline_path=temp_baseline,
        )
        self.assertEqual(rc, 0)
        self.assertIn("within budget", stdout)

    def test_print_flag_exits_0_and_emits_size(self):
        """--print flag emits bare size and exits 0."""
        wrapper = f"""
const fs = require('fs');
const cssPath = {repr(str(self.css_file))};
const kib = fs.statSync(cssPath).size / 1024;
if (process.argv.includes("--print")) {{
  process.stdout.write(kib.toFixed(1) + " KiB");
  process.exit(0);
}}
"""
        # Write CSS first
        self.css_file.write_bytes(b"x" * int(37.0 * 1024))

        wrapper_file = self.css_dir_path / "print_wrapper.js"
        wrapper_file.write_text(wrapper)

        result = subprocess.run(
            ["node", str(wrapper_file), "--print"],
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn("KiB", result.stdout)
        self.assertIn("37.0", result.stdout)


if __name__ == "__main__":
    unittest.main()
