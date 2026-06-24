import { Router } from 'express';
import { analyticsRoutes } from './analyticsRoutes.js';
import { authRoutes } from './authRoutes.js';
import { customerRoutes } from './customerRoutes.js';
import { invoiceRoutes } from './invoiceRoutes.js';
import { menuRoutes } from './menuRoutes.js';
import { orderRoutes } from './orderRoutes.js';
import { settingsRoutes } from './settingsRoutes.js';
import { staffRoutes } from './staffRoutes.js';
import { superadminRoutes } from './superadminRoutes.js';
import { supportRoutes } from './supportRoutes.js';
import { tableRoutes } from './tableRoutes.js';

export const apiRoutes = Router();

apiRoutes.get('/health', (req, res) => res.json({ status: 'ok', name: 'POSS API' }));
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/analytics', analyticsRoutes);
apiRoutes.use('/customers', customerRoutes);
apiRoutes.use('/invoices', invoiceRoutes);
apiRoutes.use('/menu', menuRoutes);
apiRoutes.use('/orders', orderRoutes);
apiRoutes.use('/settings', settingsRoutes);
apiRoutes.use('/staff', staffRoutes);
apiRoutes.use('/superadmin', superadminRoutes);
apiRoutes.use('/support', supportRoutes);
apiRoutes.use('/tables', tableRoutes);
