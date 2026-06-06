import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Restaurant } from '../models/Restaurant.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const loginSchema = z.object({ identifier: z.string().trim().min(1), password: z.string().min(8) });
const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().trim().min(6),
  restaurantName: z.string().trim().min(2),
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

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export const login = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const identifier = input.identifier.toLowerCase();
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: input.identifier }]
  }).select('+password').populate('restaurant');
  if (!user || !(await user.comparePassword(input.password))) throw new ApiError(401, 'Invalid login or password');
  if (!user.isActive) throw new ApiError(403, 'User is disabled');
  const cleanUser = user.toObject();
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
    restaurant: restaurant._id
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
