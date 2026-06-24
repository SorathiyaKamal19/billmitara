import { Resend } from "resend";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

let resend;

function getResendClient() {
  if (!env.mail.resendApiKey) {
    throw new ApiError(503, "Email service is not configured");
  }

  if (!resend) {
    resend = new Resend(env.mail.resendApiKey);
  }

  return resend;
}

function escapeHtml(value = "") {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function resendErrorDetails(error) {
  return {
    name: error?.name,
    message: error?.message || "Unknown Resend error",
    statusCode: error?.statusCode,
  };
}

export async function sendPasswordResetOtp({ email, name, otp }) {
  const safeName = escapeHtml(name || "there");
  const minutes = env.passwordReset.otpMinutes;

  try {
    const { error } = await getResendClient().emails.send({
      from: env.mail.from,
      to: email,
      subject: `${otp} is your BillMitara password reset code`,
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
      `,
      text: `Hello ${name || "there"}, your BillMitara password reset code is ${otp}. It expires in ${minutes} minutes. If you did not request this, ignore this email.`,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    const details = resendErrorDetails(error);
    console.error("Password reset email failed:", details);
    if (error instanceof ApiError) throw error;
    if (env.nodeEnv !== "production") {
      throw new ApiError(502, `Could not send password reset email: ${details.message}`);
    }
    throw new ApiError(502, "Could not send password reset email");
  }
}

export async function sendSupportRequestEmail({ ticket }) {
  const safeName = escapeHtml(ticket.name || "Unknown user");
  const safeEmail = escapeHtml(ticket.email || "No email");
  const safePhone = escapeHtml(ticket.phone || "No phone");
  const safeRestaurant = escapeHtml(ticket.restaurantName || "No restaurant");
  const safeCategory = escapeHtml(ticket.category || "other");
  const safeSubject = escapeHtml(ticket.subject);
  const safeMessage = escapeHtml(ticket.message).replace(/\n/g, "<br />");
  const supportTo = env.mail.supportTo;

  if (!supportTo) {
    throw new ApiError(503, "Support email recipient is not configured");
  }

  try {
    const { error } = await getResendClient().emails.send({
      from: env.mail.from,
      to: supportTo,
      subject: `BillMitara support: ${ticket.subject}`,
      html: `
        <div style="background:#f8fafc;padding:32px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="max-width:640px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:32px">
            <p style="margin:0;color:#0f766e;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">BillMitara Help & Support</p>
            <h1 style="margin:12px 0 8px;font-size:26px">${safeSubject}</h1>
            <p style="margin:0 0 20px;color:#475569;line-height:1.6">A user submitted a new support query from the application. The customer has been told that queries are usually resolved within 2 days.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:20px">
              <p style="margin:0 0 8px"><strong>Name:</strong> ${safeName}</p>
              <p style="margin:0 0 8px"><strong>Email:</strong> ${safeEmail}</p>
              <p style="margin:0 0 8px"><strong>Phone:</strong> ${safePhone}</p>
              <p style="margin:0 0 8px"><strong>Restaurant:</strong> ${safeRestaurant}</p>
              <p style="margin:0"><strong>Category:</strong> ${safeCategory}</p>
            </div>
            <div style="border-left:4px solid #0f766e;padding-left:16px;color:#334155;line-height:1.7">${safeMessage}</div>
          </div>
        </div>
      `,
      text: `BillMitara support query\n\nSubject: ${ticket.subject}\nCategory: ${ticket.category}\nName: ${ticket.name}\nEmail: ${ticket.email || "No email"}\nPhone: ${ticket.phone || "No phone"}\nRestaurant: ${ticket.restaurantName || "No restaurant"}\n\nThe customer has been told that queries are usually resolved within 2 days.\n\n${ticket.message}`,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    const details = resendErrorDetails(error);
    console.error("Support email failed:", details);
    if (error instanceof ApiError) throw error;
    if (env.nodeEnv !== "production") {
      throw new ApiError(502, `Could not send support email: ${details.message}`);
    }
    throw new ApiError(502, "Could not send support email");
  }
}
