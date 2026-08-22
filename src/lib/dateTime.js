const timeZone = 'Asia/Kolkata';

export function toKolkataInput(value) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

// datetime-local has no timezone. Treat the entered wall-clock value as IST,
// regardless of the computer/browser timezone, then persist a single UTC instant.
export function fromKolkataInput(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return '';
  const [, year, month, day, hour, minute] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) - (5.5 * 60 * 60 * 1000)).toISOString();
}

export function formatExamDateTime(value) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone, dateStyle: 'medium', timeStyle: 'short', hour12: false,
  }).format(new Date(value));
}

export function examAvailability(exam, now = Date.now()) {
  if (now < new Date(exam.startDate).getTime()) return 'Upcoming';
  if (now > new Date(exam.endDate).getTime()) return 'Ended';
  return 'Live';
}
