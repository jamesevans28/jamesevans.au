import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  personSchema,
  websiteSchema,
  professionalServiceSchema,
  JsonLd,
} from './jsonld';

describe('JSON-LD builders', () => {
  it('personSchema is a valid Person with sameAs to LinkedIn', () => {
    const p = personSchema();
    expect(p['@type']).toBe('Person');
    expect(p.name).toBe('James Evans');
    expect(p.sameAs).toContain('https://www.linkedin.com/in/-jamesevans/');
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
    expect(s.hasOfferCatalog.itemListElement.length).toBe(4);
    expect(s.hasOfferCatalog.itemListElement[0]?.['@type']).toBe('Offer');
  });

  it('omits ABN identifier while none is set', () => {
    const s = professionalServiceSchema() as Record<string, unknown>;
    expect(s.identifier).toBeUndefined();
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
