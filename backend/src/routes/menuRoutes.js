import { Router } from 'express';
import { createMenuItem, deleteMenuItem, listMenu, mostSellingMenu, updateMenuItem } from '../controllers/menuController.js';
import { authorize, protect } from '../middleware/auth.js';

export const menuRoutes = Router();
menuRoutes.use(protect);
menuRoutes.get('/', listMenu);
menuRoutes.get('/most-selling', authorize('owner', 'manager'), mostSellingMenu);
menuRoutes.post('/', authorize('owner'), createMenuItem);
menuRoutes.patch('/:id', authorize('owner'), updateMenuItem);
menuRoutes.delete('/:id', authorize('owner'), deleteMenuItem);
