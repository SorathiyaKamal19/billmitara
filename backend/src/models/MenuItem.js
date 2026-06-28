import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 1 },
    imageUrl: String,
    foodType: { type: String, enum: ['veg', 'non-veg', 'egg'], required: true },
    isAvailable: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 12 },
    sku: String
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 'text', category: 'text', code: 'text' });
menuItemSchema.index({ restaurant: 1, category: 1, name: 1 });
menuItemSchema.index({ restaurant: 1, code: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1, name: 1 });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
