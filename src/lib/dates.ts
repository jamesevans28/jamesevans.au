/** Format an ISO YYYY-MM (or 'present') as a human label like "Nov 2023". */
export function formatMonth(value: string): string {
  if (value === 'present') return 'Present';
  const [year, month] = value.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error(`Invalid month value: ${value}`);
  }
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[month - 1]} ${year}`;
}

export function formatRange(start: string, end: string): string {
  return `${formatMonth(start)} to ${formatMonth(end)}`;
}

/**
 * Format a full ISO timestamp as an article date, e.g. "25 July 2026".
 * Fixed to en-AU and UTC so the static build and the browser agree — a
 * locale-dependent render would mismatch the prerendered HTML.
 */
export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${iso}`);
  }
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
