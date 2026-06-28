import { Router } from 'express';
import { closeSupportTicket, createSupportTicket, listSupportTickets } from '../controllers/supportController.js';
import { authorize, protect } from '../middleware/auth.js';

export const supportRoutes = Router();

supportRoutes.use(protect);
supportRoutes.get('/', authorize('owner', 'superadmin'), listSupportTickets);
supportRoutes.post('/', authorize('owner'), createSupportTicket);
supportRoutes.patch('/:id/close', authorize('superadmin'), closeSupportTicket);
