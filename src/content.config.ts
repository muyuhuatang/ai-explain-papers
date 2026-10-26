// Articles: Markdown files in blog/ at the root of the project, one file per article.
// The file name becomes the address: blog/my-article.md → /blog/my-article/.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './blog' }),
  schema: z.object({
    title: z.string(),
    // One or two sentences for article lists, link previews and search results.
    description: z.string().default(''),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    // Id of the paper this article explains, e.g. 2026-001. The article and the
    // paper page then link to each other.
    paper: z
      .string()
      .regex(/^\d{4}-\d{3}$/, 'paper must be a paper id such as 2026-001')
      .optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
