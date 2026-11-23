import { Router } from 'express';
import { DateTime } from 'luxon';
import { env } from '../config/env.js';
import { Appointment } from '../models/Appointment.js';
import { BusinessHours } from '../models/BusinessHours.js';
import { Membership } from '../models/Membership.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/errors.js';
import {
  businessHoursSchema,
  membershipCreateSchema,
  membershipUpdateSchema,
  parseOrThrow,
  rejectAppointmentSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
} from '../utils/validation.js';

const router = Router();
router.use(authenticate, requireAdmin);

function validObjectId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

router.get('/overview', asyncHandler(async (_req, res) => {
  const today = DateTime.now().setZone(env.timezone);
  const start = today.startOf('day').toUTC().toJSDate();
  const end = today.plus({ days: 1 }).startOf('day').toUTC().toJSDate();
  const [pendingAppointments, todaysAppointments, activeMemberships, customerCount] = await Promise.all([
    Appointment.countDocuments({ status: 'pending' }),
    Appointment.countDocuments({ startAt: { $gte: start, $lt: end }, status: { $in: ['pending', 'confirmed'] } }),
    Membership.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'customer' }),
  ]);
  res.json({ overview: { pendingAppointments, todaysAppointments, activeMemberships, customerCount } });
}));

router.get('/appointments', asyncHandler(async (req, res) => {
  const filter = {};
  if (['pending', 'confirmed', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
  const appointments = await Appointment.find(filter)
    .sort({ startAt: 1 })
    .limit(300)
    .populate('customerId', 'name email')
    .select('customerId serviceName priceCents durationMinutes startAt endAt status customerNotes adminNotes createdAt')
    .lean();
  res.json({ appointments });
}));

router.patch('/appointments/:id/confirm', asyncHandler(async (req, res) => {
  if (!validObjectId(req.params.id)) throw new HttpError(400, 'Agendamento inválido.');
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, status: 'pending', occupiesSlot: true },
    { $set: { status: 'confirmed' } },
    { new: true, runValidators: true },
  ).populate('customerId', 'name email').lean();
  if (!appointment) throw new HttpError(409, 'Este agendamento não está mais pendente. Atualize a agenda.');
  res.json({ appointment });
}));

router.patch('/appointments/:id/reject', asyncHandler(async (req, res) => {
  if (!validObjectId(req.params.id)) throw new HttpError(400, 'Agendamento inválido.');
  const input = parseOrThrow(rejectAppointmentSchema, req.body);
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, status: 'pending', occupiesSlot: true },
    { $set: { status: 'rejected', occupiesSlot: false, adminNotes: input.adminNotes } },
    { new: true, runValidators: true },
  ).populate('customerId', 'name email').lean();
  if (!appointment) throw new HttpError(409, 'Este agendamento não está mais pendente. Atualize a agenda.');
  res.json({ appointment });
}));

router.get('/business-hours', asyncHandler(async (_req, res) => {
  const days = await BusinessHours.find().sort({ dayOfWeek: 1 }).lean();
  res.json({ days });
}));

router.put('/business-hours', asyncHandler(async (req, res) => {
  const { days } = parseOrThrow(businessHoursSchema, req.body);
  const upcoming = await Appointment.find({
    occupiesSlot: true,
    startAt: { $gte: DateTime.now().toUTC().toJSDate() },
  }).select('startAt endAt').lean();
  const schedule = new Map(days.map((day) => [day.dayOfWeek, day]));

  for (const appointment of upcoming) {
    const start = DateTime.fromJSDate(appointment.startAt, { zone: 'utc' }).setZone(env.timezone);
    const end = DateTime.fromJSDate(appointment.endAt, { zone: 'utc' }).setZone(env.timezone);
    const day = schedule.get(start.weekday);
    if (!day?.isOpen || start.toFormat('HH:mm') < day.openTime || end.toFormat('HH:mm') > day.closeTime) {
      throw new HttpError(409, 'A alteração afetaria um horário já reservado. Ajuste a agenda existente antes de salvar o expediente.');
    }
  }

  await Promise.all(days.map((day) => BusinessHours.updateOne(
    { dayOfWeek: day.dayOfWeek },
    { $set: day },
    { upsert: true, runValidators: true },
  )));
  const savedDays = await BusinessHours.find().sort({ dayOfWeek: 1 }).lean();
  res.json({ days: savedDays });
}));

router.get('/services', asyncHandler(async (_req, res) => {
  const services = await Service.find().sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ services });
}));

router.post('/services', asyncHandler(async (req, res) => {
  const input = parseOrThrow(serviceCreateSchema, req.body);
  const service = await Service.create({ ...input, isDemo: false });
  res.status(201).json({ service });
}));

router.patch('/services/:id', asyncHandler(async (req, res) => {
  if (!validObjectId(req.params.id)) throw new HttpError(400, 'Serviço inválido.');
  const input = parseOrThrow(serviceUpdateSchema, req.body);
  if (Object.keys(input).length === 0) throw new HttpError(400, 'Informe ao menos um campo para atualizar.');
  const updates = { ...input };
  if (Object.hasOwn(input, 'priceCents')) updates.isDemo = false;
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true },
  ).lean();
  if (!service) throw new HttpError(404, 'Serviço não encontrado.');
  res.json({ service });
}));

router.get('/customers', asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 80) : '';
  const filter = { role: 'customer' };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }
  const customers = await User.find(filter).select('name email createdAt').sort({ name: 1 }).limit(300).lean();
  res.json({ customers });
}));

router.get('/memberships', asyncHandler(async (_req, res) => {
  const memberships = await Membership.find()
    .populate('customerId', 'name email')
    .sort({ status: 1, billingDay: 1, createdAt: -1 })
    .limit(300)
    .lean();
  res.json({ memberships });
}));

router.post('/memberships', asyncHandler(async (req, res) => {
  const input = parseOrThrow(membershipCreateSchema, req.body);
  const customer = await User.findOne({ _id: input.customerId, role: 'customer' }).select('_id');
  if (!customer) throw new HttpError(404, 'Cliente não encontrado.');
  const startedAt = DateTime.fromISO(input.startedAt, { zone: env.timezone });
  if (!startedAt.isValid || startedAt.toISODate() !== input.startedAt) throw new HttpError(400, 'Data de início inválida.');
  const membership = await Membership.create({
    ...input,
    customerId: customer._id,
    startedAt: startedAt.startOf('day').toUTC().toJSDate(),
  });
  const populated = await membership.populate('customerId', 'name email');
  res.status(201).json({ membership: populated.toObject() });
}));

router.patch('/memberships/:id', asyncHandler(async (req, res) => {
  if (!validObjectId(req.params.id)) throw new HttpError(400, 'Plano mensal inválido.');
  const input = parseOrThrow(membershipUpdateSchema, req.body);
  if (Object.keys(input).length === 0) throw new HttpError(400, 'Informe ao menos um campo para atualizar.');
  const updates = { ...input };
  if (updates.startedAt) {
    const startedAt = DateTime.fromISO(updates.startedAt, { zone: env.timezone });
    if (!startedAt.isValid || startedAt.toISODate() !== updates.startedAt) throw new HttpError(400, 'Data de início inválida.');
    updates.startedAt = startedAt.startOf('day').toUTC().toJSDate();
  }
  const membership = await Membership.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true },
  ).populate('customerId', 'name email').lean();
  if (!membership) throw new HttpError(404, 'Plano mensal não encontrado.');
  res.json({ membership });
}));

export default router;
