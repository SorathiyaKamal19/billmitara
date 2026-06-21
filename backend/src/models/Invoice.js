import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customerName: String,
    customerMobile: String,
    billNumber: { type: String, required: true, unique: true },
    subtotal: Number,
    discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    discountValue: { type: Number, default: 0 },
    discount: Number,
    discountReason: String,
    takeawayCharge: { type: Number, default: 0 },
    parcelCharge: Number,
    gstEnabled: { type: Boolean, default: true },
    gstRate: Number,
    gst: Number,
    exactTotal: Number,
    roundOff: { type: Number, default: 0 },
    total: Number,
    pdfUrl: String,
    whatsappStatus: { type: String, enum: ['not_sent', 'queued', 'sent', 'failed', 'mock_sent', 'share_link'], default: 'not_sent' },
    whatsappReason: String,
    whatsappShareUrl: String,
    paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'partial'], default: 'cash' },
    payments: [
      {
        method: { type: String, enum: ['cash', 'upi', 'card'], required: true },
        amount: { type: Number, required: true, min: 0 }
      }
    ],
    finalizedAt: Date,
    editReason: String,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Invoice = mongoose.model('Invoice', invoiceSchema);
