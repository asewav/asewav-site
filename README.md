# ASE WAV Website

Static website for `asewav.com`, deployed through Cloudflare Pages from this repository. No build step is required.

## Local Preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. The site uses root-relative links, so serve the repository root rather than opening an individual HTML file.

## Checks

```sh
python3 tests/check_site.py
```

These offline checks cover local links and assets, canonical URLs, unique IDs, product prices, checkout URLs, MailerLite form destinations, sitemap entries, and legacy homepage anchors. They do not send subscriptions or make purchases.

Before publishing, also check desktop and mobile layout, menu keyboard behavior, audio playback and seeking, page previews, and form validation in a browser.

## Product And Asset Rules

- Modern R&B Chords for Producers: $27; 124-page ebook, 439 MIDI files, 25 progressions, 50 chord starters.
- Tonnetz Chart for Producers: $9.99; 37-page PDF only, with no physical item, MIDI, or audio files.
- Free pack: 10 progressions, 10 MIDI files, and two PDF guides.
- Keep the exact owner-approved checkout URLs and the two separate MailerLite form destinations.
- Public previews live in `assets/`. Optimized WebP copies in `assets/previews/` derive from existing artwork and the free guide's first page. Full-resolution sample pages remain available on demand.
- `assets/icons.svg` contains a subset of Lucide icons; its license is in `assets/lucide-LICENSE.txt`.
- Do not put paid customer PDFs, MIDI archives, credentials, or private project notes in this public repository.

## Publishing

Work on a separate branch and use a pull request to review its Cloudflare preview. Merge into `main` only after publication is approved. Keep existing indexed URLs and the Google verification file intact.
