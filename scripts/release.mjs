#!/usr/bin/env node
// Creates a GitHub Release for every published paper version that does not have one yet.
// The release gets the PDF attached and its SHA-256 in the notes, which gives each
// version a timestamped record outside the Git history.
//
// Runs in GitHub Actions after the build (needs the gh CLI and GH_TOKEN).
// Existing releases are checked: if a released PDF's digest no longer matches
// paper.yaml, the run fails.
//
//   npm run release -- --dry-run      show what would be released

import { execFileSync } from 'node:child_process';
import { appendFileSync, copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';
import { authorList, formatDate, loadPapers, paths } from '../src/lib/papers.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dryRun = process.argv.includes('--dry-run');
const repo = process.env.GITHUB_REPOSITORY;
const siteUrl = (process.env.SITE_URL || site.localSiteUrl).replace(/\/+$/, '');

if (!dryRun && !repo) {
  console.error('error: set GITHUB_REPOSITORY=owner/repo (done automatically in GitHub Actions), or use --dry-run');
  process.exit(1);
}

const { papers, errors } = loadPapers({ root, includeDrafts: false });
if (errors.length) {
  console.error(`error: paper metadata has problems, run "npm run verify":\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const gh = (args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function findRelease(tag) {
  try {
    return JSON.parse(gh(['api', `repos/${repo}/releases/tags/${encodeURIComponent(tag)}`]));
  } catch (e) {
    if (/HTTP 404/.test(String(e.stderr))) return null;
    throw e;
  }
}

function notes(paper, v, assetName) {
  const changes = v.changes ? `\n**Changes:** ${v.changes}\n` : '';
  return `**${paper.reportNumber}, version ${v.version}** (${formatDate(v.date)})

**${paper.title}**
${authorList(paper.authors)}
${changes}
| File | SHA-256 |
| --- | --- |
| \`${assetName}\` | \`${v.sha256}\` |

- Paper page: ${siteUrl}${paths.paper(paper.id)}
- This version: ${siteUrl}${paths.versionPdf(paper.id, v.version)}

Check a download with \`shasum -a 256 ${assetName}\` (macOS, Linux) or \`Get-FileHash ${assetName} -Algorithm SHA256\` (Windows PowerShell).

Created automatically by the publishing workflow when this version was first published.
`;
}

const newUrls = new Set();
const problems = [];
let createdCount = 0;
const workDir = mkdtempSync(path.join(tmpdir(), 'paper-release-'));

for (const paper of papers) {
  for (const v of paper.versions) {
    const assetName = `${paper.reportNumber}-${v.version}.pdf`;

    if (dryRun) {
      console.log(`── release ${v.tag}, asset ${assetName}\n${notes(paper, v, assetName)}`);
      continue;
    }

    const existing = findRelease(v.tag);
    if (existing) {
      const asset = existing.assets?.find((a) => a.name === assetName);
      if (!asset) {
        console.warn(`warning: release ${v.tag} exists but has no ${assetName}`);
      } else if (asset.digest && asset.digest !== `sha256:${v.sha256}`) {
        problems.push(
          `release ${v.tag} holds a PDF with ${asset.digest}, but paper.yaml records sha256:${v.sha256}. ` +
            'A published version was changed: restore the original PDF and publish the change as a new version.',
        );
      }
      continue;
    }

    const asset = path.join(workDir, assetName);
    const notesFile = path.join(workDir, `${v.tag}.md`);
    copyFileSync(v.file, asset);
    writeFileSync(notesFile, notes(paper, v, assetName));

    const args = ['release', 'create', v.tag, asset, '--repo', repo, '--title', `${paper.reportNumber} ${v.version}: ${paper.title}`, '--notes-file', notesFile];
    if (process.env.GITHUB_SHA) args.push('--target', process.env.GITHUB_SHA);
    gh(args);
    console.log(`created release ${v.tag}`);

    const release = findRelease(v.tag);
    if (release?.immutable === false) {
      console.warn('warning: this release is not immutable. Turn on "Enable release immutability" in the repository settings.');
    }
    createdCount += 1;
    newUrls.add(`${siteUrl}${paths.paper(paper.id)}`);
    newUrls.add(`${siteUrl}${paths.versionPdf(paper.id, v.version)}`);
  }
}

for (const problem of problems) console.error(`error: ${problem}`);

// Page and PDF URLs of the new versions, for the optional Wayback Machine step.
const urls = [...newUrls];
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `new_urls=${urls.join(' ')}\n`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = createdCount ? urls.map((u) => `- ${u}`).join('\n') : 'No new versions to release.';
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Paper releases\n\n${lines}\n`);
}

if (!dryRun) console.log(createdCount ? `Created ${createdCount} release(s).` : 'All published versions already have releases.');
if (problems.length) process.exit(1);
