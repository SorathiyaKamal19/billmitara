import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    restaurantName: { type: String, trim: true },
    category: { type: String, enum: ['billing', 'technical', 'account', 'feature', 'other'], default: 'technical' },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    notificationStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    notificationError: String,
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    closedAt: Date,
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastReminderAt: Date,
    reminderCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

supportTicketSchema.index({ restaurant: 1, createdAt: -1 });
supportTicketSchema.index({ createdBy: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, lastReminderAt: 1, createdAt: 1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
