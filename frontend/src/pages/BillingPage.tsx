import { useEffect, useState } from "react";
import {
  Download,
  MessageCircle,
  Printer,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Invoice, Order } from "../types";
import { money } from "../utils/format";
import { paymentLabel } from "../utils/gujarati";

type PaymentMethod = "cash" | "upi";
type PaymentMode = PaymentMethod | "partial";

export function BillingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDiscount = user?.role === "owner";
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [payments, setPayments] = useState<Record<PaymentMethod, number>>({
    cash: 0,
    upi: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState(0);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then((res) => {
      setOrder(res.data);

      setEditedItems(res.data.items);

      setPayments({
        cash: res.data.total,
        upi: 0,
      });
      setDiscountType(res.data.discountType || "fixed");
      setDiscountValue(res.data.discountValue || 0);
    });
  }, [orderId]);
  function updateItem(index: number, field: string, value: any) {
    const updated = [...editedItems];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setEditedItems(updated);
  }

  function removeItem(index: number) {
    const updated = editedItems.filter((_, i) => i !== index);

    setEditedItems(updated);
  }

  async function saveChanges() {
    if (!order) return;

    const payload = {
      items: editedItems,
      discountType: canDiscount ? discountType : order.discountType,
      discountValue: canDiscount ? discountValue : order.discountValue,
    };

    const { data } = await api.patch(`/orders/${orderId}`, payload);

    setOrder(data);

    setEditMode(false);

    toast.success("ઓર્ડર અપડેટ થયો");
  }
  async function bill() {
    if (!order) return;
    const paymentRows =
      paymentMode === "partial"
        ? Object.entries(payments)
            .filter(([, amount]) => amount > 0)
            .map(([method, amount]) => ({ method, amount }))
        : [{ method: paymentMode, amount: order.total }];
    const paid = paymentRows.reduce((sum, row) => sum + row.amount, 0);
    if (Math.abs(paid - order.total) > 0.5)
      return toast.error("પેમેન્ટ રકમ બિલના કુલ સાથે મળવી જોઈએ");
    const { data } = await api.post(`/invoices/order/${orderId}`, {
      sendWhatsApp: Boolean(order.customerMobile),
      paymentMode,
      payments: paymentRows,
    });
    setInvoice(data);
    setShowPayment(false);
    toast.success(`બિલ બન્યું. WhatsApp: ${data.whatsappStatus}`);
  }

  async function openPdf() {
    if (!invoice) return;
    const res = await api.get(`/invoices/${invoice._id}/pdf`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    window.open(url, "_blank");
  }

  if (!order)
    return <div className="glass rounded-lg p-8">બિલ લોડ થઈ રહ્યું છે...</div>;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="glass rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5 dark:border-white/10">
          <div>
            <p className="text-sm font-bold uppercase text-saffron">
              બિલ પૂર્વદર્શન
            </p>
            <h1 className="text-3xl font-black">
              રેસ્ટોરન્ટ બિલ
            </h1>
          </div>
          <div className="text-right">
            <p className="font-black">{order.tableName || order.type}</p>
            <p className="text-sm text-gray-500">
              {order.customerName || "Walk-in"} ·{" "}
              {order.customerMobile || "No mobile"}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {editedItems.map((item, index) => (
            <div
              key={item._id || item.name}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                {/* LEFT */}
                <div className="flex-1 space-y-3">
                  {/* ITEM NAME */}
                  {editMode ? (
                    <input
                      className="input w-full"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(index, "name", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-lg font-black">{item.name}</p>
                  )}

                  {/* NOTE */}
                  {editMode ? (
                    <input
                      className="input w-full"
                      placeholder="નોંધ ઉમેરો..."
                      value={item.note || ""}
                      onChange={(e) =>
                        updateItem(index, "note", e.target.value)
                      }
                    />
                  ) : item.note ? (
                    <p className="text-sm text-gray-500">{item.note}</p>
                  ) : null}
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-3">
                  {/* QUANTITY */}
                  <div className="w-24">
                    {editMode ? (
                      <input
                        className="input text-center"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value))
                        }
                      />
                    ) : (
                      <div className="rounded-lg bg-gray-100 px-4 py-3 text-center font-black dark:bg-white/10">
                        x{item.quantity}
                      </div>
                    )}
                  </div>

                  {/* PRICE */}
                  <div className="min-w-[90px] text-right">
                    <p className="text-lg font-black text-saffron">
                      {money(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* DELETE */}
                  {editMode && (
                    <button
                      className="btn-soft h-[48px] w-[48px] p-0"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-5 flex flex-wrap gap-3 mt-2">
          {!editMode ? (
            <button className="btn-soft" onClick={() => setEditMode(true)}>
              <Pencil size={17} />
              વસ્તુઓ સંપાદિત કરો
            </button>
          ) : (
            <>
              <button className="btn-primary" onClick={saveChanges}>
                <Save size={17} />
                ફેરફારો સાચવો
              </button>

              <button
                className="btn-soft"
                onClick={() => {
                  setEditedItems(order.items);
                  setEditMode(false);
                }}
              >
                <X size={17} />
                રદ કરો
              </button>
            </>
          )}
        </div>
        {canDiscount && editMode && (
          <div className="mb-5 grid gap-3 rounded-xl border border-saffron/20 bg-saffron/10 p-4 sm:grid-cols-[1fr_140px_140px]">
            <div>
              <p className="font-black">Owner discount</p>
              <p className="text-sm text-gray-500">Apply discount before bill confirmation.</p>
            </div>
            <select className="input" value={discountType} onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")}>
              <option value="fixed">Rs.</option>
              <option value="percentage">%</option>
            </select>
            <input className="input" type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
          </div>
        )}
        <div className="ml-auto mt-6 max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <span>સબટોટલ</span>
            <b>{money(order.subtotal)}</b>
          </div>
          <div className="flex justify-between">
            <span>ડિસ્કાઉન્ટ</span>
            <b>{money(order.discount)}</b>
          </div>
          <div className="flex justify-between">
            <span>Parcel charge</span>
            <b>{money(order.takeawayCharge ?? order.parcelCharge)}</b>
          </div>
          {order.gstEnabled && (
            <div className="flex justify-between">
              <span>GST</span>
              <b>{money(order.gst)}</b>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-3 text-xl dark:border-white/10">
            <span className="font-black">અંતિમ રકમ</span>
            <b>{money(order.total)}</b>
          </div>
        </div>
      </div>
      <aside className="glass h-fit rounded-lg p-5">
        <h2 className="text-xl font-black">બિલ ક્રિયાઓ</h2>
        <p className="mt-2 text-sm text-gray-500">
          PDF અને WhatsApp બિલ બનાવવા પહેલાં પેમેન્ટ પુષ્ટિ જરૂરી છે.
        </p>
        <button
          className="btn-primary mt-5 w-full"
          onClick={() => setShowPayment(true)}
          disabled={editMode}
        >
          <MessageCircle size={18} /> પેમેન્ટ અને બિલ બનાવો
        </button>
        {invoice && (
          <div className="mt-4 space-y-3">
            <button className="btn-soft w-full" onClick={openPdf}>
              <Download size={18} /> PDF ખોલો
            </button>
            <button className="btn-soft w-full" onClick={() => window.print()}>
              <Printer size={18} /> બિલ પ્રિન્ટ કરો
            </button>
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              {invoice.billNumber} · {invoice.whatsappStatus}
            </div>
            <button
              className="btn-primary w-full"
              onClick={() => navigate("/tables")}
            >
              ફ્લોર પર પાછા જાઓ
            </button>
          </div>
        )}
      </aside>

      {showPayment && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="glass w-full max-w-md rounded-lg p-5">
            <h2 className="text-xl font-black">પેમેન્ટ પુષ્ટિ કરો</h2>
            <p className="mt-1 text-sm text-gray-500">
              પેમેન્ટ પુષ્ટિ પછી જ બિલ બનશે.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["cash", "upi", "partial"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={
                    paymentMode === mode ? "btn-primary px-2" : "btn-soft px-2"
                  }
                  onClick={() => setPaymentMode(mode)}
                >
                  {paymentLabel(mode)}
                </button>
              ))}
            </div>
            {paymentMode === "partial" && (
              <div className="mt-4 grid gap-3">
                {(["cash", "upi"] as const).map((method) => (
                  <label key={method} className="block">
                    <span className="mb-1 block text-sm font-bold capitalize">
                      {paymentLabel(method)}
                    </span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={payments[method]}
                      onChange={(e) =>
                        setPayments({
                          ...payments,
                          [method]: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                ))}
                <p className="text-sm font-bold">
                  વિભાગિત કુલ:{" "}
                  {money(payments.cash + payments.upi)} /{" "}
                  {money(order.total)}
                </p>
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <button
                className="btn-soft flex-1"
                onClick={() => setShowPayment(false)}
              >
                રદ કરો
              </button>
              <button className="btn-primary flex-1" onClick={bill}>
                પુષ્ટિ કરો અને બિલ બનાવો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
