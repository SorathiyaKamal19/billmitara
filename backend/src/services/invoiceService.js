import PDFDocument from 'pdfkit';
import { randomBytes } from 'crypto';
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

function safeHexColor(value, fallback = '#f97316') {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function colorWithOpacity(hex, opacityHex = '14') {
  const color = safeHexColor(hex).slice(1);
  const opacity = Math.max(0, Math.min(1, parseInt(opacityHex, 16) / 255));
  const channels = [0, 2, 4].map((index) => parseInt(color.slice(index, index + 2), 16));
  const blended = channels.map((channel) => Math.round(channel * opacity + 255 * (1 - opacity)));
  return `#${blended.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function formatPayments(invoice) {
  if (!invoice.payments?.length) return paymentLabel(invoice.paymentMode);
  return invoice.payments.map((payment) => `${paymentLabel(payment.method)} ${formatINR(payment.amount)}`).join(' + ');
}

async function nextBillNumber(restaurant) {
  const count = await Invoice.countDocuments({ restaurant: restaurant._id });
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `${restaurant.invoicePrefix || 'POSS'}-${date}-${String(count + 1).padStart(4, '0')}`;
}

async function nextPublicCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomBytes(5).toString('base64url').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase();
    if (code.length < 6) continue;
    const exists = await Invoice.exists({ publicCode: code });
    if (!exists) return code;
  }
  throw new Error('Could not generate invoice public code');
}

export async function buildInvoicePdfBuffer(invoice, order, restaurant) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const page = { width: doc.page.width, height: doc.page.height };
    const left = 40;
    const right = page.width - 40;
    const width = right - left;
    const bottom = page.height - 86;
    const brand = safeHexColor(restaurant.brandColor);
    const brandSoft = colorWithOpacity(brand, '16');
    const ink = '#111827';
    const muted = '#667085';
    const border = '#e5e7eb';
    const soft = '#f8fafc';
    const orderType = order.type === 'takeaway' ? 'Parcel order' : 'Dine-in order';
    const billDate = formatBillDate(invoice.finalizedAt || invoice.createdAt);

    const label = (content, x, y, options = {}) => {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(muted);
      doc.text(String(content).toUpperCase(), x, y, { characterSpacing: 0.3, ...options });
    };
    const drawPill = (content, x, y, pillWidth, color = brand, fill = brandSoft) => {
      doc.roundedRect(x, y, pillWidth, 22, 11).fill(fill);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(color).text(content, x + 10, y + 7, {
        width: pillWidth - 20,
        align: 'center'
      });
    };
    const drawFooter = () => {
      const footerY = page.height - 64;
      doc.moveTo(left, footerY - 10).lineTo(right, footerY - 10).strokeColor(border).lineWidth(0.7).stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#98a2b3').text('This is a computer generated bill.', left, footerY, {
        width,
        align: 'center'
      });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(brand).text('Powered by BillMitara', left, footerY + 13, {
        width,
        align: 'center'
      });
    };
    const drawPageChrome = (continued = false) => {
      doc.rect(0, 0, page.width, page.height).fill('#ffffff');
      doc.rect(0, 0, page.width, 9).fill(brand);
      if (continued) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(`${restaurant.name} - Invoice continued`, left, 28, {
          width: 320
        });
        doc.font('Helvetica').fontSize(8).fillColor(muted).text(invoice.billNumber, right - 180, 28, {
          width: 180,
          align: 'right'
        });
      }
    };
    const ensureSpace = (y, needed, continuedHeader) => {
      if (y + needed <= bottom) return y;
      drawFooter();
      doc.addPage();
      drawPageChrome(true);
      if (continuedHeader) continuedHeader(58);
      return continuedHeader ? 96 : 58;
    };

    drawPageChrome();

    doc.roundedRect(left, 34, width, 112, 8).fill(soft);
    doc.rect(left, 34, 7, 112).fill(brand);
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(24).text(restaurant.name || 'Restaurant', left + 22, 52, {
      width: 290,
      lineGap: 1
    });
    doc.font('Helvetica').fontSize(9.5).fillColor(muted).text(shortText(restaurant.address || 'Restaurant POS', 105), left + 22, 86, {
      width: 300,
      lineGap: 2
    });
    const contact = [
      restaurant.phone ? `Phone: ${restaurant.phone}` : null,
      invoice.gstEnabled && restaurant.gstNumber ? `GSTIN: ${restaurant.gstNumber}` : null
    ].filter(Boolean).join('   ');
    if (contact) doc.fontSize(8.5).fillColor(muted).text(contact, left + 22, 122, { width: 320 });

    doc.font('Helvetica-Bold').fontSize(10).fillColor(muted).text('TAX INVOICE', right - 190, 54, {
      width: 170,
      align: 'right',
      characterSpacing: 1.2
    });
    doc.font('Helvetica-Bold').fontSize(16).fillColor(ink).text(invoice.billNumber, right - 220, 75, {
      width: 200,
      align: 'right'
    });
    drawPill('PAID', right - 102, 106, 82, '#059669', '#dcfce7');

    const cardY = 164;
    const gap = 12;
    const cardWidth = (width - gap * 2) / 3;
    const card = (title, rows, x) => {
      doc.roundedRect(x, cardY, cardWidth, 92, 7).fillAndStroke('#ffffff', border);
      label(title, x + 14, cardY + 14, { width: cardWidth - 28 });
      let y = cardY + 33;
      rows.forEach(([rowLabel, rowValue]) => {
        doc.font('Helvetica').fontSize(8).fillColor(muted).text(rowLabel, x + 14, y, { width: 52 });
        doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(shortText(rowValue || '-', 34), x + 68, y, {
          width: cardWidth - 82
        });
        y += 18;
      });
    };

    card('Customer', [
      ['Name', invoice.customerName || order.customerName || 'Walk-in'],
      ['Mobile', invoice.customerMobile || order.customerMobile || '-']
    ], left);
    card('Order', [
      ['Type', orderType],
      ['Table', order.tableName || '-']
    ], left + cardWidth + gap);
    card('Payment', [
      ['Mode', paymentLabel(invoice.paymentMode)],
      ['Date', billDate]
    ], left + (cardWidth + gap) * 2);

    const table = {
      x: left,
      y: 286,
      item: left + 16,
      qty: left + 316,
      rate: left + 372,
      amount: left + 456,
      itemWidth: 276,
      qtyWidth: 38,
      rateWidth: 66,
      amountWidth: 58
    };
    const drawTableHeader = (y) => {
      doc.roundedRect(table.x, y, width, 32, 7).fill(ink);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
      doc.text('ITEM', table.item, y + 11, { width: table.itemWidth });
      doc.text('QTY', table.qty, y + 11, { width: table.qtyWidth, align: 'right' });
      doc.text('RATE', table.rate, y + 11, { width: table.rateWidth, align: 'right' });
      doc.text('AMOUNT', table.amount, y + 11, { width: table.amountWidth, align: 'right' });
    };

    let rowY = table.y;
    drawTableHeader(rowY);
    rowY += 42;

    order.items.forEach((item, index) => {
      const note = shortText(item.note, 110);
      const itemHeight = doc.font('Helvetica-Bold').fontSize(10).heightOfString(item.name, { width: table.itemWidth });
      const noteHeight = note ? doc.font('Helvetica').fontSize(8).heightOfString(note, { width: table.itemWidth }) + 5 : 0;
      const rowHeight = Math.max(40, itemHeight + noteHeight + 22);
      rowY = ensureSpace(rowY, rowHeight + 8, drawTableHeader);
      if (index % 2 === 0) doc.roundedRect(left, rowY - 4, width, rowHeight + 2, 5).fill('#fcfcfd');

      doc.fillColor(ink).font('Helvetica-Bold').fontSize(10).text(item.name, table.item, rowY + 8, {
        width: table.itemWidth,
        lineGap: 1
      });
      if (note) {
        doc.font('Helvetica').fontSize(8).fillColor(muted).text(note, table.item, rowY + 22 + itemHeight, {
          width: table.itemWidth
        });
      }
      doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(String(item.quantity), table.qty, rowY + 10, {
        width: table.qtyWidth,
        align: 'right'
      });
      doc.font('Helvetica').fontSize(9.5).fillColor(ink).text(formatINR(item.price), table.rate, rowY + 10, {
        width: table.rateWidth,
        align: 'right'
      });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(formatINR(item.price * item.quantity), table.amount, rowY + 10, {
        width: table.amountWidth,
        align: 'right'
      });
      doc.moveTo(left, rowY + rowHeight).lineTo(right, rowY + rowHeight).strokeColor(border).lineWidth(0.7).stroke();
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
    const totalsBlockHeight = totals.length * 22 + 104;
    const totalsTop = ensureSpace(rowY + 24, totalsBlockHeight);
    const totalsLeft = right - 236;
    const totalsWidth = 236;

    doc.roundedRect(left, totalsTop, width, totalsBlockHeight, 8).fillAndStroke('#ffffff', border);
    doc.roundedRect(left + 16, totalsTop + 18, width - totalsWidth - 42, 58, 7).fill(soft);
    label('Payment details', left + 32, totalsTop + 31, { width: 180 });
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ink).text(formatPayments(invoice), left + 32, totalsTop + 49, {
      width: width - totalsWidth - 74
    });

    const totalRowHeight = 22;
    totals.forEach(([rowLabel, rowValue], index) => {
      const isTotal = index === totals.length - 1;
      const y = totalsTop + 18 + index * totalRowHeight + (isTotal ? 8 : 0);
      if (isTotal) {
        doc.roundedRect(totalsLeft, y - 7, totalsWidth, 34, 7).fill(ink);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12);
        doc.text(rowLabel, totalsLeft + 14, y + 3, { width: 110 });
        doc.text(formatINR(rowValue), totalsLeft + 124, y + 3, { width: totalsWidth - 138, align: 'right' });
        return;
      }
      doc.fillColor(muted).font('Helvetica').fontSize(9.5);
      doc.text(rowLabel, totalsLeft + 14, y, { width: 112 });
      doc.fillColor(ink).font('Helvetica-Bold').text(formatINR(rowValue), totalsLeft + 126, y, {
        width: totalsWidth - 140,
        align: 'right'
      });
    });

    const thanksTop = ensureSpace(totalsTop + totalsBlockHeight + 18, 46);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text('Thank you for visiting. Visit again!', left, thanksTop, {
      width,
      align: 'center'
    });
    doc.font('Helvetica').fontSize(8.5).fillColor(muted).text('Please keep this bill for your records.', left, thanksTop + 18, {
      width,
      align: 'center'
    });
    drawFooter();
    doc.end();
  });
}

export async function createInvoiceForOrder(orderId, { sendWhatsApp = true, paymentMode = 'cash', payments = [], customerMobile } = {}) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (customerMobile !== undefined) {
    order.customerMobile = customerMobile.trim();
    await order.save();
  }
  const restaurant = await Restaurant.findById(order.restaurant);
  const billNumber = await nextBillNumber(restaurant);
  const publicCode = await nextPublicCode();
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
    publicCode,
    publicUrl: `${env.publicClientUrl}/i/${publicCode}`,
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
      invoiceUrl: invoice.publicUrl,
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
