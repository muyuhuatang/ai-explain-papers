// /papers/<id>/citation.bib: BibTeX record for the latest version.
import type { APIRoute } from 'astro';
import { bibtex } from '../../../lib/papers.mjs';
import { absolute, getPapers, paths } from '../../../lib/site.mjs';

export function getStaticPaths() {
  return getPapers()
    .filter((paper) => paper.latest)
    .map((paper) => ({ params: { id: paper.id }, props: { paper } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(bibtex(props.paper, absolute(paths.paper(props.paper.id))), {
    headers: { 'Content-Type': 'application/x-bibtex; charset=utf-8' },
  });
