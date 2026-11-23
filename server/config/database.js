import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 12_000,
    connectTimeoutMS: 12_000,
    maxPoolSize: 10,
  });
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}
