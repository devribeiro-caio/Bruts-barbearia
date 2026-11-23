import { Router } from 'express';
import { env } from '../config/env.js';
import { BusinessHours } from '../models/BusinessHours.js';
import { Service } from '../models/Service.js';
import { getMonthlyAvailability } from '../services/availability.js';
import { asyncHandler, HttpError } from '../utils/errors.js';

const router = Router();

router.get('/services', asyncHandler(async (_req, res) => {
  const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ services });
}));

router.get('/contact', asyncHandler(async (_req, res) => {
  const services = await Service.find({ isActive: true }).select('isDemo').lean();
  res.json({
    whatsappPhone: env.whatsappPhone,
    timezone: env.timezone,
    demoPrices: services.some((service) => service.isDemo),
  });
}));

router.get('/business-hours', asyncHandler(async (_req, res) => {
  const days = await BusinessHours.find().sort({ dayOfWeek: 1 }).lean();
  res.json({ days });
}));

router.get('/availability', asyncHandler(async (req, res) => {
  const { serviceId, month } = req.query;
  if (typeof serviceId !== 'string' || !/^[a-f\d]{24}$/i.test(serviceId)) {
    throw new HttpError(400, 'Escolha um serviço válido.');
  }
  if (typeof month !== 'string') throw new HttpError(400, 'Informe o mês para consultar a agenda.');

  const service = await Service.findOne({ _id: serviceId, isActive: true }).lean();
  if (!service) throw new HttpError(404, 'Este serviço não está disponível.');
  const availability = await getMonthlyAvailability(service, month);
  res.json({ availability });
}));

export default router;
