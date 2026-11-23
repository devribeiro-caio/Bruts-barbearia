import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { Appointment } from '../models/Appointment.js';
import { BusinessHours } from '../models/BusinessHours.js';
import { Membership } from '../models/Membership.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';

export async function ensureIndexes() {
  await Promise.all([
    User.init(),
    Service.init(),
    BusinessHours.init(),
    Appointment.init(),
    Membership.init(),
  ]);
}

async function seedServices() {
  if (await Service.exists()) return;
  await Service.insertMany([
    { name: 'Corte tradicional', description: 'Acabamento limpo, no seu estilo.', priceCents: 4500, durationMinutes: 30, sortOrder: 1, isDemo: true },
    { name: 'Degradê', description: 'Transição precisa e contorno alinhado.', priceCents: 5500, durationMinutes: 60, sortOrder: 2, isDemo: true },
    { name: 'Barba', description: 'Desenho e acabamento com cuidado.', priceCents: 3000, durationMinutes: 30, sortOrder: 3, isDemo: true },
    { name: 'Corte + barba', description: 'Serviço completo em uma visita.', priceCents: 7500, durationMinutes: 90, sortOrder: 4, isDemo: true },
  ]);
}

async function seedBusinessHours() {
  for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek += 1) {
    await BusinessHours.updateOne(
      { dayOfWeek },
      { $setOnInsert: { dayOfWeek, isOpen: false, openTime: '09:00', closeTime: '18:00' } },
      { upsert: true },
    );
  }
}

async function seedAdmin() {
  const currentAdmin = await User.findOne({ role: 'admin' }).select('_id email').lean();
  if (currentAdmin) return;

  if (!env.adminEmail || !env.adminPassword) {
    if (env.isProduction) {
      throw new Error('Configure ADMIN_EMAIL e ADMIN_PASSWORD para criar a conta única do administrador.');
    }
    console.warn('Admin não configurado. Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env para entrar no painel.');
    return;
  }

  if (Buffer.byteLength(env.adminPassword, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD precisa ter no máximo 72 bytes para o hash de senha.');
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  await User.create({ name: 'Administrador', email: env.adminEmail, passwordHash, role: 'admin' });
  console.info('Conta administrativa inicial provisionada.');
}

export async function seedDatabase() {
  await ensureIndexes();
  await seedServices();
  await seedBusinessHours();
  await seedAdmin();
}
