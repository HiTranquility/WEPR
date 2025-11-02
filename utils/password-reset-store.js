import crypto from "crypto";

const resetTokens = new Map();

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function buildRecord(userId, ttlMs = DEFAULT_TTL_MS) {
  const expiresAt = Date.now() + ttlMs;
  return { userId, expiresAt };
}

export function createPasswordResetToken(userId, ttlMs = DEFAULT_TTL_MS) {
  if (!userId) throw new Error("Missing user id for password reset token");
  const token = crypto.randomBytes(32).toString("hex");
  resetTokens.set(token, buildRecord(userId, ttlMs));
  return token;
}

export function getPasswordResetToken(token) {
  if (!token) return null;
  const record = resetTokens.get(token);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  return record;
}

export function consumePasswordResetToken(token) {
  const record = getPasswordResetToken(token);
  if (!record) return null;
  resetTokens.delete(token);
  return record;
}

export function clearPasswordResetToken(token) {
  if (!token) return;
  resetTokens.delete(token);
}

export function purgeExpiredPasswordResetTokens() {
  const now = Date.now();
  for (const [token, record] of resetTokens.entries()) {
    if (record.expiresAt <= now) {
      resetTokens.delete(token);
    }
  }
}

