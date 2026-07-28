import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  personSchema,
  websiteSchema,
  professionalServiceSchema,
  blogSchema,
  blogPostingSchema,
  breadcrumbSchema,
  JsonLd,
} from './jsonld';
import type { BlogPost } from './blog';

function samplePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    slug: 'how-to-use-ai-for-email',
    title: 'How to Use AI to Write Better Emails',
    description: 'x'.repeat(150),
    status: 'published',
    publishedAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-21T09:00:00.000Z',
    tags: ['guides'],
    bodyMarkdown: '## S\n\ntext',
    words: 1200,
    readingMinutes: 6,
    ...overrides,
  } as BlogPost;
}

describe('JSON-LD builders', () => {
  it('personSchema is a valid Person with sameAs to LinkedIn and X', () => {
    const p = personSchema();
    expect(p['@type']).toBe('Person');
    expect(p.name).toBe('James Evans');
    expect(p.sameAs).toContain('https://www.linkedin.com/in/-jamesevans/');
    expect(p.sameAs).toContain('https://x.com/jjme28');
    expect(p.worksFor.name).toBe('Australia Post');
    expect(Array.isArray(p.knowsAbout)).toBe(true);
  });

  it('websiteSchema is a valid WebSite in en-AU', () => {
    const w = websiteSchema();
    expect(w['@type']).toBe('WebSite');
    expect(w.inLanguage).toBe('en-AU');
    expect(w.url).toBe('https://jamesevans.au');
  });

  it('professionalServiceSchema lists an offer catalog for each service', () => {
    const s = professionalServiceSchema();
    expect(s['@type']).toBe('ProfessionalService');
    expect(s.areaServed.name).toBe('Australia');
    expect(s.hasOfferCatalog.itemListElement.length).toBeGreaterThanOrEqual(4);
    expect(s.hasOfferCatalog.itemListElement[0]?.['@type']).toBe('Offer');
  });

  it('omits ABN identifier while none is set', () => {
    const s = professionalServiceSchema() as Record<string, unknown>;
    expect(s.identifier).toBeUndefined();
  });
});

describe('blog JSON-LD', () => {
  it('blogPostingSchema carries the fields Google uses for articles', () => {
    const s = blogPostingSchema(samplePost());
    expect(s['@type']).toBe('BlogPosting');
    expect(s.headline).toBe('How to Use AI to Write Better Emails');
    expect(s.url).toBe(
      'https://jamesevans.au/blog/how-to-use-ai-for-email/',
    );
    expect(s.datePublished).toBe('2026-07-20T09:00:00.000Z');
    expect(s.dateModified).toBe('2026-07-21T09:00:00.000Z');
    expect(s.author.name).toBe('James Evans');
    expect(s.wordCount).toBe(1200);
    expect(s.inLanguage).toBe('en-AU');
    expect(s.image).toContain('/og/blog/how-to-use-ai-for-email.png');
  });

  it('points mainEntityOfPage at a syndication canonical when one is set', () => {
    const s = blogPostingSchema(
      samplePost({ canonicalUrl: 'https://example.com/original/' }),
    );
    // The article may be syndicated, but the canonical wins for attribution.
    expect(s.mainEntityOfPage['@id']).toBe('https://example.com/original/');
    expect(s.url).toBe('https://jamesevans.au/blog/how-to-use-ai-for-email/');
  });

  it('falls back to publishedAt when a post has never been edited', () => {
    const s = blogPostingSchema(samplePost({ updatedAt: undefined }));
    expect(s.dateModified).toBe('2026-07-20T09:00:00.000Z');
  });

  it('blogSchema lists only published posts', () => {
    const s = blogSchema([
      samplePost(),
      samplePost({ slug: 'a-draft', status: 'draft', publishedAt: undefined }),
    ]);
    expect(s['@type']).toBe('Blog');
    expect(s.blogPost).toHaveLength(1);
    expect(s.blogPost[0]?.url).toContain('how-to-use-ai-for-email');
  });

  it('breadcrumbSchema builds Home > Blog > post in order', () => {
    const s = breadcrumbSchema(samplePost());
    expect(s.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(s.itemListElement.map((i) => i.name)).toEqual([
      'Home',
      'Blog',
      'How to Use AI to Write Better Emails',
    ]);
  });
});

describe('JsonLd component', () => {
  it('renders one ld+json script per schema', () => {
    const { container } = render(
      <JsonLd data={[personSchema(), websiteSchema()]} />,
    );
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    expect(scripts).toHaveLength(2);
    // Content is valid JSON.
    expect(() =>
      JSON.parse(scripts[0]?.innerHTML ?? '{}'),
    ).not.toThrow();
  });

  it('accepts a single schema object', () => {
    const { container } = render(<JsonLd data={websiteSchema()} />);
    expect(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).toHaveLength(1);
  });
});
