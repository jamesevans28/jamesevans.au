import { site } from '@/content/site';
import { currentRole, skills } from '@/content/experience';
import { services } from '@/content/services';
import { aiOfferings } from '@/content/ai';
import { blog } from '@/content/blog';
import type { BlogPost } from '@/lib/blog';

/**
 * JSON-LD structured data builders. Returned as plain objects and serialized
 * into <script type="application/ld+json"> tags so search engines can
 * understand the person and the business.
 */

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: site.url,
    jobTitle: currentRole.title,
    email: `mailto:${site.email}`,
    worksFor: {
      '@type': 'Organization',
      name: currentRole.company,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Melbourne',
      addressRegion: 'VIC',
      addressCountry: 'AU',
    },
    knowsAbout: [...skills],
    sameAs: [site.linkedin],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    inLanguage: 'en-AU',
  };
}

export function professionalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.tradingName,
    url: `${site.url}/services/`,
    description: site.description,
    email: `mailto:${site.email}`,
    areaServed: { '@type': 'Country', name: 'Australia' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Melbourne',
      addressRegion: 'VIC',
      addressCountry: 'AU',
    },
    provider: { '@type': 'Person', name: site.name, url: site.url },
    // ABN added to identifiers once issued (see docs/PLAN.md §11).
    ...(site.abn ? { identifier: `ABN ${site.abn}` } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: [
        // AI offerings lead the catalog.
        ...aiOfferings.map((o) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: o.title,
            description: o.tagline,
          },
        })),
        ...services.map((s) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: s.title, description: s.tagline },
        })),
      ],
    },
  };
}

/**
 * Blog index. `blogPost` entries are references (headline + url) rather than
 * full articles — the canonical BlogPosting lives on each post's own page.
 */
export function blogSchema(posts: BlogPost[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${blog.title} | ${site.name}`,
    description: blog.description,
    url: `${site.url}/blog/`,
    inLanguage: 'en-AU',
    author: { '@type': 'Person', name: site.name, url: site.url },
    blogPost: posts
      .filter((post) => post.status === 'published')
      .map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: `${site.url}/blog/${post.slug}/`,
        datePublished: post.publishedAt,
      })),
  };
}

export function blogPostingSchema(post: BlogPost) {
  const url = `${site.url}/blog/${post.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    // mainEntityOfPage tells Google which URL is authoritative for this article.
    mainEntityOfPage: { '@type': 'WebPage', '@id': post.canonicalUrl ?? url },
    url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Person', name: site.name, url: site.url },
    publisher: { '@type': 'Person', name: site.name, url: site.url },
    image: `${site.url}/og/blog/${post.slug}.png`,
    keywords: post.tags.join(', '),
    wordCount: post.words,
    articleSection: post.tags[0],
    inLanguage: 'en-AU',
    isAccessibleForFree: true,
  };
}

export function breadcrumbSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: blog.title,
        item: `${site.url}/blog/`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${site.url}/blog/${post.slug}/`,
      },
    ],
  };
}

/** Render a JSON-LD script tag for the given schema object(s). */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
