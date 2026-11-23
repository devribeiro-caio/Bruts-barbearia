import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import app from './app.js';
import { seedDatabase } from './services/seed.js';

async function start() {
  if (env.mongoUri) {
    try {
      await connectDatabase(env.mongoUri);
      await seedDatabase();
      console.info('MongoDB conectado e índices verificados.');
    } catch (error) {
      console.error('Não foi possível preparar o MongoDB:', error.message);
      if (env.isProduction) process.exit(1);
    }
  } else if (env.isProduction) {
    throw new Error('MONGODB_URI não configurado.');
  } else {
    console.warn('MONGODB_URI não configurado. A interface inicia, mas operações de dados ficam indisponíveis.');
  }

  const host = env.isProduction ? '0.0.0.0' : '127.0.0.1';
  const server = app.listen(env.port, host, () => {
    console.info(`Brutus Cortes escutando em ${host}:${env.port}`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
