import { useEffect, useState } from "react";
import { CheckCircle2, Clock, History, X } from "lucide-react";

import toast from "react-hot-toast";

import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { Order } from "../types";

const labels = {
  chefScreen: "શેફ સ્ક્રીન",
  kitchenOrders: "રસોડાના ઓર્ડર",
  history: "ઇતિહાસ",
  takeawayOrder: "Parcel order",
  guest: "મહેમાન",
  markReady: "તૈયાર તરીકે માર્ક કરો",
  noActiveOrders: "રસોડામાં કોઈ સક્રિય ઓર્ડર નથી",
  kitchenHistory: "રસોડાનો ઇતિહાસ",
  todaysCompletedOrders: "આજના પૂર્ણ થયેલા ઓર્ડર",
  noKitchenHistory: "રસોડાનો ઇતિહાસ ઉપલબ્ધ નથી",
  newKitchenOrder: "નવો રસોડાનો ઓર્ડર",
  orderMarkedReady: "ઓર્ડર તૈયાર તરીકે માર્ક કર્યો",
};

export function KitchenPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const canUpdateKitchen = user?.role !== "waiter";

  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const text = labels;

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

      toast.success(labels.newKitchenOrder);
    };

    socket.on("order:new", onOrder);
    socket.on("order:updated", onOrder);

    return () => {
      socket.off("order:new", onOrder);
      socket.off("order:updated", onOrder);
    };
  }, [socket]);

  async function markReady(order: Order) {
    await api.patch(`/orders/${order._id}/status`, {
      status: "ready",
    });

    setOrders((rows) => rows.filter((row) => row._id !== order._id));

    setHistory((rows) => [{ ...order, status: "ready" }, ...rows]);

    toast.success(text.orderMarkedReady);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4 shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/30 dark:via-gray-900 dark:to-cyan-950/20 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {text.chefScreen}
            </p>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {text.kitchenOrders}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <History size={17} />
              {text.history}
            </button>
          </div>
        </div>
      </div>

      {/* ORDERS */}

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
                    : text.takeawayOrder}
                </p>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {order.customerName || text.guest}

                  {order.customerMobile ? ` · ${order.customerMobile}` : ""}
                </p>
              </div>

              <StatusBadge value={order.type} />
            </div>

            {/* ITEMS */}

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item._id || item.name}
                    className="rounded-lg border border-gray-100 bg-white/90 p-3 dark:border-white/10 dark:bg-white/10 sm:p-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-base font-black sm:text-lg">
                        {item.name}
                      </p>

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

            {/* NOTES */}

            {order.notes && (
              <div className="mx-4 mb-3 max-h-16 shrink-0 overflow-y-auto rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                {order.notes}
              </div>
            )}

            {/* BUTTON */}

            {canUpdateKitchen && (
              <button
                className="mx-4 mb-4 mt-auto inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                onClick={() => markReady(order)}
              >
                <CheckCircle2 size={18} />
                {text.markReady}
              </button>
            )}
          </div>
        ))}

        {!orders.length && (
          <div className="glass rounded-xl border-emerald-100 p-10 text-center md:col-span-2 2xl:col-span-3">
            <Clock className="mx-auto text-emerald-500" />

            <p className="mt-3 font-black">{text.noActiveOrders}</p>
          </div>
        )}
      </div>

      {/* OVERLAY */}

      {historyOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setHistoryOpen(false)}
        />
      )}

      {/* HISTORY SIDEBAR */}

      <div
        className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-full transform flex-col border-l border-emerald-100 bg-white shadow-2xl transition-transform duration-300 dark:border-emerald-500/20 dark:bg-[#111827] sm:max-w-md ${
          historyOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-xl font-black leading-tight sm:text-2xl">
              {text.kitchenHistory}
            </h2>

            <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
              {text.todaysCompletedOrders}
            </p>
          </div>

          <button
            onClick={() => setHistoryOpen(false)}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white p-2 text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-white/10 dark:text-emerald-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* HISTORY LIST */}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 pb-6 sm:p-5">
          {history.map((order) => (
            <div
              key={order._id}
              className="glass rounded-xl border-emerald-100 p-4 dark:border-emerald-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-base font-black leading-6">
                  {order.tableName || text.takeawayOrder}
                </p>

                <div className="shrink-0">
                  <StatusBadge value={order.status} />
                </div>
              </div>

              <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>

              <div className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item._id || item.name}
                    className="flex items-start justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm dark:bg-white/5"
                  >
                    <span className="min-w-0 break-words font-semibold">
                      {item.name}
                    </span>

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
                {text.noKitchenHistory}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
