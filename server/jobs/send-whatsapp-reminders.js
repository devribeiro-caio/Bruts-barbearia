import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { Appointment } from '../models/Appointment.js';

const reminderDefinitions = [
  {
    kind: '24h',
    targetMinutes: 24 * 60,
    sentField: 'reminder24hSentAt',
    template: () => env.whatsappTemplate24h,
    parameters: (appointment, start) => [
      appointment.customerId.name,
      start.toFormat('dd/MM/yyyy'),
      start.toFormat('HH:mm'),
      appointment.serviceName,
      formatMoney(appointment.priceCents),
    ],
  },
  {
    kind: '2h',
    targetMinutes: 2 * 60,
    sentField: 'reminder2hSentAt',
    template: () => env.whatsappTemplate2h,
    parameters: (appointment, start) => [
      appointment.customerId.name,
      start.toFormat('HH:mm'),
      appointment.serviceName,
    ],
  },
];

function formatMoney(cents = 0) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(cents) || 0) / 100);
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12 && digits.length <= 15) return digits;
  return '';
}

function getReminderWindow(now, targetMinutes) {
  const target = now.plus({ minutes: targetMinutes });
  const lookback = Math.max(5, Number(process.env.REMINDER_LOOKBACK_MINUTES) || 20);
  return {
    $gte: target.minus({ minutes: lookback }).toUTC().toJSDate(),
    $lt: target.plus({ minutes: 1 }).toUTC().toJSDate(),
  };
}

function assertWhatsAppConfiguration() {
  const missing = [];
  if (!env.whatsappAccessToken) missing.push('WHATSAPP_ACCESS_TOKEN');
  if (!env.whatsappPhoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (missing.length > 0) throw new Error(`Configuração do WhatsApp incompleta: ${missing.join(', ')}.`);
}

async function sendTemplate({ to, templateName, parameters }) {
  const response = await fetch(`https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsappAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: env.whatsappTemplateLanguage },
        components: [{
          type: 'body',
          parameters: parameters.map((text) => ({ type: 'text', text: String(text) })),
        }],
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || `HTTP ${response.status}`;
    throw new Error(`WhatsApp recusou a mensagem: ${message}`);
  }
  return body;
}

async function claimAppointment(appointmentId, sentField, sentAt) {
  return Appointment.findOneAndUpdate(
    { _id: appointmentId, status: 'confirmed', [sentField]: null },
    { $set: { [sentField]: sentAt } },
    { new: true },
  );
}

async function releaseClaim(appointmentId, sentField) {
  await Appointment.updateOne({ _id: appointmentId, [sentField]: { $ne: null } }, { $set: { [sentField]: null } });
}

async function processReminder(definition, now) {
  const appointments = await Appointment.find({
    status: 'confirmed',
    startAt: getReminderWindow(now, definition.targetMinutes),
    [definition.sentField]: null,
  }).populate('customerId', 'name whatsappPhone whatsappOptIn').lean();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const appointment of appointments) {
    const customer = appointment.customerId;
    const phone = normalizePhone(customer?.whatsappPhone);
    if (!customer?.whatsappOptIn || !phone) {
      skipped += 1;
      continue;
    }

    const claimedAt = new Date();
    const claimed = await claimAppointment(appointment._id, definition.sentField, claimedAt);
    if (!claimed) continue;

    try {
      const start = DateTime.fromJSDate(appointment.startAt, { zone: 'utc' }).setZone(env.timezone);
      await sendTemplate({
        to: phone,
        templateName: definition.template(),
        parameters: definition.parameters(appointment, start),
      });
      sent += 1;
      console.info(`[whatsapp-reminders] lembrete ${definition.kind} enviado para ${phone}, agendamento ${appointment._id}.`);
    } catch (error) {
      failed += 1;
      await releaseClaim(appointment._id, definition.sentField);
      console.error(`[whatsapp-reminders] falha no lembrete ${definition.kind} do agendamento ${appointment._id}: ${error.message}`);
    }
  }

  return { found: appointments.length, sent, skipped, failed };
}

async function main() {
  if (!env.mongoUri) throw new Error('MONGODB_URI não configurado.');
  assertWhatsAppConfiguration();
  await connectDatabase(env.mongoUri);
  const now = DateTime.now().setZone(env.timezone);
  const results = {};
  for (const definition of reminderDefinitions) {
    results[definition.kind] = await processReminder(definition, now);
  }
  console.info(`[whatsapp-reminders] execução concluída em ${now.toISO()}: ${JSON.stringify(results)}`);
}

try {
  await main();
} catch (error) {
  console.error(`[whatsapp-reminders] execução interrompida: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
