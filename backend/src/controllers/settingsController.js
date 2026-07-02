import QRCode from 'qrcode';
import { z } from 'zod';
import { Restaurant } from '../models/Restaurant.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(30, 'Restaurant name must be 30 characters or less').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  gstEnabled: z.boolean().optional(),
  gstRate: z.number().min(0).max(100).optional(),
  defaultDiscountType: z.enum(['fixed', 'percentage']).optional(),
  defaultDiscountValue: z.number().min(0).max(100000).optional(),
  defaultDiscountReason: z.string().optional(),
  takeawayChargeEnabled: z.boolean().optional(),
  takeawayCharge: z.number().min(0).optional(),
  parcelCharge: z.number().min(0).optional(),
  brandColor: z.string().optional(),
  qrMenuUrl: z.string().optional()
}).refine((settings) => settings.defaultDiscountType !== 'percentage' || (settings.defaultDiscountValue ?? 0) <= 100, {
  message: 'Percentage discount cannot be more than 100',
  path: ['defaultDiscountValue']
});

export const getSettings = asyncHandler(async (req, res) => {
  res.json(await Restaurant.findById(req.user.restaurant).lean());
});

export const updateSettings = asyncHandler(async (req, res) => {
  const input = settingsSchema.parse(req.body);
  const restaurant = await Restaurant.findByIdAndUpdate(req.user.restaurant, input, { new: true });
  res.json(restaurant);
});

export const qrMenu = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurant);
  const url = restaurant.qrMenuUrl || `${req.protocol}://${req.get('host')}/menu/${restaurant._id}`;
  const dataUrl = await QRCode.toDataURL(url);
  res.json({ url, dataUrl });
});
