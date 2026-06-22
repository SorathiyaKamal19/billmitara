import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    category: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    foodType: { type: String, enum: ['veg', 'non-veg', 'egg'], default: 'veg' },
    note: String,
    status: { type: String, enum: ['queued', 'preparing', 'ready', 'served'], default: 'queued' }
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    tableName: String,
    type: { type: String, enum: ['dine-in', 'takeaway'], default: 'dine-in' },
    status: { type: String, enum: ['running', 'in-kitchen', 'ready', 'billed', 'cancelled'], default: 'running' },
    customerName: String,
    customerMobile: String,
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0 },
    discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    discountValue: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountReason: String,
    takeawayCharge: { type: Number, default: 0 },
    parcelCharge: { type: Number, default: 0 },
    gstEnabled: { type: Boolean, default: true },
    gstRate: { type: Number, default: 5 },
    gst: { type: Number, default: 0 },
    exactTotal: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, updatedAt: -1 });
orderSchema.index({ restaurant: 1, type: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, table: 1, status: 1 });

export const Order = mongoose.model('Order', orderSchema);
