import mongoose from 'mongoose';
import { env } from '../config/env.js';

let connection: typeof mongoose | null = null;

export async function connectDb(): Promise<typeof mongoose> {
  if (connection) return connection;
  mongoose.set('strictQuery', true);
  connection = await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    autoIndex: env.NODE_ENV !== 'production',
  });
  console.log('[db] conectado a MongoDB');
  return connection;
}

export async function disconnectDb(): Promise<void> {
  if (!connection) return;
  await mongoose.disconnect();
  connection = null;
}

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}
