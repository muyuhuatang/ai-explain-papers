// /robots.txt. Crawlers only read robots.txt at the root of a host, so this takes
// effect once the site is served from its own domain.
import type { APIRoute } from 'astro';
import { absolute } from '../lib/site.mjs';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
