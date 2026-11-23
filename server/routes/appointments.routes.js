import { Router } from 'express';
import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { authenticate } from '../middleware/auth.js';
import { assertAvailableSlot } from '../services/availability.js';
import { asyncHandler, HttpError } from '../utils/errors.js';
import { appointmentSchema, parseOrThrow } from '../utils/validation.js';

const router = Router();
router.use(authenticate);

router.get('/mine', asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ customerId: req.user.id })
    .sort({ startAt: -1 })
    .limit(100)
    .select('serviceName priceCents durationMinutes startAt endAt status customerNotes adminNotes createdAt')
    .lean();
  res.json({ appointments });
}));

router.post('/', asyncHandler(async (req, res) => {
  const input = parseOrThrow(appointmentSchema, req.body);
  const service = await Service.findOne({ _id: input.serviceId, isActive: true }).lean();
  if (!service) throw new HttpError(404, 'Este serviço não está disponível.');
  const slot = await assertAvailableSlot(service, input.date, input.time);

  try {
    const appointment = await Appointment.create({
      customerId: req.user.id,
      serviceId: service._id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      startAt: slot.startAt,
      endAt: slot.endAt,
      slotStarts: slot.slotStarts,
      occupiesSlot: true,
      status: 'pending',
      customerNotes: input.customerNotes,
    });
    res.status(201).json({ appointment });
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(409, 'Este horário acabou de ser reservado. Atualize a agenda e escolha outro.');
    }
    throw error;
  }
}));

export default router;
