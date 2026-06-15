import { FormEvent, useEffect, useState } from "react";
import { CreditCard, Eye, Plus, PlusCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { OrderTimer } from "../components/OrderTimer";
import { StatusBadge } from "../components/StatusBadge";
import { useLanguage } from "../context/LanguageContext";
import { RestaurantTable } from "../types";
import { money } from "../utils/format";
import { useAuth } from "../context/AuthContext";

function tableTone(status: RestaurantTable["status"]) {
  if (status === "running")
    return "border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-950/30";
  if (status === "reserved")
    return "border-yellow-200 bg-yellow-50/80 dark:border-yellow-500/30 dark:bg-yellow-950/30";
  if (status === "available")
    return "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-950/30";
  return "";
}

export function TablesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");

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
    toast.success(t("ટેબલ ઉમેરાયું", "Table added"));
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-saffron">
            {t("ફ્લોર", "Floor")}
          </p>
          <h1 className="text-3xl font-black">{t("ટેબલ મેનેજમેન્ટ", "Table management")}</h1>
        </div>
        {user?.role === "owner" && (
          <form
            onSubmit={createTable}
            className="glass grid w-full grid-cols-2 gap-2 rounded-lg p-2 sm:w-auto sm:flex sm:flex-wrap"
          >
            <input
              className="input col-span-2 sm:w-36"
              placeholder={t("ટેબલનું નામ", "Table name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="input sm:w-24"
              type="number"
              min={1}
              value={capacity}
              placeholder={t("બેઠકો", "Seats")}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
            <button className="btn-primary min-w-0">
              <Plus size={17} /> {t("ઉમેરો", "Add table")}
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
          .map((table) => (
            <div
              key={table._id}
              className={`glass rounded-lg p-5 text-left transition hover:-translate-y-1 hover:shadow-soft ${tableTone(table.status)}`}
            >
              <div className="flex items-center justify-between">
                <StatusBadge value={table.status} />
                <Users size={19} className="text-gray-400" />
              </div>
              <p className="mt-5 text-2xl font-black">{table.name}</p>
              <p className="text-sm text-gray-500">
                {table.zone} - {table.capacity} {t("બેઠકો", "seats")}
              </p>

              {table.currentOrder ? (
                <div className="mt-4 space-y-2 rounded-lg bg-saffron/10 p-3 text-sm">
                  <p className="font-bold">
                    {t("ચાલુ બિલ", "Running bill")} {money(table.currentOrder.total)}
                  </p>
                  <p className="text-gray-500">
                    {table.currentOrder.items?.length || 0} {t("વસ્તુઓ", "line items")}
                  </p>
                  {table.currentOrder.createdAt && (
                    <OrderTimer
                      createdAt={table.currentOrder.createdAt}
                      status={table.currentOrder.status}
                      compact
                    />
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm font-semibold text-emerald-600">
                  {t("નવા ઓર્ડર માટે તૈયાર", "Ready for new order")}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                {table.currentOrder && (
                  <button
                    onClick={() =>
                      navigate(`/order-details/${table.currentOrder!._id}`)
                    }
                    className="btn-soft col-span-2"
                  >
                    <Eye size={17} /> {t("ઓર્ડર જુઓ", "View order")}
                  </button>
                )}
                <button
                  onClick={() =>
                    navigate(
                      table.currentOrder
                        ? `/orders/${table._id}?orderId=${table.currentOrder._id}`
                        : `/orders/${table._id}`,
                    )
                  }
                  className={table.currentOrder ? "btn-soft" : "btn-soft col-span-2"}
                >
                  <PlusCircle size={17} />{" "}
                  {table.currentOrder ? t("વસ્તુઓ ઉમેરો", "Add items") : t("ઓર્ડર લો", "Create order")}
                </button>

                {table.currentOrder && (

                <button
                  disabled={!table.currentOrder}
                  onClick={() =>
                    table.currentOrder &&
                    navigate(`/billing/${table.currentOrder._id}`)
                  }
                  className="btn-primary"
                >
                  <CreditCard size={17} /> {t("બિલ", "Bill")}
                </button>

                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

