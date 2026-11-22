// Runs on every /r/* request. Catalogue shares forward to their SEO page,
// user uploads get the share shell with real OG tags injected so WhatsApp
// previews show the recipe. Fails open: any error, slow response, or odd
// data passes through to the static share shell, never a 5xx from here.

const RPC = 'https://zendompobuoihmfxrfzc.supabase.co/rest/v1/rpc/shared_recipe';
const KEY = 'sb_publishable__sc02lAfmuJH_ngb0w9uQQ_pN3Lid7h';

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const euro = (n: number) => '€' + Number(n).toFixed(2).replace('.', ',');

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  try {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/r\/([A-Za-z0-9_-]{12})\/?$/);
    if (!m) return context.next();

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    let recipe: Record<string, unknown> | null = null;
    try {
      const res = await fetch(RPC, {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_code: m[1] }),
        signal: ctrl.signal,
      });
      if (res.ok) recipe = await res.json();
    } finally {
      clearTimeout(timer);
    }

    // unknown code or any upstream trouble: the shell handles it client-side
    if (!recipe || typeof recipe !== 'object' || !recipe.title) return context.next();

    // catalogue recipe with a slug: one real page per recipe
    if (typeof recipe.slug === 'string' && recipe.slug.length > 0) {
      return new Response(null, {
        status: 302,
        headers: { Location: new URL(`/recepten/${recipe.slug}/`, url).toString() },
      });
    }

    // user upload: share shell with real preview tags for non-JS scrapers
    const shellRes = await context.next();
    let html = await shellRes.text();
    const title = esc(recipe.title) + ' | Youmechef';
    const desc = recipe.pricePerPortion != null
      ? esc(euro(recipe.pricePerPortion as number) + ' per portie, precies afgewogen. Gedeeld via Youmechef.')
      : 'Een recept, gedeeld via Youmechef.';
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
    if (typeof recipe.imageUrl === 'string' && recipe.imageUrl.startsWith('https://')) {
      html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(recipe.imageUrl)}">`);
    }
    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    return context.next();
  }
};
