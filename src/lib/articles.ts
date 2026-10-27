// Articles from the blog collection. Drafts work like draft papers: visible in
// `npm run dev`, left out of production builds unless SHOW_DRAFTS=true.
import { getCollection, type CollectionEntry } from 'astro:content';
import { showDrafts } from './site.mjs';

export type Article = CollectionEntry<'blog'>;

export async function getArticles(): Promise<Article[]> {
  const articles = await getCollection('blog', ({ data }) => showDrafts || !data.draft);
  return articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.data.title.localeCompare(b.data.title));
}

export const articlePath = (id: string) => `/blog/${id}/`;

/** Front matter dates are read as midnight UTC; this returns the YYYY-MM-DD written in the file. */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** Reading time in minutes, at about 230 words a minute. Code blocks and HTML tags (the markup of figures) are not counted. */
export function readingTime(markdown = '') {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
