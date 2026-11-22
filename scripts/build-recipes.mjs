// Generates the per-recipe pages, the recipe index pages, sitemap.xml and
// robots.txt from the published catalogue in Supabase. Reads with the same
// publishable key the waitlist form uses: the existing RLS policy already
// exposes published catalogue recipes, so no service key is involved.
//
// Run: node scripts/build-recipes.mjs
// Output is deterministic, so a rerun without data changes is a no-op in git.

import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recipeArticle, euro, esc } from './recipe-template.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUPABASE_URL = 'https://zendompobuoihmfxrfzc.supabase.co';
const KEY = 'sb_publishable__sc02lAfmuJH_ngb0w9uQQ_pN3Lid7h';
const SITE = 'https://www.youmechef.com';

const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function rest(path) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
  });
  if (!res.ok) throw new Error(path.split('?')[0] + ' -> HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res.json();
}

// the slug column may not exist until the app migration ran; fall back gracefully
let recipes;
try {
  recipes = await rest('Recipe?select=id,title,slug,defaultPortions,prepMinutes,heroImageUrl,latestPrice&status=eq.PUBLISHED&sourceType=eq.CATALOG&order=title');
} catch {
  recipes = await rest('Recipe?select=id,title,defaultPortions,prepMinutes,heroImageUrl,latestPrice&status=eq.PUBLISHED&sourceType=eq.CATALOG&order=title');
}

const ids = recipes.map((r) => '"' + r.id + '"').join(',');
const lines = await rest('RecipeIngredient?select=recipeId,rawText,notPurchasable&recipeId=in.(' + ids + ')&order=rawText');
const ingredientsByRecipe = {};
for (const l of lines) {
  if (l.notPurchasable) continue;
  const name = l.rawText.trim().toLowerCase();
  if (!name) continue;
  (ingredientsByRecipe[l.recipeId] ??= new Set()).add(name);
}

const seen = new Set();
const items = recipes
  .filter((r) => r.heroImageUrl && r.latestPrice != null)
  .map((r) => {
    let slug = r.slug || slugify(r.title);
    while (seen.has(slug)) slug += '-2';
    seen.add(slug);
    return { ...r, slug, ingredients: [...(ingredientsByRecipe[r.id] ?? [])].sort() };
  });

const skipped = recipes.length - items.length;

if (items.length === 0) {
  throw new Error('no publishable recipes returned, refusing to build an empty catalogue');
}

