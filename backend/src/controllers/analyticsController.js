import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardAnalytics } from '../services/analyticsService.js';

export const dashboardAnalytics = asyncHandler(async (req, res) => {
  res.json(await getDashboardAnalytics(req.user.restaurant, req.query.period || 'today', req.query.start, req.query.end));
});
