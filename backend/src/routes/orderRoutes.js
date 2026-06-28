import { Router } from 'express';
import { addItemsToOrder, createOrder, getOrder, listOrders, updateOrder, updateOrderStatus } from '../controllers/orderController.js';
import { authorizePermission, protect } from '../middleware/auth.js';

export const orderRoutes = Router();
orderRoutes.use(protect);
orderRoutes.get('/', authorizePermission('orders', 'parcel', 'kitchen', 'billing'), listOrders);
orderRoutes.get('/:id', authorizePermission('orders', 'parcel', 'kitchen', 'billing'), getOrder);
orderRoutes.post('/', authorizePermission('orders', 'parcel'), createOrder);
orderRoutes.patch('/:id', authorizePermission('orders', 'parcel', 'billing'), updateOrder);
orderRoutes.patch('/:id/status', authorizePermission('orders', 'parcel', 'kitchen'), updateOrderStatus);
orderRoutes.post('/:id/items', authorizePermission('orders', 'parcel'), addItemsToOrder);
