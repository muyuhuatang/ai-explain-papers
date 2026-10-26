// /papers/<id>/paper.pdf: the latest version, byte-for-byte (its SHA-256 matches paper.yaml).
import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { getPapers } from '../../../lib/site.mjs';

export function getStaticPaths() {
  return getPapers()
    .filter((paper) => paper.latest)
    .map((paper) => ({ params: { id: paper.id }, props: { file: paper.latest.file } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(readFileSync(props.file), { headers: { 'Content-Type': 'application/pdf' } });
