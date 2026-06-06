import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: String,
    foodType: { type: String, enum: ['veg', 'non-veg', 'egg'], default: 'veg' },
    isAvailable: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 12 },
    sku: String
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 'text', category: 'text', code: 'text' });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
