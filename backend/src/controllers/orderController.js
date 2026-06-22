import { z } from 'zod';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { Table } from '../models/Table.js';
import { Restaurant } from '../models/Restaurant.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { calculateOrderTotals } from '../utils/tax.js';
import { emitKitchen, emitRestaurant } from '../config/socket.js';
import { boundedInt } from '../utils/security.js';

const orderSchema = z.object({
  table: z.string().optional().nullable(),
  type: z.enum(['dine-in', 'takeaway']).default('dine-in'),
  customerName: z.string().trim().min(1, 'Customer name is required'),
  customerMobile: z.string().optional(),
  notes: z.string().optional(),
  discountType: z.enum(['fixed', 'percentage']).default('fixed'),
  discountValue: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().optional(),
  discountReason: z.string().optional(),
  customerMobile: z.string().optional(),
  takeawayCharge: z.number().nonnegative().optional(),
  parcelCharge: z.number().nonnegative().optional(),
  items: z.array(z.object({ menuItem: z.string(), quantity: z.number().int().positive(), note: z.string().optional() })).min(1)
});

const editableOrderItemSchema = z.object({
  _id: z.any().optional(),
  menuItem: z.any().optional(),
  name: z.string().trim().min(1),
  category: z.string().optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  foodType: z.string().optional(),
  note: z.string().optional(),
  status: z.string().optional()
});

function assertDiscountAllowed(req, discountValue = 0) {
  if (Number(discountValue || 0) > 0 && req.user.role !== 'owner') {
    throw new ApiError(403, 'Only owner can apply discounts');
  }
}

async function hydrateItems(items, restaurantId) {
  const ids = items.map((item) => item.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: ids }, restaurant: restaurantId });
  const map = new Map(menuItems.map((item) => [String(item._id), item]));
  return items.map((item) => {
    const menuItem = map.get(item.menuItem);
    if (!menuItem) throw new ApiError(400, 'Invalid menu item in order');
    return {
      menuItem: menuItem._id,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price,
      quantity: item.quantity,
      foodType: menuItem.foodType,
      note: item.note
    };
  });
}

export const listOrders = asyncHandler(async (req, res) => {
  const query = { restaurant: req.user.restaurant };
  if (req.query.kitchenHistory === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    query.updatedAt = { $gte: start };
    query.status = { $in: ['ready', 'billed'] };
  }
  if (req.query.status) query.status = req.query.status;
  if (req.query.type) query.type = req.query.type;
  const orders = await Order.find(query).sort({ createdAt: -1 }).limit(boundedInt(req.query.limit, { max: 100, fallback: 50 })).lean();
  res.json(orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
  if (!order) throw new ApiError(404, 'Order not found');
  res.json(order);
});

export const createOrder = asyncHandler(async (req, res) => {
  const input = orderSchema.parse(req.body);
  assertDiscountAllowed(req, input.discountValue ?? input.discount);
  const restaurant = await Restaurant.findById(req.user.restaurant);
  const items = await hydrateItems(input.items, req.user.restaurant);
  const defaultCharge = restaurant.parcelCharge || restaurant.takeawayCharge;
  const takeawayCharge = input.type === 'takeaway' && restaurant.takeawayChargeEnabled ? input.takeawayCharge ?? defaultCharge : 0;
  const totals = calculateOrderTotals(items, {
    discountType: input.discountType,
    discountValue: input.discountValue ?? input.discount ?? 0,
    takeawayCharge,
    gstEnabled: restaurant.gstEnabled !== false,
    gstRate: restaurant.gstRate
  });
  let tableName;
  if (input.type === 'dine-in') {
    if (!input.table) throw new ApiError(400, 'Table is required for dine-in orders');
    const table = await Table.findOne({ _id: input.table, restaurant: req.user.restaurant });
    if (!table) throw new ApiError(404, 'Table not found');
    tableName = table.name;
  }
  const order = await Order.create({
    restaurant: req.user.restaurant,
    table: input.table,
    tableName,
    type: input.type,
    customerName: input.customerName,
    customerMobile: input.customerMobile?.trim(),
    notes: input.notes,
    discountReason: input.discountReason?.trim(),
    createdBy: req.user._id,
    items,
    ...totals,
    status: 'in-kitchen'
  });
  if (input.table) await Table.findByIdAndUpdate(input.table, { status: 'running', currentOrder: order._id });
  emitKitchen(String(req.user.restaurant), 'order:new', order);
  emitRestaurant(String(req.user.restaurant), 'order:updated', order);
  res.status(201).json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, reason } = z.object({
    status: z.enum(['running', 'in-kitchen', 'ready', 'billed', 'cancelled']),
    reason: z.string().trim().optional()
  }).parse(req.body);
  const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurant }).lean();
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status === 'billed') throw new ApiError(400, 'Billed orders cannot be cancelled');
  if (order.status === 'cancelled') throw new ApiError(400, 'Order is already cancelled');

  if (status === 'cancelled') {
    if (req.user.role === 'chef') throw new ApiError(403, 'Chef cannot cancel orders');
    if (!reason) throw new ApiError(400, 'Cancellation reason is required');
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    if (order.table) {
      await Table.findOneAndUpdate(
        { _id: order.table, restaurant: req.user.restaurant, currentOrder: order._id },
        { status: 'available', $unset: { currentOrder: 1 } }
      );
    }
  }

  order.status = status;
  await order.save();
  emitKitchen(String(req.user.restaurant), 'order:updated', order);
  emitRestaurant(String(req.user.restaurant), 'order:updated', order);
  res.json(order);
});

