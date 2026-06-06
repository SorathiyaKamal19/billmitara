import { Router } from 'express';
import { changePassword, login, me, registerOwner, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

export const authRoutes = Router();
authRoutes.post('/login', login);
authRoutes.post('/register-owner', registerOwner);
authRoutes.get('/me', protect, me);
authRoutes.patch('/profile', protect, updateProfile);
authRoutes.patch('/password', protect, changePassword);
