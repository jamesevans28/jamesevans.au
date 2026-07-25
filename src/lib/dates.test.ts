import { describe, it, expect } from 'vitest';
import { formatMonth, formatRange, formatPostDate } from './dates';

describe('formatMonth', () => {
  it('formats an ISO year-month', () => {
    expect(formatMonth('2023-11')).toBe('Nov 2023');
  });

  it('renders the present sentinel', () => {
    expect(formatMonth('present')).toBe('Present');
  });

  it('rejects malformed values', () => {
    expect(() => formatMonth('2023-13')).toThrow();
    expect(() => formatMonth('nonsense')).toThrow();
  });
});

describe('formatRange', () => {
  it('joins two months', () => {
    expect(formatRange('2023-11', 'present')).toBe('Nov 2023 to Present');
  });
});

describe('formatPostDate', () => {
  it('formats an ISO timestamp as an article date', () => {
    expect(formatPostDate('2026-07-20T09:00:00.000Z')).toBe('20 July 2026');
  });

  it('is timezone-stable, so prerendered HTML matches the browser', () => {
    // A late-UTC timestamp must not roll to the next day for AEST readers:
    // the prerendered date is fixed at build time and cannot re-render.
    expect(formatPostDate('2026-07-20T23:30:00.000Z')).toBe('20 July 2026');
    // ...nor back a day for the Americas.
    expect(formatPostDate('2026-07-20T00:30:00.000Z')).toBe('20 July 2026');
  });

  it('rejects an invalid date', () => {
    expect(() => formatPostDate('not-a-date')).toThrow();
  });
});
