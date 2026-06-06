import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Search, Send, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MenuItem } from '../types';
import { money } from '../utils/format';
import { foodTypeLabel, statusLabel } from '../utils/gujarati';

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
  const [notes, setNotes] = useState('');
  const [takeawayCharge, setTakeawayCharge] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstRate, setGstRate] = useState(5);
  const [mostSellingIds, setMostSellingIds] = useState<string[]>([]);

  useEffect(() => {
    api.get('/menu').then((res) => setMenu(res.data.filter((item: MenuItem) => item.isAvailable)));
    api.get('/settings').then((res) => {
      setTakeawayCharge(res.data.takeawayChargeEnabled ? res.data.takeawayCharge : 0);
      setGstEnabled(Boolean(res.data.gstEnabled));
      setGstRate(Number(res.data.gstRate || 0));
    });
  }, []);

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
  const gst = gstEnabled ? Math.max(subtotal + charge - discount, 0) * (gstRate / 100) : 0;
  const total = Math.max(subtotal + charge - discount, 0) + gst;

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
    if (!cart.length) return toast.error('ઓછામાં ઓછી એક વસ્તુ ઉમેરો');
    if (!customerName.trim()) return toast.error('Customer name is required');
    const payload = {
      table: type === 'dine-in' ? tableId : undefined,
      type,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      notes,
      discountType: canDiscount ? discountType : 'fixed',
      discountValue: canDiscount ? discountValue : 0,
      items: cart.map((item) => ({ menuItem: item._id, quantity: item.quantity, note: item.note })),
      takeawayCharge: charge
    };
    if (existingOrderId) {
      await api.post(`/orders/${existingOrderId}/items`, { items: payload.items, discountType: payload.discountType, discountValue: payload.discountValue });
      toast.success('વધુ વસ્તુઓ રસોડામાં મોકલાઈ');
    } else {
      await api.post('/orders', payload);
      toast.success('ઓર્ડર રસોડામાં મોકલાયો');
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
              <input className="input pl-10" placeholder="Search item name or item code" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="grid max-h-40 gap-2 overflow-y-auto pr-1 sm:flex sm:max-h-none sm:max-w-full sm:overflow-x-auto sm:overflow-y-hidden sm:pb-1 sm:pr-0">
              {categories.map((cat) => <button type="button" key={cat} onClick={() => setCategory(cat)} className={`w-full justify-start sm:w-auto sm:shrink-0 ${cat === category ? 'btn-primary' : 'btn-soft'}`}>{cat === 'Most Selling' && <Star size={15} />} <span className="truncate">{cat === 'All' ? 'બધા' : cat === 'Most Selling' ? 'સૌથી વધુ વેચાતા' : cat}</span></button>)}
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <button type="button" key={item._id} onClick={() => add(item)} className="glass overflow-hidden rounded-lg text-left transition hover:-translate-y-1">
         
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3"><p className="min-w-0 font-black">{item.name}</p><span className="shrink-0 text-sm font-black text-saffron">{money(item.price)}</span></div>
                <p className="mt-1 text-xs text-gray-500">{item.code ? `${item.code} - ` : ''}{item.category} - {foodTypeLabel(item.foodType)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
      <aside className={`glass h-fit rounded-lg p-4 sm:p-5 xl:sticky xl:top-6 ${mobileSummaryFirst ? 'order-first xl:order-none' : ''}`}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-black">હાલનો ઓર્ડર</h2><Send className="text-saffron" /></div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(['dine-in', 'takeaway'] as const).map((value) => (
            <button key={value} type="button" onClick={() => setType(value)} className={type === value ? 'btn-primary px-2' : 'btn-soft px-2'}>{statusLabel(value)}</button>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          <input className="input" placeholder="Customer name *" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <input className="input" placeholder="Mobile for WhatsApp bill (optional)" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} />
          <textarea className="input min-h-20" placeholder="રસોડા માટે નોંધ" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1 sm:max-h-[45vh] xl:max-h-80">
          {cart.map((item) => (
            <div key={item._id} className="rounded-lg bg-white/80 p-3 dark:bg-white/10">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-bold">{item.name}</p><p className="text-xs text-gray-500">{money(item.price)} પ્રતિ વસ્તુ</p></div>
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
        <div className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-white/10">
          <div className="flex justify-between"><span>સબટોટલ</span><b>{money(subtotal)}</b></div>
          {canDiscount && (
            <div className="flex items-center justify-between gap-3">
              <span>Discount</span>
              <select className="input h-9 w-24" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}>
                <option value="fixed">Rs.</option>
                <option value="percentage">%</option>
              </select>
              <input className="input h-9 w-24" type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
            </div>
          )}
          {type === 'takeaway' && <div className="flex justify-between"><span>Parcel charge</span><b>{money(charge)}</b></div>}
          {gstEnabled && <div className="flex justify-between"><span>GST {gstRate}%</span><b>{money(gst)}</b></div>}
          <div className="flex justify-between text-lg"><span className="font-black">કુલ</span><b>{money(total)}</b></div>
        </div>
        <button className="btn-primary mt-5 w-full">
          <Send size={18} />
          {existingOrderId ? 'વસ્તુઓ રસોડામાં ઉમેરો' : 'રસોડામાં મોકલો'}
        </button>
      </aside>
    </form>
  );
}
