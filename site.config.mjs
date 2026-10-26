// Site-wide settings for AI Explain.
//
// The public URL is NOT set here: the GitHub Actions workflow reads it from the
// repository's GitHub Pages settings (https://<user>.github.io/<repo>/ today,
// your own domain once one is added), so linking a domain later needs no code change.

// The person behind the site, shown on the home page, the About page and under articles.
const owner = {
  name: 'Fan Huang',
  affiliation: 'Indiana University Bloomington',
  orcid: '0000-0002-3097-0484',
  github: 'muyuhuatang',
  // Address of your Google Scholar profile, for example
  // 'https://scholar.google.com/citations?user=XXXXXXXXXXXX'. Leave empty to hide the link.
  scholar: '',
};

export default {
  name: 'AI Explain',

  // Headline of the home page.
  tagline: 'Research on large language models, explained.',

  // Introduction under the headline and on the About page.
  intro:
    'I’m Fan Huang, a researcher at Indiana University Bloomington. I publish my papers on large language models here, with articles that explain what they find in plain language.',

  // Used in search results and link previews.
  description:
    'Papers and plain-language articles by Fan Huang on how large language models form beliefs, reason and explain themselves.',

  language: 'en',
  owner,

  // Papers ----------------------------------------------------------------

  // Publisher of the papers. Used in Google Scholar metadata
  // (citation_technical_report_institution) and as the BibTeX `institution`.
  institution: 'AI Explain',

  // Report numbers look like AIE-WP-2026-001. They are permanent once a paper is published.
  reportPrefix: 'AIE-WP',

  // Pre-filled first author for `npm run paper:new`. What gets published is the
  // author list in each paper's paper.yaml, so co-authors are added there.
  defaultAuthor: { name: owner.name, affiliation: owner.affiliation, orcid: owner.orcid },

  // Default licence for new papers (SPDX identifier).
  defaultLicense: 'CC-BY-4.0',

  // Set to true once "Enable release immutability" is switched on in the GitHub
  // repository settings. The About page then states that releases are immutable.
  immutableReleases: true,

  // Fallbacks for local builds only. In GitHub Actions these come from the
  // environment (SITE_URL / BASE_PATH from the Pages settings, GITHUB_REPOSITORY).
  localSiteUrl: 'http://localhost:4321',
  repository: 'muyuhuatang/ai-explain-papers', // used for GitHub links in local builds
  branch: 'main',
};
