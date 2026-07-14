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
  return `${formatMonth(start)} — ${formatMonth(end)}`;
}
