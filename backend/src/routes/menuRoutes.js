import { Router } from 'express';
import { createMenuCategory, deleteMenuCategory, listMenuCategories, updateMenuCategory } from '../controllers/menuCategoryController.js';
import { createMenuItem, deleteMenuItem, listMenu, mostSellingMenu, updateMenuItem } from '../controllers/menuController.js';
import { authorize, protect } from '../middleware/auth.js';

export const menuRoutes = Router();
menuRoutes.use(protect);
menuRoutes.get('/', listMenu);
menuRoutes.get('/categories', authorize('owner', 'manager'), listMenuCategories);
menuRoutes.get('/most-selling', authorize('owner', 'manager'), mostSellingMenu);
menuRoutes.post('/categories', authorize('owner'), createMenuCategory);
menuRoutes.patch('/categories/:id', authorize('owner'), updateMenuCategory);
menuRoutes.delete('/categories/:id', authorize('owner'), deleteMenuCategory);
menuRoutes.post('/', authorize('owner'), createMenuItem);
menuRoutes.patch('/:id', authorize('owner'), updateMenuItem);
menuRoutes.delete('/:id', authorize('owner'), deleteMenuItem);
