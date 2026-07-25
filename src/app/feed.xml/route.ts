import { site } from '@/content/site';
import { blog } from '@/content/blog';
import { getPublishedPosts } from '@/lib/blog';

/**
 * RSS 2.0 feed at /feed.xml. Emitted as a static file during `next build`
 * (force-static is required — a static export has no request-time server).
 *
 * Feed readers and syndication services are a real discovery channel, and the
 * <link rel="alternate"> in the layout points crawlers at it.
 */
export const dynamic = 'force-static';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(): Promise<Response> {
  const posts = await getPublishedPosts();
  const feedUrl = `${site.url}/feed.xml`;
  const latest = posts[0]?.updatedAt ?? posts[0]?.publishedAt;

  const items = posts
    .map((post) => {
      const url = `${site.url}/blog/${post.slug}/`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishedAt!).toUTCString()}</pubDate>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${blog.title} — ${site.name}`)}</title>
    <link>${site.url}/blog/</link>
    <description>${escapeXml(blog.description)}</description>
    <language>en-AU</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${latest ? `    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>` : ''}
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
