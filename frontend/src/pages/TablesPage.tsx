import { FormEvent, useEffect, useState } from "react";
import { CreditCard, Eye, Plus, PlusCircle, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { OrderTimer } from "../components/OrderTimer";
import { StatusBadge } from "../components/StatusBadge";
import { useLanguage } from "../context/LanguageContext";
import { RestaurantTable } from "../types";
import { money } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { hasModulePermission } from "../utils/permissions";

function tableTone(status: RestaurantTable["status"]) {
  if (status === "running") return "border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-950/30";
  if (status === "reserved") return "border-yellow-200 bg-yellow-50/80 dark:border-yellow-500/30 dark:bg-yellow-950/30";
  if (status === "available") return "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-950/30";
  return "";
}

export function TablesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const canManageTables = (user?.role === "owner" || user?.role === "manager") && hasModulePermission(user, "tables");
  const canOpenOrders = hasModulePermission(user, "orders");
  const canOpenBilling = hasModulePermission(user, "billing");
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await api.get("/tables");
    setTables(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTable(event: FormEvent) {
    event.preventDefault();
    await api.post("/tables", { name, capacity, zone: "Main Floor" });
    setName("");
    setCapacity("");
    toast.success(t("Table added", "Table added"));
    load();
  }

  async function deleteTable() {
    if (!tableToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/tables/${tableToDelete._id}`);
      toast.success(t("Table deleted", "Table deleted"));
      setTableToDelete(null);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("Could not delete table", "Could not delete table"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">{t("Floor", "Floor")}</p>
          <h1 className="text-3xl font-black">{t("Table management", "Table management")}</h1>
        </div>

        {canManageTables && (
          <form onSubmit={createTable} className="glass grid w-full grid-cols-2 gap-2 rounded-lg p-2 sm:w-auto sm:flex sm:flex-wrap">
            <input
              className="input col-span-2 sm:w-36"
              placeholder={t("Table name", "Table name")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <input
              className="input sm:w-24"
              type="number"
              min={1}
              value={capacity}
              placeholder={t("Seats", "Seats")}
              onChange={(event) => setCapacity(event.target.value ? Number(event.target.value) : "")}
            />
            <button className="btn-primary min-w-0">
              <Plus size={17} /> {t("Add table", "Add table")}
            </button>
          </form>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...tables]
          .sort((a, b) => {
            if (a.status === "running" && b.status !== "running") return -1;
            if (a.status !== "running" && b.status === "running") return 1;
            if (a.status === "reserved" && b.status !== "reserved") return -1;
            if (a.status !== "reserved" && b.status === "reserved") return 1;
            return 0;
          })
          .map((table) => {
            const hasCurrentOrder = Boolean(table.currentOrder);

            return (
              <div key={table._id} className={`glass rounded-lg p-5 text-left transition hover:-translate-y-1 hover:shadow-soft ${tableTone(table.status)}`}>
                <div className="flex items-center justify-between">
                  <StatusBadge value={table.status} />
                  <Users size={19} className="text-gray-400" />
                </div>

                <p className="mt-5 text-2xl font-black">{table.name}</p>
                <p className="text-sm text-gray-500">
                  {table.zone} - {table.capacity} {t("seats", "seats")}
                </p>

                {table.currentOrder ? (
                  <div className="mt-4 space-y-2 rounded-lg bg-saffron/10 p-3 text-sm">
                    <p className="font-bold">
                      {t("Running bill", "Running bill")} {money(table.currentOrder.total)}
                    </p>
                    <p className="text-gray-500">
                      {table.currentOrder.items?.length || 0} {t("line items", "line items")}
                    </p>
                    {table.currentOrder.createdAt && <OrderTimer createdAt={table.currentOrder.createdAt} status={table.currentOrder.status} compact />}
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-emerald-600">{t("Ready for new order", "Ready for new order")}</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {table.currentOrder && canOpenOrders && (
                    <button onClick={() => navigate(`/order-details/${table.currentOrder!._id}`)} className="btn-soft col-span-2">
                      <Eye size={17} /> {t("View order", "View order")}
                    </button>
                  )}

                  {canOpenOrders && (
                    <button
                      onClick={() => navigate(table.currentOrder ? `/orders/${table._id}?orderId=${table.currentOrder._id}` : `/orders/${table._id}`)}
                      className={table.currentOrder && canOpenBilling ? "btn-soft" : "btn-soft col-span-2"}
                    >
                      <PlusCircle size={17} /> {table.currentOrder ? t("Add items", "Add items") : t("Create order", "Create order")}
                    </button>
                  )}

                  {table.currentOrder && canOpenBilling && (
                    <button disabled={!table.currentOrder} onClick={() => table.currentOrder && navigate(`/billing/${table.currentOrder._id}`)} className="btn-primary">
                      <CreditCard size={17} /> {t("Bill", "Bill")}
                    </button>
                  )}

                  {canManageTables && (
                    <button
                      type="button"
                      disabled={hasCurrentOrder}
                      onClick={() => setTableToDelete(table)}
                      title={hasCurrentOrder ? t("Complete the running order before deleting", "Complete the running order before deleting") : t("Delete table", "Delete table")}
                      className="btn-soft col-span-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={17} /> {t("Delete table", "Delete table")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {tableToDelete && (
        <ConfirmDialog
          title={t("Delete table?", "Delete table?")}
          description={
            <>
              <p className="font-bold text-gray-950 dark:text-white">{tableToDelete.name}</p>
              <p className="mt-2">{t("This action cannot be undone. The table will be removed from your floor list.", "This action cannot be undone. The table will be removed from your floor list.")}</p>
            </>
          }
          confirmLabel={t("Delete", "Delete")}
          loadingLabel={t("Deleting...", "Deleting...")}
          cancelLabel={t("Cancel", "Cancel")}
          loading={deleting}
          danger
          onConfirm={deleteTable}
          onClose={() => setTableToDelete(null)}
        />
      )}
    </div>
  );
}
