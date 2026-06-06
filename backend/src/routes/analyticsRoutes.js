import { Router } from 'express';
import { dashboardAnalytics } from '../controllers/analyticsController.js';
import { authorize, protect } from '../middleware/auth.js';

export const analyticsRoutes = Router();
analyticsRoutes.use(protect, authorize('owner'));
analyticsRoutes.get('/dashboard', dashboardAnalytics);
