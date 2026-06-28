import { Router } from 'express';
import { createMenuCategory, deleteMenuCategory, listMenuCategories, updateMenuCategory } from '../controllers/menuCategoryController.js';
import { createMenuItem, deleteMenuItem, listMenu, mostSellingMenu, updateMenuItem } from '../controllers/menuController.js';
import { authorizePermission, protect } from '../middleware/auth.js';

export const menuRoutes = Router();
menuRoutes.use(protect);
menuRoutes.get('/', listMenu);
menuRoutes.get('/categories', authorizePermission('menu', 'orders', 'parcel', 'kitchen', 'billing'), listMenuCategories);
menuRoutes.get('/most-selling', authorizePermission('menu', 'orders', 'parcel', 'kitchen', 'billing'), mostSellingMenu);
menuRoutes.post('/categories', authorizePermission('menu'), createMenuCategory);
menuRoutes.patch('/categories/:id', authorizePermission('menu'), updateMenuCategory);
menuRoutes.delete('/categories/:id', authorizePermission('menu'), deleteMenuCategory);
menuRoutes.post('/', authorizePermission('menu'), createMenuItem);
menuRoutes.patch('/:id', authorizePermission('menu'), updateMenuItem);
menuRoutes.delete('/:id', authorizePermission('menu'), deleteMenuItem);
