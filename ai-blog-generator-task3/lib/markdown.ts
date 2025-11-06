import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypePrismPlus from 'rehype-prism-plus';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkRehype)
    .use(rehypePrismPlus, { ignoreMissing: true })
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}

