import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';

export async function ensureSubscriptionAccess(user) {
  if (user.role === 'superadmin') return;
  const restaurantId = user.restaurant?._id || user.restaurant;
  if (!restaurantId) throw new ApiError(401, 'Invalid session');

  if (user.role === 'owner') {
    if (user.isSubscribed === false) {
      throw new ApiError(402, 'Your subscription is over. Please contact admin.');
    }
    return;
  }

  const owner = await User.findOne({ restaurant: restaurantId, role: 'owner' }).select('isActive isSubscribed').lean();
  if (!owner || owner.isActive === false || owner.isSubscribed === false) {
    throw new ApiError(402, 'Your subscription is over. Please contact admin.');
  }
}

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) throw new ApiError(401, 'Invalid session');
    await ensureSubscriptionAccess(user);
    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Invalid or expired token'));
  }
}

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Insufficient permissions'));
  next();
};
