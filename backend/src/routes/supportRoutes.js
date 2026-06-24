import { Router } from 'express';
import { createSupportTicket, listSupportTickets } from '../controllers/supportController.js';
import { protect } from '../middleware/auth.js';

export const supportRoutes = Router();

supportRoutes.use(protect);
supportRoutes.get('/', listSupportTickets);
supportRoutes.post('/', createSupportTicket);
