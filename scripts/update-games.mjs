// Sync the game list from the public itch.io profile.
// No dependencies: run with `node scripts/update-games.mjs`.
// Writes games.json next to index.html.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROFILE = 'https://kobi-21.itch.io/';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'games.json');

// Projects on itch that are not games, or that should never be listed here.
const EXCLUDE = new Set(['kdocs']);

// Human copy for known games. New games fall back to a generic line on the site.
const COPY = {
  'broken': {
    en: 'A short game made for Sop Game Jam 2026.', ar: 'لعبة قصيرة صُنعت لـ Sop Game Jam 2026.',
    metaEn: 'Game jam · 2026', metaAr: 'جيم جام · 2026'
  },
  'one-more-click': {
    en: 'Built for GMTK Game Jam.', ar: 'صُنعت لـ GMTK Game Jam.',
    metaEn: 'Game jam', metaAr: 'جيم جام'
  },
  'the-annoying-ball': {
    en: 'A ball follows you through a maze. One touch against a wall ends the run.',
    ar: 'كرة تتبعك في متاهة. لمسة واحدة للجدار تنهي الجولة.',
    metaEn: 'Puzzle · 1 hour', metaAr: 'ألغاز · ساعة واحدة'
  },
  'weird-gharib': {
    en: 'A small puzzle experiment, titled in Arabic.', ar: 'تجربة ألغاز صغيرة بعنوان عربي.',
    metaEn: 'Puzzle · Bilingual', metaAr: 'ألغاز · ثنائية اللغة'
  },
  'remember-me': {
    en: 'Remember the path and avoid the fake platforms.', ar: 'تذكّر المسار وتجنّب المنصات المزيفة.',
    metaEn: 'Puzzle · Memory', metaAr: 'ألغاز · ذاكرة'
  },
  'cat-mazz': {
    en: 'A small puzzle game.', ar: 'لعبة ألغاز صغيرة.',
    metaEn: 'Puzzle', metaAr: 'ألغاز'
  }
};

const HEADERS = {
  'User-Agent': 'KobiPortfolioBot/1.0 (+https://its-kobi.github.io/)',
  'Accept': 'text/html,application/xhtml+xml'
};

function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

async function get(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.status === 429) throw new Error('rate limited');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } catch (error) {
      lastError = error;
      await new Promise(r => setTimeout(r, attempt * 2500));
    }
  }
  throw lastError;
}

const html = await get(PROFILE);

// Split the profile grid into one chunk per game card.
const chunks = html.split('data-game_id="').slice(1);
const games = [];
const seen = new Set();

for (const chunk of chunks) {
  const link = chunk.match(/<div class="game_title">\s*<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  if (!link) continue;

  const url = link[1].replace(/\/$/, '');
  const slug = url.split('/').pop();
  const title = decode(link[2]).replace(/\s+!/g, '!');

  if (!slug || seen.has(slug) || EXCLUDE.has(slug)) continue;
  seen.add(slug);

  const cover = chunk.match(/data-lazy_src="(https:\/\/img\.itch\.zone\/[^"]+)"/)
    || chunk.match(/<img[^>]+src="(https:\/\/img\.itch\.zone\/[^"]+)"/);

  const blurb = chunk.match(/<div[^>]*class="game_text"[^>]*title="([^"]*)"/)
    || chunk.match(/<div[^>]*class="game_text"[^>]*>([^<]*)</);

  const copy = COPY[slug] || {};
  games.push({
    title,
    slug,
    url,
    cover: cover ? decode(cover[1]) : null,
    desc_en: copy.en || (blurb ? decode(blurb[1]) : null),
    desc_ar: copy.ar || null,
    meta_en: copy.metaEn || null,
    meta_ar: copy.metaAr || null
  });
}

if (games.length === 0) {
  throw new Error('No games parsed from the itch.io profile — page structure may have changed.');
}

const payload = {
  source: PROFILE,
  updated: new Date().toISOString(),
  total: games.length,
  games
};

// Keep the file stable when nothing actually changed, so scheduled runs
// don't create a commit every few hours.
try {
  const previous = JSON.parse(await readFile(OUT, 'utf8'));
  if (previous && previous.total === games.length && JSON.stringify(previous.games) === JSON.stringify(games)) {
    console.log('No changes — games.json left untouched.');
    process.exit(0);
  }
} catch (error) {
  // No previous file, or it is unreadable: write a fresh one.
}

await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Wrote ${games.length} games to games.json`);
for (const game of games) console.log(`- ${game.title} (${game.url})`);
