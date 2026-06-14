import ExcelJS from 'exceljs';
import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { createInvoiceForOrder, buildInvoicePdfBuffer } from '../services/invoiceService.js';
import { calculateOrderTotals } from '../utils/tax.js';

export const createInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, restaurant: req.user.restaurant });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const mobile = (req.body.customerMobile || order.customerMobile || '').trim();
  if (!mobile) return res.status(400).json({ message: 'Customer mobile is required to finalize the bill' });
  const payments = req.body.payments?.length ? req.body.payments : [{ method: req.body.paymentMode || 'cash', amount: order.total || 0 }];
  if (payments.some((payment) => payment.method === 'card')) return res.status(400).json({ message: 'Card payment is not available' });
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  if (Math.abs(paid - order.total) > 0.5) return res.status(400).json({ message: 'Payment amount must match bill total' });
  const paymentMode = payments.length > 1 ? 'partial' : payments[0].method;
  try {
    const invoice = await createInvoiceForOrder(req.params.orderId, {
      sendWhatsApp: req.body.sendWhatsApp !== false && Boolean(mobile),
      paymentMode,
      payments,
      customerMobile: mobile
    });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const getInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  const order = await Order.findById(invoice.order);
  const restaurant = await Restaurant.findById(invoice.restaurant);
  if (!order || !restaurant) throw new ApiError(404, 'Invoice data not found');
  const pdf = await buildInvoicePdfBuffer(invoice, order, restaurant);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.billNumber}.pdf"`);
  res.send(pdf);
});

export const listInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ restaurant: req.user.restaurant }).sort({ createdAt: -1 }).limit(100);
  res.json(invoices);
});

export const exportInvoicesExcel = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ restaurant: req.user.restaurant }).sort({ createdAt: -1 });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sales');
  sheet.columns = [
    { header: 'Bill No', key: 'billNumber', width: 20 },
    { header: 'Customer', key: 'customerName', width: 24 },
    { header: 'Mobile', key: 'customerMobile', width: 16 },
    { header: 'Subtotal', key: 'subtotal', width: 12 },
    { header: 'GST', key: 'gst', width: 12 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Payment', key: 'paymentMode', width: 12 },
    { header: 'Date', key: 'createdAt', width: 24 }
  ];
  invoices.forEach((invoice) => sheet.addRow(invoice.toObject()));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="poss-sales-report.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

export const updateFinalizedInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  const order = await Order.findOne({ _id: invoice.order, restaurant: req.user.restaurant });
  if (!order) throw new ApiError(404, 'Order not found');
  const discountType = req.body.discountType || invoice.discountType || 'fixed';
  const discountValue = Number(req.body.discountValue ?? invoice.discountValue ?? invoice.discount ?? 0);
  const totals = calculateOrderTotals(order.items, {
    discountType,
    discountValue,
    takeawayCharge: invoice.takeawayCharge,
    gstEnabled: invoice.gstEnabled,
    gstRate: invoice.gstRate
  });
  Object.assign(invoice, totals, {
    editReason: req.body.reason,
    editedBy: req.user._id
  });
  await invoice.save();
  res.json(invoice);
});
