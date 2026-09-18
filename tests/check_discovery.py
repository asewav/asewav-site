"""Search-discovery safeguards for the static Cloudflare Pages site."""

import unittest
from urllib.robotparser import RobotFileParser
from check_site import BASE, ROOT, PAGES, Page


class DiscoveryChecks(unittest.TestCase):
    def test_real_not_found_page(self):
        # A root 404.html disables Cloudflare Pages' implicit SPA fallback.
        page = Page((ROOT / '404.html').read_text())
        self.assertEqual(len(page.tags('h1')), 1)
        robots = next(a['content'] for a in page.tags('meta') if a.get('name') == 'robots')
        self.assertIn('noindex', robots)
        self.assertFalse(any(a.get('rel') == 'canonical' for a in page.tags('link')))
        self.assertIn('/', [a.get('href') for a in page.tags('a')])
        for tag in ('a', 'link', 'img'):
            for attrs in page.tags(tag):
                path = attrs.get('href', attrs.get('src', '')).split('?')[0]
                self.assertTrue(path.startswith('/'))
                target = ROOT / path.lstrip('/')
                if path.endswith('/'):
                    target /= 'index.html'
                self.assertTrue(target.is_file(), path)

    def test_search_crawlers_can_access_public_pages(self):
        robots = RobotFileParser()
        robots.parse((ROOT / 'robots.txt').read_text().splitlines())
        for bot in ('Googlebot', 'bingbot', 'OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'):
            for page in PAGES:
                with self.subTest(bot=bot, page=page):
                    self.assertTrue(robots.can_fetch(bot, BASE + page))


if __name__ == '__main__':
    unittest.main(verbosity=2)
