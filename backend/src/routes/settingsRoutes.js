import { Router } from 'express';
import { getSettings, qrMenu, updateSettings } from '../controllers/settingsController.js';
import { authorizePermission, protect } from '../middleware/auth.js';

export const settingsRoutes = Router();
settingsRoutes.use(protect);
settingsRoutes.get('/', getSettings);
settingsRoutes.patch('/', authorizePermission('settings'), updateSettings);
settingsRoutes.get('/qr-menu', authorizePermission('qr-menu'), qrMenu);
