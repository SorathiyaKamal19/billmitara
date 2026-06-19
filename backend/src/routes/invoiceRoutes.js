import { Router } from 'express';
import { createInvoice, exportInvoicesExcel, getInvoicePdf, listInvoices, updateFinalizedInvoice } from '../controllers/invoiceController.js';
import { authorize, protect } from '../middleware/auth.js';

export const invoiceRoutes = Router();
invoiceRoutes.get('/:id/pdf', getInvoicePdf);
invoiceRoutes.use(protect);
invoiceRoutes.get('/', authorize('owner', 'manager'), listInvoices);
invoiceRoutes.get('/export.xlsx', authorize('owner'), exportInvoicesExcel);
invoiceRoutes.post('/order/:orderId', authorize('owner', 'manager'), createInvoice);
invoiceRoutes.patch('/:id', authorize('owner'), updateFinalizedInvoice);
