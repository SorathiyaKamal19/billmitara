import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

menuCategorySchema.index({ restaurant: 1, name: 1 });

export const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);
