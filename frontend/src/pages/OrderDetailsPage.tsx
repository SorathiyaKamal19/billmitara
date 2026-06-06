import { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, PlusCircle, RefreshCw, Utensils } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Order } from '../types';
import { money, shortDate } from '../utils/format';

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  async function load() {
    const { data } = await api.get(`/orders/${orderId}`);
    setOrder(data);
  }

  useEffect(() => { load(); }, [orderId]);

  if (!order) return <div className="glass rounded-lg p-8">ઓર્ડર લોડ થઈ રહ્યો છે...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">ટેબલ ઓર્ડરની વિગતો</p>
          <h1 className="text-3xl font-black">{order.tableName || 'Parcel'} હાલનો ઓર્ડર</h1>
          <p className="mt-1 text-sm text-gray-500">{shortDate(order.createdAt)} · {order.customerName || 'Walk-in'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-soft" onClick={() => navigate('/tables')}><ArrowLeft size={17} /> ટેબલ</button>
          <button className="btn-soft" onClick={load}><RefreshCw size={17} /> રિફ્રેશ</button>
          {order.table && <button className="btn-soft" onClick={() => navigate(`/orders/${order.table}?orderId=${order._id}`)}><PlusCircle size={17} /> વસ્તુઓ ઉમેરો</button>}
          <button className="btn-primary" onClick={() => navigate(`/billing/${order._id}`)}><CreditCard size={17} /> બિલ બનાવો</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">ઓર્ડર કરેલી વસ્તુઓ</h2>
            <StatusBadge value={order.status} />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {order.items.map((item) => (
              <div className="grid grid-cols-[1fr_70px_100px] gap-3 py-4 text-sm" key={item._id || item.name}>
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category || 'Item'} {item.note ? `· ${item.note}` : ''}</p>
                </div>
                <p className="text-right text-lg font-black">x{item.quantity}</p>
                <p className="text-right font-black">{money(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="glass h-fit rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-saffron/10 text-saffron"><Utensils size={21} /></div>
            <div>
              <p className="font-black">{order.type}</p>
              <p className="text-sm text-gray-500">{order.customerMobile || 'મોબાઇલ ઉમેર્યો નથી'}</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><span>સબટોટલ</span><b>{money(order.subtotal)}</b></div>
            <div className="flex justify-between"><span>ડિસ્કાઉન્ટ</span><b>{money(order.discount)}</b></div>
            <div className="flex justify-between"><span>Parcel charge</span><b>{money(order.takeawayCharge ?? order.parcelCharge)}</b></div>
            {order.gstEnabled && <div className="flex justify-between"><span>GST</span><b>{money(order.gst)}</b></div>}
            <div className="flex justify-between border-t border-gray-200 pt-3 text-xl dark:border-white/10"><span className="font-black">ચાલુ કુલ</span><b>{money(order.total)}</b></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
