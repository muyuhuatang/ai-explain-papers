// Reads, validates and fingerprints the papers in ./papers.
//
// Shared by the Astro pages and the scripts in ./scripts, so it only uses
// plain Node APIs (no import.meta.env). Each paper lives in papers/<id>/:
//
//   papers/2026-001/
//     paper.yaml        metadata and the list of versions
//     v1.0/paper.pdf    one folder per version, never modified once published
//     v1.1/paper.pdf
//     source/           optional source files (LaTeX, Markdown, figures, data)

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import site from '../../site.config.mjs';

export const ID_PATTERN = /^(\d{4})-(\d{3})$/;
export const VERSION_PATTERN = /^v\d+(?:\.\d+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

// Google Scholar may skip PDFs larger than 5 MB.
const SCHOLAR_PDF_LIMIT = 5 * 1024 * 1024;

export const PDF_NAME = 'paper.pdf';

/** Site-relative URL paths, shared by the pages and the release script. */
export const paths = {
  paper: (id) => `/papers/${id}/`,
  pdf: (id) => `/papers/${id}/${PDF_NAME}`,
  versionPdf: (id, version) => `/papers/${id}/${version}/${PDF_NAME}`,
  bib: (id) => `/papers/${id}/citation.bib`,
};

export const reportNumber = (id) => `${site.reportPrefix}-${id}`;
export const releaseTag = (id, version) => `${id}-${version}`;

export const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
export const isPdf = (buffer) => buffer.subarray(0, 5).toString('latin1') === '%PDF-';

export function compareVersions(a, b) {
  const pa = a.slice(1).split('.').map(Number);
  const pb = b.slice(1).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

/** v1.0 for the first version, otherwise the last version with its final number bumped. */
export function nextVersion(versions) {
  if (!versions.length) return 'v1.0';
  const parts = versions.at(-1).slice(1).split('.').map(Number);
  parts[parts.length - 1] += 1;
  return `v${parts.join('.')}`;
}

/** Today's date as YYYY-MM-DD in local time. */
export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const text = (value) => (value == null ? '' : String(value).trim());

/**
 * Loads every paper under <root>/papers.
 * Errors make the build fail; warnings are printed by `npm run verify`.
 */
export function loadPapers({ root = process.cwd(), includeDrafts = true } = {}) {
  const papersDir = path.join(root, 'papers');
  const result = { papers: [], errors: [], warnings: [] };
  if (!existsSync(papersDir)) return result;

  for (const entry of readdirSync(papersDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || /^[._]/.test(entry.name)) continue;
    const { paper, errors, warnings } = loadPaper(path.join(papersDir, entry.name), entry.name);
    result.errors.push(...errors);
    result.warnings.push(...warnings);
    if (paper && (includeDrafts || !paper.draft)) result.papers.push(paper);
  }

  result.papers.sort((a, b) => b.id.localeCompare(a.id));
  return result;
}

function loadPaper(dir, folder) {
  const errors = [];
  const warnings = [];
  const where = `papers/${folder}`;
  const error = (message) => errors.push(`${where}: ${message}`);
  const warn = (message) => warnings.push(`${where}: ${message}`);

  const metaFile = path.join(dir, 'paper.yaml');
  if (!existsSync(metaFile)) {
    error('missing paper.yaml');
    return { errors, warnings };
  }

  let raw;
  try {
    raw = parse(readFileSync(metaFile, 'utf8'));
  } catch (e) {
    error(`paper.yaml is not valid YAML: ${e.message}`);
    return { errors, warnings };
  }
  if (!raw || typeof raw !== 'object') {
    error('paper.yaml is empty');
    return { errors, warnings };
  }

  const id = text(raw.id);
  if (!ID_PATTERN.test(id)) error(`id must look like 2026-001 (found "${id}")`);
  else if (id !== folder) error(`id "${id}" must match the folder name "${folder}"`);

  const title = text(raw.title);
  if (!title) error('title is required');

  const authors = (Array.isArray(raw.authors) ? raw.authors : []).map((author, i) => {
    const name = text(typeof author === 'string' ? author : author?.name);
    if (!name) error(`authors[${i}] needs a name`);
    const orcid = text(author?.orcid).replace(/^https?:\/\/orcid\.org\//, '');
    if (orcid && !ORCID_PATTERN.test(orcid)) error(`authors[${i}].orcid "${orcid}" is not a valid ORCID iD`);
    return { name, affiliation: text(author?.affiliation), orcid };
  });
  if (!authors.length) error('at least one author is required');

  const abstract = text(raw.abstract);
  if (!abstract) error('abstract is required');

  const keywords = (Array.isArray(raw.keywords) ? raw.keywords : text(raw.keywords).split(','))
    .map(text)
    .filter(Boolean);

  const license = text(raw.license);
  if (!license) error('license is required (for example CC-BY-4.0)');

  const draft = raw.draft === true;
  const versions = loadVersions(raw.versions, { dir, id: folder, draft, error, warn });
  if (!draft && !versions.length) error('a published paper needs at least one version (npm run paper:version)');

  const sourceDir = path.join(dir, 'source');
  const hasSource = existsSync(sourceDir) && readdirSync(sourceDir).some((f) => f !== '.gitkeep');

  const paper = {
    id: folder,
    reportNumber: reportNumber(folder),
    title,
    authors,
    abstract,
    abstractParagraphs: abstract.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()),
    keywords,
    language: text(raw.language) || 'en',
    license,
    draft,
    versions,
    first: versions[0] ?? null,
    latest: versions.at(-1) ?? null,
    published: versions[0]?.date ?? null,
    updated: versions.at(-1)?.date ?? null,
    hasSource,
  };
  return { paper, errors, warnings };
}

function loadVersions(list, { dir, id, draft, error, warn }) {
  if (list != null && !Array.isArray(list)) {
    error('versions must be a list');
    return [];
  }

  const versions = [];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  for (const [i, entry] of (list ?? []).entries()) {
    const version = text(entry?.version);
    if (!VERSION_PATTERN.test(version)) {
      error(`versions[${i}].version must look like v1.0 (found "${version}")`);
      continue;
    }

    const previous = versions.at(-1);
    if (previous && compareVersions(version, previous.version) <= 0) {
      error(`${version} is listed after ${previous.version}; list versions oldest first, without duplicates`);
    }

    const date = text(entry.date);
    if (!isValidDate(date)) error(`${version}: date must be a real date in YYYY-MM-DD form (found "${date}")`);
    else if (previous && date < previous.date) error(`${version}: date ${date} is earlier than ${previous.version} (${previous.date})`);
    else if (!draft && date > tomorrow) error(`${version}: date ${date} is in the future`);

    const recorded = text(entry.sha256).toLowerCase();
    const file = path.join(dir, version, PDF_NAME);
    let size = 0;

    if (!existsSync(file)) {
      error(`${version}: missing ${version}/${PDF_NAME}`);
    } else {
      const buffer = readFileSync(file);
      size = buffer.length;
      if (!isPdf(buffer)) error(`${version}/${PDF_NAME} is not a PDF file`);
      if (size > SCHOLAR_PDF_LIMIT) warn(`${version}/${PDF_NAME} is larger than 5 MB; Google Scholar may not process it`);

      const actual = sha256(buffer);
      if (!SHA256_PATTERN.test(recorded)) {
        error(`${version}: sha256 is missing or malformed (the file's SHA-256 is ${actual}); add versions with npm run paper:version`);
      } else if (recorded !== actual) {
        error(
          `${version}/${PDF_NAME} no longer matches its recorded SHA-256 (recorded ${recorded}, file is ${actual}). ` +
            'Published versions are immutable: restore the original PDF and publish the change as a new version.',
        );
      }
    }

    versions.push({ version, date, sha256: recorded, size, file, changes: text(entry.changes), tag: releaseTag(id, version) });
  }

  // Version folders on disk that paper.yaml does not mention are probably a mistake.
  const listed = new Set(versions.map((v) => v.version));
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && VERSION_PATTERN.test(entry.name) && !listed.has(entry.name)) {
      warn(`folder ${entry.name}/ is not listed in paper.yaml and will not be published`);
    }
  }

  return versions;
}

