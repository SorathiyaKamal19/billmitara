import { Router } from 'express';
import { createInvoice, exportInvoicesExcel, getInvoicePdf, getPublicInvoice, listInvoices, updateFinalizedInvoice } from '../controllers/invoiceController.js';
import { authorizePermission, protect } from '../middleware/auth.js';

export const invoiceRoutes = Router();
invoiceRoutes.get('/public/:code', getPublicInvoice);
invoiceRoutes.get('/:id/pdf', getInvoicePdf);
invoiceRoutes.use(protect);
invoiceRoutes.get('/', authorizePermission('billing', 'reports'), listInvoices);
invoiceRoutes.get('/export.xlsx', authorizePermission('reports'), exportInvoicesExcel);
invoiceRoutes.post('/order/:orderId', authorizePermission('billing'), createInvoice);
invoiceRoutes.patch('/:id', authorizePermission('reports'), updateFinalizedInvoice);
