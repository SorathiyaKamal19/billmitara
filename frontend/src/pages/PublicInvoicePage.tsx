import { useEffect, useState } from "react";
import { Download, ReceiptText, Share2, Store, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { BillTotals } from "../components/BillTotals";
import { useLanguage } from "../context/LanguageContext";
import { formatBillDateTime, money } from "../utils/format";
import { paymentLabel } from "../utils/gujarati";

type PublicInvoice = {
  invoice: {
    billNumber: string;
    customerName?: string;
    customerMobile?: string;
    subtotal: number;
    discount?: number;
    discountReason?: string;
    takeawayCharge?: number;
    gstEnabled?: boolean;
    gstRate?: number;
    gst?: number;
    roundOff?: number;
    total: number;
    paymentMode?: "cash" | "upi" | "partial";
    payments?: { method: "cash" | "upi"; amount: number }[];
    pdfUrl?: string;
    publicUrl?: string;
    createdAt: string;
  };
  order: {
    type: "dine-in" | "takeaway";
    tableName?: string;
    items: { name: string; quantity: number; price: number; note?: string }[];
  };
  restaurant: {
    name: string;
    address?: string;
    phone?: string;
    gstNumber?: string;
    gstEnabled?: boolean;
    brandColor?: string;
  };
};

export function PublicInvoicePage() {
  const { code } = useParams();
  const { t } = useLanguage();
  const [bill, setBill] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/invoices/public/${code}`)
      .then((res) => {
        setBill(res.data);
        setNotFound(false);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  async function shareBill() {
    if (!bill) return;
    const shareUrl = bill.invoice.publicUrl || window.location.href;
    const shareText = `${bill.restaurant.name} invoice ${bill.invoice.billNumber} - ${money(bill.invoice.total)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${bill.restaurant.name} Invoice`,
          text: shareText,
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("બિલ લિંક કોપી થઈ", "Bill link copied"));
    } catch {
      toast.error(t("બિલ શેર કરી શકાયું નહીં", "Could not share bill"));
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 py-8">
        <div className="glass w-full max-w-md rounded-lg p-6 text-center">
          <ReceiptText className="mx-auto text-saffron" size={38} />
          <p className="mt-4 font-black">{t("ઇન્વોઇસ લોડ થઈ રહ્યું છે...", "Loading invoice...")}</p>
        </div>
      </main>
    );
  }

  if (notFound || !bill) {
    return (
      <main className="grid min-h-dvh place-items-center px-4 py-8">
        <div className="glass w-full max-w-md rounded-lg p-6 text-center">
          <XCircle className="mx-auto text-red-500" size={42} />
          <h1 className="mt-4 text-2xl font-black">{t("ઇન્વોઇસ મળ્યું નથી", "Invoice not found")}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("કૃપા કરીને QR કોડ તપાસો અથવા રેસ્ટોરન્ટને બિલ ફરી મોકલવા કહો.", "Please check the QR code or ask the restaurant to resend the bill.")}
          </p>
        </div>
      </main>
    );
  }

  const { invoice, order, restaurant } = bill;
  const paymentText = invoice.payments?.length
    ? invoice.payments
        .map((row) => `${paymentLabel(row.method)} ${money(row.amount)}`)
        .join(" + ")
    : invoice.paymentMode
      ? paymentLabel(invoice.paymentMode)
      : t("ચૂકવાયેલ", "Paid");
  const serviceLabel =
    order.type === "dine-in" ? order.tableName || t("ડાઇન-ઇન", "Dine-in") : t("ટેકઅવે", "Takeaway");

  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <section className="glass overflow-hidden rounded-lg">
          <div className="bg-gray-950 px-5 py-6 text-white sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase text-white/70">
                  <Store size={16} />
                  {t("ઇન્વોઇસ", "Invoice")}
                </div>
                <h1 className="mt-2 text-3xl font-black leading-tight">
                  {restaurant.name}
                </h1>
                {restaurant.address && (
                  <p className="mt-2 max-w-xl text-sm text-white/70">
                    {restaurant.address}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-white/60">{t("રકમ", "Amount")}</p>
                <p className="text-3xl font-black">{money(invoice.total)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-gray-200 px-5 py-5 text-sm dark:border-white/10 sm:grid-cols-2 sm:px-7">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                {t("ઇન્વોઇસ નં.", "Invoice No.")}
              </p>
              <p className="font-black">{invoice.billNumber}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase text-gray-500">{t("તારીખ", "Date")}</p>
              <p className="font-bold">{formatBillDateTime(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                {t("ગ્રાહક", "Customer")}
              </p>
              <p className="font-bold">{invoice.customerName || t("વૉક-ઇન", "Walk-in")}</p>
              {invoice.customerMobile && (
                <p className="text-gray-500">{invoice.customerMobile}</p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase text-gray-500">
                {t("સેવા", "Service")}
              </p>
              <p className="font-bold">{serviceLabel}</p>
              <p className="text-gray-500">{t("પેમેન્ટ", "Payment")}: {paymentText}</p>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
              <div className="grid grid-cols-[1fr_48px_78px] gap-2 border-b border-gray-200 px-4 py-3 text-xs font-black uppercase text-gray-500 dark:border-white/10">
                <span>{t("વસ્તુ", "Item")}</span>
                <span className="text-center">{t("જથ્થો", "Qty")}</span>
                <span className="text-right">{t("રકમ", "Amount")}</span>
              </div>
              {order.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="grid grid-cols-[1fr_48px_78px] gap-2 border-b border-gray-100 px-4 py-3 text-sm last:border-0 dark:border-white/10"
                >
                  <div className="min-w-0">
                    <p className="font-bold">{item.name}</p>
                    {item.note && (
                      <p className="mt-1 text-xs text-gray-500">{item.note}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {money(item.price)} {t("પ્રતિ વસ્તુ", "each")}
                    </p>
                  </div>
                  <div className="text-center font-bold">{item.quantity}</div>
                  <div className="text-right font-black">
                    {money(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <BillTotals
              className="bill-totals ml-auto mt-6 max-w-sm"
              subtotal={invoice.subtotal}
              discount={invoice.discount || 0}
              discountReason={invoice.discountReason}
              takeawayCharge={invoice.takeawayCharge || 0}
              gstEnabled={invoice.gstEnabled}
              gstRate={invoice.gstRate}
              gst={invoice.gst || 0}
              roundOff={invoice.roundOff || 0}
              total={invoice.total}
              totalLabel={t("ચૂકવેલી રકમ", "Amount paid")}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-5 dark:border-white/10 sm:flex-row sm:px-7">
            {invoice.pdfUrl && (
              <a
                className="btn-primary flex-1"
                href={invoice.pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={18} />
                {t("PDF ડાઉનલોડ કરો", "Download PDF")}
              </a>
            )}
            <button className="btn-soft flex-1" onClick={shareBill}>
              <Share2 size={18} />
              {t("બિલ શેર કરો", "Share Bill")}
            </button>
          </div>
        </section>

        <p className="py-5 text-center text-sm font-bold text-gray-500">
          {t("મુલાકાત બદલ આભાર. ફરી મુલાકાત લેજો!", "Thank you for visiting. Visit again!")}
        </p>
      </div>
    </main>
  );
}
