import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { Restaurant } from '../models/Restaurant.js';
import { User } from '../models/User.js';
import { PasswordResetOtp } from '../models/PasswordResetOtp.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { sendPasswordResetOtp } from '../services/emailService.js';
import { ensureSubscriptionAccess } from '../middleware/auth.js';

const loginSchema = z.object({ identifier: z.string().trim().min(1), password: z.string().min(8) });
const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().trim().min(6),
  restaurantName: z.string().trim().min(2).max(30, 'Restaurant name must be 30 characters or less'),
  restaurantPhone: z.string().trim().optional(),
  restaurantAddress: z.string().trim().optional()
});
const profileSchema = z.object({
  name: z.string().trim().min(2)
});
const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});
const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase())
});
const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(8)
});
const verifyResetOtpSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
});

function hashOtp(userId, otp) {
  return crypto
    .createHmac('sha256', env.jwtSecret)
    .update(`${userId}:${otp}`)
    .digest('hex');
}

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function signPasswordResetToken(user) {
  return jwt.sign({ id: user._id, purpose: 'password-reset' }, env.jwtSecret, { expiresIn: '10m' });
}

async function validatePasswordResetOtp(email, otp) {
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) throw new ApiError(400, 'Invalid or expired reset code');

  const reset = await PasswordResetOtp.findOne({ user: user._id });
  if (!reset || reset.expiresAt <= new Date()) {
    if (reset) await reset.deleteOne();
    throw new ApiError(400, 'Invalid or expired reset code');
  }
  if (reset.attempts >= env.passwordReset.maxAttempts) {
    await reset.deleteOne();
    throw new ApiError(429, 'Too many incorrect attempts. Request a new code');
  }

  const candidateHash = hashOtp(user._id, otp);
  const expected = Buffer.from(reset.otpHash, 'hex');
  const candidate = Buffer.from(candidateHash, 'hex');
  const matches = expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);

  if (!matches) {
    reset.attempts += 1;
    await reset.save();
    throw new ApiError(400, 'Invalid or expired reset code');
  }

  return { user, reset };
}

export const login = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const identifier = input.identifier.toLowerCase();
  const compactPhone = input.identifier.replace(/[\s()-]/g, '');
  const phoneCandidates = new Set([input.identifier, compactPhone]);
  if (/^\d{10}$/.test(compactPhone)) phoneCandidates.add(`+91${compactPhone}`);
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: { $in: [...phoneCandidates] } }]
  }).select('+password').populate('restaurant').lean();
  if (!user || !(await bcrypt.compare(input.password, user.password))) throw new ApiError(401, 'Invalid login or password');
  if (!user.isActive) throw new ApiError(403, 'User is disabled');
  await ensureSubscriptionAccess(user);
  const cleanUser = { ...user };
  delete cleanUser.password;
  res.json({ token: signToken(user), user: cleanUser });
});

export const registerOwner = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const existing = await User.findOne({ $or: [{ email: input.email }, { phone: input.phone }] });
  if (existing?.email === input.email) throw new ApiError(409, 'Email is already registered');
  if (existing?.phone === input.phone) throw new ApiError(409, 'Mobile number is already registered');

  const restaurant = await Restaurant.create({
    name: input.restaurantName,
    phone: input.restaurantPhone,
    address: input.restaurantAddress
  });

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    phone: input.phone,
    role: 'owner',
    restaurant: restaurant._id,
    isSubscribed: true
  });

  await user.populate('restaurant');
  const cleanUser = user.toObject();
  delete cleanUser.password;
  res.status(201).json({ token: signToken(user), user: cleanUser });
});

export const me = asyncHandler(async (req, res) => {
  await req.user.populate('restaurant');
  res.json(req.user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const input = profileSchema.parse(req.body);
  req.user.name = input.name;
  await req.user.save();
  await req.user.populate('restaurant');
  res.json(req.user);
});

export const changePassword = asyncHandler(async (req, res) => {
  const input = passwordSchema.parse(req.body);
  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(input.currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  user.password = input.newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully' });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  const user = await User.findOne({ email, isActive: true });
  const response = {
    message: 'If an active account exists for this email, a reset code has been sent.'
  };

  if (!user) throw new ApiError(404, 'No active account found with this email address');

  const existing = await PasswordResetOtp.findOne({ user: user._id });
  if (existing && existing.createdAt > new Date(Date.now() - 60 * 1000)) {
    return res.status(429).json({ message: 'Please wait one minute before requesting another code' });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + env.passwordReset.otpMinutes * 60 * 1000);
  await PasswordResetOtp.findOneAndUpdate(
    { user: user._id },
    { otpHash: hashOtp(user._id, otp), attempts: 0, expiresAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendPasswordResetOtp({ email: user.email, name: user.name, otp });
  } catch (error) {
    await PasswordResetOtp.deleteOne({ user: user._id });
    throw error;
  }

  res.json(response);
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const input = verifyResetOtpSchema.parse(req.body);
  const { user } = await validatePasswordResetOtp(input.email, input.otp);
  res.json({
    message: 'OTP verified successfully. You can now reset your password.',
    resetToken: signPasswordResetToken(user)
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const input = resetPasswordSchema.parse(req.body);
  let decoded;
  try {
    decoded = jwt.verify(input.resetToken, env.jwtSecret);
  } catch {
    throw new ApiError(400, 'Password reset session expired. Verify the OTP again');
  }
  if (decoded.purpose !== 'password-reset') {
    throw new ApiError(400, 'Password reset session expired. Verify the OTP again');
  }

  const user = await User.findOne({ _id: decoded.id, isActive: true }).select('+password');
  if (!user) throw new ApiError(400, 'Password reset session expired. Verify the OTP again');
  user.password = input.newPassword;
  await user.save();
  await PasswordResetOtp.deleteOne({ user: user._id });
  res.json({ message: 'Password reset successfully. You can now sign in.' });
});
