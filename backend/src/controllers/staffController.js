import { z } from 'zod';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const staffRoleSchema = z.enum(['manager', 'waiter', 'chef']);
const permissionSchema = z.enum(['tables', 'orders', 'parcel', 'kitchen', 'billing', 'menu', 'reports', 'customers', 'settings', 'staff']);

const createStaffSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8),
  phone: z.string().trim().min(6),
  role: staffRoleSchema,
  permissions: z.array(permissionSchema).default([]),
  isActive: z.boolean().optional()
});
const updateStaffSchema = z.object({
  name: z.string().trim().min(2).optional(),
  password: z.string().min(8).optional(),
  role: staffRoleSchema.optional(),
  permissions: z.array(permissionSchema).optional(),
  isActive: z.boolean().optional()
});

function staffQuery(req, id) {
  return {
    _id: id,
    restaurant: req.user.restaurant,
    role: { $ne: 'owner' }
  };
}

export const listStaff = asyncHandler(async (req, res) => {
  const users = await User.find({
    restaurant: req.user.restaurant,
    role: { $ne: 'owner' }
  })
    .select('-password')
    .sort({ role: 1, name: 1 })
    .lean();

  res.json(users);
});

export const createStaff = asyncHandler(async (req, res) => {
  const input = createStaffSchema.parse(req.body);
  const checks = [{ phone: input.phone }];
  if (input.email) checks.push({ email: input.email });
  const existing = await User.findOne({ $or: checks });
  if (input.email && existing?.email === input.email) throw new ApiError(409, 'Email is already registered');
  if (existing?.phone === input.phone) throw new ApiError(409, 'Mobile number is already registered');

  const user = await User.create({
    ...input,
    email: input.email || undefined,
    restaurant: req.user.restaurant
  });

  const cleanUser = user.toObject();
  delete cleanUser.password;
  res.status(201).json(cleanUser);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const input = updateStaffSchema.parse(req.body);
  const user = await User.findOne(staffQuery(req, req.params.id)).select('+password');
  if (!user) throw new ApiError(404, 'Staff account not found');

  for (const field of ['name', 'role', 'permissions', 'isActive']) {
    if (input[field] !== undefined) user[field] = input[field];
  }
  if (input.password) user.password = input.password;

  await user.save();
  const cleanUser = user.toObject();
  delete cleanUser.password;
  res.json(cleanUser);
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete(staffQuery(req, req.params.id));
  if (!user) throw new ApiError(404, 'Staff account not found');
  res.status(204).send();
});
