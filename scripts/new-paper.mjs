#!/usr/bin/env node
// Creates papers/<year>-<number>/ with a paper.yaml to fill in.
//
//   npm run paper:new -- "Title of the paper"

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import site from '../site.config.mjs';
import { ID_PATTERN, reportNumber } from '../src/lib/papers.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const papersDir = path.join(root, 'papers');
const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run paper:new -- "Title of the paper"');
  process.exit(1);
}

const year = new Date().getFullYear();
const used = existsSync(papersDir)
  ? readdirSync(papersDir)
      .map((name) => name.match(ID_PATTERN))
      .filter((match) => match && Number(match[1]) === year)
      .map((match) => Number(match[2]))
  : [];
const id = `${year}-${String(Math.max(0, ...used) + 1).padStart(3, '0')}`;
const dir = path.join(papersDir, id);

const scalar = (value) => stringify(value, { lineWidth: 0 }).trimEnd();
const author = site.defaultAuthor;

const yaml = `# Metadata for ${reportNumber(id)}. Field reference: README.md, "Paper metadata".
id: ${id}
title: ${scalar(title)}
# Authors in the order printed on the PDF. Add an entry (name, affiliation,
# optional orcid) for each co-author, and remove the first one if you are not
# an author of this paper.
authors:
  - name: ${scalar(author.name)}
    affiliation: ${scalar(author.affiliation)}
    ${author.orcid ? `orcid: ${author.orcid}` : '# orcid: 0000-0000-0000-0000'}
abstract: |
  Replace this with the abstract. It is shown on the paper page and read by
  Google Scholar, so use the same text as in the PDF.

  Separate paragraphs with a blank line.
keywords: []
language: en
license: ${site.defaultLicense}
# Drafts can be previewed with "npm run dev" but are never published.
# Delete this line when the paper is ready to go public.
draft: true
# Add the PDF of each version with: npm run paper:version -- ${id} path/to/paper.pdf
versions: []
`;

mkdirSync(path.join(dir, 'source'), { recursive: true });
writeFileSync(path.join(dir, 'source', '.gitkeep'), '');
writeFileSync(path.join(dir, 'paper.yaml'), yaml);

console.log(`Created papers/${id}/ (${reportNumber(id)}).

Next steps:
  1. Fill in papers/${id}/paper.yaml (authors, abstract, keywords).
  2. Put the source files (LaTeX, figures, data) in papers/${id}/source/ if you want them public.
  3. Add the PDF:  npm run paper:version -- ${id} path/to/paper.pdf
  4. Preview:      npm run dev`);
