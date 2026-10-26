// /papers/<id>/<version>/paper.pdf: one specific version, kept online permanently.
import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { getPapers } from '../../../../lib/site.mjs';

export function getStaticPaths() {
  return getPapers().flatMap((paper) =>
    paper.versions.map((v) => ({ params: { id: paper.id, version: v.version }, props: { file: v.file } })),
  );
}

export const GET: APIRoute = ({ props }) =>
  new Response(readFileSync(props.file), { headers: { 'Content-Type': 'application/pdf' } });
