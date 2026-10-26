// Helpers for the Astro pages: base-aware URLs, the paper list and profile links.

import site from '../../site.config.mjs';
import { loadPapers } from './papers.mjs';

export { paths } from './papers.mjs';

// BASE_URL is "/" for a custom domain and "/<repo>/" for https://<user>.github.io/<repo>/.
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Site-relative path → link that works under the deployed base path. */
export const href = (path = '/') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

/** Site-relative path → absolute URL (canonical links, Scholar metadata, sitemap, RSS). */
export const absolute = (path = '/') => new URL(href(path), import.meta.env.SITE).href;

// Drafts are always visible in `npm run dev`. Production builds leave them out
// unless SHOW_DRAFTS=true (a repository variable in GitHub Actions).
export const showDrafts = import.meta.env.DEV || process.env.SHOW_DRAFTS === 'true';

let cached;

export function getPapers() {
  if (cached && !import.meta.env.DEV) return cached;
  const { papers, errors } = loadPapers({ includeDrafts: showDrafts });
  if (errors.length) {
    throw new Error(`Paper metadata has errors (run "npm run verify"):\n- ${errors.join('\n- ')}`);
  }
  cached = papers;
  return papers;
}

const repository = process.env.GITHUB_REPOSITORY || site.repository;

export const repoUrl = repository ? `https://github.com/${repository}` : null;

export const github = {
  history: (id) => repoUrl && `${repoUrl}/commits/${site.branch}/papers/${id}`,
  source: (id) => repoUrl && `${repoUrl}/tree/${site.branch}/papers/${id}/source`,
  release: (tag) => repoUrl && `${repoUrl}/releases/tag/${encodeURIComponent(tag)}`,
  releases: () => repoUrl && `${repoUrl}/releases`,
};

const { owner } = site;

/** Profile links of the site owner (home page, About page, under articles). */
export const ownerLinks = [
  owner.scholar && { label: 'Google Scholar', href: owner.scholar },
  owner.orcid && { label: 'ORCID', href: `https://orcid.org/${owner.orcid}` },
  owner.github && { label: 'GitHub', href: `https://github.com/${owner.github}` },
].filter(Boolean);
