import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

FORBIDDEN = [
    'href="{{ " /',
    'printf " /%s"',
    '" , "',
]

INCLUDE_DIRS = [ROOT / "themes", ROOT / "layouts"]
FILE_GLOBS = ["**/*.html", "**/*.htm"]


class TestForbiddenTemplatePatterns(unittest.TestCase):
    def test_no_forbidden_literals_in_templates(self):
        matches = []
        for base in INCLUDE_DIRS:
            for glob in FILE_GLOBS:
                for path in base.glob(glob):
                    try:
                        text = path.read_text(encoding="utf-8")
                    except Exception:
                        # skip unreadable files
                        continue
                    for i, line in enumerate(text.splitlines(), start=1):
                        for pat in FORBIDDEN:
                            if pat in line:
                                matches.append(
                                    (str(path.relative_to(ROOT)), i, line.strip(), pat)
                                )
        if matches:
            msg_lines = [
                "Forbidden template patterns found:",
            ]
            for fn, ln, text, pat in matches:
                msg_lines.append(f"{fn}:{ln}: matched {pat!r} -> {text}")
            self.fail("\n".join(msg_lines))


if __name__ == "__main__":
    unittest.main()
