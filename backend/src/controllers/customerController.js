import { Customer } from '../models/Customer.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const q = req.query.q;
  const query = { restaurant: req.user.restaurant };
  if (q) query.$or = [{ name: new RegExp(q, 'i') }, { mobile: new RegExp(q, 'i') }];
  const customers = await Customer.find(query).sort({ totalSpending: -1 }).limit(100);
  res.json(customers);
});
