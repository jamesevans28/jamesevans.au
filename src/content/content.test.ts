import { describe, it, expect } from 'vitest';
import { navLinks, stats, site } from './site';
import { roles, currentRole } from './experience';
import { services } from './services';
import { caseStudies, featuredCaseStudies } from './work';
import { testimonials } from './testimonials';
import { formatMonth, formatRange } from '@/lib/dates';

describe('site content integrity', () => {
  it('nav links all point to known routes', () => {
    const routes = new Set([
      '/',
      '/services/',
      '/experience/',
      '/work/',
      '/about/',
      '/contact/',
    ]);
    for (const link of navLinks) {
      expect(routes.has(link.href)).toBe(true);
    }
  });

  it('has exactly four homepage stats, each with a value and label', () => {
    expect(stats).toHaveLength(4);
    for (const stat of stats) {
      expect(stat.value.length).toBeGreaterThan(0);
      expect(stat.label.length).toBeGreaterThan(0);
    }
  });

  it('does not publish the personal Gmail', () => {
    const serialized = JSON.stringify(site);
    expect(serialized).not.toMatch(/gmail/i);
    expect(site.email).toBe('hello@jamesevans.au');
  });
});

describe('experience integrity', () => {
  it('the current role is Australia Post and marked present', () => {
    expect(currentRole.company).toBe('Australia Post');
    expect(currentRole.end).toBe('present');
    expect(roles[0]).toBe(currentRole);
  });

  it('exactly one role is current (present)', () => {
    const current = roles.filter((r) => r.end === 'present');
    expect(current).toHaveLength(1);
  });

  it('every role has valid, non-inverted dates', () => {
    for (const role of roles) {
      expect(() => formatMonth(role.start)).not.toThrow();
      expect(() => formatRange(role.start, role.end)).not.toThrow();
      if (role.end !== 'present') {
        expect(role.start <= role.end).toBe(true);
      }
    }
  });

  it('roles are listed newest first', () => {
    const starts = roles.map((r) => r.start);
    const sorted = [...starts].sort().reverse();
    expect(starts).toEqual(sorted);
  });
});

describe('services integrity', () => {
  it('has services with unique slugs, including AI adoption', () => {
    expect(services.length).toBeGreaterThanOrEqual(4);
    const slugs = new Set(services.map((s) => s.slug));
    expect(slugs.size).toBe(services.length);
    expect(slugs.has('ai-adoption')).toBe(true);
  });

  it('every service lists what you get', () => {
    for (const service of services) {
      expect(service.youGet.length).toBeGreaterThan(0);
    }
  });
});

describe('work integrity', () => {
  it('has unique case-study slugs', () => {
    const slugs = new Set(caseStudies.map((c) => c.slug));
    expect(slugs.size).toBe(caseStudies.length);
  });

  it('features exactly two case studies for the homepage', () => {
    expect(featuredCaseStudies).toHaveLength(2);
  });

  it('external client URLs use https', () => {
    for (const study of caseStudies) {
      if (study.clientUrl) {
        expect(study.clientUrl.startsWith('https://')).toBe(true);
      }
    }
  });
});

describe('testimonials integrity', () => {
  it('every testimonial has a quote and attribution', () => {
    for (const t of testimonials) {
      expect(t.quote.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
      expect(typeof t.placeholder).toBe('boolean');
    }
  });
});
