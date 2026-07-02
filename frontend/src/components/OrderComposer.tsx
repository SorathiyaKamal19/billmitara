import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Minus, Plus, Search, Send, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MenuItem } from '../types';
import { calcClientTotals, money } from '../utils/format';
import { foodTypeLabel, statusLabel } from '../utils/gujarati';
import { DiscountFields } from './DiscountFields';
import { BillTotals } from './BillTotals';

interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
}

export function OrderComposer({
  tableId,
  existingOrderId,
  defaultType = 'dine-in',
  mobileSummaryFirst = false
}: {
  tableId?: string;
  existingOrderId?: string | null;
  defaultType?: 'dine-in' | 'takeaway';
  mobileSummaryFirst?: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const canDiscount = user?.role === 'owner';
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [type, setType] = useState(defaultType);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [notes, setNotes] = useState('');
  const [takeawayCharge, setTakeawayCharge] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstRate, setGstRate] = useState(5);
  const [mostSellingIds, setMostSellingIds] = useState<string[]>([]);
  const [orderedQuantities, setOrderedQuantities] = useState<Record<string, number>>({});
  const isAddingToExistingOrder = Boolean(existingOrderId);

  useEffect(() => {
    api.get('/menu').then((res) => setMenu(res.data.filter((item: MenuItem) => item.isAvailable)));
    api.get('/settings').then((res) => {
      const charge = res.data.parcelCharge ?? res.data.takeawayCharge ?? 0;
      setTakeawayCharge(res.data.takeawayChargeEnabled ? charge : 0);
      setGstEnabled(Boolean(res.data.gstEnabled));
      setGstRate(Number(res.data.gstRate || 0));
      if (!existingOrderId) {
        const defaultDiscountValue = Number(res.data.defaultDiscountValue || 0);
        setDiscountType(res.data.defaultDiscountType || 'fixed');
        setDiscountValue(defaultDiscountValue);
        setDiscountReason(defaultDiscountValue > 0 ? res.data.defaultDiscountReason || '' : '');
      }
    });
  }, [existingOrderId]);

  useEffect(() => {
    if (!existingOrderId) {
      setOrderedQuantities({});
      return;
    }

    api.get(`/orders/${existingOrderId}`).then((res) => {
      const quantities = res.data.items.reduce((acc: Record<string, number>, item: { menuItem?: string; quantity: number }) => {
        const menuItemId = String(item.menuItem || '');
        if (menuItemId) acc[menuItemId] = (acc[menuItemId] || 0) + item.quantity;
        return acc;
      }, {});
      setOrderedQuantities(quantities);
      setDiscountType(res.data.discountType || 'fixed');
      setDiscountValue(res.data.discountValue || 0);
      setDiscountReason(res.data.discountReason || '');
    });
  }, [existingOrderId]);

  const categories = useMemo(() => ['All', 'Most Selling', ...Array.from(new Set(menu.map((item) => item.category)))], [menu]);
  useEffect(() => {
    if (category === 'Most Selling') api.get('/menu/most-selling').then((res) => {
      setMostSellingIds(res.data.map((item: MenuItem) => item._id));
      setMenu((current) => [...res.data, ...current.filter((item) => !res.data.some((top: MenuItem) => top._id === item._id))]);
    });
  }, [category]);
  const filtered = useMemo(() => menu.filter((item) => {
    const term = query.trim().toLowerCase();
    const matchesCategory = category === 'All' || (category === 'Most Selling' ? mostSellingIds.includes(item._id) : item.category === category);
    const matchesSearch = !term || item.name.toLowerCase().includes(term) || (item.code || '').toLowerCase().startsWith(term);
    return matchesCategory && matchesSearch;
  }), [category, menu, mostSellingIds, query]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const charge = type === 'dine-in' ? 0 : takeawayCharge;
  const discount = discountType === 'percentage' ? Math.min(subtotal * discountValue / 100, subtotal) : Math.min(discountValue, subtotal);
  const totals = calcClientTotals({ subtotal, charge, discount, gstEnabled, gstRate });

  function add(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((row) => row._id === item._id);
      if (existing) return current.map((row) => row._id === item._id ? { ...row, quantity: row.quantity + 1 } : row);
      return [...current, { ...item, quantity: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((current) => current.flatMap((item) => {
      if (item._id !== id) return [item];
      const quantity = item.quantity + delta;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!cart.length) return toast.error(t('ઓછામાં ઓછી એક વસ્તુ ઉમેરો', 'Add at least one item'));
    if (!isAddingToExistingOrder && !customerName.trim()) return toast.error(t('ગ્રાહકનું નામ જરૂરી છે', 'Customer name is required'));
    const payload = {
      table: type === 'dine-in' ? tableId : undefined,
      type,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      notes,
      ...(canDiscount ? {
        discountType,
        discountValue,
        discountReason: discountValue > 0 ? discountReason.trim() : undefined
      } : {}),
      items: cart.map((item) => ({ menuItem: item._id, quantity: item.quantity, note: item.note || notes.trim() || undefined })),
      takeawayCharge: charge
    };
    if (isAddingToExistingOrder && existingOrderId) {
      await api.post(`/orders/${existingOrderId}/items`, {
        items: payload.items,
        ...(canDiscount ? {
          discountType,
          discountValue,
          discountReason: discountValue > 0 ? discountReason.trim() : undefined
        } : {})
      });
      toast.success(t('વધુ વસ્તુઓ રસોડામાં મોકલાઈ', 'More items sent to kitchen'));
    } else {
      await api.post('/orders', payload);
      toast.success(t('ઓર્ડર રસોડામાં મોકલાયો', 'Order sent to kitchen'));
    }
    navigate(type === 'dine-in' ? '/tables' : '/orders');
  }

  return (
    <form onSubmit={submit} className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-5">
      <section className="min-w-0 space-y-4">
        <div className="glass rounded-lg p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input className="input pl-10" placeholder={t('વસ્તુનું નામ અથવા કોડ શોધો', 'Search item name or item code')} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="grid max-h-40 gap-2 overflow-y-auto pr-1 sm:flex sm:max-h-none sm:max-w-full sm:overflow-x-auto sm:overflow-y-hidden sm:pb-1 sm:pr-0">
              {categories.map((cat) => <button type="button" key={cat} onClick={() => setCategory(cat)} className={`w-full justify-start sm:w-auto sm:shrink-0 ${cat === category ? 'btn-primary' : 'btn-soft'}`}>{cat === 'Most Selling' && <Star size={15} />} <span className="truncate">{cat === 'All' ? t('બધા', 'All') : cat === 'Most Selling' ? t('સૌથી વધુ વેચાતા', 'Most Selling') : cat}</span></button>)}
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const cartItem = cart.find((row) => row._id === item._id);
            const orderedQuantity = orderedQuantities[item._id] || 0;
            const isSelected = Boolean(cartItem);
            const wasOrdered = orderedQuantity > 0;

            return (
              <button
                type="button"
                key={item._id}
                onClick={() => add(item)}
                className={`glass overflow-hidden rounded-lg border text-left transition hover:-translate-y-1 ${
                  isSelected
                    ? 'border-saffron bg-saffron/10 ring-2 ring-saffron/30'
                    : wasOrdered
                      ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-950/30'
                      : 'border-transparent'
                }`}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 font-black">{item.name}</p>
                    <span className="shrink-0 text-sm font-black text-saffron">{money(item.price)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{item.code ? `${item.code} - ` : ''}{item.category} - {foodTypeLabel(item.foodType)}</p>
                  {(wasOrdered || isSelected) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {wasOrdered && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-black text-white">
                          <CheckCircle2 size={13} /> {t('ઓર્ડર થયેલું', 'Ordered')} x{orderedQuantity}
                        </span>
                      )}
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-saffron px-2.5 py-1 text-xs font-black text-white">
                          <Plus size={13} /> {t('પસંદ કરેલું', 'Selected')} x{cartItem?.quantity}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <aside className={`glass h-fit rounded-lg p-4 sm:p-5 xl:sticky xl:top-6 ${mobileSummaryFirst ? 'order-first xl:order-none' : ''}`}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-black">{t('હાલનો ઓર્ડર', 'Current order')}</h2><Send className="text-saffron" /></div>
        {!isAddingToExistingOrder && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(['dine-in', 'takeaway'] as const).map((value) => (
              <button key={value} type="button" onClick={() => setType(value)} className={type === value ? 'btn-primary px-2' : 'btn-soft px-2'}>{statusLabel(value)}</button>
            ))}
          </div>
        )}
        <div className="mt-4 grid gap-3">
          {!isAddingToExistingOrder && (
            <>
              <input className="input" placeholder={t('ગ્રાહકનું નામ', 'Customer name') + ' *'} required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input className="input" placeholder={t('WhatsApp બિલ માટે મોબાઇલ', 'Mobile for WhatsApp bill')} value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} />
            </>
          )}
          <textarea className="input min-h-20" placeholder={t('રસોડા માટે નોંધ', 'Kitchen notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1 sm:max-h-[45vh] xl:max-h-80">
          {cart.map((item) => (
            <div key={item._id} className="rounded-lg bg-white/80 p-3 dark:bg-white/10">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-bold">{item.name}</p><p className="text-xs text-gray-500">{money(item.price)} {t('પ્રતિ વસ્તુ', 'each')}</p></div>
                <button type="button" onClick={() => setCart((rows) => rows.filter((row) => row._id !== item._id))}><Trash2 size={17} className="text-red-500" /></button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-soft p-2" onClick={() => changeQty(item._id, -1)}><Minus size={15} /></button>
                  <span className="w-8 text-center font-black">{item.quantity}</span>
                  <button type="button" className="btn-soft p-2" onClick={() => changeQty(item._id, 1)}><Plus size={15} /></button>
                </div>
                <p className="font-black">{money(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        {canDiscount && (
          <div className="mt-5">
            <DiscountFields
              compact
              discountType={discountType}
              discountValue={discountValue}
              discountReason={discountReason}
              onTypeChange={setDiscountType}
              onValueChange={setDiscountValue}
              onReasonChange={setDiscountReason}
            />
          </div>
        )}
        <BillTotals
          className="mt-5 border-t border-gray-200 pt-4 dark:border-white/10"
          subtotal={subtotal}
          discount={discount}
          discountReason={discountReason}
          takeawayCharge={charge}
          gstEnabled={gstEnabled}
          gstRate={gstRate}
          gst={totals.gst}
          roundOff={totals.roundOff}
          total={totals.total}
          totalLabel={t('કુલ', 'Total')}
        />
        <div className="mt-5 flex justify-end">
          <button className="btn-primary w-fit px-4">
            <Send size={18} />
            {existingOrderId ? t('વસ્તુઓ રસોડામાં ઉમેરો', 'Add Items to Kitchen') : t('રસોડામાં મોકલો', 'Send to Kitchen')}
          </button>
        </div>
      </aside>
    </form>
  );
}
