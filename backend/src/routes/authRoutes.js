import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePassword,
  login,
  me,
  registerOwner,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  verifyResetOtp
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

export const authRoutes = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later' }
});
const registerOwnerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please try again later' }
});
const passwordResetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset attempts. Please try again later' }
});
const passwordResetSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset attempts. Please try again later' }
});

authRoutes.post('/login', loginLimiter, login);
authRoutes.post('/register-owner', registerOwnerLimiter, registerOwner);
authRoutes.post('/forgot-password', passwordResetRequestLimiter, requestPasswordReset);
authRoutes.post('/verify-reset-otp', passwordResetSubmitLimiter, verifyResetOtp);
authRoutes.post('/reset-password', passwordResetSubmitLimiter, resetPassword);
authRoutes.get('/me', protect, me);
authRoutes.patch('/profile', protect, updateProfile);
authRoutes.patch('/password', protect, changePassword);
