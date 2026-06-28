import { Router } from 'express';
import { createStaff, deleteStaff, listStaff, updateStaff } from '../controllers/staffController.js';
import { authorizePermission, protect } from '../middleware/auth.js';

export const staffRoutes = Router();
staffRoutes.use(protect, authorizePermission('staff'));
staffRoutes.get('/', listStaff);
staffRoutes.post('/', createStaff);
staffRoutes.patch('/:id', updateStaff);
staffRoutes.delete('/:id', deleteStaff);
