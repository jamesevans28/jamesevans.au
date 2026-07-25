import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
import { getPublishedPosts } from '@/lib/blog';

// Static export requires a fully static sitemap (no request-time data).
// Post data is read from DynamoDB at build time, which is still static output.
export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    '',
    '/services',
    '/experience',
    '/work',
    '/blog',
    '/about',
    '/contact',
  ];

  const pages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${site.url}${route}/`.replace(/\/{2,}$/, '/'),
    changeFrequency: route === '' || route === '/blog' ? 'monthly' : 'yearly',
    priority: route === '' ? 1 : 0.8,
  }));

  // Real lastModified dates are how Google notices a new or edited post
  // within hours of a deploy (docs/BLOG_PLAN.md §6).
  const posts = await getPublishedPosts();
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${site.url}/blog/${post.slug}/`,
    lastModified: post.updatedAt ?? post.publishedAt,
    changeFrequency: 'yearly',
    priority: 0.7,
  }));

  return [...pages, ...postEntries];
}
