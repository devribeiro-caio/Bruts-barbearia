import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const timezone = process.env.SHOP_TIMEZONE || 'America/Sao_Paulo';

try {
  new Intl.DateTimeFormat('pt-BR', { timeZone: timezone });
} catch {
  throw new Error(`Fuso horário inválido em SHOP_TIMEZONE: ${timezone}`);
}

if (nodeEnv === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Defina JWT_SECRET com pelo menos 32 caracteres no ambiente de produção.');
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI?.trim() || '',
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  jwtSecret: process.env.JWT_SECRET || 'local-only-change-this-development-secret-32chars',
  timezone,
  whatsappPhone: (process.env.WHATSAPP_PHONE || '').replace(/\D/g, ''),
  cookieName: 'brutus_session',
};
