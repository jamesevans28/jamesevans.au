import { site } from '@/content/site';
import { currentRole, skills } from '@/content/experience';
import { services } from '@/content/services';
import { aiOfferings } from '@/content/ai';

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
