import { z } from 'zod';
import { MenuCategory } from '../models/MenuCategory.js';
import { MenuItem } from '../models/MenuItem.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { escapeRegex } from '../utils/security.js';

const categorySchema = z.object({
  name: z.string().trim().min(2)
});

async function findCategoryByName(restaurant, name, excludeId) {
  const query = {
    restaurant,
    name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i')
  };
  if (excludeId) query._id = { $ne: excludeId };
  return MenuCategory.findOne(query);
}

async function syncCategoriesFromMenu(restaurant) {
  const names = await MenuItem.distinct('category', { restaurant, category: { $nin: [null, ''] } });
  for (const name of names) {
    const trimmed = String(name).trim();
    if (!trimmed) continue;
    const existing = await findCategoryByName(restaurant, trimmed);
    if (!existing) await MenuCategory.create({ restaurant, name: trimmed });
  }
}

export async function assertMenuCategoryExists(restaurant, name) {
  if (!name) return;
  const category = await findCategoryByName(restaurant, name);
  if (!category) throw new ApiError(400, 'Please select an existing category');
}

export const listMenuCategories = asyncHandler(async (req, res) => {
  await syncCategoriesFromMenu(req.user.restaurant);

  const categories = await MenuCategory.find({ restaurant: req.user.restaurant }).sort({ name: 1 }).lean();
  const counts = await MenuItem.aggregate([
    { $match: { restaurant: req.user.restaurant } },
    { $group: { _id: '$category', itemCount: { $sum: 1 } } }
  ]);
  const countByCategory = new Map(counts.map((row) => [String(row._id).toLowerCase(), row.itemCount]));

  res.json(categories.map((category) => ({
    ...category,
    itemCount: countByCategory.get(category.name.toLowerCase()) || 0
  })));
});

export const createMenuCategory = asyncHandler(async (req, res) => {
  const input = categorySchema.parse(req.body);
  const duplicate = await findCategoryByName(req.user.restaurant, input.name);
  if (duplicate) throw new ApiError(409, 'A category with this name already exists');

  const category = await MenuCategory.create({ ...input, restaurant: req.user.restaurant });
  res.status(201).json({ ...category.toObject(), itemCount: 0 });
});

export const updateMenuCategory = asyncHandler(async (req, res) => {
  const input = categorySchema.parse(req.body);
  const category = await MenuCategory.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
  if (!category) throw new ApiError(404, 'Category not found');

  const duplicate = await findCategoryByName(req.user.restaurant, input.name, req.params.id);
  if (duplicate) throw new ApiError(409, 'A category with this name already exists');

  const previousName = category.name;
  category.name = input.name;
  await category.save();

  if (previousName !== input.name) {
    await MenuItem.updateMany(
      { restaurant: req.user.restaurant, category: previousName },
      { $set: { category: input.name } }
    );
  }

  const itemCount = await MenuItem.countDocuments({ restaurant: req.user.restaurant, category: input.name });
  res.json({ ...category.toObject(), itemCount });
});

export const deleteMenuCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
  if (!category) throw new ApiError(404, 'Category not found');

  const itemCount = await MenuItem.countDocuments({ restaurant: req.user.restaurant, category: category.name });
  if (itemCount > 0) {
    throw new ApiError(409, 'Move or delete menu items in this category before deleting it');
  }

  await category.deleteOne();
  res.status(204).send();
});
