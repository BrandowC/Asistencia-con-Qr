import { env } from '../config/env.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function roomCodeExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + env.ROOM_CODE_TTL_SECONDS * 1000);
}
