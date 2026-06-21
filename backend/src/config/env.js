import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function booleanEnv(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function numberEnv(value, defaultValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/poss',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`,
  mail: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'onboarding@resend.dev'
  },
  passwordReset: {
    otpMinutes: Number(process.env.PASSWORD_RESET_OTP_MINUTES || 10),
    maxAttempts: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 5)
  },
  whatsappProvider: process.env.WHATSAPP_PROVIDER || 'mock',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_WHATSAPP_FROM
  },
  keepAlive: {
    enabled: booleanEnv(process.env.KEEP_ALIVE_ENABLED),
    url: process.env.KEEP_ALIVE_URL,
    intervalMinutes: numberEnv(process.env.KEEP_ALIVE_INTERVAL_MINUTES, 9)
  },
  seed: {
    ownerEmail: process.env.SEED_OWNER_EMAIL || 'owner@poss.local',
    ownerPassword: process.env.SEED_OWNER_PASSWORD || 'Password@123'
  }
};

if (env.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || env.jwtSecret === 'dev-only-change-me' || env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong secret of at least 32 characters in production');
  }
}
