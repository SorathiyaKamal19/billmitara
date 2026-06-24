import { z } from 'zod';
import { SupportTicket } from '../models/SupportTicket.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSupportRequestEmail } from '../services/emailService.js';

const supportRequestSchema = z.object({
  category: z.enum(['billing', 'technical', 'account', 'feature', 'other']).default('technical'),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000)
});

export const listSupportTickets = asyncHandler(async (req, res) => {
  const query = req.user.role === 'superadmin'
    ? {}
    : { restaurant: req.user.restaurant, createdBy: req.user._id };

  const tickets = await SupportTicket.find(query)
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  res.json(tickets);
});

export const createSupportTicket = asyncHandler(async (req, res) => {
  const input = supportRequestSchema.parse(req.body);
  await req.user.populate('restaurant');

  const ticket = await SupportTicket.create({
    restaurant: req.user.restaurant?._id,
    createdBy: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    restaurantName: req.user.restaurant?.name,
    category: input.category,
    subject: input.subject,
    message: input.message
  });

  try {
    await sendSupportRequestEmail({ ticket });
    ticket.notificationStatus = 'sent';
    ticket.notificationError = undefined;
    await ticket.save();
  } catch (error) {
    ticket.notificationStatus = 'failed';
    ticket.notificationError = error.message;
    await ticket.save();
    throw error;
  }

  res.status(201).json(ticket);
});
