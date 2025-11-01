const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

const store = new Map(); // email -> { otp, expiresAt, attempts }

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createOtp(email) {
  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_MS;
  store.set(email, { otp, expiresAt, attempts: 0 });
  return { otp, expiresAt };
}

export function verifyOtp(email, otp) {
  const entry = store.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) return false;
  if (entry.attempts >= MAX_ATTEMPTS) return false;
  entry.attempts += 1;
  return entry.otp === String(otp).trim();
}

export function consumeOtp(email) {
  store.delete(email);
}

export function hasActiveOtp(email) {
  const entry = store.get(email);
  return !!entry && Date.now() <= entry.expiresAt;
}


