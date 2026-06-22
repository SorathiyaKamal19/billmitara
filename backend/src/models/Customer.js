import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, trim: true },
    mobile: { type: String, required: true, trim: true },
    totalVisits: { type: Number, default: 0 },
    totalSpending: { type: Number, default: 0 },
    lastVisitAt: Date
  },
  { timestamps: true }
);

customerSchema.index({ restaurant: 1, mobile: 1 }, { unique: true });
customerSchema.index({ restaurant: 1, totalSpending: -1 });
customerSchema.index({ restaurant: 1, lastVisitAt: -1 });

export const Customer = mongoose.model('Customer', customerSchema);
