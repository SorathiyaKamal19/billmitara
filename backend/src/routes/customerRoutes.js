import { Router } from 'express';
import { listCustomers } from '../controllers/customerController.js';
import { authorize, protect } from '../middleware/auth.js';

export const customerRoutes = Router();
customerRoutes.use(protect, authorize('owner', 'manager'));
customerRoutes.get('/', listCustomers);
