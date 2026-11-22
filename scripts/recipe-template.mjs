// The one recipe layout. Used by scripts/build-recipes.mjs at build time for
// the SEO pages, and imported by /r/index.html in the browser for the share
// page, so the two can never drift apart. Keep this file dependency-free.

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function euro(n) {
  return '€' + Number(n).toFixed(2).replace('.', ',');
}

// data: { title, imageUrl, prepMinutes?, portions?, pricePerPortion?,
//         items: [string], sourceUrl? }
// opts: { lang: 'nl'|'en', eyebrow, itemsHeading, teaseLine?, ctaText,
//         ctaHref, backHref?, backText? }
export function recipeArticle(data, opts) {
  const meta = [];
  if (data.prepMinutes) meta.push(data.prepMinutes + ' min');
  if (data.portions) meta.push(data.portions + (opts.lang === 'nl' ? ' porties' : ' portions'));
  if (data.pricePerPortion != null) meta.push(euro(data.pricePerPortion) + (opts.lang === 'nl' ? ' per portie' : ' per portion'));

  let html =
    '<p class="eyebrow">' + esc(opts.eyebrow) + '</p>' +
    '<h1>' + esc(data.title) + '</h1>' +
    '<p class="recipe-meta-line">' + meta.map(esc).join(' &middot; ') + '</p>';
  if (data.imageUrl) {
    html += '<img class="recipe-hero" src="' + esc(data.imageUrl) + '" alt="' + esc(data.title) + '" width="1200" height="800">';
  }
  if (data.items && data.items.length) {
    html += '<h2>' + esc(opts.itemsHeading) + '</h2><ul class="chips">' +
      data.items.map((i) => '<li>' + esc(i) + '</li>').join('') +
      '</ul>';
  }
  if (opts.teaseLine) {
    html += '<p class="micro">' + esc(opts.teaseLine) + '</p>';
  }
  if (data.sourceUrl) {
    html += '<p class="micro" style="margin-top: 14px;"><a href="' + esc(data.sourceUrl) + '" rel="noopener nofollow" target="_blank">' +
      (opts.lang === 'nl' ? 'Origineel recept' : 'Original recipe') + '</a></p>';
  }
  html +=
    '<div class="recipe-cta-block">' +
    '<p>' + (opts.lang === 'nl' ? 'Wij wegen elk ingrediënt precies af. Jij kookt.' : 'We weigh every ingredient exactly. You cook.') + '</p>' +
    '<a class="btn" href="' + esc(opts.ctaHref) + '">' + esc(opts.ctaText) + '</a>' +
    '</div>';
  if (opts.backHref) {
    html += '<p class="backlink"><a href="' + esc(opts.backHref) + '">' + esc(opts.backText) + '</a></p>';
  }
  return html;
}
