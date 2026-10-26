#!/usr/bin/env node
// Checks every paper's metadata and SHA-256 fingerprints.
//
//   npm run verify            check papers/ (runs before every build)
//   node scripts/verify.mjs --dist
//                             also check the built site in dist/: every published
//                             PDF must be byte-identical to the recorded version

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDF_NAME, loadPapers, sha256 } from '../src/lib/papers.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const checkDist = process.argv.includes('--dist');
const showDrafts = process.env.SHOW_DRAFTS === 'true';

const { papers, errors, warnings } = loadPapers({ root });

if (checkDist) {
  const dist = path.join(root, 'dist');
  const distFile = (...parts) => path.join(dist, 'papers', ...parts);
  const matches = (file, expected) => existsSync(file) && sha256(readFileSync(file)) === expected;

  for (const paper of papers) {
    const where = `dist/papers/${paper.id}`;
    const published = !paper.draft || showDrafts;

    if (!published) {
      if (existsSync(distFile(paper.id))) errors.push(`${where}: draft paper was included in the build`);
      continue;
    }
    if (!existsSync(distFile(paper.id, 'index.html'))) {
      errors.push(`${where}/index.html was not built`);
      continue;
    }
    if (!paper.draft && !readFileSync(distFile(paper.id, 'index.html'), 'utf8').includes('name="citation_title"')) {
      errors.push(`${where}/index.html is missing its Google Scholar metadata`);
    }
    for (const v of paper.versions) {
      if (!matches(distFile(paper.id, v.version, PDF_NAME), v.sha256)) {
        errors.push(`${where}/${v.version}/${PDF_NAME} is missing or differs from the recorded SHA-256`);
      }
    }
    if (paper.latest && !matches(distFile(paper.id, PDF_NAME), paper.latest.sha256)) {
      errors.push(`${where}/${PDF_NAME} is missing or differs from ${paper.latest.version}`);
    }
  }
}

if (!checkDist) {
  for (const paper of papers) {
    const status = paper.draft ? 'draft    ' : 'published';
    const versions = paper.versions.map((v) => v.version).join(', ') || 'no versions';
    console.log(`  ${paper.id}  ${status}  ${versions.padEnd(18)} ${paper.title}`);
  }
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);

const versionCount = papers.reduce((n, p) => n + p.versions.length, 0);
if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} found.`);
  process.exit(1);
}
console.log(
  checkDist
    ? 'Built site checked: every PDF matches its recorded SHA-256.'
    : `${papers.length} paper${papers.length === 1 ? '' : 's'}, ${versionCount} version${versionCount === 1 ? '' : 's'}: metadata valid, all SHA-256 fingerprints match.`,
);
