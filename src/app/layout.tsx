import type { Metadata } from 'next';
import { archivo, bricolage } from './fonts';
import { ThemeScript } from '@/components/ThemeScript';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { JsonLd, personSchema, websiteSchema } from '@/lib/jsonld';
import { Analytics } from '@/components/Analytics';
import { site } from '@/content/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Software engineering, apps & tech help in Melbourne`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Software engineering, apps & tech help`,
    description: site.description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — Software engineering, apps & tech help`,
    description: site.description,
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" className={`${bricolage.variable} ${archivo.variable}`}>
      <head>
        <ThemeScript />
        <JsonLd data={[personSchema(), websiteSchema()]} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-volt focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
