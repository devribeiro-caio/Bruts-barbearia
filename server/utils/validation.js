import { z } from 'zod';
import { HttpError } from './errors.js';

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe um horário válido.');
const serviceId = z.string().regex(/^[a-f\d]{24}$/i, 'Serviço inválido.');
const customerId = z.string().regex(/^[a-f\d]{24}$/i, 'Cliente inválido.');
const priceCents = z.number().int().min(0).max(10_000_000);
const durationMinutes = z.number().int().min(30).max(240).refine((value) => value % 30 === 0, 'A duração deve usar blocos de 30 minutos.');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(80),
  email: z.string().trim().email('Informe um e-mail válido.').max(254),
  whatsappPhone: z.string().trim().max(20).optional().default(''),
  whatsappOptIn: z.boolean().optional().default(false),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(72)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'A senha é muito longa.'),
}).superRefine((value, context) => {
  if (value.whatsappOptIn && value.whatsappPhone.replace(/\D/g, '').length < 10) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['whatsappPhone'], message: 'Informe um WhatsApp válido para receber lembretes.' });
  }
});

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').max(254),
  password: z.string().min(1, 'Informe sua senha.').max(72),
});

export const appointmentSchema = z.object({
  serviceId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha uma data válida.'),
  time: timeString,
  customerNotes: z.string().trim().max(500).optional().default(''),
});

const businessDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  isOpen: z.boolean(),
  openTime: timeString,
  closeTime: timeString,
}).superRefine((day, context) => {
  if (day.isOpen && day.openTime >= day.closeTime) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['closeTime'], message: 'O fim do expediente deve ser depois do início.' });
  }
});

export const businessHoursSchema = z.object({
  days: z.array(businessDaySchema).length(7, 'Configure os sete dias da semana.'),
}).superRefine((value, context) => {
  const dayNumbers = value.days.map((day) => day.dayOfWeek);
  if (new Set(dayNumbers).size !== 7) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['days'], message: 'Cada dia da semana deve aparecer uma única vez.' });
  }
});

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().default(''),
  priceCents,
  durationMinutes,
  isActive: z.boolean().optional().default(true),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export const membershipCreateSchema = z.object({
  customerId,
  planName: z.string().trim().min(2).max(80),
  monthlyPriceCents: priceCents,
  billingDay: z.number().int().min(1).max(31),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de início.'),
  status: z.enum(['active', 'paused', 'cancelled']).optional().default('active'),
  notes: z.string().trim().max(500).optional().default(''),
});

export const membershipUpdateSchema = z.object({
  planName: z.string().trim().min(2).max(80).optional(),
  monthlyPriceCents: priceCents.optional(),
  billingDay: z.number().int().min(1).max(31).optional(),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const rejectAppointmentSchema = z.object({
  adminNotes: z.string().trim().max(500).optional().default(''),
});

export function parseOrThrow(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new HttpError(400, firstIssue?.message || 'Os dados enviados são inválidos.');
  }
  return result.data;
}
