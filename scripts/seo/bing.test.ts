import { describe, expect, it } from 'vitest';
import { wcfDate } from './bing';

describe('wcfDate', () => {
  it('parses WCF dates with a timezone offset', () => {
    expect(wcfDate('/Date(1316156400000-0700)/')).toBe(
      new Date(1316156400000).toISOString(),
    );
  });

  it('parses WCF dates without an offset', () => {
    expect(wcfDate('/Date(1753000000000)/')).toBe(
      new Date(1753000000000).toISOString(),
    );
  });

  // Bing sends the .NET zero date to mean "never crawled". Reporting it as a
  // real year-0001 timestamp would read as data rather than its absence.
  it('treats the .NET zero date as null', () => {
    expect(wcfDate('/Date(-62135596800000)/')).toBeNull();
  });

  it('leaves non-date strings untouched', () => {
    expect(wcfDate('https://jamesevans.au/')).toBe('https://jamesevans.au/');
    expect(wcfDate('')).toBe('');
  });
});
