import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    brandColor: { type: String, default: '#f97316' },
    logoUrl: String,
    address: String,
    phone: String,
    gstNumber: String,
    gstEnabled: { type: Boolean, default: true },
    gstRate: { type: Number, default: 5 },
    currency: { type: String, default: 'INR' },
    takeawayChargeEnabled: { type: Boolean, default: false },
    takeawayCharge: { type: Number, default: 0 },
    parcelCharge: { type: Number, default: 0 },
    invoicePrefix: { type: String, default: 'POSS' },
    thermalPrinterWidth: { type: Number, default: 80 },
    qrMenuUrl: String
  },
  { timestamps: true }
);

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
