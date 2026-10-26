// /rss.xml: published articles and papers, newest first.
import type { APIRoute } from 'astro';
import site from '../../site.config.mjs';
import { getFeed } from '../lib/feed';
import { absolute } from '../lib/site.mjs';

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string);

const rssDate = (date: string) => new Date(`${date}T00:00:00Z`).toUTCString();

export const GET: APIRoute = async () => {
  // Drafts never go into the feed, even when SHOW_DRAFTS puts them on the site.
  const items = (await getFeed()).filter((item) => !item.draft && item.date);

  const entries = items.map((item) => {
    const url = escape(absolute(item.path));
    return [
      '    <item>',
      `      <title>${escape(item.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rssDate(item.date)}</pubDate>`,
      `      <category>${item.kind === 'paper' ? 'Paper' : 'Article'}</category>`,
      `      <description>${escape(item.summary)}</description>`,
      '    </item>',
    ].join('\n');
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(site.name)}</title>
    <link>${escape(absolute('/'))}</link>
    <description>${escape(site.description)}</description>
    <language>${site.language}</language>
    <atom:link href="${escape(absolute('/rss.xml'))}" rel="self" type="application/rss+xml" />
${entries.join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
