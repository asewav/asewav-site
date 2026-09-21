"""Offline checks for the public pages, product facts, and signup destinations."""

import json
from html.parser import HTMLParser
from pathlib import Path
import unittest
from urllib.parse import unquote, urljoin, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://asewav.com/'
PAGES = ('', 'about', 'free', 'free-rnb-midi-chord-pack',
         'rnb-chord-progressions', 'neo-soul-chord-progressions',
         'tonnetz-chart-for-producers')
TONNETZ_CHECKOUT = ('https://shop.asewav.com/buy?cart_links%5B0%5D=xvIMk'
                   '&qty%5BxvIMk%5D=1&s=1&cart_links%5B%5D=xvIMk')
MRC_CHECKOUT = 'https://shop.asewav.com/b/modern-rnb-chords-for-producers'
FREE_FORM = 'https://assets.mailerlite.com/jsonp/2494362/forms/192314599900448052/subscribe'
UPDATES_FORM = 'https://assets.mailerlite.com/jsonp/2494362/forms/192314900700202888/subscribe'


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.nodes, self.schemas = [], []
        self.schema_text = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.nodes.append((tag, attrs))
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.schema_text = ''

    def handle_data(self, text):
        if self.schema_text is not None:
            self.schema_text += text

    def handle_endtag(self, tag):
        if tag == 'script' and self.schema_text is not None:
            self.schemas.extend(json.loads(self.schema_text).get('@graph', []))
            self.schema_text = None

    def tags(self, tag):
        return [attrs for name, attrs in self.nodes if name == tag]


class SiteChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = {name: Page((ROOT / name / 'index.html').read_text()) for name in PAGES}

    def test_metadata_and_ids(self):
        for name, page in self.pages.items():
            with self.subTest(page=name):
                canonical = next(a['href'] for a in page.tags('link') if a.get('rel') == 'canonical')
                self.assertEqual(canonical, urljoin(BASE, name + '/') if name else BASE)
                self.assertEqual(len(page.tags('h1')), 1)
                self.assertTrue(page.schemas)
                ids = [a['id'] for _, a in page.nodes if 'id' in a]
                self.assertEqual(len(ids), len(set(ids)), 'Duplicate HTML id')

    def test_shared_navigation_script(self):
        for name, page in self.pages.items():
            with self.subTest(page=name):
                scripts = [a for a in page.tags('script')
                           if urlparse(a.get('src', '')).path == '/scripts.js']
                self.assertEqual(len(scripts), 1, 'Shared navigation needs its script')
                self.assertIn('defer', scripts[0])

    def test_header_wordmark(self):
        for name, page in self.pages.items():
            with self.subTest(page=name):
                logos = [a for a in page.tags('img')
                         if a.get('src') == '/assets/asewav-wordmark.png']
                self.assertEqual(len(logos), 1)
                self.assertEqual(logos[0].get('alt'), 'ASE WAV')
                self.assertEqual(logos[0].get('width'), '1163')
                self.assertEqual(logos[0].get('height'), '208')

    def test_home_gallery_accessibility_and_scope(self):
        home = self.pages['']
        slides = [attrs for _, attrs in home.nodes
                  if attrs.get('aria-roledescription') == 'slide']
        self.assertEqual(len(slides), 3)
        self.assertNotIn('inert', slides[0])
        for slide in slides[1:]:
            self.assertIn('inert', slide)
            self.assertEqual(slide.get('aria-hidden'), 'true')
        for name, page in self.pages.items():
            scripts = [a for a in page.tags('script')
                       if urlparse(a.get('src', '')).path == '/home-gallery.js']
            self.assertEqual(len(scripts), 0 if name else 1)
            if scripts:
                self.assertIn('defer', scripts[0])

    def test_local_links_and_assets(self):
        for name, page in self.pages.items():
            base = urljoin(BASE, name + '/') if name else BASE
            for tag, attrs in page.nodes:
                references = [attrs[key] for key in ('src', 'href') if attrs.get(key)]
                for reference in references:
                    url = urlparse(urljoin(base, reference))
                    if url.hostname != 'asewav.com':
                        continue
                    target = ROOT / unquote(url.path).lstrip('/')
                    if url.path.endswith('/'):
                        target /= 'index.html'
                    with self.subTest(page=name, reference=reference):
                        self.assertTrue(target.is_file(), str(target))
                        if url.fragment and target.suffix == '.html':
                            ids = {a.get('id') for _, a in Page(target.read_text()).nodes}
                            self.assertIn(unquote(url.fragment), ids)
                        if tag == 'img':
                            self.assertTrue(attrs.get('alt'), 'Product image needs alt text')

    def test_product_prices_and_checkout(self):
        for name, price, checkout in (('', '27', MRC_CHECKOUT), ('tonnetz-chart-for-producers', '9.99', TONNETZ_CHECKOUT)):
            page = self.pages[name]
            product = next(n for n in page.schemas if n['@type'] == 'Product')
            self.assertEqual(product['offers']['price'], price)
            self.assertEqual(product['offers']['priceCurrency'], 'USD')
            self.assertEqual(product['offers']['url'], checkout)
        for page in self.pages.values():
            for link in page.tags('a'):
                url = link.get('href', '')
                if urlparse(url).hostname == 'shop.asewav.com':
                    self.assertIn(url, (MRC_CHECKOUT, TONNETZ_CHECKOUT))

    def test_signup_connections(self):
        for name in ('', 'free'):
            actions = [a.get('action') for a in self.pages[name].tags('form')]
            self.assertIn(FREE_FORM, actions)
        self.assertIn(UPDATES_FORM, [a.get('action') for a in self.pages[''].tags('form')])
        for page in self.pages.values():
            for form in page.tags('form'):
                self.assertIn(form.get('action'), (FREE_FORM, UPDATES_FORM))
                self.assertEqual(form.get('method'), 'post')
                self.assertEqual(form.get('target'), '_blank')

    def test_sitemap_and_search_verification(self):
        tree = ET.parse(ROOT / 'sitemap.xml')
        urls = {n.text for n in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
        expected = {urljoin(BASE, name + '/') if name else BASE for name in PAGES}
        self.assertEqual(urls, expected)
        self.assertTrue((ROOT / 'google547a6649ac9a4627.html').is_file())
        self.assertIn('https://asewav.com/sitemap.xml', (ROOT / 'robots.txt').read_text())

    def test_legacy_homepage_anchors(self):
        ids = {a.get('id') for _, a in self.pages[''].nodes}
        self.assertTrue({'top', 'book', 'buy', 'listen', 'sample', 'about', 'faq', 'updates', 'tonnetz'} <= ids)


if __name__ == '__main__':
    unittest.main(verbosity=2)
