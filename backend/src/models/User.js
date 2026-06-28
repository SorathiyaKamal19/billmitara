import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['superadmin', 'owner', 'manager', 'waiter', 'chef'], required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    permissions: [{ type: String, trim: true }],
    phone: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
    isSubscribed: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.index({ restaurant: 1, role: 1, name: 1 });
userSchema.index({ restaurant: 1, isActive: 1 });
userSchema.index({ role: 1, isSubscribed: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
