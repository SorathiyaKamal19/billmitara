import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CreditCard, Plus, RefreshCw, ShoppingBag, Table2 } from 'lucide-react';
import { OrderComposer } from '../components/OrderComposer';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/client';
import { Order } from '../types';
import { money, shortDate } from '../utils/format';

export function OrderPage() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showComposer, setShowComposer] = useState(Boolean(tableId));
  const existingOrderId = searchParams.get('orderId');

  async function load() {
    const res = await api.get('/orders?limit=100');
    setOrders(res.data.filter((order: Order) => !['billed', 'cancelled'].includes(order.status)));
  }

  useEffect(() => {
    if (!tableId) load();
  }, [tableId]);

  if (!tableId && !showComposer) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-saffron">ચાલુ ઓર્ડર</p>
            <h1 className="text-3xl font-black">ગ્રાહક માંગે ત્યારે બિલ બનાવો</h1>
          </div>
          <div className="flex gap-2">
            <button className="btn-soft" onClick={load}><RefreshCw size={17} /> રિફ્રેશ</button>
            <button className="btn-primary" onClick={() => setShowComposer(true)}><Plus size={17} /> New parcel</button>
          </div>
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {orders.map((order) => (
            <div
              className="glass flex h-[28rem] min-h-0 flex-col overflow-hidden rounded-xl p-0 shadow-sm sm:h-[30rem]"
              key={order._id}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="min-w-0">
                  <p className="truncate text-xl font-black">{order.tableName || 'Parcel order'}</p>
                  <p className="truncate text-sm text-gray-500">{shortDate(order.createdAt)}</p>
                </div>
                <StatusBadge value={order.status} />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      className="rounded-lg border border-gray-100 bg-white/85 p-3 text-sm dark:border-white/10 dark:bg-white/10"
                      key={item._id || item.name}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 font-semibold">
                          {item.name}
                        </span>
                        <span className="shrink-0 rounded-md bg-saffron/10 px-2 py-0.5 font-black text-saffron">
                          x{item.quantity}
                        </span>
                      </div>
                      <div className="mt-2 text-right font-black">
                        {money(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between rounded-lg bg-saffron/10 p-3">
                  <span className="font-bold">ચાલુ કુલ</span>
                  <span className="text-lg font-black text-saffron">{money(order.total)}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {order.table ? (
                    <button className="btn-soft min-w-0 px-2" onClick={() => navigate(`/orders/${order.table}?orderId=${order._id}`)}><Table2 size={17} /> <span className="truncate">વસ્તુઓ ઉમેરો</span></button>
                  ) : (
                    <button className="btn-soft min-w-0 px-2" onClick={() => setShowComposer(true)}><ShoppingBag size={17} /> <span className="truncate">નવો ઓર્ડર</span></button>
                  )}
                  <button className="btn-primary min-w-0 px-2" onClick={() => navigate(`/billing/${order._id}`)}><CreditCard size={17} /> <span className="truncate">બિલ</span></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-saffron">વેઇટર મોડ</p>
        <h1 className="text-3xl font-black">{tableId ? (existingOrderId ? 'ટેબલમાં વસ્તુઓ ઉમેરો' : 'ટેબલ ઓર્ડર') : 'Parcel order'}</h1>
      </div>
      <OrderComposer tableId={tableId} existingOrderId={existingOrderId} defaultType={tableId ? 'dine-in' : 'takeaway'} />
    </div>
  );
}
