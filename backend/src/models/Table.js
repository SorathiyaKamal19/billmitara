import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true },
    capacity: { type: Number, default: 4 },
    zone: { type: String, default: 'Main Floor' },
    status: { type: String, enum: ['available', 'running', 'reserved', 'cleaning'], default: 'available' },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
  },
  { timestamps: true }
);

tableSchema.index({ restaurant: 1, zone: 1, name: 1 });
tableSchema.index({ restaurant: 1, status: 1 });
tableSchema.index({ restaurant: 1, currentOrder: 1 });

export const Table = mongoose.model('Table', tableSchema);
