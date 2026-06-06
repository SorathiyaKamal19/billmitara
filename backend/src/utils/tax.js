export function calculateOrderTotals(items, { discountType = 'fixed', discountValue = 0, discount = 0, takeawayCharge = 0, parcelCharge = 0, gstEnabled = true, gstRate = 5 } = {}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const rawDiscountValue = discountValue || discount || 0;
  const calculatedDiscount = discountType === 'percentage' ? (subtotal * Number(rawDiscountValue || 0)) / 100 : Number(rawDiscountValue || 0);
  const discountAmount = Number(Math.min(Math.max(calculatedDiscount, 0), subtotal).toFixed(2));
  const charge = Number(takeawayCharge || parcelCharge || 0);
  const taxable = Math.max(subtotal + charge - discountAmount, 0);
  const gst = gstEnabled ? Number(((taxable * Number(gstRate || 0)) / 100).toFixed(2)) : 0;
  const total = Number((taxable + gst).toFixed(2));
  return { subtotal, discountType, discountValue: Number(rawDiscountValue || 0), discount: discountAmount, takeawayCharge: charge, parcelCharge: charge, gstEnabled: Boolean(gstEnabled), gstRate: gstEnabled ? gstRate : 0, gst, total };
}
