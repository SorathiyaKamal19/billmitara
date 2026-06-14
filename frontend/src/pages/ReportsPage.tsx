import { useEffect, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  IndianRupee,
  Pencil,
  ReceiptIndianRupee,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { StatCard } from "../components/StatCard";
import { Invoice } from "../types";
import { money, shortDate } from "../utils/format";
import { paymentLabel } from "../utils/gujarati";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

export function ReportsPage() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editModal, setEditModal] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed",
  );

  const [discountValue, setDiscountValue] = useState(0);

  const [reason, setReason] = useState("");
  useEffect(() => {
    api.get("/invoices").then((res) => setInvoices(res.data));
  }, []);
  const total = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const gst = invoices.reduce((sum, invoice) => sum + invoice.gst, 0);

  async function exportExcel() {
    const res = await api.get("/invoices/export.xlsx", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "poss-sales-report.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  function editInvoice(invoice: Invoice) {
    setSelectedInvoice(invoice);

    setDiscountType("fixed");

    setDiscountValue(0);

    setReason(t("માલિક સુધારો", "Owner correction"));

    setEditModal(true);
  }

  async function saveInvoiceEdit() {
    if (!selectedInvoice) return;

    await api.patch(`/invoices/${selectedInvoice._id}`, {
      discountType,
      discountValue,
      reason,
    });

    const res = await api.get("/invoices");

    setInvoices(res.data);

    setEditModal(false);

    toast.success(t("ઇન્વોઇસ સફળતાપૂર્વક અપડેટ થયું", "Invoice updated successfully"));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">
            {t("રિપોર્ટ", "Reports")}
          </p>
          <h1 className="text-3xl font-black">{t("વેચાણ અને GST રિપોર્ટ", "Sales & GST reports")}</h1>
        </div>
        <button className="btn-primary" onClick={exportExcel}>
          <FileSpreadsheet size={18} /> {t("Excel એક્સપોર્ટ કરો", "Export Excel")}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={t("આવક", "Revenue")}
          value={money(total)}
          icon={IndianRupee}
          accent="rgb(var(--app-main-color-rgb))"
        />
        <StatCard
          label={t("GST વસૂલાત", "GST Collected")}
          value={money(gst)}
          icon={ReceiptIndianRupee}
          accent="#10b981"
        />
        <StatCard
          label={t("બિલ", "Bills")}
          value={String(invoices.length)}
          icon={Download}
          accent="#7c3aed"
        />
      </div>
      <div className="glass overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/70 dark:bg-white/10">
              <tr>
                <th className="p-4">{t("બિલ", "Bill")}</th>
                <th>{t("ગ્રાહક", "Customer")}</th>
                <th>GST</th>
                <th>{t("કુલ", "Total")}</th>
                <th>{t("પેમેન્ટ", "Payment")}</th>
                <th>WhatsApp</th>
                <th>{t("તારીખ", "Date")}</th>
                <th>{t("સંપાદન", "Edit")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  className="border-t border-gray-200 dark:border-white/10"
                  key={invoice._id}
                >
                  <td className="p-4 font-bold">{invoice.billNumber}</td>
                  <td>{invoice.customerName || t("વૉક-ઇન", "Walk-in")}</td>
                  <td>{money(invoice.gst)}</td>
                  <td className="font-black">{money(invoice.total)}</td>
                  <td>{paymentLabel(invoice.paymentMode)}</td>
                  <td>{invoice.whatsappStatus}</td>
                  <td>{shortDate(invoice.createdAt)}</td>
                  <td>
                    <button
                      className="flex items-center gap-2 rounded-xl bg-saffron px-4 py-2 text-sm font-bold text-white transition hover:scale-105"
                      onClick={() => editInvoice(invoice)}
                    >
                      <Pencil size={15} />
                      {t("સંપાદિત કરો", "Edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editModal && selectedInvoice && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            onClick={() => setEditModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 flex h-screen w-full flex-col bg-white shadow-2xl dark:bg-slate-900 md:w-[450px]">
            {/* Header */}
            <div className="border-b border-gray-200 p-5 dark:border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-saffron">
                    {t("ઇન્વોઇસ એડિટર", "Invoice Editor")}
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {selectedInvoice.billNumber}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedInvoice.customerName || t("વૉક-ઇન ગ્રાહક", "Walk-in Customer")}
                  </p>
                </div>

                <button
                  onClick={() => setEditModal(false)}
                  className="rounded-xl bg-gray-100 p-2 transition hover:bg-gray-200 dark:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-saffron/5 p-4 dark:bg-saffron/10">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    {t("હાલનું કુલ", "Current Total")}
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-saffron">
                    {money(selectedInvoice.total)}
                  </h3>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    GST
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-emerald-600">
                    {money(selectedInvoice.gst)}
                  </h3>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    {t("પેમેન્ટ", "Payment")}
                  </p>

                  <h3 className="mt-2 text-lg font-black capitalize">
                    {paymentLabel(selectedInvoice.paymentMode)}
                  </h3>
                </div>
              </div>

              {/* Form */}
              <div className="mt-6 space-y-5">
                {/* Discount Type */}
                <div>
                  <label className="mb-3 block text-sm font-bold">
                    {t("ડિસ્કાઉન્ટ પ્રકાર", "Discount Type")}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDiscountType("fixed")}
                      className={`rounded-2xl border p-4 font-bold transition ${
                        discountType === "fixed"
                          ? "border-saffron bg-saffron text-white"
                          : "border-gray-200 dark:border-white/10"
                      }`}
                    >
                      {t("₹ નિશ્ચિત રકમ", "₹ Fixed Amount")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDiscountType("percentage")}
                      className={`rounded-2xl border p-4 font-bold transition ${
                        discountType === "percentage"
                          ? "border-saffron bg-saffron text-white"
                          : "border-gray-200 dark:border-white/10"
                      }`}
                    >
                      {t("% ટકા", "% Percentage")}
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("ડિસ્કાઉન્ટ મૂલ્ય", "Discount Value")}
                  </label>

                  <input
                    className="input h-12"
                    type="number"
                    placeholder={t("ડિસ્કાઉન્ટ મૂલ્ય દાખલ કરો", "Enter discount value")}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    {t("સંપાદનનું કારણ", "Reason For Edit")}
                  </label>

                  <textarea
                    className="input min-h-[120px]"
                    placeholder={t("આ ઇન્વોઇસ કેમ સંપાદિત થઈ રહ્યું છે તે લખો...", "Explain why this invoice is being edited...")}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                {/* Preview */}
                <div className="rounded-2xl border border-saffron/20 bg-saffron/5 p-4">
                  <p className="text-sm font-bold text-saffron">
                    {t("ઇન્વોઇસ ફેરફાર સૂચના", "Invoice Modification Notice")}
                  </p>

                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {t(
                      "આ ઇન્વોઇસ પહેલેથી બન્યું છે. ફેરફારો નોંધાશે અને અંતિમ રિપોર્ટમાં દેખાશે.",
                      "This invoice has already been generated. Changes will be recorded and reflected in the final report.",
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-5 dark:border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  className="btn-soft flex-1"
                  onClick={() => setEditModal(false)}
                >
                  {t("રદ કરો", "Cancel")}
                </button>

                <button
                  className="btn-primary flex-1"
                  onClick={saveInvoiceEdit}
                >
                  {t("ફેરફારો સાચવો", "Save Changes")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