export const addItemsToOrder = asyncHandler(async (req, res) => {
  const input = z.object({
    items: orderSchema.shape.items,
    discountType: z.enum(['fixed', 'percentage']).optional(),
    discountValue: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().optional(),
    discountReason: z.string().optional()
  }).parse(req.body);
  assertDiscountAllowed(req, input.discountValue ?? input.discount);
  const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
  if (!order) throw new ApiError(404, 'Order not found');
  const items = await hydrateItems(input.items, req.user.restaurant);
  order.items.push(...items);
  const totals = calculateOrderTotals(order.items, {
    discountType: input.discountType ?? order.discountType,
    discountValue: input.discountValue ?? input.discount ?? order.discountValue,
    takeawayCharge: order.takeawayCharge,
    gstEnabled: order.gstEnabled !== false,
    gstRate: order.gstRate
  });
  Object.assign(order, totals, { status: 'in-kitchen' });
  if (input.discountReason !== undefined) order.discountReason = input.discountReason?.trim();
  await order.save();
  emitKitchen(String(req.user.restaurant), 'order:updated', order);
  emitRestaurant(String(req.user.restaurant), 'order:updated', order);
  res.json(order);
});

export const updateOrder = asyncHandler(async (req, res) => {
  const input = z.object({
    items: z.array(editableOrderItemSchema).min(1),
    discountType: z.enum(['fixed', 'percentage']).optional(),
    discountValue: z.number().nonnegative().optional(),
    discountReason: z.string().optional(),
    customerMobile: z.string().optional()
  }).parse(req.body);
  assertDiscountAllowed(req, input.discountValue);
  const order = await Order.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status === 'billed') throw new ApiError(400, 'Billed orders cannot be edited');
  order.items = input.items.map((item) => ({
    menuItem: item.menuItem,
    name: item.name,
    category: item.category,
    price: item.price,
    quantity: item.quantity,
    foodType: item.foodType || 'veg',
    note: item.note,
    status: item.status || 'queued'
  }));
  const totals = calculateOrderTotals(order.items, {
    discountType: input.discountType ?? order.discountType,
    discountValue: input.discountValue ?? order.discountValue,
    takeawayCharge: order.takeawayCharge,
    gstEnabled: order.gstEnabled !== false,
    gstRate: order.gstRate
  });
  Object.assign(order, totals);
  if (input.discountReason !== undefined) order.discountReason = input.discountReason?.trim();
  if (input.customerMobile !== undefined) order.customerMobile = input.customerMobile.trim();
  await order.save();
  emitKitchen(String(req.user.restaurant), 'order:updated', order);
  emitRestaurant(String(req.user.restaurant), 'order:updated', order);
  res.json(order);
});
