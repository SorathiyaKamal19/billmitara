import { FormEvent, useEffect, useState } from "react";
import { Plus, Save, Trash2, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { MenuItem } from "../types";
import { money } from "../utils/format";
import { foodTypeLabel } from "../utils/gujarati";
import { ToggleSwitch } from "../components/ToggleSwitch";

export function MenuPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);

  const defaultForm = {
    name: "",
    code: "",
    category: "",
    price: 0,
    foodType: "veg" as const,
    imageUrl: "",
  };

  const [form, setForm] = useState(defaultForm);

  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  async function load() {
    const res = await api.get("/menu");
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();

    try {
      await api.post("/menu", form);
      setForm(defaultForm);
      toast.success(t("મેનુ વસ્તુ ઉમેરાઈ", "Menu item added"));
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("મેનુ વસ્તુ ઉમેરી શકાઈ નહીં", "Could not add menu item"));
    }
  }

  async function toggle(item: MenuItem) {
    await api.patch(`/menu/${item._id}`, {
      isAvailable: !item.isAvailable,
    });

    load();
  }

  async function remove(id: string) {
    await api.delete(`/menu/${id}`);

    toast.success(t("વસ્તુ કાઢી નાખી", "Item removed"));

    load();
  }

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setEditModal(true);
  }

  async function updateItem() {
    if (!editItem) return;

    try {
      await api.patch(`/menu/${editItem._id}`, editItem);
      toast.success(t("મેનુ અપડેટ થયું", "Menu updated"));
      setEditModal(false);
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("મેનુ અપડેટ થઈ શક્યું નહીં", "Could not update menu"));
    }
  }

  return (
    <div className="min-h-screen space-y-6">
      {" "}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/75 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-saffron/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-saffron">
            {t("મેનુ મેનેજમેન્ટ", "Menu Management")}
          </span>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">
            {t("રેસ્ટોરન્ટ મેનુ", "Restaurant Menu")}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t("ખાદ્ય વસ્તુઓ બનાવો, અપડેટ કરો અને મેનેજ કરો.", "Create, update and manage your food items.")}
          </p>
        </div>

        <div className="rounded-xl border border-saffron/15 bg-saffron/5 px-5 py-3">
          <p className="text-xs text-gray-500">{t("કુલ વસ્તુઓ", "Total Items")}</p>
          <p className="mt-1 text-3xl font-black text-saffron">{items.length}</p>
        </div>
      </div>
      {/* ADD FORM */}
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/75 sm:p-5 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]"
      >
        <input
          className="input"
          placeholder={t("ખાદ્ય વસ્તુ", "Food item")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          className="input"
          placeholder={t("વસ્તુ કોડ", "Item code")}
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />

        <input
          className="input"
          placeholder={t("કેટેગરી", "Category")}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-saffron">
            ₹
          </span>

          <input
            type="text"
            inputMode="numeric"
            placeholder={t("કિંમત દાખલ કરો", "Enter price")}
            value={form.price === 0 ? "" : form.price}
            onChange={(e) => {
              const value = e.target.value;

              if (/^\d*$/.test(value)) {
                setForm({
                  ...form,
                  price: value === "" ? 0 : Number(value),
                });
              }
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-saffron focus:ring-4 focus:ring-saffron/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
        </div>

        <select
          className="input"
          value={form.foodType}
          onChange={(e) =>
            setForm({
              ...form,
              foodType: e.target.value as any,
            })
          }
        >
          <option value="veg">{t("વેજ", "Veg")}</option>
          <option value="non-veg">{t("નોન-વેજ", "Non-Veg")}</option>
        </select>

        <button className="btn-primary">
          <Plus size={17} />
          {t("ઉમેરો", "Add")}
        </button>
      </form>
      {/* MENU LIST */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item._id}
            className="group rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-saffron/25 hover:shadow-soft dark:border-white/10 dark:bg-gray-900/75"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {item.code && `${item.code} • `}
                  {item.category}
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    item.foodType === "veg"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : item.foodType === "egg"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                  }`}
                >
                  {foodTypeLabel(item.foodType)}
                </span>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-saffron">
                  {money(item.price)}
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                    item.isAvailable
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                  }`}
                >
                  {item.isAvailable ? t("ઉપલબ્ધ", "Available") : t("ઉપલબ્ધ નથી", "Unavailable")}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <ToggleSwitch
                checked={item.isAvailable}
                onChange={() => toggle(item)}
                label={item.isAvailable ? t("ઉપલબ્ધ", "Available") : t("ઉપલબ્ધ નથી", "Unavailable")}
              />

              <div className="flex gap-2">
              <button
                onClick={() => openEdit(item)}
                className="rounded-lg bg-sky-50 p-3 text-sky-700 transition hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
              >
                <Pencil size={16} />
              </button>

              <button
                onClick={() => remove(item._id)}
                className="rounded-lg bg-rose-50 p-3 text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
              >
                <Trash2 size={16} />
              </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* EDIT MODAL */}
      {editModal && editItem && (
        <div className="fixed inset-0 left-0 top-0 z-[100] grid h-dvh w-screen place-items-center overflow-y-auto bg-gray-950/70 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-lg border border-white/70 bg-white p-5 shadow-2xl ring-1 ring-gray-950/5 dark:border-white/10 dark:bg-gray-950 dark:ring-white/10">
            <div className="mb-5 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
              <h2 className="text-2xl font-black">{t("મેનુ વસ્તુ સંપાદિત કરો", "Edit Menu Item")}</h2>

              <button className="btn-soft p-2" onClick={() => setEditModal(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <input
                className="input w-full"
                placeholder={t("ખાદ્ય વસ્તુ", "Food item")}
                value={editItem.name}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    name: e.target.value,
                  })
                }
              />

              <input
                className="input w-full"
                placeholder={t("વસ્તુ કોડ", "Item code")}
                value={editItem.code}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    code: e.target.value,
                  })
                }
              />

              <input
                className="input w-full"
                placeholder={t("કેટેગરી", "Category")}
                value={editItem.category}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    category: e.target.value,
                  })
                }
              />

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-saffron">
                  ₹
                </span>

                <input
                  className="input w-full pl-10"
                  type="text"
                  inputMode="numeric"
                  placeholder={t("કિંમત દાખલ કરો", "Enter price")}
                  value={editItem.price || ""}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (/^\d*$/.test(value)) {
                      setEditItem({
                        ...editItem,
                        price: value === "" ? 0 : Number(value),
                      });
                    }
                  }}
                />
              </div>

              <select
                className="input w-full"
                value={editItem.foodType}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    foodType: e.target.value as any,
                  })
                }
              >
                <option value="veg">{t("વેજ", "Veg")}</option>
                <option value="non-veg">{t("નોન-વેજ", "Non-Veg")}</option>
              </select>

              <button onClick={updateItem} className="btn-primary w-full">
                <Save size={18} />
                {t("મેનુ અપડેટ કરો", "Update Menu")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
