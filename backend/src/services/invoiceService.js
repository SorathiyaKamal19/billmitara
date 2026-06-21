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
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(date);
  const timePart = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(date);
  return `${datePart}, ${timePart}`;
}

function paymentLabel(value) {
  if (value === 'upi') return 'UPI';
  if (value === 'card') return 'Card';
  if (value === 'partial') return 'Partial';
  return 'Cash';
}

function shortText(value, maxLength = 80) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
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

    const left = 42;
    const right = 553;
    const width = right - left;
    const orderType = order.type === 'takeaway' ? 'Parcel order' : 'Dine-in order';

    doc.roundedRect(left, 36, width, 92, 6).fill('#111827');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(restaurant.name, left + 22, 58, { width: 300 });
    doc.fontSize(9).font('Helvetica').fillColor('#d1d5db').text(restaurant.address || 'Restaurant POS', left + 22, 86, { width: 300 });
    if (restaurant.phone) doc.text(`Phone: ${restaurant.phone}`, left + 22, 101, { width: 300 });
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text('TAX INVOICE', right - 190, 58, { width: 168, align: 'right' });
    doc.fontSize(9).font('Helvetica').fillColor('#d1d5db').text(invoice.billNumber, right - 190, 82, { width: 168, align: 'right' });
    if (invoice.gstEnabled && restaurant.gstNumber) {
      doc.text(`GSTIN: ${restaurant.gstNumber}`, right - 190, 98, { width: 168, align: 'right' });
    }
    doc.fillColor('#111827');

    const detailsTop = 152;
    const boxGap = 18;
    const boxWidth = (width - boxGap) / 2;
    doc.roundedRect(left, detailsTop, boxWidth, 88, 6).strokeColor('#e5e7eb').lineWidth(1).stroke();
    doc.roundedRect(left + boxWidth + boxGap, detailsTop, boxWidth, 88, 6).stroke();

    const customerX = left + 14;
    const billX = left + boxWidth + boxGap + 14;
    const lineValue = (label, value, x, y, labelWidth = 52) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text(label, x, y, { width: labelWidth });
      doc.font('Helvetica-Bold').fillColor('#374151').text(value, x + labelWidth, y, { width: boxWidth - labelWidth - 28 });
    };

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text('Customer Details', customerX, detailsTop + 13);
    lineValue('Name:', invoice.customerName || 'Walk-in', customerX, detailsTop + 38);
    lineValue('Mobile:', invoice.customerMobile || '-', customerX, detailsTop + 56);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text('Bill Details', billX, detailsTop + 13);
    lineValue('Date:', formatBillDate(invoice.finalizedAt || invoice.createdAt), billX, detailsTop + 38);
    lineValue('Order:', `${orderType}${order.tableName ? ` / ${order.tableName}` : ''}`, billX, detailsTop + 56);
    lineValue('Pay:', paymentLabel(invoice.paymentMode), billX, detailsTop + 74);

    const tableColumns = {
      item: left + 14,
      qty: left + 304,
      rate: left + 364,
      amount: left + 440
    };
    const tableWidths = {
      item: 270,
      qty: 38,
      rate: 72,
      amount: 58
    };
    const drawTableHeader = (y) => {
      doc.roundedRect(left, y, width, 28, 5).fill('#f3f4f6');
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9);
      doc.text('Item', tableColumns.item, y + 9, { width: tableWidths.item });
      doc.text('Qty', tableColumns.qty, y + 9, { width: tableWidths.qty, align: 'right' });
      doc.text('Rate', tableColumns.rate, y + 9, { width: tableWidths.rate, align: 'right' });
      doc.text('Amount', tableColumns.amount, y + 9, { width: tableWidths.amount, align: 'right' });
    };

    let rowY = 268;
    drawTableHeader(rowY);
    rowY += 38;

    order.items.forEach((item) => {
      const itemHeight = doc.font('Helvetica').fontSize(10).heightOfString(item.name, { width: tableWidths.item });
      const rowHeight = Math.max(30, itemHeight + 16);
      if (rowY + rowHeight > 690) {
        doc.addPage();
        rowY = 54;
        drawTableHeader(rowY);
        rowY += 38;
      }
      doc.fillColor('#111827').font('Helvetica').fontSize(10).text(item.name, tableColumns.item, rowY + 7, { width: tableWidths.item });
      doc.text(String(item.quantity), tableColumns.qty, rowY + 7, { width: tableWidths.qty, align: 'right' });
      doc.text(formatINR(item.price), tableColumns.rate, rowY + 7, { width: tableWidths.rate, align: 'right' });
      doc.font('Helvetica-Bold').text(formatINR(item.price * item.quantity), tableColumns.amount, rowY + 7, { width: tableWidths.amount, align: 'right' });
      doc.moveTo(left, rowY + rowHeight).lineTo(right, rowY + rowHeight).strokeColor('#e5e7eb').lineWidth(1).stroke();
      rowY += rowHeight;
    });

    const totals = [
      ['Subtotal', invoice.subtotal],
      ...(invoice.discount > 0 ? [[`Discount${invoice.discountReason ? ` (${invoice.discountReason})` : ''}`, -invoice.discount]] : []),
      ...(Number(invoice.takeawayCharge ?? invoice.parcelCharge) > 0 ? [['Parcel Charge', invoice.takeawayCharge ?? invoice.parcelCharge]] : []),
      ...(invoice.gstEnabled ? [[`GST (${invoice.gstRate}%)`, invoice.gst]] : []),
      ...(invoice.roundOff ? [['Round Off', invoice.roundOff]] : []),
      ['Grand Total', invoice.total]
    ];
    let totalsTop = Math.max(rowY + 26, 430);
    const totalsBlockHeight = totals.length * 20 + 74;
    if (totalsTop + totalsBlockHeight > 760) {
      doc.addPage();
      totalsTop = 54;
    }
    const totalsLeft = right - 220;
    const totalRowHeight = 20;
    totals.forEach(([label, value], index) => {
      const isTotal = index === totals.length - 1;
      const y = totalsTop + index * totalRowHeight + (isTotal ? 8 : 0);
      if (isTotal) doc.moveTo(totalsLeft, y - 8).lineTo(right, y - 8).strokeColor('#111827').lineWidth(1).stroke();
      doc.fillColor('#111827').font(isTotal ? 'Helvetica-Bold' : 'Helvetica').fontSize(isTotal ? 13 : 10);
      doc.text(label, totalsLeft, y, { width: 112 });
      doc.text(formatINR(value), totalsLeft + 112, y, { width: 108, align: 'right' });
    });
    const noteTop = totalsTop + totals.length * totalRowHeight + 38;
    doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text('This is a computer generated bill.', left, noteTop, { width, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Thank you for visiting. Visit again!', left, noteTop + 18, { width, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text('Powered by BillMitara', left, noteTop + 36, { width, align: 'center' });
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
      message: `Thank you for visiting ${shortText(restaurant.name)}. Your bill ${invoice.billNumber} is ready. Visit Again!`,
      pdfUrl: invoice.pdfUrl
    });
    invoice.whatsappStatus = result.status;
    invoice.whatsappReason = result.reason;
    invoice.whatsappShareUrl = result.shareUrl;
    await invoice.save();
  }
  emitRestaurant(String(order.restaurant), 'invoice:created', invoice);
  return invoice;
}
