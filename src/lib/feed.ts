// Entries for the lists of articles and papers, and for the RSS feed.
import { articlePath, getArticles, isoDate, readingTime, type Article } from './articles';
import { authorList, excerpt } from './papers.mjs';
import { getPapers, paths } from './site.mjs';

export interface FeedItem {
  kind: 'article' | 'paper';
  path: string;
  title: string;
  /** YYYY-MM-DD; empty for a draft paper that has no version yet. */
  date: string;
  summary: string;
  draft: boolean;
  /** Papers: the authors. */
  byline?: string;
  /** Papers: the report number. */
  reference?: string;
  /** Articles: minutes. */
  readingTime?: number;
}

/** Rough plain text of a Markdown body, for a summary when an article has no description. */
const plainText = (markdown: string) =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`>]/g, '');

export const articleItem = (article: Article): FeedItem => ({
  kind: 'article',
  path: articlePath(article.id),
  title: article.data.title,
  date: isoDate(article.data.date),
  summary: article.data.description || excerpt(plainText(article.body ?? ''), 220),
  draft: article.data.draft,
  readingTime: readingTime(article.body),
});

export const paperItem = (paper: any): FeedItem => ({
  kind: 'paper',
  path: paths.paper(paper.id),
  title: paper.title,
  date: paper.published ?? '',
  summary: excerpt(paper.abstract, 240),
  draft: paper.draft,
  byline: authorList(paper.authors),
  reference: paper.reportNumber,
});

const kindOrder = { article: 0, paper: 1 };

/** Articles and papers together, newest first; on the same day, articles come first. */
export async function getFeed(): Promise<FeedItem[]> {
  const articles = (await getArticles()).map(articleItem);
  const papers = getPapers()
    .filter((paper: any) => paper.latest)
    .map(paperItem);
  return [...articles, ...papers].sort((a, b) => b.date.localeCompare(a.date) || kindOrder[a.kind] - kindOrder[b.kind]);
}
