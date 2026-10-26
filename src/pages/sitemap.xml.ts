// /sitemap.xml: every public page, and the latest PDF of every published paper.
import type { APIRoute } from 'astro';
import { articlePath, getArticles, isoDate } from '../lib/articles';
import { absolute, getPapers, paths } from '../lib/site.mjs';

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string);

const newest = (dates: (string | undefined)[]) => dates.filter(Boolean).sort().at(-1);

export const GET: APIRoute = async () => {
  // Drafts are never listed, even when SHOW_DRAFTS puts them on the site.
  const papers = getPapers().filter((paper: any) => !paper.draft);
  const articles = (await getArticles()).filter((article) => !article.data.draft);
  const paperDate = newest(papers.map((p: any) => p.updated));
  const articleDate = newest(articles.map((a) => isoDate(a.data.date)));

  const entries = [
    { path: '/', lastmod: newest([paperDate, articleDate]) },
    { path: '/blog/', lastmod: articleDate },
    { path: '/papers/', lastmod: paperDate },
    { path: '/about/' },
    ...articles.map((a) => ({ path: articlePath(a.id), lastmod: isoDate(a.data.date) })),
    ...papers.flatMap((p: any) => [
      { path: paths.paper(p.id), lastmod: p.updated },
      { path: paths.pdf(p.id), lastmod: p.updated },
    ]),
  ];

  const urls = entries
    .map(({ path, lastmod }) => `  <url><loc>${escape(absolute(path))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`)
    .join('\n');

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
