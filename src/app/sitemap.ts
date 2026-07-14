import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

// Static export requires a fully static sitemap (no request-time data).
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/services', '/experience', '/work', '/about', '/contact'];
  return routes.map((route) => ({
    url: `${site.url}${route}/`.replace(/\/{2,}$/, '/'),
    changeFrequency: route === '' ? 'monthly' : 'yearly',
    priority: route === '' ? 1 : 0.8,
  }));
}
