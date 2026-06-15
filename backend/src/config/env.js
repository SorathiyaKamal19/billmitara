import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/poss',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`,
  mail: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.GMAIL_USER,
    appPassword: process.env.GMAIL_APP_PASSWORD,
    from: process.env.MAIL_FROM || process.env.GMAIL_USER
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
