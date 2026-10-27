// Site-wide settings for AI Explain.
//
// The public URL is NOT set here: the GitHub Actions workflow reads it from the
// repository's GitHub Pages settings (https://<user>.github.io/<repo>/ today,
// your own domain once one is added), so linking a domain later needs no code change.

// The person behind the site, shown on the home page, the About page and under articles.
// The details follow your personal website, https://muyuhuatang.github.io/.
const owner = {
  name: 'Fan Huang',
  // Shown before the affiliation under articles and on the About page.
  title: 'Ph.D. candidate in Informatics',
  affiliation: 'Indiana University Bloomington',
  orcid: '0000-0002-3097-0484',
  github: 'muyuhuatang',
  // Profile addresses. Leave any of them empty to hide its link.
  website: 'https://muyuhuatang.github.io/',
  scholar: 'https://scholar.google.com/citations?user=2-6ICS4AAAAJ',
  linkedin: 'https://www.linkedin.com/in/fhuang181/',
  x: 'https://x.com/HuangFan_Hoan',
};

export default {
  // Name of this site, which sets it apart from the main AI Explain website
  // (ai-explain.org). The header shows the shared brand in bold and the rest lighter.
  name: 'AI Explain Tech Blog',
  brand: 'AI Explain',

  // Headline of the home page.
  tagline: 'Research on large language models, explained.',

  // Introduction under the headline and on the About page.
  intro:
    'I’m Fan Huang, a Ph.D. candidate in Informatics at Indiana University Bloomington. I study human–AI alignment: probing and mitigating the biases and limitations of large language models. Here I share my ongoing work, with articles that explain what they find in plain language.',

  // Used in search results and link previews.
  description:
    'Papers and plain-language articles by Fan Huang on human–AI alignment and the biases and limitations of large language models.',

  language: 'en',
  owner,

  // Papers ----------------------------------------------------------------

  // Publisher of the papers. Used in Google Scholar metadata
  // (citation_technical_report_institution) and as the BibTeX `institution`.
  // Keep it unchanged: published papers are already cited with it.
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
