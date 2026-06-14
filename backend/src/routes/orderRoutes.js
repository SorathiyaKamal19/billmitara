import { Router } from 'express';
import { addItemsToOrder, createOrder, getOrder, listOrders, updateOrder, updateOrderStatus } from '../controllers/orderController.js';
import { authorize, protect } from '../middleware/auth.js';

export const orderRoutes = Router();
orderRoutes.use(protect);
orderRoutes.get('/', listOrders);
orderRoutes.get('/:id', authorize('owner', 'manager', 'waiter', 'chef'), getOrder);
orderRoutes.post('/', authorize('owner', 'manager', 'waiter'), createOrder);
orderRoutes.patch('/:id', authorize('owner', 'manager', 'waiter'), updateOrder);
orderRoutes.patch('/:id/status', authorize('owner', 'manager', 'waiter', 'chef'), updateOrderStatus);
orderRoutes.post('/:id/items', authorize('owner', 'manager', 'waiter'), addItemsToOrder);
