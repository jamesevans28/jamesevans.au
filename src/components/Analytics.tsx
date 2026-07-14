import { GoogleAnalytics } from '@next/third-parties/google';

/**
 * Google Analytics 4, loaded only in production and only when a measurement
 * ID is configured (NEXT_PUBLIC_GA_ID, e.g. G-XXXXXXX). @next/third-parties
 * loads gtag efficiently and off the critical path.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (process.env.NODE_ENV !== 'production' || !gaId) {
    return null;
  }
  return <GoogleAnalytics gaId={gaId} />;
}
