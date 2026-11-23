import { DateTime } from 'luxon';
import { env } from '../config/env.js';
import { HttpError } from './errors.js';

export function localDateTime(date, time) {
  const value = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: env.timezone });
  if (!value.isValid || value.toFormat('yyyy-MM-dd HH:mm') !== `${date} ${time}`) {
    throw new HttpError(400, 'Data ou horário inválido.');
  }
  return value;
}

export function parseMonth(value) {
  const month = DateTime.fromFormat(value, 'yyyy-MM', { zone: env.timezone }).startOf('month');
  if (!month.isValid || month.toFormat('yyyy-MM') !== value) {
    throw new HttpError(400, 'Mês inválido.');
  }
  const currentMonth = DateTime.now().setZone(env.timezone).startOf('month');
  if (month < currentMonth || month > currentMonth.plus({ months: 6 })) {
    throw new HttpError(400, 'A agenda pode ser consultada até seis meses à frente.');
  }
  return month;
}

export function dateAtTime(date, time) {
  return localDateTime(date, time).toUTC().toJSDate();
}
