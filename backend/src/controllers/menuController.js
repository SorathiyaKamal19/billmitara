import { z } from 'zod';
import { MenuItem } from '../models/MenuItem.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { boundedQueryString, escapeRegex } from '../utils/security.js';
import { assertMenuCategoryExists } from './menuCategoryController.js';

const menuSchema = z.object({
  name: z.string().trim().min(2, 'Item name is required'),
  code: z.string().trim().min(1, 'Item code is required'),
  category: z.string().trim().min(2, 'Category is required'),
  price: z.number().positive('Price must be greater than 0'),
  imageUrl: z.string().optional().or(z.literal('')),
  foodType: z.enum(['veg', 'non-veg', 'egg'], { required_error: 'Food type is required' }),
  isAvailable: z.boolean().optional(),
  prepTimeMinutes: z.number().int().nonnegative().optional()
});

export const listMenu = asyncHandler(async (req, res) => {
  const query = { restaurant: req.user.restaurant };
  const q = boundedQueryString(req.query.q);
  if (q) {
    const search = new RegExp(escapeRegex(q), 'i');
    query.$or = [
      { name: search },
      { code: search },
      { category: search }
    ];
  }
  const category = boundedQueryString(req.query.category);
  if (category) query.category = category;
  const items = await MenuItem.find(query).sort({ category: 1, name: 1 }).lean();
  res.json(items);
});

export const mostSellingMenu = asyncHandler(async (req, res) => {
  const { Order } = await import('../models/Order.js');
  const rows = await Order.aggregate([
    { $match: { restaurant: req.user.restaurant, status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.menuItem', quantity: { $sum: '$items.quantity' } } },
    { $sort: { quantity: -1 } },
    { $limit: 12 }
  ]);
  const ids = rows.map((row) => row._id).filter(Boolean);
  const items = await MenuItem.find({ _id: { $in: ids }, restaurant: req.user.restaurant, isAvailable: true }).lean();
  const rank = new Map(rows.map((row, index) => [String(row._id), index]));
  res.json(items.sort((a, b) => (rank.get(String(a._id)) ?? 999) - (rank.get(String(b._id)) ?? 999)));
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const input = menuSchema.parse(req.body);
  await assertMenuCategoryExists(req.user.restaurant, input.category);
  const duplicateQuery = {
    restaurant: req.user.restaurant,
    name: new RegExp(`^${escapeRegex(input.name)}$`, 'i')
  };
  if (input.code?.trim()) {
    const codeDuplicate = await MenuItem.findOne({
      restaurant: req.user.restaurant,
      code: new RegExp(`^${escapeRegex(input.code.trim())}$`, 'i')
    });
    if (codeDuplicate) throw new ApiError(409, 'An item with this code already exists');
  }
  const duplicate = await MenuItem.findOne(duplicateQuery);
  if (duplicate) throw new ApiError(409, 'An item with this name already exists');
  const item = await MenuItem.create({ ...input, restaurant: req.user.restaurant });
  res.status(201).json(item);
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const input = menuSchema.partial().parse(req.body);
  if (input.category) await assertMenuCategoryExists(req.user.restaurant, input.category);
  if (input.name) {
    const duplicate = await MenuItem.findOne({
      _id: { $ne: req.params.id },
      restaurant: req.user.restaurant,
      name: new RegExp(`^${escapeRegex(input.name)}$`, 'i')
    });
    if (duplicate) throw new ApiError(409, 'An item with this name already exists');
  }
  if (input.code?.trim()) {
    const codeDuplicate = await MenuItem.findOne({
      _id: { $ne: req.params.id },
      restaurant: req.user.restaurant,
      code: new RegExp(`^${escapeRegex(input.code.trim())}$`, 'i')
    });
    if (codeDuplicate) throw new ApiError(409, 'An item with this code already exists');
  }
  const item = await MenuItem.findOneAndUpdate({ _id: req.params.id, restaurant: req.user.restaurant }, input, { new: true });
  res.json(item);
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant: req.user.restaurant });
  res.status(204).send();
});
