export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyByOffset(value, delta) {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1, 12);
  return currentMonthKey(date);
}

export function formatCalendarDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(year, month - 1, day, 12));
}
