import { DateTime } from 'luxon';
import { Appointment } from '../models/Appointment.js';
import { BusinessHours } from '../models/BusinessHours.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
import { localDateTime, parseMonth } from '../utils/date-time.js';

export async function getMonthlyAvailability(service, monthValue) {
  const month = parseMonth(monthValue);
  const endOfMonth = month.plus({ months: 1 });
  const [hoursRows, appointmentRows] = await Promise.all([
    BusinessHours.find({ dayOfWeek: { $gte: 1, $lte: 7 } }).lean(),
    Appointment.find({
      occupiesSlot: true,
      slotStarts: {
        $gte: month.toUTC().toJSDate(),
        $lt: endOfMonth.toUTC().toJSDate(),
      },
    }).select('slotStarts').lean(),
  ]);

  const hoursByDay = new Map(hoursRows.map((row) => [row.dayOfWeek, row]));
  const busySlots = new Set(appointmentRows.flatMap((row) => row.slotStarts).map((slot) => new Date(slot).getTime()));
  const now = DateTime.now().setZone(env.timezone);
  const duration = service.durationMinutes;
  const numberOfDays = month.daysInMonth;
  const days = [];

  for (let dayNumber = 1; dayNumber <= numberOfDays; dayNumber += 1) {
    const day = month.set({ day: dayNumber });
    const date = day.toISODate();
    const schedule = hoursByDay.get(day.weekday);
    const slots = [];

    if (schedule?.isOpen) {
      const opensAt = localDateTime(date, schedule.openTime);
      const closesAt = localDateTime(date, schedule.closeTime);

      for (let start = opensAt; start.plus({ minutes: duration }) <= closesAt; start = start.plus({ minutes: 30 })) {
        if (start <= now) continue;
        const slotStarts = [];
        for (let offset = 0; offset < duration; offset += 30) {
          slotStarts.push(start.plus({ minutes: offset }).toUTC().toMillis());
        }
        if (slotStarts.some((slot) => busySlots.has(slot))) continue;
        slots.push({ time: start.toFormat('HH:mm') });
      }
    }

    days.push({ date, slots, availableCount: slots.length });
  }

  return { month: month.toFormat('yyyy-MM'), timezone: env.timezone, days };
}

export async function assertAvailableSlot(service, date, time) {
  const requestedStart = localDateTime(date, time);
  if (requestedStart <= DateTime.now().setZone(env.timezone)) {
    throw new HttpError(400, 'Escolha um horário futuro.');
  }

  const monthValue = requestedStart.toFormat('yyyy-MM');
  const availability = await getMonthlyAvailability(service, monthValue);
  const day = availability.days.find((item) => item.date === date);
  if (!day?.slots.some((slot) => slot.time === time)) {
    throw new HttpError(409, 'Este horário não está mais disponível. Atualize a agenda e escolha outro.');
  }

  const slotStarts = [];
  for (let offset = 0; offset < service.durationMinutes; offset += 30) {
    slotStarts.push(requestedStart.plus({ minutes: offset }).toUTC().toJSDate());
  }
  return {
    startAt: requestedStart.toUTC().toJSDate(),
    endAt: requestedStart.plus({ minutes: service.durationMinutes }).toUTC().toJSDate(),
    slotStarts,
  };
}
