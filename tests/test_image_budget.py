import os
import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_image_budgets.js"

DEFAULT_BUDGET_KIB = 512


class TestImageBudget(unittest.TestCase):
    """Test image budget enforcement, the merge-blocking gate run by CI."""

    def setUp(self):
        """Set up a fixture tree the script scans relative to its working directory."""
        self.workdir = tempfile.TemporaryDirectory()
        self.workdir_path = pathlib.Path(self.workdir.name)

    def tearDown(self):
        """Clean up the fixture tree."""
        self.workdir.cleanup()

    def _write_image(self, bundle, size_kib):
        """Write a fixture image of a given size into content/recommendations/<bundle>."""
        bundle_dir = self.workdir_path / "content" / "recommendations" / bundle
        bundle_dir.mkdir(parents=True, exist_ok=True)
        (bundle_dir / "cover.png").write_bytes(b"x" * int(size_kib * 1024))

    def _write_static_image(self, size_kib):
        """Write a fixture image into static/images, the bundle that once had its own budget."""
        static_dir = self.workdir_path / "static" / "images"
        static_dir.mkdir(parents=True, exist_ok=True)
        (static_dir / "logo.png").write_bytes(b"x" * int(size_kib * 1024))

    def _invoke_script(self, budget_env=None, extra_args=None):
        """
        Invoke check_image_budgets.js against the fixture tree.

        Returns:
            (returncode, stdout, stderr)
        """
        cmd = ["node", str(SCRIPT)]
        if extra_args:
            cmd.extend(extra_args)

        env = os.environ.copy()
        if budget_env is not None:
            env["IMAGE_BUDGET_KIB"] = budget_env

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=self.workdir_path,
            env=env,
        )
        return result.returncode, result.stdout, result.stderr

    def test_bundle_within_budget_passes(self):
        """A bundle under the default budget exits 0."""
        self._write_image("signal", DEFAULT_BUDGET_KIB - 1)
        rc, stdout, _ = self._invoke_script()
        self.assertEqual(rc, 0)
        self.assertIn("within their respective budgets", stdout)

    def test_bundle_over_budget_exits_1_and_names_numbers(self):
        """A bundle over the default budget exits 1 and names the bundle and budget."""
        self._write_image("courses", DEFAULT_BUDGET_KIB + 1)
        rc, _, stderr = self._invoke_script()
        self.assertEqual(rc, 1)
        self.assertIn("courses", stderr)
        self.assertIn("exceeds budget", stderr)
        self.assertIn(f"{float(DEFAULT_BUDGET_KIB):.1f}", stderr)

    def test_every_bundle_shares_one_budget(self):
        """No bundle gets a budget of its own: an oversized second bundle also fails."""
        self._write_image("signal", 1)
        self._write_image("courses", DEFAULT_BUDGET_KIB + 1)
        rc, _, stderr = self._invoke_script()
        self.assertEqual(rc, 1)
        self.assertIn("courses", stderr)
        self.assertNotIn("signal", stderr)

    def test_static_images_held_to_the_same_budget(self):
        """static/images gets no budget of its own: it passes and fails at the same threshold."""
        self._write_static_image(DEFAULT_BUDGET_KIB - 1)
        rc, stdout, _ = self._invoke_script()
        self.assertEqual(rc, 0)
        self.assertIn("within their respective budgets", stdout)

        self._write_static_image(DEFAULT_BUDGET_KIB + 1)
        rc, _, stderr = self._invoke_script()
        self.assertEqual(rc, 1)
        self.assertIn("static/images", stderr)

    def test_env_override_raises_budget(self):
        """IMAGE_BUDGET_KIB applies to every bundle, not just unlisted ones."""
        self._write_image("courses", DEFAULT_BUDGET_KIB + 1)
        rc, stdout, _ = self._invoke_script(budget_env=str(DEFAULT_BUDGET_KIB + 100))
        self.assertEqual(rc, 0)
        self.assertIn("within their respective budgets", stdout)

    def test_env_override_lowers_budget(self):
        """IMAGE_BUDGET_KIB below the default still enforces."""
        self._write_image("signal", 100)
        rc, _, stderr = self._invoke_script(budget_env="50")
        self.assertEqual(rc, 1)
        self.assertIn("exceeds budget", stderr)

    def test_malformed_budget_exits_2(self):
        """Non-numeric IMAGE_BUDGET_KIB exits 2 rather than silently passing."""
        self._write_image("signal", 1)
        rc, _, stderr = self._invoke_script(budget_env="abc")
        self.assertEqual(rc, 2)
        self.assertIn("Invalid IMAGE_BUDGET_KIB", stderr)

    def test_no_images_exits_0(self):
        """An empty tree reports no images and exits 0."""
        rc, stdout, _ = self._invoke_script()
        self.assertEqual(rc, 0)
        self.assertIn("No images found", stdout)


if __name__ == "__main__":
    unittest.main()
