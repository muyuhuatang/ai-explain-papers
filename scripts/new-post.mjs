#!/usr/bin/env node
// Creates a new article as a draft: blog/<slug>.md, published at /blog/<slug>/.
//
//   npm run post:new -- "Title of the article"

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { today } from '../src/lib/papers.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('usage: npm run post:new -- "Title of the article"');
  process.exit(1);
}

const slug =
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '') || 'article';

const file = path.join(root, 'blog', `${slug}.md`);
if (existsSync(file)) {
  console.error(`error: blog/${slug}.md already exists. Choose another title, or rename the file afterwards.`);
  process.exit(1);
}

const scalar = (value) => stringify(value, { lineWidth: 0 }).trimEnd();

mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(
  file,
  `---
title: ${scalar(title)}
# One or two sentences for article lists, link previews and search results.
description: ""
date: ${today()}
tags: []
# If this article explains one of your papers, put the paper's id here:
# paper: 2026-001
# Drafts show up in "npm run dev" but are never published. Delete this line to publish.
draft: true
---

Write the article here in Markdown.
`,
);

console.log(`Created blog/${slug}.md (draft). It will be published at /blog/${slug}/.

Next steps:
  1. Write the article and fill in the description.
  2. Preview:  npm run dev
  3. Delete "draft: true", then commit and push.`);
