import { useEffect, useState } from "react";
import {
  Download,
  MessageCircle,
  Printer,
  Pencil,
  Trash2,
  Save,
  X,
  ExternalLink,
  QrCode,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { BillTotals } from "../components/BillTotals";
import { DiscountFields } from "../components/DiscountFields";
import { Invoice, Order, Restaurant } from "../types";
import { formatBillDateTime } from "../utils/format";
import { money } from "../utils/format";
import { paymentLabel } from "../utils/gujarati";

type PaymentMethod = "cash" | "upi";
type PaymentMode = PaymentMethod | "partial";

export function BillingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const canDiscount = user?.role === "owner";
  const [restaurant, setRestaurant] = useState<Partial<Restaurant>>(
    user?.restaurant || {}
  );
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
  const [discountReason, setDiscountReason] = useState("");
  const [billingMobile, setBillingMobile] = useState("");

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
      setDiscountReason(res.data.discountReason || "");
      setBillingMobile(res.data.customerMobile || "");
    });
  }, [orderId]);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setRestaurant(res.data))
      .catch(() => setRestaurant(user?.restaurant || {}));
  }, [user?.restaurant]);

  function updateItem(index: number, field: string, value: any) {
    const updated = [...editedItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setEditedItems(updated);
  }

  function removeItem(index: number) {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  }

  async function saveChanges() {
    if (!order) return;

    const payload = {
      items: editedItems,
      discountType: canDiscount ? discountType : order.discountType,
      discountValue: canDiscount ? discountValue : order.discountValue,
      discountReason: canDiscount ? discountReason.trim() : order.discountReason,
      customerMobile: billingMobile.trim(),
    };

    const { data } = await api.patch(`/orders/${orderId}`, payload);
    setOrder(data);
    setBillingMobile(data.customerMobile || "");
    setEditMode(false);
    toast.success(t("ઓર્ડર અપડેટ થયો", "Order updated"));
  }

  async function bill() {
    if (!order) return;
    const mobile = billingMobile.trim();
    if (!mobile) return toast.error(t("બિલ પૂર્ણ કરવા માટે મોબાઇલ નંબર જરૂરી છે", "Customer mobile is required to finalize the bill"));
    const paymentRows =
      paymentMode === "partial"
        ? Object.entries(payments)
            .filter(([, amount]) => amount > 0)
            .map(([method, amount]) => ({ method, amount }))
        : [{ method: paymentMode, amount: order.total }];
    const paid = paymentRows.reduce((sum, row) => sum + row.amount, 0);
    if (Math.abs(paid - order.total) > 0.5)
      return toast.error(t("પેમેન્ટ રકમ બિલના કુલ સાથે મળવી જોઈએ", "Payment amount must match bill total"));
    try {
      const { data } = await api.post(`/invoices/order/${orderId}`, {
        sendWhatsApp: true,
        paymentMode,
        payments: paymentRows,
        customerMobile: mobile,
      });
      setInvoice(data);
      setShowPayment(false);
      if (data.whatsappShareUrl) {
        window.open(data.whatsappShareUrl, "_blank", "noopener,noreferrer");
      }
      const whatsappMessage = data.whatsappStatus === "failed" && data.whatsappReason
        ? `WhatsApp failed: ${data.whatsappReason}`
        : data.whatsappShareUrl
          ? "WhatsApp opened"
        : `WhatsApp: ${data.whatsappStatus}`;
      toast.success(`${t("બિલ બન્યું", "Bill generated")}. ${whatsappMessage}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("બિલ બનાવી શકાયું નહીં", "Could not generate bill"));
    }
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
    return <div className="glass rounded-lg p-8">{t("બિલ લોડ થઈ રહ્યું છે...", "Loading bill...")}</div>;

  const billDate = invoice?.createdAt || order.createdAt;
  const billNumber = invoice?.billNumber || t("Draft bill", "Draft bill");
  const guestName = order.customerName || t("વૉક-ઇન", "Walk-in");
  const guestMobile = billingMobile || t("મોબાઇલ નથી", "No mobile");
  const serviceLabel =
    order.type === "dine-in"
      ? order.tableName || t("Dine-in", "Dine-in")
      : t("Takeaway", "Takeaway");
  const paymentText = invoice?.payments?.length
    ? invoice.payments
        .map((row) => `${paymentLabel(row.method)} ${money(row.amount)}`)
        .join(" + ")
    : invoice?.paymentMode
      ? paymentLabel(invoice.paymentMode)
      : t("Pending", "Pending");

  return (
    <div className="billing-page grid gap-6 xl:grid-cols-[1fr_360px]">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm 12mm;
          }
          html, body {
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          .print-bill, .print-bill * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
          .print-bill {
            position: absolute;
            inset: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
            color: #111 !important;
            font-family: Georgia, "Times New Roman", serif;
          }
          .print-bill .text-saffron {
            color: #92400e !important;
          }
          .print-bill p,
          .print-bill h1,
          .print-bill span,
          .print-bill div {
            color: #111 !important;
          }
          .print-bill .text-gray-500,
          .print-bill .text-gray-600 {
            color: #555 !important;
          }
          .print-bill .print-items {
            border: 1px solid #222 !important;
            border-radius: 4px !important;
            box-shadow: none !important;
          }
          .print-bill .print-items > div {
            border-color: #ddd !important;
          }
          .print-bill .print-items > div:first-child {
            background: #f3f3f3 !important;
            border-bottom: 1px solid #222 !important;
          }
          .print-bill .bill-totals {
            border-top: 2px dashed #222 !important;
            padding-top: 14px !important;
          }
          .print-bill .border-dashed {
            border-color: #999 !important;
          }
        }
      `}</style>
      <div className="print-bill glass rounded-lg p-6">
        <div className="border-b border-dashed border-gray-300 pb-5 text-center dark:border-white/20">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-saffron">
            {t("Tax Invoice", "Tax Invoice")}
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight">
            {restaurant.name || user?.restaurant?.name || "BillMitara"}
          </h1>
          {restaurant.address && (
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-300">
              {restaurant.address}
            </p>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
            {restaurant.phone && <span>{restaurant.phone}</span>}
            {restaurant.gstEnabled && restaurant.gstNumber && (
              <span>GSTIN: {restaurant.gstNumber}</span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">
              {t("Bill No.", "Bill No.")}
            </p>
            <p className="font-black">{billNumber}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase text-gray-500">
              {t("Date", "Date")}
            </p>
            <p className="font-bold">{formatBillDateTime(billDate)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">
              {t("Customer", "Customer")}
            </p>
            <p className="font-bold">{guestName}</p>
            <p className="text-gray-500">{guestMobile}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase text-gray-500">
              {t("Service", "Service")}
            </p>
            <p className="font-bold">{serviceLabel}</p>
            <p className="text-gray-500">
              {t("Payment", "Payment")}: {paymentText}
            </p>
          </div>
        </div>

        <div className="no-print flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5 pt-6 dark:border-white/10">
          <div>
            <p className="text-sm font-bold uppercase text-saffron">
              {t("બિલ પૂર્વદર્શન", "Invoice Preview")}
            </p>
            <h1 className="text-3xl font-black">{t("રેસ્ટોરન્ટ બિલ", "Restaurant bill")}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatBillDateTime(order.createdAt)}
            </p>
          </div>
          {/* <div className="text-right">
            <p className="font-black">{order.tableName || order.type}</p>
            <p className="text-sm text-gray-500">
              {order.customerName || t("વૉક-ઇન", "Walk-in")} ·{" "}
              {billingMobile || t("મોબાઇલ નથી", "No mobile")}
            </p>
          </div> */}
        </div>
        <div className="print-items mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
          <div className="grid grid-cols-[1fr_48px_72px_90px] gap-2 border-b border-gray-200 px-4 py-3 text-xs font-black uppercase text-gray-500 dark:border-white/10">
            <span>{t("Item", "Item")}</span>
            <span className="text-center">{t("Qty", "Qty")}</span>
            <span className="text-right">{t("Rate", "Rate")}</span>
            <span className="text-right">{t("Amount", "Amount")}</span>
          </div>
          {editedItems.map((item, index) => (
            <div
              key={item._id || `${item.name}-${index}`}
              className="grid grid-cols-[1fr_48px_72px_90px] gap-2 border-b border-gray-100 px-4 py-3 text-sm last:border-0 dark:border-white/10"
            >
              <div className="min-w-0">
                <p className="font-bold">{item.name}</p>
                {item.note ? (
                  <p className="mt-1 text-xs text-gray-500">{item.note}</p>
                ) : null}
              </div>
              <div className="text-center font-bold">{item.quantity}</div>
              <div className="text-right">{money(item.price)}</div>
              <div className="text-right font-black">
                {money(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="no-print mt-5 space-y-4">
          {editedItems.map((item, index) => (
            <div
              key={item._id || item.name}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="flex-1 space-y-3">
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
                  {editMode ? (
                    <input
                      className="input w-full"
                      placeholder={t("નોંધ ઉમેરો...", "Add note...")}
                      value={item.note || ""}
                      onChange={(e) =>
                        updateItem(index, "note", e.target.value)
                      }
                    />
                  ) : item.note ? (
                    <p className="text-sm text-gray-500">{item.note}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
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
                  <div className="min-w-[90px] text-right">
                    <p className="text-lg font-black text-saffron">
                      {money(item.price * item.quantity)}
                    </p>
                  </div>
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
        <div className="no-print mb-5 mt-2 flex flex-wrap gap-3">
          {!editMode ? (
            <button className="btn-soft" onClick={() => setEditMode(true)}>
              <Pencil size={17} />
              {t("વસ્તુઓ સંપાદિત કરો", "Edit items")}
            </button>
          ) : (
            <>
              <button className="btn-primary" onClick={saveChanges}>
                <Save size={17} />
                {t("ફેરફારો સાચવો", "Save changes")}
              </button>
              <button
                className="btn-soft"
                onClick={() => {
                  setEditedItems(order.items);
                  setDiscountType(order.discountType || "fixed");
                  setDiscountValue(order.discountValue || 0);
                  setDiscountReason(order.discountReason || "");
                  setEditMode(false);
                }}
              >
                <X size={17} />
                {t("રદ કરો", "Cancel")}
              </button>
            </>
          )}
        </div>
        {canDiscount && editMode && (
          <div className="no-print mb-5">
            <DiscountFields
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
          className="bill-totals ml-auto mt-6 max-w-sm"
          subtotal={order.subtotal}
          discount={order.discount}
          discountReason={order.discountReason}
          takeawayCharge={order.takeawayCharge ?? order.parcelCharge}
          gstEnabled={order.gstEnabled}
          gstRate={order.gstRate}
          gst={order.gst}
          roundOff={order.roundOff}
          total={order.total}
          totalLabel={t("અંતિમ રકમ", "Final amount")}
        />
        <div className="mt-6 border-t border-dashed border-gray-300 pt-4 text-center text-xs text-gray-500 dark:border-white/20">
          <p className="font-bold text-gray-700 dark:text-gray-200">
            {t("Thank you. Please visit again.", "Thank you. Please visit again.")}
          </p>
          <p className="mt-1">{t("Powered by BillMitara", "Powered by BillMitara")}</p>
        </div>
      </div>
      <aside className="no-print glass h-fit rounded-lg p-5">
        <h2 className="text-xl font-black">{t("બિલ ક્રિયાઓ", "Bill actions")}</h2>
        <p className="mt-2 text-sm text-gray-500">
          {t("PDF અને WhatsApp બિલ બનાવવા પહેલાં પેમેન્ટ અને મોબાઇલ નંબર જરૂરી છે.", "Payment and mobile number are required before PDF and WhatsApp bill generation.")}
        </p>
        <button
          className="btn-primary mt-5 w-full"
          onClick={() => setShowPayment(true)}
          disabled={editMode}
        >
          <MessageCircle size={18} /> {t("પેમેન્ટ અને બિલ બનાવો", "Payment & Generate")}
        </button>
        {invoice && (
          <div className="mt-4 space-y-3">
            {invoice.whatsappShareUrl && (
              <a
                className="btn-primary w-full"
                href={invoice.whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} /> {t("Send WhatsApp", "Send WhatsApp")}
              </a>
            )}
            <button className="btn-soft w-full" onClick={openPdf}>
              <Download size={18} /> {t("PDF ખોલો", "Open PDF")}
            </button>
            {invoice.publicUrl && (
              <a
                className="btn-soft w-full"
                href={invoice.publicUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={18} /> {t("Customer bill page", "Customer bill page")}
              </a>
            )}
            {invoice.qrDataUrl && (
              <div className="border-t border-gray-200 pt-4 text-center dark:border-white/10">
                <p className="text-sm font-black">
                  {t("Scan to view invoice", "Scan to view invoice")}
                </p>
                <img
                  src={invoice.qrDataUrl}
                  alt="Invoice QR"
                  className="mx-auto mt-3 size-48 rounded-lg bg-white p-3"
                />
                <p className="mt-2 break-all text-xs font-semibold text-gray-500">
                  {invoice.publicUrl}
                </p>
              </div>
            )}
            {!invoice.qrDataUrl && invoice.publicUrl && (
              <div className="border-t border-gray-200 pt-4 text-center dark:border-white/10">
                <QrCode className="mx-auto text-gray-400" size={42} />
                <p className="mt-2 break-all text-xs font-semibold text-gray-500">
                  {invoice.publicUrl}
                </p>
              </div>
            )}
            <button className="btn-soft w-full" onClick={() => window.print()}>
              <Printer size={18} /> {t("બિલ પ્રિન્ટ કરો", "Print bill")}
            </button>
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              {invoice.billNumber} · {invoice.whatsappStatus}
            </div>
            <button
              className="btn-primary w-full"
              onClick={() => navigate("/tables")}
            >
              {t("ફ્લોર પર પાછા જાઓ", "Back to floor")}
            </button>
          </div>
        )}
      </aside>

      {showPayment && (
        <div className="fixed inset-0 left-0 top-0 z-[100] grid h-dvh w-screen place-items-center overflow-y-auto bg-gray-950/70 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-white/70 bg-white p-5 shadow-2xl ring-1 ring-gray-950/5 dark:border-white/10 dark:bg-gray-950 dark:ring-white/10">
            <h2 className="text-xl font-black">{t("પેમેન્ટ પુષ્ટિ કરો", "Confirm payment")}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("પેમેન્ટ પુષ્ટિ પછી જ બિલ બનશે.", "Bill generates only after payment confirmation.")}
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-bold">
                {t("ગ્રાહકનું મોબાઇલ", "Customer mobile")} *
              </span>
              <input
                className="input"
                placeholder={t("10 અંકનો મોબાઇલ નંબર", "10-digit mobile number")}
                value={billingMobile}
                onChange={(e) => setBillingMobile(e.target.value)}
                required
              />
            </label>
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
                  {t("વિભાગિત કુલ", "Split total")}: {money(payments.cash + payments.upi)} /{" "}
                  {money(order.total)}
                </p>
              </div>
            )}
            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
              <button
                className="btn-soft"
                onClick={() => setShowPayment(false)}
              >
                {t("રદ કરો", "Cancel")}
              </button>
              <button className="btn-primary" onClick={bill}>
                {t("પુષ્ટિ કરો અને બિલ બનાવો", "Confirm & Bill")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
