import { z } from 'zod';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const updateOwnerAccessSchema = z.object({
  isActive: z.boolean().optional(),
  isSubscribed: z.boolean().optional()
}).refine((value) => value.isActive !== undefined || value.isSubscribed !== undefined, {
  message: 'No access setting provided'
});

function cleanOwner(owner, staffCount = 0) {
  return {
    _id: owner._id,
    name: owner.name,
    email: owner.email,
    phone: owner.phone,
    role: owner.role,
    restaurant: owner.restaurant,
    isActive: owner.isActive,
    isSubscribed: owner.isSubscribed !== false,
    staffCount,
    createdAt: owner.createdAt,
    updatedAt: owner.updatedAt
  };
}

export const listOwners = asyncHandler(async (req, res) => {
  const owners = await User.find({ role: 'owner' })
    .select('-password')
    .populate('restaurant')
    .sort({ createdAt: -1 })
    .lean();

  const restaurantIds = owners.map((owner) => owner.restaurant?._id || owner.restaurant).filter(Boolean);
  const staffCounts = await User.aggregate([
    { $match: { restaurant: { $in: restaurantIds }, role: { $nin: ['owner', 'superadmin'] } } },
    { $group: { _id: '$restaurant', count: { $sum: 1 } } }
  ]);
  const countByRestaurant = new Map(staffCounts.map((row) => [String(row._id), row.count]));

  res.json(
    owners.map((owner) => {
      const restaurantId = owner.restaurant?._id || owner.restaurant;
      return cleanOwner(owner, countByRestaurant.get(String(restaurantId)) || 0);
    })
  );
});

export const updateOwnerAccess = asyncHandler(async (req, res) => {
  const input = updateOwnerAccessSchema.parse(req.body);
  const owner = await User.findOne({ _id: req.params.id, role: 'owner' }).select('-password').populate('restaurant');
  if (!owner) throw new ApiError(404, 'Owner account not found');

  if (input.isActive !== undefined) owner.isActive = input.isActive;
  if (input.isSubscribed !== undefined) owner.isSubscribed = input.isSubscribed;

  await owner.save();
  res.json(cleanOwner(owner.toObject()));
});
