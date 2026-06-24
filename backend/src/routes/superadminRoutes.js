import { Router } from 'express';
import { listOwners, updateOwnerAccess } from '../controllers/superadminController.js';
import { authorize, protect } from '../middleware/auth.js';

export const superadminRoutes = Router();

superadminRoutes.use(protect, authorize('superadmin'));
superadminRoutes.get('/owners', listOwners);
superadminRoutes.patch('/owners/:id', updateOwnerAccess);
