import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

let transporter;

function getTransporter() {
  if (!env.mail.user || !env.mail.appPassword) {
    throw new ApiError(503, 'Password reset email is not configured');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: {
        user: env.mail.user,
        pass: env.mail.appPassword
      }
    });
  }

  return transporter;
}

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);
}

export async function sendPasswordResetOtp({ email, name, otp }) {
  const safeName = escapeHtml(name || 'there');
  const minutes = env.passwordReset.otpMinutes;

  try {
    await getTransporter().sendMail({
      from: env.mail.from,
      to: email,
      subject: `${otp} is your BillMitara password reset code`,
      text: `Hello ${name || 'there'}, your BillMitara password reset code is ${otp}. It expires in ${minutes} minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="background:#f8fafc;padding:32px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="max-width:520px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:32px">
            <p style="margin:0;color:#0f766e;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">BillMitara POS</p>
            <h1 style="margin:12px 0 8px;font-size:26px">Reset your password</h1>
            <p style="color:#475569;line-height:1.6">Hello ${safeName}, use this one-time code to reset your password:</p>
            <div style="margin:24px 0;padding:18px;border-radius:14px;background:#ecfdf5;text-align:center;font-size:34px;font-weight:800;letter-spacing:10px;color:#0f766e">${otp}</div>
            <p style="color:#475569;line-height:1.6">This code expires in ${minutes} minutes. If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        </div>
      `
    });
  } catch (error) {
    console.error('Password reset email failed:', error.message);
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'Could not send password reset email');
  }
}
