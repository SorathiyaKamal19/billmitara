import { Router } from 'express';
import { dashboardAnalytics } from '../controllers/analyticsController.js';
import { authorizePermission, protect } from '../middleware/auth.js';

export const analyticsRoutes = Router();
analyticsRoutes.use(protect, authorizePermission('reports'));
analyticsRoutes.get('/dashboard', dashboardAnalytics);
