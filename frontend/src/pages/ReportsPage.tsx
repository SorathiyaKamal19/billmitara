import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Pencil,
  ReceiptIndianRupee,
  Search,
  X,
} from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import { api } from "../api/client";
import { StatCard } from "../components/StatCard";
import { Invoice } from "../types";
import { money, shortDate } from "../utils/format";
import { paymentLabel } from "../utils/gujarati";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

function dateInputValue(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function ReportsPage() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [reportDate, setReportDate] = useState<Date | null>(null);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
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

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const min = minAmount === "" ? null : Number(minAmount);
    const max = maxAmount === "" ? null : Number(maxAmount);

    return invoices.filter((invoice) => {
      const searchable = [
        invoice.billNumber,
        invoice.customerName,
        invoice.customerMobile,
        invoice.whatsappStatus,
        paymentLabel(invoice.paymentMode),
        String(invoice.total),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        normalizedQuery === "" || searchable.includes(normalizedQuery);
      const matchesDate =
        !reportDate ||
        dateInputValue(invoice.createdAt) === dateInputValue(reportDate);
      const matchesMin =
        min === null || Number.isNaN(min) || invoice.total >= min;
      const matchesMax =
        max === null || Number.isNaN(max) || invoice.total <= max;

      return matchesQuery && matchesDate && matchesMin && matchesMax;
    });
  }, [invoices, maxAmount, minAmount, query, reportDate]);

  const total = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const gst = filteredInvoices.reduce((sum, invoice) => sum + invoice.gst, 0);

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
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">
            {t("રિપોર્ટ", "Reports")}
          </p>
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">{t("વેચાણ અને GST રિપોર્ટ", "Sales & GST reports")}</h1>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={exportExcel}>
          <FileSpreadsheet size={18} /> {t("Excel એક્સપોર્ટ કરો", "Export Excel")}
        </button>
      </div>
      <div className="glass rounded-lg p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_auto]">
          <label className="relative block min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
            />
            <input
              className="input h-11 pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("નામ અથવા બિલ શોધો", "Search name or bill")}
            />
          </label>

          <label className="relative block min-w-0">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
            />
            <span id="reports-date-filter" className="sr-only">
              {t("તારીખ પસંદ કરો", "Select date")}
            </span>
            <DatePicker
              selected={reportDate}
              onChange={(date: Date | null) => setReportDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText={t("DD/MM/YYYY", "DD/MM/YYYY")}
              className="input h-11 pl-10"
              wrapperClassName="w-full"
              popperClassName="reports-datepicker-popper"
              portalId="reports-datepicker-root"
              isClearable
              ariaLabelledBy="reports-date-filter"
            />
          </label>

          <input
            className="input h-11"
            type="number"
            min="0"
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
            placeholder={t("ન્યૂનતમ રકમ", "Min amount")}
            aria-label={t("ન્યૂનતમ રકમ", "Min amount")}
          />

          <input
            className="input h-11"
            type="number"
            min="0"
            value={maxAmount}
            onChange={(event) => setMaxAmount(event.target.value)}
            placeholder={t("મહત્તમ રકમ", "Max amount")}
            aria-label={t("મહત્તમ રકમ", "Max amount")}
          />

          <button
            className="btn-soft h-11 w-full md:w-auto"
            type="button"
            onClick={() => {
              setQuery("");
              setReportDate(null);
              setMinAmount("");
              setMaxAmount("");
            }}
          >
            <X size={17} />
            {t("રીસેટ", "Reset")}
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
          {filteredInvoices.length} / {invoices.length} {t("બિલ", "Bills")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          value={String(filteredInvoices.length)}
          icon={Download}
          accent="#7c3aed"
        />
      </div>
      <div className="grid gap-3 md:hidden">
        {filteredInvoices.map((invoice) => (
          <article className="glass rounded-lg p-4" key={invoice._id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-black">
                  {invoice.billNumber}
                </p>
                <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                  {invoice.customerName || t("વૉક-ઇન", "Walk-in")}
                </p>
              </div>
              <p className="shrink-0 text-right text-xs font-bold text-gray-500 dark:text-gray-400">
                {shortDate(invoice.createdAt)}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                  GST
                </p>
                <p className="mt-1 font-bold">{money(invoice.gst)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                  {t("કુલ", "Total")}
                </p>
                <p className="mt-1 font-black text-saffron">
                  {money(invoice.total)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                  {t("પેમેન્ટ", "Payment")}
                </p>
                <p className="mt-1 font-bold capitalize">
                  {paymentLabel(invoice.paymentMode)}
                </p>
              </div>
            </div>

            <button
              className="btn-primary mt-4 w-full"
              onClick={() => editInvoice(invoice)}
            >
              <Pencil size={15} />
              {t("સંપાદિત કરો", "Edit")}
            </button>
          </article>
        ))}
        {filteredInvoices.length === 0 && (
          <div className="glass rounded-lg p-6 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t("કોઈ બિલ મળ્યું નથી", "No bills found")}
          </div>
        )}
      </div>

      <div className="glass hidden overflow-hidden rounded-lg md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-white/70 dark:bg-white/10">
              <tr>
                <th className="p-4">{t("બિલ", "Bill")}</th>
                <th>{t("ગ્રાહક", "Customer")}</th>
                <th>GST</th>
                <th>{t("કુલ", "Total")}</th>
                <th>{t("પેમેન્ટ", "Payment")}</th>
                <th>{t("તારીખ", "Date")}</th>
                <th>{t("સંપાદન", "Edit")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr
                  className="border-t border-gray-200 dark:border-white/10"
                  key={invoice._id}
                >
                  <td className="p-4 font-bold">{invoice.billNumber}</td>
                  <td>{invoice.customerName || t("વૉક-ઇન", "Walk-in")}</td>
                  <td>{money(invoice.gst)}</td>
                  <td className="font-black">{money(invoice.total)}</td>
                  <td>{paymentLabel(invoice.paymentMode)}</td>
                  <td>{shortDate(invoice.createdAt)}</td>
                  <td>
                    <button
                      className="btn-primary px-3 py-2"
                      onClick={() => editInvoice(invoice)}
                    >
                      <Pencil size={15} />
                      {t("સંપાદિત કરો", "Edit")}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    className="p-8 text-center text-sm font-semibold text-gray-500 dark:text-gray-400"
                    colSpan={7}
                  >
                    {t("કોઈ બિલ મળ્યું નથી", "No bills found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editModal && selectedInvoice && (
        <div className="fixed inset-0 left-0 top-0 z-[100] h-screen min-h-dvh w-screen overflow-hidden bg-gray-950/70 backdrop-blur-xl">
          {/* Overlay */}
          <div
            onClick={() => setEditModal(false)}
            className="absolute inset-0"
          />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 top-auto z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-lg bg-white shadow-2xl dark:bg-slate-900 md:bottom-0 md:left-auto md:right-0 md:top-0 md:h-screen md:max-h-none md:w-[450px] md:rounded-none">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 dark:border-white/10 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-wider text-saffron">
                    {t("ઇન્વોઇસ એડિટર", "Invoice Editor")}
                  </p>

                  <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">
                    {selectedInvoice.billNumber}
                  </h2>

                  <p className="mt-1 truncate text-sm text-gray-500">
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {/* Summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-saffron/5 p-4 dark:bg-saffron/10">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    {t("હાલનું કુલ", "Current Total")}
                  </p>

                  <h3 className="mt-2 break-words text-xl font-black text-saffron sm:text-2xl">
                    {money(selectedInvoice.total)}
                  </h3>
                </div>

                <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
                  <p className="text-xs font-bold uppercase text-gray-500">
                    GST
                  </p>

                  <h3 className="mt-2 break-words text-xl font-black text-emerald-600 sm:text-2xl">
                    {money(selectedInvoice.gst)}
                  </h3>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-500/10">
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
                      className={`rounded-lg border p-3 text-sm font-bold transition sm:p-4 ${
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
                      className={`rounded-lg border p-3 text-sm font-bold transition sm:p-4 ${
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
                <div className="rounded-lg border border-saffron/20 bg-saffron/5 p-4">
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
            <div className="border-t border-gray-200 p-4 dark:border-white/10 sm:p-5">
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