// ---------------------------------------------------------------------------
// Formatting helpers

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 2026-10-26 → "26 October 2026" (or "26 Oct 2026" with style "short"). */
export function formatDate(date, style = 'long') {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  const month = MONTHS[m - 1];
  return `${d} ${style === 'short' ? month.slice(0, 3) : month} ${y}`;
}

/** Google Scholar expects dates as YYYY/MM/DD. */
export const scholarDate = (date) => date.replaceAll('-', '/');

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function excerpt(value, max) {
  const flat = value.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:]+$/, '')}…`;
}

export function authorList(authors) {
  const names = authors.map((a) => a.name);
  if (names.length < 3) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}

// ---------------------------------------------------------------------------
// Citations

const BIB_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const BIB_ESCAPES = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};
const bibEscape = (value) => value.replace(/[\\{}&%$#_~^]/g, (c) => BIB_ESCAPES[c]);

/** BibTeX entry for the latest version. `url` is the absolute URL of the paper page. */
export function bibtex(paper, url) {
  const [year, month] = paper.published.split('-');
  const fields = [
    ['title', `{{${bibEscape(paper.title)}}}`],
    ['author', `{${paper.authors.map((a) => bibEscape(a.name)).join(' and ')}}`],
    ['institution', `{${bibEscape(site.institution)}}`],
    ['number', `{${paper.reportNumber}}`],
    ['year', `{${year}}`],
    ['month', BIB_MONTHS[Number(month) - 1]],
    ['note', `{Version ${paper.latest.version.slice(1)}, ${formatDate(paper.latest.date)}}`],
    ['url', `{${url}}`],
  ];
  const width = Math.max(...fields.map(([key]) => key.length));
  const body = fields.map(([key, value]) => `  ${key.padEnd(width)} = ${value}`).join(',\n');
  return `@techreport{${paper.reportNumber},\n${body}\n}\n`;
}

/** Report-style citation: Author (Year). Title (Number, version). Publisher. URL */
export function plainCitation(paper, url) {
  const title = paper.title.replace(/\.$/, '');
  return `${authorList(paper.authors)} (${paper.published.slice(0, 4)}). ${title} (${paper.reportNumber}, version ${paper.latest.version.slice(1)}). ${site.institution}. ${url}`;
}

const LICENSES = {
  'CC-BY-4.0': ['Creative Commons Attribution 4.0 International (CC BY 4.0)', 'https://creativecommons.org/licenses/by/4.0/'],
  'CC-BY-SA-4.0': ['Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)', 'https://creativecommons.org/licenses/by-sa/4.0/'],
  'CC-BY-NC-4.0': ['Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)', 'https://creativecommons.org/licenses/by-nc/4.0/'],
  'CC-BY-NC-SA-4.0': ['Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)', 'https://creativecommons.org/licenses/by-nc-sa/4.0/'],
  'CC-BY-ND-4.0': ['Creative Commons Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)', 'https://creativecommons.org/licenses/by-nd/4.0/'],
  'CC-BY-NC-ND-4.0': ['Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)', 'https://creativecommons.org/licenses/by-nc-nd/4.0/'],
  'CC0-1.0': ['CC0 1.0 Universal (public domain dedication)', 'https://creativecommons.org/publicdomain/zero/1.0/'],
};

/** Known SPDX identifiers get a readable name and link; anything else is shown as written. */
export function licenseInfo(id) {
  const known = LICENSES[id];
  return known ? { id, name: known[0], url: known[1] } : { id, name: id, url: null };
}
