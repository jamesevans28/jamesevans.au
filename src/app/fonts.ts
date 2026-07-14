import localFont from 'next/font/local';

// Self-hosted variable fonts — zero external requests, no layout shift.
// Bricolage Grotesque (display) and Archivo (body) are both OFL-licensed.

export const bricolage = localFont({
  src: './fonts/bricolage-grotesque.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '300 900',
});

export const archivo = localFont({
  src: './fonts/archivo.woff2',
  variable: '--font-body',
  display: 'swap',
  weight: '100 900',
});
