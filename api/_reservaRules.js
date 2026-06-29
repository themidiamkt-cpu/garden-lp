const TIMEZONE = 'America/Sao_Paulo';
const RESERVATION_CUTOFF_TIME = '12:00';
const CLOSED_DATES = new Set(['2026-06-12', '2026-06-13', '2026-06-19', '2026-06-24']);
const SPECIAL_DEPOSIT_RULES = {
  '2026-06-29': {
    after: '12:00',
    amountPerAdult: 100
  }
};

const OPENING_HOURS = {
  0: [{ start: '11:00', end: '18:00' }],
  1: [{ start: '11:00', end: '15:00' }],
  2: [{ start: '11:00', end: '15:00' }],
  3: [{ start: '11:00', end: '15:00' }, { start: '18:00', end: '24:00' }],
  4: [{ start: '11:00', end: '15:00' }, { start: '18:00', end: '24:00' }],
  5: [{ start: '11:00', end: '15:00' }, { start: '18:00', end: '24:00' }],
  6: [{ start: '11:00', end: '24:00' }]
};

function padTime(value) {
  return String(value).padStart(2, '0');
}

function minutesFromTime(time) {
  const [hours, minutes] = String(time).split(':').map(Number);
  return (hours * 60) + minutes;
}

function timeFromMinutes(total) {
  return `${padTime(Math.floor(total / 60))}:${padTime(total % 60)}`;
}

function localDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return (Number(parts.hour) * 60) + Number(parts.minute);
}

function dayOfWeek(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function getValidSlots(dateString, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString))) return [];
  if (CLOSED_DATES.has(dateString)) return [];

  const today = localDateString(now);
  if (dateString < today) return [];

  const intervals = OPENING_HOURS[dayOfWeek(dateString)] || [];
  const currentMinutes = localMinutes(now);
  const slots = [];

  intervals.forEach(interval => {
    const start = minutesFromTime(interval.start);
    const end = minutesFromTime(interval.end);
    const latestReservation = SPECIAL_DEPOSIT_RULES[dateString]
      ? end - 30
      : minutesFromTime(RESERVATION_CUTOFF_TIME);

    for (let minute = start; minute < end; minute += 30) {
      if (minute > latestReservation) break;
      if (dateString === today && minute <= currentMinutes) continue;
      slots.push(timeFromMinutes(minute));
    }
  });

  return slots;
}

function isValidSlot(dateString, time, now = new Date()) {
  return getValidSlots(dateString, now).includes(time);
}

function requiresSpecialDeposit(dateString, time) {
  const rule = SPECIAL_DEPOSIT_RULES[dateString];
  if (!rule || !/^\d{2}:\d{2}$/.test(String(time))) return false;
  return minutesFromTime(time) > minutesFromTime(rule.after);
}

module.exports = {
  CLOSED_DATES,
  OPENING_HOURS,
  RESERVATION_CUTOFF_TIME,
  SPECIAL_DEPOSIT_RULES,
  TIMEZONE,
  getValidSlots,
  isValidSlot,
  requiresSpecialDeposit
};
