import { Customer } from '../models/Customer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { boundedQueryString, escapeRegex } from '../utils/security.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const q = boundedQueryString(req.query.q);
  const query = { restaurant: req.user.restaurant };
  if (q) {
    const search = new RegExp(escapeRegex(q), 'i');
    query.$or = [{ name: search }, { mobile: search }];
  }
  const customers = await Customer.find(query).sort({ totalSpending: -1 }).limit(100).lean();
  res.json(customers);
});
