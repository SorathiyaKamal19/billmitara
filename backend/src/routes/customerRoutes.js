import { Router } from 'express';
import { listCustomers } from '../controllers/customerController.js';
import { authorizePermission, protect } from '../middleware/auth.js';

export const customerRoutes = Router();
customerRoutes.use(protect, authorizePermission('customers'));
customerRoutes.get('/', listCustomers);
