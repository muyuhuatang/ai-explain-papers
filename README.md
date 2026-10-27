# AI Explain Tech Blog

Source of the **AI Explain Tech Blog**, a tech blog with two kinds of posts, published with GitHub Pages. Its name sets it apart from the main AI Explain website. Papers keep "AI Explain" as their publisher.

- **Articles** are blog posts written in Markdown, for example a plain-language explanation of a paper. Search engines index them like any blog post.
- **Papers** are research papers (PDF) with a permanent number such as `AIE-WP-2026-001`, a page with the abstract, a citation and BibTeX, and a full version history. Paper pages carry the metadata Google Scholar reads, so papers can appear in Google Scholar. Articles cannot: Scholar only indexes research papers.

Every paper version stays online. The build refuses to publish a paper version whose PDF no longer matches the SHA-256 fingerprint recorded when it was added. Pushing to `main` builds the site, creates a GitHub Release for each new paper version and deploys.

The site is built with [Astro](https://astro.build) and runs no JavaScript in the browser.

## Requirements

Node.js 24 (any version from 22.23.4 works).

```sh
npm install
npm run dev      # http://localhost:4321, drafts included
npm run build    # production build in dist/, drafts left out
```

## Writing an article

1. Create the article. It starts as a draft:

   ```sh
   npm run post:new -- "Title of the article"
   ```

   This creates `blog/<slug>.md`. The file name becomes the address: `blog/my-article.md` is published at `/blog/my-article/`.

2. Write the article in Markdown below the front matter, and fill in the `description`.
3. Preview it with `npm run dev`.
4. Delete the `draft: true` line, then commit and push.

Articles can be edited at any time; unlike papers they have no versions.

| Front matter | Required | Description |
| --- | --- | --- |
| `title` | yes | Quote it if it contains a colon. |
| `description` | no | One or two sentences for article lists, link previews and search results. Without it, the start of the article is used. |
| `date` | yes | Publication date, `YYYY-MM-DD`. Articles are listed newest first. |
| `tags` | no | List of topics, for example `[LLMs, evaluation]`. |
| `paper` | no | Id of the paper the article explains, for example `2026-001`. The article and the paper page then link to each other. |
| `draft` | no | `true` keeps the article out of production builds, the RSS feed and the sitemap. |

Code blocks are highlighted automatically, in light and dark mode.

## Publishing a paper

1. Create the paper. It gets the next free number for the current year and starts as a draft:

   ```sh
   npm run paper:new -- "Title of the Paper"
   ```

2. Fill in `papers/<id>/paper.yaml`: authors, abstract, keywords and licence (see [Paper metadata](#paper-metadata)). Optionally put the source files (LaTeX, figures, data) in `papers/<id>/source/`.

3. Add the PDF as the first version, v1.0:

   ```sh
   npm run paper:version -- 2026-001 path/to/paper.pdf
   ```

   This copies the file to `papers/2026-001/v1.0/paper.pdf` and records its date and SHA-256 in `paper.yaml`.

4. Check it with `npm run dev`. Draft pages show a notice and carry no Scholar metadata.

5. Delete the `draft: true` line, then commit and push. The workflow publishes the page and creates the release `2026-001-v1.0`.

The date of v1.0 is shown as the publication date. If a draft waits a while before going public, update that date in `paper.yaml` before publishing.

## Publishing a new version of a paper

Never replace a published PDF. Add a new version instead:

```sh
npm run paper:version -- 2026-001 path/to/revised.pdf --changes "Corrected Table 2 and extended Section 4"
```

The version number goes up automatically (v1.0 → v1.1). Use `--version v2.0` for a major revision and `--date 2026-11-01` to set the date. The paper page then shows the new version as the latest and keeps every earlier PDF at `/papers/<id>/<version>/paper.pdf`.

## Paper metadata

`papers/<id>/paper.yaml`. `npm run paper:new` writes a commented template, and `papers/2026-001/paper.yaml` is a filled-in example.

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | `YYYY-NNN`, the same as the folder name. The report number is `AIE-WP-` plus the id. |
| `title` | yes | Quote it if it contains a colon. |
| `authors` | yes | List in the order printed on the PDF. Each entry has `name`, with optional `affiliation` and `orcid` (`0000-0000-0000-0000`). |
| `abstract` | yes | Plain text. Separate paragraphs with a blank line. Use the same text as in the PDF. |
| `keywords` | no | List, e.g. `[machine learning, interpretability]`. |
| `language` | no | Language code, default `en`. |
| `license` | yes | SPDX identifier such as `CC-BY-4.0` or `CC0-1.0`, or free text such as `All rights reserved`. |
| `draft` | no | `true` keeps the paper out of production builds, the sitemap, the RSS feed and GitHub Releases. |
| `versions` | for published papers | Written by `npm run paper:version`: `version`, `date`, `sha256`, `changes`. Oldest first. |

`npm run verify` checks all of this, including every SHA-256, and runs before each build.

## How paper versions are recorded

| Record | What it shows | Can it be changed later? |
| --- | --- | --- |
| SHA-256 in `paper.yaml` and on the paper page | The exact bytes of each version | The build fails if a recorded PDF changes |
| GitHub Release `<id>-<version>` | The PDF and its SHA-256, timestamped by GitHub when first published | Not once release immutability is on (see setup) |
| Git history | Every change to every paper | Commit dates are set by the author's computer and can be rewritten, so they are not independent evidence |
| Wayback Machine snapshot (optional) | That the page and PDF were public at a given time | Kept by the Internet Archive |

The release job also compares each existing release's PDF digest with `paper.yaml` and fails if they differ. `.gitattributes` marks PDFs as binary so Git never changes their bytes.

## One-time GitHub setup

1. Create a **public** repository on GitHub, for example `ai-explain-papers`. The site will be at `https://<user>.github.io/ai-explain-papers/`.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Open **Settings → General → Releases** and turn on **Enable release immutability**. Then set `immutableReleases: true` in `site.config.mjs` so the About page says so.
4. Push this folder:

   ```sh
   git add -A
   git commit -m "Set up AI Explain"
   git remote add origin https://github.com/<user>/ai-explain-papers.git
   git push -u origin main
   ```

5. Watch the **Publish** workflow in the **Actions** tab. When it finishes, the site is live.

Optional repository variables (**Settings → Secrets and variables → Actions → Variables**):

- `SHOW_DRAFTS` = `true`: also publish drafts, with a draft notice. Draft papers still carry no Scholar metadata, and drafts stay out of the RSS feed and the sitemap.
- `WAYBACK_ARCHIVE` = `true`: ask the Internet Archive to snapshot the page and PDF of every newly released paper version.

## Adding your own domain

No code changes are needed. The workflow reads the site address from the Pages settings at every run. For example, for `ai-explain.org` or `blog.ai-explain.org`:

1. At your DNS provider, point the domain at GitHub Pages. For a subdomain such as `blog.ai-explain.org`, add a `CNAME` record `blog` → `<user>.github.io`. For the bare domain `ai-explain.org`, follow GitHub's instructions for apex domains (`A` records).
2. In **Settings → Pages → Custom domain**, enter the domain, save, and tick **Enforce HTTPS** once it becomes available.
3. Recommended: verify the domain under your GitHub account's **Settings → Pages** to prevent domain takeovers.
4. Run the workflow again (**Actions → Publish → Run workflow**). Canonical URLs, Scholar metadata, BibTeX URLs, the RSS feed and the sitemap are written at build time and switch to the new domain on this run.

GitHub redirects the old `github.io` address to the custom domain. `robots.txt` only takes effect at the root of a domain, so it starts working once the custom domain is live.

## Google Scholar

Google Scholar indexes papers, not articles. Each paper page provides what Scholar's inclusion guidelines ask for: one static page per paper with `citation_title`, `citation_author`, `citation_publication_date`, `citation_pdf_url`, the report number and publisher, a list page linking every paper, and a sitemap.

The PDF matters as much as the page. Export text-based PDFs (not scans), put the title in a large font at the top of page 1 with the authors directly below, end with a section headed "References", and keep files under 5 MB. `templates/latex/paper.tex` follows these rules.

Inclusion is decided by Google Scholar and can take weeks or longer. Since the address changes when your own domain is added, expect Scholar indexing to start after the move. After that, submitting `https://<your-domain>/sitemap.xml` in Google Search Console helps discovery. Adding a paper to your Scholar profile by hand does not put it in the Scholar search index.

## Settings

`site.config.mjs` holds the site name, the home page headline (`tagline`) and introduction (`intro`), your profile (`owner`: name, title, affiliation, ORCID iD, GitHub user, and the addresses of your homepage, Google Scholar, LinkedIn and X profiles; any left empty is hidden), the publisher name and report prefix for papers, the default author and licence for new papers, and the `immutableReleases` flag.

## Project layout

```
blog/<slug>.md                  articles (Markdown with front matter)
papers/<id>/paper.yaml          paper metadata and version list
papers/<id>/<version>/paper.pdf one PDF per version, never modified once published
papers/<id>/source/             optional source files
site.config.mjs                 name, introduction, profile links, paper settings
src/content.config.ts           the article front matter fields
src/lib/papers.mjs              loads and validates papers; citations (used by site and scripts)
src/pages/                      home, articles, papers, About, PDFs, BibTeX, RSS, sitemap, robots.txt
src/styles/global.css           the design: colours, type and layout
scripts/                        post:new, paper:new, paper:version, verify, release
templates/latex/paper.tex       LaTeX template for Scholar-friendly PDFs
.github/workflows/publish.yml   verify → build → release → deploy (→ archive)
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local preview with drafts |
| `npm run build` | Verify, build `dist/`, then check every built PDF against its SHA-256 |
| `npm run post:new -- "Title"` | Create a new article as a draft |
| `npm run paper:new -- "Title"` | Create the next paper as a draft |
| `npm run paper:version -- <id> <file.pdf> [--changes "..."] [--version vX.Y] [--date YYYY-MM-DD]` | Add a paper version |
| `npm run verify` | Check paper metadata and fingerprints |
| `npm run release -- --dry-run` | Preview the GitHub Releases the workflow would create |
