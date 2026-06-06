import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Clock, IndianRupee, ReceiptText, ShoppingBag, Table2, Users } from 'lucide-react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { money, shortDate } from '../utils/format';
import { useSocket } from '../hooks/useSocket';

export function DashboardPage() {
  const socket = useSocket();
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('today');

  async function load() {
    const res = await api.get(`/analytics/dashboard?period=${period}`);
    setData(res.data);
  }

  useEffect(() => { load(); }, [period]);
  useEffect(() => {
    socket.on('order:updated', load);
    socket.on('invoice:created', load);
    return () => {
      socket.off('order:updated', load);
      socket.off('invoice:created', load);
    };
  }, [socket]);

  const trend = data?.salesTrend?.map((row: any) => ({ date: row._id.slice(5), revenue: row.revenue, orders: row.orders })) || [];
  const peak = data?.peakHours?.map((row: any) => ({ hour: `${row._id}:00`, orders: row.orders })) || [];
  const payments = data?.paymentStats?.map((row: any) => ({ name: row._id, value: row.amount })) || [];
  const mainColor = 'rgb(var(--app-main-color-rgb))';
  const colors = [mainColor, '#10b981', '#0ea5e9', '#7c3aed'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">માલિક પેનલ</p>
          <h1 className="text-3xl font-black tracking-tight">વ્યવસાય વિશ્લેષણ</h1>
        </div>
        <select className="input w-48" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">આજે</option>
          <option value="yesterday">ગઈકાલે</option>
          <option value="this_week">આ અઠવાડિયું</option>
          <option value="last_week">ગયા અઠવાડિયે</option>
          <option value="last_month">ગયા મહિને</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="કુલ આવક" value={money(data?.revenue)} icon={IndianRupee} accent={mainColor} />
        <StatCard label="આજના ઓર્ડર" value={String(data?.orders || 0)} icon={ReceiptText} accent="#10b981" />
        <StatCard label="Parcel orders" value={String(data?.takeawayOrders || data?.parcelOrders || 0)} icon={ShoppingBag} accent="#7c3aed" />
        <StatCard label="ટેબલ ઓર્ડર" value={String(data?.dineInOrders || 0)} icon={Table2} accent="#0ea5e9" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">વેચાણ ટ્રેન્ડ</h2><Clock size={18} /></div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs><linearGradient id="sales" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor={mainColor} stopOpacity={0.5} /><stop offset="95%" stopColor={mainColor} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => money(Number(value))} />
                <Area dataKey="revenue" stroke={mainColor} fill="url(#sales)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass flex h-97 flex-col rounded-lg p-5">
          <h2 className="shrink-0 text-lg font-black">સૌથી વધુ વેચાતી વસ્તુઓ</h2>
          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {data?.topItems?.map((item: any, index: number) => (
              <div className="flex items-center justify-between rounded-lg bg-white/70 p-3 dark:bg-white/10" key={item._id}>
                <div><p className="font-bold">{index + 1}. {item._id}</p><p className="text-xs text-gray-500">{item.quantity} વેચાયા</p></div>
                <p className="font-black">{money(item.revenue)}</p>
              </div>
            ))}
            {!data?.topItems?.length && (
              <div className="py-10 text-center text-sm font-bold text-gray-500">No top selling items yet.</div>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="glass rounded-lg p-5">
          <h2 className="text-lg font-black">વ્યસ્ત સમય</h2>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={peak}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" /><YAxis /><Tooltip /><Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="glass rounded-lg p-5">
          <h2 className="text-lg font-black">પેમેન્ટ વસૂલાત</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payments} dataKey="value" nameKey="name" outerRadius={90} label>
                  {payments.map((_: any, index: number) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => money(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm font-bold text-gray-500">વિભાગિત પેમેન્ટ: {data?.partialPayments || 0}</p>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="glass flex h-96 flex-col rounded-lg p-5">
          <div className="flex shrink-0 items-center justify-between"><h2 className="text-lg font-black">તાજેતરના બિલ</h2><Users size={18} /></div>
          <div className="mt-4 min-h-0 flex-1 divide-y divide-gray-200 overflow-y-auto pr-1 dark:divide-white/10">
            {data?.recentBills?.map((bill: any) => (
              <div className="flex items-center justify-between py-3" key={bill._id}>
                <div><p className="font-bold">{bill.billNumber}</p><p className="text-xs text-gray-500">{shortDate(bill.createdAt)}</p></div>
                <p className="font-black">{money(bill.total)}</p>
              </div>
            ))}
            {!data?.recentBills?.length && (
              <div className="py-10 text-center text-sm font-bold text-gray-500">No recent bills yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
