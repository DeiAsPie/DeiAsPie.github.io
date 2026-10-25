import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
WORKFLOWS_DIR = ROOT / ".github" / "workflows"

FAST_CHECK_COMMANDS = [
    "npm run build",
    "node scripts/check_css_size.js",
    "npm run size:images:check",
    "npm run lint:content",
    "npm run lint:markdown",
    "npm run lint",
    "pytest -q",
]

JOB_KEY = re.compile(r"^  ([A-Za-z0-9_-]+):\s*$")


def job_blocks(workflow_text):
    """Split workflow text into {job name: block text} for keys under jobs:."""
    blocks = {}
    current = None
    in_jobs = False
    for line in workflow_text.splitlines():
        if line == "jobs:":
            in_jobs = True
            continue
        if line and not line[0].isspace() and not line.startswith("#"):
            in_jobs = False
        if not in_jobs:
            continue
        key = JOB_KEY.match(line)
        if key:
            current = key.group(1)
            blocks[current] = []
        elif current is not None:
            blocks[current].append(line)
    return {name: "\n".join(lines) for name, lines in blocks.items()}


def job_block(workflow_text, name):
    """Return one job block; fail with a message naming the job if it is absent."""
    blocks = job_blocks(workflow_text)
    if name not in blocks:
        raise AssertionError(f"job {name!r} not found under jobs: in workflow text")
    return blocks[name]


def needs_of(block):
    match = re.search(r"^    needs:[ \t]*(.*)$", block, re.MULTILINE)
    if match is None:
        return []
    return [item.strip() for item in match.group(1).strip("[] \t").split(",") if item.strip()]


def publish_needs_only_verify(workflow_text):
    return needs_of(job_block(workflow_text, "publish")) == ["verify"]


def has_run_line(block, command):
    values = re.findall(r"^[ \t]*(?:-[ \t]+)?run:[ \t]*(.*?)[ \t]*$", block, re.MULTILINE)
    return command in values


def publish_if(block):
    match = re.search(r"^    if:[ \t]*(.*)$", block, re.MULTILINE)
    return match.group(1) if match else ""


class TestWorkflowGate(unittest.TestCase):
    def setUp(self):
        self.ci_text = (WORKFLOWS_DIR / "ci.yml").read_text(encoding="utf-8")
        self.publish = job_block(self.ci_text, "publish")
        self.verify = job_block(self.ci_text, "verify")

    def test_publish_needs_only_verify(self):
        """publish must need verify and nothing else."""
        self.assertTrue(
            publish_needs_only_verify(self.ci_text),
            "publish must need verify and nothing else",
        )

    def test_browser_audit_is_off_publish_path(self):
        """browser-audit is not a publish dependency and still runs smoke and audit."""
        self.assertNotIn("browser-audit", needs_of(self.publish))
        browser_audit = job_block(self.ci_text, "browser-audit")
        self.assertIn("npm run test:smoke", browser_audit)
        self.assertIn("scripts/audit.sh", browser_audit)

    def test_publish_if_is_main_push_or_dispatch_only(self):
        """publish runs only for push or workflow_dispatch on refs/heads/main."""
        if_expr = publish_if(self.publish)
        self.assertIn("refs/heads/main", if_expr)
        self.assertIn("'push'", if_expr)
        self.assertIn("'workflow_dispatch'", if_expr)
        self.assertNotIn("pull_request", if_expr)

    def test_verify_runs_each_fast_check_as_whole_line(self):
        """Each fast-check command is a whole run: line in verify."""
        for command in FAST_CHECK_COMMANDS:
            with self.subTest(command=command):
                self.assertTrue(
                    has_run_line(self.verify, command),
                    f"verify must run {command!r} as a whole run: line",
                )

    def test_verify_has_no_continue_on_error(self):
        """verify failures must block publish."""
        self.assertNotIn("continue-on-error", self.verify)

    def test_publish_cancel_in_progress_false(self):
        """publish must not cancel an in-flight Pages deploy."""
        self.assertIn("cancel-in-progress: false", self.publish)

    def test_pages_and_id_token_write_only_in_publish(self):
        """pages: write and id-token: write appear only in publish."""
        header = self.ci_text.split("\njobs:", 1)[0]
        self.assertNotIn("pages: write", header)
        self.assertNotIn("id-token: write", header)
        for name, block in job_blocks(self.ci_text).items():
            if name == "publish":
                continue
            with self.subTest(job=name):
                self.assertNotIn("pages: write", block)
                self.assertNotIn("id-token: write", block)
        self.assertIn("pages: write", self.publish)
        self.assertIn("id-token: write", self.publish)

    def test_no_deploy_workflow_or_second_pages_action(self):
        """deploy.yml is gone and no other workflow uses actions/deploy-pages."""
        self.assertFalse(
            (WORKFLOWS_DIR / "deploy.yml").exists(),
            ".github/workflows/deploy.yml must not exist",
        )
        for path in sorted(WORKFLOWS_DIR.glob("*.y*ml")):
            if path.name == "ci.yml":
                continue
            with self.subTest(workflow=path.name):
                self.assertNotIn(
                    "actions/deploy-pages",
                    path.read_text(encoding="utf-8"),
                    f"{path.name} must not reference actions/deploy-pages",
                )

    def test_publish_needs_check_fails_for_browser_audit_dependency(self):
        """Negative case: publish needing browser-audit must fail the needs check."""
        synthetic = (
            "jobs:\n"
            "  verify:\n"
            "    runs-on: ubuntu-latest\n"
            "  browser-audit:\n"
            "    runs-on: ubuntu-latest\n"
            "  publish:\n"
            "    needs: [verify, browser-audit]\n"
            "    runs-on: ubuntu-latest\n"
        )
        self.assertFalse(publish_needs_only_verify(synthetic))

    def test_missing_publish_or_verify_job_is_named(self):
        """Edge case: a missing job fails with a message naming it."""
        no_publish = "jobs:\n  verify:\n    runs-on: ubuntu-latest\n"
        with self.assertRaisesRegex(AssertionError, "'publish'"):
            job_block(no_publish, "publish")
        no_verify = "jobs:\n  publish:\n    needs: verify\n"
        with self.assertRaisesRegex(AssertionError, "'verify'"):
            job_block(no_verify, "verify")


if __name__ == "__main__":
    unittest.main()
