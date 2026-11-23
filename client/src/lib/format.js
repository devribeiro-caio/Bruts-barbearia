const shopTimezone = 'America/Sao_Paulo';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatMoney(cents = 0) {
  return currency.format((Number(cents) || 0) / 100);
}

export function formatDateTime(value, options = {}) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: shopTimezone,
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(value));
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: shopTimezone,
    dateStyle: 'full',
    ...options,
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: shopTimezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDayTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: shopTimezone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function statusLabel(status) {
  return ({ pending: 'Pendente', confirmed: 'Confirmado', rejected: 'Recusado' })[status] || status;
}

export function parsePriceToCents(value) {
  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function centsToInput(cents) {
  return (Number(cents || 0) / 100).toFixed(2).replace('.', ',');
}
