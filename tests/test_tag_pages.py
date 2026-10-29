import atexit
import pathlib
import re
import shutil
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIXTURE_DIR = ROOT / "content" / "recommendations" / "_test_tag_pages"

# probe-case is spelled with different letter case on two articles: one tag.
# probe-pair is on one article until the second build adds a second.
ARTICLES = {
    "a": ["probe-solo", "probe-pair", "probe-triple", "Probe-Case"],
    "b": ["probe-triple", "probe-case"],
    "c": ["probe-triple"],
}
SECOND_PAIR_ARTICLE = {"d": ["probe-pair"]}


def _cleanup_fixture():
    if FIXTURE_DIR.exists():
        shutil.rmtree(FIXTURE_DIR, ignore_errors=True)


atexit.register(_cleanup_fixture)


def _write_articles(articles, root=FIXTURE_DIR):
    for slug, tags in articles.items():
        article_dir = root / slug
        article_dir.mkdir(parents=True, exist_ok=True)
        tag_list = ", ".join(f'"{tag}"' for tag in tags)
        (article_dir / "index.md").write_text(
            f"---\ntitle: Tag Probe {slug}\ndate: 2025-01-01\n"
            f"description: Tag page fixture\ntags: [{tag_list}]\n---\nBody\n",
            encoding="utf-8",
        )


def _build(articles):
    _cleanup_fixture()
    _write_articles(articles)
    destination = pathlib.Path(tempfile.mkdtemp())
    subprocess.run(
        ["hugo", "--minify", "-d", str(destination)],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return destination


def _build_isolated(articles):
    """Build a copy of the repo whose only articles are the fixtures."""
    site = pathlib.Path(tempfile.mkdtemp())
    shutil.copytree(
        ROOT,
        site,
        dirs_exist_ok=True,
        ignore=shutil.ignore_patterns(
            ".git", "content", "node_modules", "public", "resources"
        ),
    )
    shutil.copytree(ROOT / "content" / "tags", site / "content" / "tags")
    _write_articles(articles, site / "content" / "recommendations" / "_test_tag_pages")
    destination = pathlib.Path(tempfile.mkdtemp())
    subprocess.run(
        ["hugo", "--minify", "-d", str(destination)],
        cwd=site,
        check=True,
        capture_output=True,
    )
    shutil.rmtree(site, ignore_errors=True)
    return destination


def _article_html(site, slug):
    path = site / "recommendations" / "_test_tag_pages" / slug / "index.html"
    return path.read_text(encoding="utf-8")


def _tag_link_count(html, tag):
    return len(re.findall(rf'<a [^>]*href="?/tags/{tag}/', html))


class TestTagPages(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.before = _build(ARTICLES)
        cls.after = _build({**ARTICLES, **SECOND_PAIR_ARTICLE})
        _cleanup_fixture()

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.before, ignore_errors=True)
        shutil.rmtree(cls.after, ignore_errors=True)

    def test_single_use_tag_has_no_page_and_is_a_plain_label(self):
        """A tag on one article has no page, no link, and no index entry."""
        self.assertFalse((self.before / "tags" / "probe-solo").exists())
        html = _article_html(self.before, "a")
        self.assertIn("#probe-solo", html)
        self.assertEqual(_tag_link_count(html, "probe-solo"), 0)
        tags_index = (self.before / "tags" / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("probe-solo", tags_index)
        sitemap = (self.before / "sitemap.xml").read_text(encoding="utf-8")
        self.assertNotIn("/tags/probe-solo/", sitemap)

    def test_second_article_turns_the_tag_into_a_page(self):
        """Once a second article has the tag, it is a link, a page, and indexed."""
        self.assertFalse((self.before / "tags" / "probe-pair").exists())
        self.assertTrue((self.after / "tags" / "probe-pair" / "index.html").exists())
        for slug in ("a", "d"):
            with self.subTest(slug=slug):
                self.assertEqual(
                    _tag_link_count(_article_html(self.after, slug), "probe-pair"), 1
                )
        tags_index = (self.after / "tags" / "index.html").read_text(encoding="utf-8")
        self.assertIn("/tags/probe-pair/", tags_index)
        sitemap = (self.after / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("/tags/probe-pair/", sitemap)

    def test_tag_on_three_articles_is_unchanged(self):
        """The two-article rule does not touch a tag that already has a page."""
        self.assertTrue((self.before / "tags" / "probe-triple" / "index.html").exists())
        for slug in ("a", "b", "c"):
            with self.subTest(slug=slug):
                self.assertEqual(
                    _tag_link_count(_article_html(self.before, slug), "probe-triple"), 1
                )

    def test_tag_counts_ignore_letter_case(self):
        """Probe-Case and probe-case are one tag, so both articles link to its page."""
        self.assertTrue((self.before / "tags" / "probe-case" / "index.html").exists())
        for slug in ("a", "b"):
            with self.subTest(slug=slug):
                self.assertEqual(
                    _tag_link_count(_article_html(self.before, slug), "probe-case"), 1
                )


class TestAllSingleUseTags(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.site = _build_isolated({"a": ["solo-one"], "b": ["solo-two"]})

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.site, ignore_errors=True)

    def test_tags_index_renders_empty_state(self):
        """Every tag single-use: /tags/ still exists for the menu link and is empty."""
        self.assertFalse((self.site / "tags" / "solo-one").exists())
        tags_index = (self.site / "tags" / "index.html").read_text(encoding="utf-8")
        self.assertIn("No terms yet.", tags_index)
        self.assertNotIn("/tags/solo-one/", tags_index)


if __name__ == "__main__":
    unittest.main()
