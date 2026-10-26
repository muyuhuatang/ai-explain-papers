#!/usr/bin/env node
// Adds a new version of a paper: copies the PDF to papers/<id>/<version>/paper.pdf,
// records its SHA-256 and appends it to the versions list in paper.yaml.
//
//   npm run paper:version -- 2026-001 path/to/paper.pdf
//   npm run paper:version -- 2026-001 path/to/paper.pdf --changes "Fixed the proof of Lemma 2"
//
// Options: --changes "text"   what changed (required from the second version on)
//          --version v2.0     version number (default: v1.0, then v1.1, v1.2, ...)
//          --date 2026-11-01  version date (default: today)

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseDocument } from 'yaml';
import { PDF_NAME, VERSION_PATTERN, compareVersions, isPdf, isValidDate, nextVersion, sha256, today } from '../src/lib/papers.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    changes: { type: 'string', short: 'm' },
    version: { type: 'string' },
    date: { type: 'string' },
  },
});

const [id, pdfArg] = positionals;
if (!id || !pdfArg) fail('usage: npm run paper:version -- <paper-id> <file.pdf> [--changes "..."] [--version v1.1] [--date YYYY-MM-DD]');

const paperDir = path.join(root, 'papers', id);
const metaFile = path.join(paperDir, 'paper.yaml');
if (!existsSync(metaFile)) fail(`papers/${id}/paper.yaml does not exist (create the paper with npm run paper:new)`);

// npm runs scripts from the project folder, so resolve the PDF against the folder the command was typed in.
const source = path.resolve(process.env.INIT_CWD ?? process.cwd(), pdfArg);
if (!existsSync(source)) fail(`cannot find ${source}`);
const pdf = readFileSync(source);
if (!isPdf(pdf)) fail(`${source} is not a PDF file`);

const doc = parseDocument(readFileSync(metaFile, 'utf8'));
if (doc.errors.length) fail(`papers/${id}/paper.yaml is not valid YAML: ${doc.errors[0].message}`);

let list = doc.get('versions');
if (!list || !Array.isArray(list.items)) {
  list = doc.createNode([]);
  doc.set('versions', list);
}
const existing = list.items.map((item) => String(item.get('version')));

const version = values.version ?? nextVersion(existing);
if (!VERSION_PATTERN.test(version)) fail(`version must look like v1.0 (got "${version}")`);
if (existing.length && compareVersions(version, existing.at(-1)) <= 0) {
  fail(`${version} must be higher than the latest version, ${existing.at(-1)}`);
}

const date = values.date ?? today();
if (!isValidDate(date)) fail(`date must be YYYY-MM-DD (got "${date}")`);

const changes = values.changes?.trim() || (existing.length ? '' : 'Initial release.');
if (!changes) fail('describe what changed in this version with --changes "..."');

const targetDir = path.join(paperDir, version);
if (existsSync(targetDir)) fail(`papers/${id}/${version}/ already exists`);

const hash = sha256(pdf);
mkdirSync(targetDir);
copyFileSync(source, path.join(targetDir, PDF_NAME));

list.flow = false;
list.add(doc.createNode({ version, date, sha256: hash, changes }));
writeFileSync(metaFile, doc.toString({ lineWidth: 0, flowCollectionPadding: false }));

const draft = doc.get('draft') === true;
console.log(`Added ${version} of ${id}:
  papers/${id}/${version}/${PDF_NAME}
  SHA-256 ${hash}

${draft ? `The paper is still a draft. Delete "draft: true" from papers/${id}/paper.yaml when it is ready to publish.\n` : ''}Preview with "npm run dev", then commit and push. The push publishes the site and creates the
GitHub Release ${id}-${version}. From then on this PDF must never change; publish fixes as a new version.`);
