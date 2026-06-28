import { z } from 'zod';
import { SupportTicket } from '../models/SupportTicket.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
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
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentTicketCount = await SupportTicket.countDocuments({
    createdBy: req.user._id,
    createdAt: { $gte: since }
  });

  if (recentTicketCount >= env.support.dailyLimit) {
    throw new ApiError(
      429,
      `We already received your support queries. Our team usually resolves queries within 2 days, so please wait before sending another message.`
    );
  }

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

export const closeSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Support ticket not found');
  if (ticket.status !== 'closed') {
    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closedBy = req.user._id;
    await ticket.save();
  }
  res.json(ticket);
});
