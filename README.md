# Kobi — portfolio

Single-page portfolio for Kobi: YouTube thumbnails and Godot games, presented
as two equal halves of the same practice. Static HTML, no build step, no framework.

**Live:** https://its-kobi.github.io/

## Structure

```
index.html          Markup, CSS, translations and lightbox logic
assets/
  favicon.svg       Site icon
  og-cover.jpg      1200×630 social share image
  work/             Seven optimised 1280×720 covers (~0.9 MB total)
robots.txt
sitemap.xml
```

## Sections

1. Hero — one centred statement, no animation, plus a 50/50 split marker
2. Thumbnails — 7 covers in a grid, click to open full size
3. Games — 5 released Godot games with links to itch.io
4. About — short statement and facts
5. Contact — email, Discord (copy button) and socials

## Features

- English / Arabic toggle with `dir="rtl"`, persisted in `localStorage`
- Light / dark theme, follows the OS by default, persisted in `localStorage`
- `?lang=ar` and `?theme=dark` URL options for sharing a specific view
- Accessible lightbox (`<dialog>`, arrow keys, Esc, focus return)
- No reveal animations, parallax, custom cursor, audio or tracking
- Respects `prefers-reduced-motion`

## Editing content

English text appears twice: in the markup (`data-i18n` keys) and in the `T.en`
dictionary at the bottom of `index.html`. Arabic lives in `T.ar`. If you change a
sentence, update both places. Values are written with `textContent`, so no HTML.

Contact details are inline: the email in `mailto:` links, and the Discord username
in `#discordUser` plus the `discordBtn` handler.

## Adding a cover

1. Export a 1280×720 JPG (~quality 90) to `assets/work/`.
2. Duplicate a `.card` block, update `src`, `alt`, the index and `data-index`.
3. Add the same file to the `works` array in the script.
4. Update "07 selected" / `thumbs_side`.

## Games list auto-sync

The games list is driven by `games.json`, which is generated from the public
itch.io profile. A GitHub Action (`.github/workflows/update-games.yml`) refreshes
it every 3 hours, or on demand from the Actions tab, and commits only when
something changed. The five most recent games appear on the page; the rest are
listed in the "Also on itch.io" line.

Local refresh:

```sh
node scripts/update-games.mjs
```

- Non-game projects are skipped via `EXCLUDE` in `scripts/update-games.mjs`.
- Known games use the hand-written English/Arabic copy in `COPY`.
- New games fall back to the short description on itch.io (English) and a
  generic Arabic line. Add a `COPY` entry for translated copy.

## Deploying

GitHub Pages serves the repository root:

```sh
git add .
git commit -m "Redesign portfolio"
git push origin main
```

Changes appear at https://its-kobi.github.io/ within a minute.
