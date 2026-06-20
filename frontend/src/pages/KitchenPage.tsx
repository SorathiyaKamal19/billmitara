import { useEffect, useState } from "react";
import { CheckCircle2, Clock, History, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { OrderTimer } from "../components/OrderTimer";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSocket } from "../hooks/useSocket";
import { Order } from "../types";
import { formatOrderTime } from "../utils/format";

export function KitchenPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const socket = useSocket();
  const canUpdateKitchen = user?.role !== "waiter";

  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  async function load() {
    const [activeRes, historyRes] = await Promise.all([
      api.get("/orders?status=in-kitchen&limit=100"),
      api.get("/orders?kitchenHistory=today&limit=100"),
    ]);

    setOrders(activeRes.data);
    setHistory(historyRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onOrder = (order: Order) => {
      setOrders((current) =>
        [order, ...current.filter((row) => row._id !== order._id)].filter(
          (row) => row.status === "in-kitchen",
        ),
      );

      toast.success(t("નવો રસોડાનો ઓર્ડર", "New kitchen order"));
    };

    socket.on("order:new", onOrder);
    socket.on("order:updated", onOrder);

    return () => {
      socket.off("order:new", onOrder);
      socket.off("order:updated", onOrder);
    };
  }, [socket, t]);

  async function markReady(order: Order) {
    await api.patch(`/orders/${order._id}/status`, {
      status: "ready",
    });

    setOrders((rows) => rows.filter((row) => row._id !== order._id));
    setHistory((rows) => [{ ...order, status: "ready" }, ...rows]);
    toast.success(t("ઓર્ડર તૈયાર તરીકે માર્ક કર્યો", "Order marked ready"));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4 shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/30 dark:via-gray-900 dark:to-cyan-950/20 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t("શેફ સ્ક્રીન", "Chef Screen")}
            </p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {t("રસોડાના ઓર્ડર", "Kitchen Orders")}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <History size={17} />
              {t("ઇતિહાસ", "History")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order._id}
            className="glass flex h-[32rem] min-h-0 flex-col overflow-hidden rounded-xl border-emerald-100 p-0 shadow-sm dark:border-emerald-500/20 sm:h-[25rem]"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="min-w-0">
                <p className="truncate text-xl font-black sm:text-2xl">
                  {order.type === "dine-in"
                    ? order.tableName
                    : t("પાર્સલ ઓર્ડર", "Parcel order")}
                </p>
                <p className="mt-1 truncate text-sm text-gray-500">
                  {order.customerName || t("મહેમાન", "Guest")}
                  {order.customerMobile ? ` · ${order.customerMobile}` : ""}
                </p>
              </div>
              <StatusBadge value={order.type} />
            </div>

            <div className="shrink-0 border-b border-gray-200 bg-emerald-50/70 px-4 py-3 dark:border-white/10 dark:bg-emerald-500/10">
              <OrderTimer orderId={order._id} createdAt={order.createdAt} status={order.status} compact />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item._id || item.name}
                    className="rounded-lg border border-gray-100 bg-white/90 p-3 dark:border-white/10 dark:bg-white/10 sm:p-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-base font-black sm:text-lg">{item.name}</p>
                      <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-xl font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 sm:text-l">
                        x{item.quantity}
                      </span>
                    </div>
                    {item.note && (
                      <p className="mt-1 text-sm text-gray-500">{item.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {order.notes && (
              <div className="mx-4 mb-3 max-h-16 shrink-0 overflow-y-auto rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                {order.notes}
              </div>
            )}

            {canUpdateKitchen && (
              <button
                className="mx-4 mb-4 mt-auto inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                onClick={() => markReady(order)}
              >
                <CheckCircle2 size={18} />
                {t("તૈયાર તરીકે માર્ક કરો", "Mark Ready")}
              </button>
            )}
          </div>
        ))}

        {!orders.length && (
          <div className="glass rounded-xl border-emerald-100 p-10 text-center md:col-span-2 2xl:col-span-3">
            <Clock className="mx-auto text-emerald-500" />
            <p className="mt-3 font-black">{t("રસોડામાં કોઈ સક્રિય ઓર્ડર નથી", "No active kitchen orders")}</p>
          </div>
        )}
      </div>

      {historyOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setHistoryOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-full transform flex-col border-l border-emerald-100 bg-white shadow-2xl transition-transform duration-300 dark:border-emerald-500/20 dark:bg-[#111827] sm:max-w-md ${
          historyOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-xl font-black leading-tight sm:text-2xl">
              {t("રસોડાનો ઇતિહાસ", "Kitchen History")}
            </h2>
            <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
              {t("આજના પૂર્ણ થયેલા ઓર્ડર", "Today's completed orders")}
            </p>
          </div>

          <button
            onClick={() => setHistoryOpen(false)}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white p-2 text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-white/10 dark:text-emerald-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 pb-6 sm:p-5">
          {history.map((order) => (
            <div
              key={order._id}
              className="glass rounded-xl border-emerald-100 p-4 dark:border-emerald-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-base font-black leading-6">
                  {order.tableName || t("પાર્સલ ઓર્ડર", "Parcel order")}
                </p>
                <div className="shrink-0">
                  <StatusBadge value={order.status} />
                </div>
              </div>

              <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {formatOrderTime(order.createdAt)}
              </p>

              <div className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item._id || item.name}
                    className="flex items-start justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm dark:bg-white/5"
                  >
                    <span className="min-w-0 break-words font-semibold">{item.name}</span>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!history.length && (
            <div className="py-10 text-center">
              <History className="mx-auto text-emerald-500" size={40} />
              <p className="mt-3 font-bold text-gray-500">
                {t("રસોડાનો ઇતિહાસ ઉપલબ્ધ નથી", "No kitchen history available")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
