import { useEffect, useState } from 'react';
import { ArrowLeft, Ban, CreditCard, PlusCircle, RefreshCw, Utensils } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { BillTotals } from '../components/BillTotals';
import { CancelOrderDialog } from '../components/CancelOrderDialog';
import { StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { Order } from '../types';
import { money, shortDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { hasModulePermission } from '../utils/permissions';

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const canOpenTables = hasModulePermission(user, 'tables');
  const canOpenOrders = hasModulePermission(user, 'orders');
  const canOpenBilling = hasModulePermission(user, 'billing');
  const [order, setOrder] = useState<Order | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  async function load() {
    const { data } = await api.get(`/orders/${orderId}`);
    setOrder(data);
  }

  useEffect(() => { load(); }, [orderId]);

  if (!order) {
    return (
      <div className="glass rounded-lg p-8">
        {t('ઓર્ડર લોડ થઈ રહ્યો છે...', 'Loading order...')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">
            {t('ટેબલ ઓર્ડરની વિગતો', 'Table order details')}
          </p>
          <h1 className="text-3xl font-black">
            {order.tableName || t('પાર્સલ', 'Parcel')} {t('હાલનો ઓર્ડર', 'Current order')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {shortDate(order.createdAt)} · {order.customerName || t('વૉક-ઇન', 'Walk-in')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canOpenTables && (
            <button className="btn-soft" onClick={() => navigate('/tables')}>
              <ArrowLeft size={17} /> {t('ટેબલ', 'Tables')}
            </button>
          )}
          <button className="btn-soft" onClick={load}>
            <RefreshCw size={17} /> {t('રિફ્રેશ', 'Refresh')}
          </button>
          {order.table && canOpenOrders && (
            <button className="btn-soft" onClick={() => navigate(`/orders/${order.table}?orderId=${order._id}`)}>
              <PlusCircle size={17} /> {t('વસ્તુઓ ઉમેરો', 'Add items')}
            </button>
          )}
          <button
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            onClick={() => setShowCancelDialog(true)}
          >
            <Ban size={17} /> {t('રદ કરો', 'Cancel')}
          </button>
          {canOpenBilling && (
            <button className="btn-primary" onClick={() => navigate(`/billing/${order._id}`)}>
              <CreditCard size={17} /> {t('બિલ બનાવો', 'Generate bill')}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">
              {t('ઓર્ડર કરેલી વસ્તુઓ', 'Ordered items')}
            </h2>
            <StatusBadge value={order.status} />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {order.items.map((item) => (
              <div className="grid grid-cols-[1fr_70px_100px] gap-3 py-4 text-sm" key={item._id || item.name}>
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.category || t('વસ્તુ', 'Item')} {item.note ? `· ${item.note}` : ''}
                  </p>
                </div>
                <p className="text-right text-lg font-black">x{item.quantity}</p>
                <p className="text-right font-black">{money(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="glass h-fit rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-saffron/10 text-saffron">
              <Utensils size={21} />
            </div>
            <div>
              <p className="font-black">{order.type}</p>
              <p className="text-sm text-gray-500">
                {order.customerMobile || t('મોબાઇલ ઉમેર્યો નથી', 'Mobile not added')}
              </p>
            </div>
          </div>
          <BillTotals
            className="mt-5"
            subtotal={order.subtotal}
            discount={order.discount}
            discountReason={order.discountReason}
            takeawayCharge={order.takeawayCharge ?? order.parcelCharge}
            gstEnabled={order.gstEnabled}
            gstRate={order.gstRate}
            gst={order.gst}
            roundOff={order.roundOff}
            total={order.total}
            totalLabel={t('ચાલુ કુલ', 'Running total')}
          />
        </aside>
      </div>
      {showCancelDialog && (
        <CancelOrderDialog
          orderId={order._id}
          orderLabel={order.tableName || t('પાર્સલ ઓર્ડર', 'Parcel order')}
          onClose={() => setShowCancelDialog(false)}
          onCancelled={() => navigate(order.table ? '/tables' : '/orders')}
        />
      )}
    </div>
  );
}
