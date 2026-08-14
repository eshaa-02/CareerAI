import { formatSalary, timeAgo, getInitials, cn } from '@/utils/helpers';

describe('formatSalary', () => {
  test('formats a min-max range', () => {
    expect(formatSalary(80000, 120000, 'USD')).toBe('$80,000 - $120,000');
  });

  test('formats a single value when only min is provided', () => {
    expect(formatSalary(90000, 0, 'USD')).toBe('$90,000');
  });

  test('formats a single value when only max is provided', () => {
    expect(formatSalary(0, 90000, 'USD')).toBe('$90,000');
  });

  test('returns "Competitive" when neither value is set', () => {
    expect(formatSalary(0, 0, 'USD')).toBe('Competitive');
  });
});

describe('timeAgo', () => {
  test('returns "Just now" for a timestamp seconds ago', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('Just now');
  });

  test('returns minutes for a timestamp within the last hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5 minutes ago');
  });

  test('uses singular unit for a count of exactly 1', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneHourAgo)).toBe('1 hour ago');
  });

  test('returns days for a timestamp several days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3 days ago');
  });
});

describe('getInitials', () => {
  test('takes the first letter of the first two words', () => {
    expect(getInitials('Alex Rivera')).toBe('AR');
  });

  test('handles a single-word name', () => {
    expect(getInitials('Cher')).toBe('C');
  });

  test('caps at two initials for names with more than two words', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MJ');
  });

  test('uppercases lowercase input', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});

describe('cn (class name merge)', () => {
  test('merges class strings and dedupes conflicting Tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  test('drops falsy values', () => {
    expect(cn('text-sm', false, undefined, null, 'font-bold')).toBe('text-sm font-bold');
  });
});
