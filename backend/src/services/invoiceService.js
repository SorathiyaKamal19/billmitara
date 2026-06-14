import PDFDocument from 'pdfkit';
import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { Customer } from '../models/Customer.js';
import { env } from '../config/env.js';
import { sendInvoiceWhatsApp } from './whatsappService.js';
import { emitRestaurant } from '../config/socket.js';

function formatINR(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function formatBillDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(value));
}

async function nextBillNumber(restaurant) {
  const count = await Invoice.countDocuments({ restaurant: restaurant._id });
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `${restaurant.invoicePrefix || 'POSS'}-${date}-${String(count + 1).padStart(4, '0')}`;
}

export async function buildInvoicePdfBuffer(invoice, order, restaurant) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const left = 36;
    const right = 559;
    const orderType = order.type === 'takeaway' ? 'Parcel order' : 'Dine-in order';

    doc.rect(left, 32, right - left, 84).fill('#111827');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(restaurant.name, left + 18, 48, { width: 320 });
    doc.fontSize(9).font('Helvetica').fillColor('#d1d5db').text(restaurant.address || 'Restaurant POS', left + 18, 76, { width: 320 });
    if (restaurant.phone) doc.text(`Phone: ${restaurant.phone}`, left + 18, 90, { width: 320 });
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('TAX INVOICE', 410, 50, { width: 110, align: 'right' });
    doc.fontSize(9).font('Helvetica').fillColor('#d1d5db').text(invoice.billNumber, 360, 70, { width: 160, align: 'right' });
    if (invoice.gstEnabled && restaurant.gstNumber) doc.text(`GSTIN: ${restaurant.gstNumber}`, 340, 88, { width: 180, align: 'right' });
    doc.fillColor('#111827');

    doc.y = 136;
    doc.fontSize(10).font('Helvetica-Bold').text('Bill details', left, doc.y);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Date: ${formatBillDate(invoice.createdAt)}`, left, doc.y + 8);
    doc.text(`Order: ${orderType}${order.tableName ? ` / ${order.tableName}` : ''}`, left, doc.y + 22);
    doc.text(`Payment: ${invoice.paymentMode || 'cash'}`, left, doc.y + 36);
    doc.font('Helvetica-Bold').text('Customer', 350, 136);
    doc.font('Helvetica').text(invoice.customerName || 'Walk-in', 350, 157, { width: 170 });
    doc.text(`Mobile: ${invoice.customerMobile || '-'}`, 350, 171, { width: 170 });
    doc.moveDown(3.2);

    const tableTop = doc.y;
    doc.roundedRect(left, tableTop, right - left, 24, 4).fill('#f3f4f6');
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10);
    doc.text('Item', left + 10, tableTop + 7, { width: 230 });
    doc.text('Qty', 290, tableTop + 7, { width: 40, align: 'right' });
    doc.text('Rate', 350, tableTop + 7, { width: 70, align: 'right' });
    doc.text('Amount', 460, tableTop + 7, { width: 80, align: 'right' });
    doc.y = tableTop + 34;

    order.items.forEach((item) => {
      const y = doc.y;
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(item.name, left + 10, y, { width: 230 });
      doc.text(String(item.quantity), 290, y, { width: 40, align: 'right' });
      doc.text(formatINR(item.price), 350, y, { width: 70, align: 'right' });
      doc.font('Helvetica-Bold').text(formatINR(item.price * item.quantity), 460, y, { width: 80, align: 'right' });
      doc.moveTo(left, y + 20).lineTo(right, y + 20).strokeColor('#e5e7eb').stroke();
      doc.y = y + 28;
    });

    doc.moveDown();
    const totals = [
      ['Subtotal', invoice.subtotal],
      ...(invoice.discount > 0 ? [[`Discount${invoice.discountReason ? ` (${invoice.discountReason})` : ''}`, -invoice.discount]] : []),
      ...(Number(invoice.takeawayCharge ?? invoice.parcelCharge) > 0 ? [['Parcel Charge', invoice.takeawayCharge ?? invoice.parcelCharge]] : []),
      ...(invoice.gstEnabled ? [[`GST (${invoice.gstRate}%)`, invoice.gst]] : []),
      ...(invoice.roundOff ? [['Round Off', invoice.roundOff]] : []),
      ['Grand Total', invoice.total]
    ];
    totals.forEach(([label, value], index) => {
      const isTotal = index === totals.length - 1;
      if (isTotal) doc.moveTo(340, doc.y).lineTo(540, doc.y).strokeColor('#111827').stroke();
      doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica').fontSize(isTotal ? 14 : 10);
      doc.text(label, 340, doc.y + (isTotal ? 8 : 0), { width: 100 });
      doc.text(formatINR(value), 460, doc.y - (isTotal ? 17 : 12), { width: 80, align: 'right' });
    });
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text('This is a computer generated bill.', { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Thank you for visiting. Visit again!', { align: 'center' });
    doc.end();
  });
}

export async function createInvoiceForOrder(orderId, { sendWhatsApp = true, paymentMode = 'cash', payments = [], customerMobile } = {}) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (customerMobile?.trim()) {
    order.customerMobile = customerMobile.trim();
    await order.save();
  }
  if (!order.customerMobile?.trim()) throw new Error('Customer mobile is required to finalize the bill');
  const restaurant = await Restaurant.findById(order.restaurant);
  const billNumber = await nextBillNumber(restaurant);
  const invoice = await Invoice.create({
    restaurant: restaurant._id,
    order: order._id,
    customerName: order.customerName,
    customerMobile: order.customerMobile,
    billNumber,
    subtotal: order.subtotal,
    discountType: order.discountType,
    discountValue: order.discountValue,
    discount: order.discount,
    discountReason: order.discountReason,
    takeawayCharge: order.takeawayCharge,
    parcelCharge: order.parcelCharge,
    gstEnabled: order.gstEnabled,
    gstRate: order.gstRate,
    gst: order.gst,
    exactTotal: order.exactTotal,
    roundOff: order.roundOff,
    total: order.total,
    paymentMode,
    payments,
    finalizedAt: new Date()
  });

  invoice.pdfUrl = `${env.publicApiUrl}/api/invoices/${invoice._id}/pdf`;
  order.status = 'billed';
  await Promise.all([invoice.save(), order.save()]);

  if (order.table) {
    await Table.findByIdAndUpdate(order.table, { status: 'available', currentOrder: null });
  }
  if (order.customerMobile) {
    await Customer.findOneAndUpdate(
      { restaurant: order.restaurant, mobile: order.customerMobile },
      {
        $set: { name: order.customerName || 'Guest', lastVisitAt: new Date() },
        $inc: { totalVisits: 1, totalSpending: order.total }
      },
      { upsert: true, new: true }
    );
  }
  if (sendWhatsApp && order.customerMobile) {
    const result = await sendInvoiceWhatsApp({
      mobile: order.customerMobile,
      message: `Thank you for visiting ${restaurant.name}. Your bill ${invoice.billNumber} is ready. Visit Again!`,
      pdfUrl: invoice.pdfUrl
    });
    invoice.whatsappStatus = result.status;
    await invoice.save();
  }
  emitRestaurant(String(order.restaurant), 'invoice:created', invoice);
  return invoice;
}
