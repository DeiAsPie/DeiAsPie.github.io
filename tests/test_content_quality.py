import json
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class TestContentQualityDateValidation(unittest.TestCase):
    def test_calendar_date_validation(self):
        script = """
        const { checkFrontMatter } = require('./scripts/check_content_quality.js');
        const invalid1 = checkFrontMatter({ title: 'Test', date: '2026-01-01', lastReviewed: '2026-02-31' });
        const invalid2 = checkFrontMatter({ title: 'Test', date: '2026-01-01', lastreviewed: '2026-04-31' });
        const valid1 = checkFrontMatter({ title: 'Test', date: '2026-01-01', lastReviewed: '2026-02-28' });
        const valid2 = checkFrontMatter({ title: 'Test', date: '2026-01-01', lastreviewed: '2026-08-15' });

        console.log(JSON.stringify({
            invalid1: invalid1.filter(i => i.type === 'frontmatter'),
            invalid2: invalid2.filter(i => i.type === 'frontmatter'),
            valid1: valid1.filter(i => i.type === 'frontmatter'),
            valid2: valid2.filter(i => i.type === 'frontmatter'),
        }));
        """
        proc = subprocess.run(["node", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True)
        res = json.loads(proc.stdout)
        self.assertEqual(len(res["invalid1"]), 1)
        self.assertIn("Invalid lastReviewed date format", res["invalid1"][0]["message"])
        self.assertEqual(len(res["invalid2"]), 1)
        self.assertIn("Invalid lastReviewed date format", res["invalid2"][0]["message"])
        self.assertEqual(len(res["valid1"]), 0)
        self.assertEqual(len(res["valid2"]), 0)


if __name__ == "__main__":
    unittest.main()
