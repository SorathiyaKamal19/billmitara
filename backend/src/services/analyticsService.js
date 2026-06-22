import { Order } from '../models/Order.js';
import { Invoice } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';

function dateRange(period = 'today', customStart, customEnd) {
  if (customStart && customEnd) return { start: new Date(customStart), end: new Date(customEnd) };
  const end = new Date();
  const start = new Date();
  if (period === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'this_week' || period === 'weekly') {
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
  } else if (period === 'last_week') {
    start.setDate(start.getDate() - start.getDay() - 7);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'last_month' || period === 'monthly') {
    start.setMonth(start.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

export async function getDashboardAnalytics(restaurantId, period = 'today', customStart, customEnd) {
  const { start, end } = dateRange(period, customStart, customEnd);
  const match = { restaurant: restaurantId, createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } };
  const invoiceMatch = { restaurant: restaurantId, createdAt: { $gte: start, $lte: end } };

  const [
    [summary],
    topItems,
    topCategories,
    salesTrend,
    peakHours,
    recentBills,
    customerCount,
    paymentStats,
    partialPayments
  ] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          takeawayOrders: { $sum: { $cond: [{ $eq: ['$type', 'takeaway'] }, 1, 0] } },
          parcelOrders: { $sum: { $cond: [{ $eq: ['$type', 'takeaway'] }, 1, 0] } },
          dineInOrders: { $sum: { $cond: [{ $eq: ['$type', 'dine-in'] }, 1, 0] } },
          gst: { $sum: '$gst' }
        }
      }
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { quantity: -1 } },
      { $limit: 8 }
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.category', quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { quantity: -1 } },
      { $limit: 8 }
    ]),
    Order.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([
      { $match: match },
      { $group: { _id: { $hour: '$createdAt' }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]),
    Invoice.find({ restaurant: restaurantId }).sort({ createdAt: -1 }).limit(8).lean(),
    Customer.countDocuments({ restaurant: restaurantId }),
    Invoice.aggregate([
      { $match: invoiceMatch },
      { $unwind: '$payments' },
      { $group: { _id: '$payments.method', amount: { $sum: '$payments.amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } }
    ]),
    Invoice.countDocuments({ ...invoiceMatch, paymentMode: 'partial' })
  ]);

  return {
    revenue: summary?.revenue || 0,
    orders: summary?.orders || 0,
    parcelOrders: summary?.parcelOrders || 0,
    takeawayOrders: summary?.takeawayOrders || 0,
    dineInOrders: summary?.dineInOrders || 0,
    gst: summary?.gst || 0,
    customers: customerCount,
    topItems,
    topCategories,
    salesTrend,
    peakHours,
    recentBills,
    paymentStats,
    partialPayments,
    range: { start, end }
  };
}
