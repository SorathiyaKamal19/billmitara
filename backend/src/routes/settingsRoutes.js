import { Router } from 'express';
import { getSettings, qrMenu, updateSettings } from '../controllers/settingsController.js';
import { authorize, protect } from '../middleware/auth.js';

export const settingsRoutes = Router();
settingsRoutes.use(protect);
settingsRoutes.get('/', getSettings);
settingsRoutes.patch('/', authorize('owner'), updateSettings);
settingsRoutes.get('/qr-menu', authorize('owner', 'manager'), qrMenu);