// All internal links are absolute from the site root, Netlify serves there.
function chrome(lang, { title, desc, canonical, altNl, altEn, image, body }) {
  const t = lang === 'nl'
    ? { home: 'Terug naar home', homeHref: '/', terms: 'Voorwaarden', termsHref: '/voorwaarden/', privacyHref: '/privacy/', supportHref: '/support/', rights: 'Alle rechten voorbehouden.', other: 'EN', otherLang: 'en', otherHref: altEn.replace(SITE, '') }
    : { home: 'Back to home', homeHref: '/en/', terms: 'Terms', termsHref: '/en/terms/', privacyHref: '/en/privacy/', supportHref: '/en/support/', rights: 'All rights reserved.', other: 'NL', otherLang: 'nl', otherHref: altNl.replace(SITE, '') };
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${esc(image || SITE + '/assets/og.jpg')}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.png?v=2">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="nl" href="${altNl}">
<link rel="alternate" hreflang="en" href="${altEn}">
<link rel="stylesheet" href="/styles.css">
</head>
<body>

<header class="nav nav-light">
  <a class="brand" href="${t.homeHref}">
    <img src="/assets/logo.png?v=2" alt="" width="36" height="36">
    <span>Youmechef</span>
  </a>
  <nav>
    <a href="${t.homeHref}">${t.home}</a>
    <a class="lang" href="${t.otherHref}" hreflang="${t.otherLang}" lang="${t.otherLang}">${t.other}</a>
  </nav>
</header>

${body}

<footer class="footer">
  <p>Youmechef</p>
  <p class="micro"><a href="${t.privacyHref}">Privacy</a> &middot; <a href="${t.termsHref}">${t.terms}</a> &middot; <a href="${t.supportHref}">Support</a></p>
  <p class="micro">&copy; <span id="year">2026</span> Youmechef. ${t.rights}</p>
</footer>

<script>
  document.getElementById('year').textContent = new Date().getFullYear();
</script>
<script src="/badges.js" defer></script>

</body>
</html>
`;
}

function recipePage(r, lang) {
  const nlUrl = `${SITE}/recepten/${r.slug}/`;
  const enUrl = `${SITE}/en/recipes/${r.slug}/`;
  const pp = euro(r.latestPrice);
  const metaParts = [];
  if (r.prepMinutes) metaParts.push(r.prepMinutes + ' min');
  metaParts.push(r.defaultPortions + (lang === 'nl' ? ' porties' : ' portions'));
  metaParts.push(pp + (lang === 'nl' ? ' per portie' : ' per portion'));
  const desc = lang === 'nl'
    ? `${r.prepMinutes ? 'Klaar in ' + r.prepMinutes + ' minuten. ' : ''}${pp} per portie, precies afgewogen. Nu in Utrecht.`
    : `${r.prepMinutes ? 'Ready in ' + r.prepMinutes + ' minutes. ' : ''}${pp} per portion, weighed exactly. Now in Utrecht.`;
  const body = '<main class="recipe-page">' + recipeArticle(
    {
      title: r.title,
      imageUrl: r.heroImageUrl,
      prepMinutes: r.prepMinutes,
      portions: r.defaultPortions,
      pricePerPortion: r.latestPrice,
      items: r.ingredients,
    },
    {
      lang,
      eyebrow: lang === 'nl' ? 'Recept' : 'Recipe',
      itemsHeading: lang === 'nl' ? 'Wat erin gaat' : 'What goes in',
      teaseLine: lang === 'nl' ? 'Alle hoeveelheden en stappen staan in de app.' : 'All amounts and steps are in the app.',
      ctaText: lang === 'nl' ? 'Zet me op de wachtlijst' : 'Join the waitlist',
      ctaHref: lang === 'nl' ? '/#waitlist' : '/en/#waitlist',
      backHref: lang === 'nl' ? '/recepten/' : '/en/recipes/',
      backText: lang === 'nl' ? 'Alle recepten' : 'All recipes',
    }
  ) + '</main>';
  return chrome(lang, {
    title: r.title + ' | Youmechef',
    desc,
    canonical: lang === 'nl' ? nlUrl : enUrl,
    altNl: nlUrl,
    altEn: enUrl,
    image: r.heroImageUrl,
    body,
  });
}

function indexPage(lang) {
  const nlUrl = `${SITE}/recepten/`;
  const enUrl = `${SITE}/en/recipes/`;
  const base = lang === 'nl' ? '/recepten/' : '/en/recipes/';
  const cards = items.map((r) => {
    const meta = [];
    if (r.prepMinutes) meta.push(r.prepMinutes + ' min');
    meta.push(euro(r.latestPrice) + (lang === 'nl' ? ' per portie' : ' per portion'));
    return `        <li class="recipe">
          <a href="${base}${r.slug}/">
            <div class="recipe-photo-wrap"><img class="recipe-photo" src="${esc(r.heroImageUrl)}" alt="${esc(r.title)}" width="900" height="600" loading="lazy"></div>
            <div class="recipe-top"><h3>${esc(r.title)}</h3></div>
            <p class="recipe-meta">${meta.join(' &middot; ')}</p>
          </a>
        </li>`;
  }).join('\n');
  const body = `<main class="recipes recipes-standalone">
  <div class="recipes-inner">
    <div class="section-head">
      <h2>${lang === 'nl' ? 'Alle recepten' : 'All recipes'}</h2>
      <p>${lang === 'nl' ? 'Getest, doorgerekend en klaar om te bestellen.' : 'Tested, costed, and ready to order.'}</p>
    </div>
    <ul class="recipe-grid">
${cards}
    </ul>
  </div>
</main>`;
  return chrome(lang, {
    title: (lang === 'nl' ? 'Alle recepten' : 'All recipes') + ' | Youmechef',
    desc: lang === 'nl' ? 'Alle recepten van Youmechef. Precies afgewogen, nu in Utrecht.' : 'All Youmechef recipes. Weighed exactly, now in Utrecht.',
    canonical: lang === 'nl' ? nlUrl : enUrl,
    altNl: nlUrl,
    altEn: enUrl,
    image: null,
    body,
  });
}

// clean output dirs so removed recipes disappear
for (const dir of ['recepten', 'en/recipes']) {
  const full = join(ROOT, dir);
  if (existsSync(full)) rmSync(full, { recursive: true });
  mkdirSync(full, { recursive: true });
}

for (const r of items) {
  mkdirSync(join(ROOT, 'recepten', r.slug), { recursive: true });
  writeFileSync(join(ROOT, 'recepten', r.slug, 'index.html'), recipePage(r, 'nl'));
  mkdirSync(join(ROOT, 'en', 'recipes', r.slug), { recursive: true });
  writeFileSync(join(ROOT, 'en', 'recipes', r.slug, 'index.html'), recipePage(r, 'en'));
}
writeFileSync(join(ROOT, 'recepten', 'index.html'), indexPage('nl'));
writeFileSync(join(ROOT, 'en', 'recipes', 'index.html'), indexPage('en'));

const staticPaths = ['/', '/en/', '/privacy/', '/voorwaarden/', '/en/privacy/', '/en/terms/', '/support/', '/en/support/', '/ophaalpunt/', '/en/pickup-partner/', '/verwijder-account/', '/en/delete-account/', '/recepten/', '/en/recipes/'];
const urls = [
  ...staticPaths,
  ...items.flatMap((r) => [`/recepten/${r.slug}/`, `/en/recipes/${r.slug}/`]),
];
writeFileSync(join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n') +
  '\n</urlset>\n');
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`generated ${items.length} recipes (${skipped} skipped for missing image or price), 2 index pages, sitemap with ${urls.length} urls`);
