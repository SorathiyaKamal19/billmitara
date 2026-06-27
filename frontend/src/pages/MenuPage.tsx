import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Save, Search, Trash2, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { MenuCategory, MenuItem } from "../types";
import { money } from "../utils/format";
import { foodTypeLabel } from "../utils/gujarati";
import { ToggleSwitch } from "../components/ToggleSwitch";

interface CategoryComboboxProps {
  categories: MenuCategory[];
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  onChange: (value: string) => void;
}

function CategoryCombobox({
  categories,
  value,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  onChange,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredCategories = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(search));
  }, [categories, query]);

  function selectCategory(name: string) {
    onChange(name);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input h-11 pr-10 pl-9"
          placeholder={open ? searchPlaceholder : placeholder}
          value={open ? query : value}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          autoComplete="off"
        />
        <ChevronDown
          size={16}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-gray-950">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <button
                key={category._id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCategory(category.name)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-saffron/10 dark:text-gray-100 dark:hover:bg-white/10"
              >
                <span className="truncate">{category.name}</span>
                {category.name === value && <Check size={16} className="shrink-0 text-saffron" />}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function MenuPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

  const defaultForm = {
    name: "",
    code: "",
    category: "",
    price: 0,
    foodType: "veg" as const,
    imageUrl: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [categoryName, setCategoryName] = useState("");

  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null);

  async function load() {
    const [menuRes, categoryRes] = await Promise.all([
      api.get("/menu"),
      api.get("/menu/categories"),
    ]);
    setItems(menuRes.data);
    setCategories(categoryRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.category) {
      toast.error(t("કેટેગરી પસંદ કરો", "Please select a category"));
      return;
    }

    try {
      await api.post("/menu", form);
      setForm({ ...defaultForm, category: form.category });
      toast.success(t("મેનુ વસ્તુ ઉમેરાઈ", "Menu item added"));
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("મેનુ વસ્તુ ઉમેરી શકાઈ નહીં", "Could not add menu item"));
    }
  }

  async function submitCategory(event: FormEvent) {
    event.preventDefault();

    try {
      const res = await api.post("/menu/categories", { name: categoryName });
      setCategoryName("");
      setForm((current) => ({ ...current, category: res.data.name }));
      toast.success(t("કેટેગરી ઉમેરાઈ", "Category added"));
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("કેટેગરી ઉમેરી શકાઈ નહીં", "Could not add category"));
    }
  }

  async function updateCategory() {
    if (!editCategory) return;

    try {
      await api.patch(`/menu/categories/${editCategory._id}`, { name: editCategory.name });
      toast.success(t("કેટેગરી અપડેટ થઈ", "Category updated"));
      setEditCategory(null);
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("કેટેગરી અપડેટ થઈ શક્યું નહીં", "Could not update category"));
    }
  }

  async function removeCategory(category: MenuCategory) {
    try {
      await api.delete(`/menu/categories/${category._id}`);
      toast.success(t("કેટેગરી કાઢી નાખી", "Category removed"));
      if (form.category === category.name) setForm((current) => ({ ...current, category: "" }));
      load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("કેટેગરી કાઢી શકાઈ નહીં", "Could not remove category"));
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
    if (!editItem.category) {
      toast.error(t("કેટેગરી પસંદ કરો", "Please select a category"));
      return;
    }

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

        <div className="w-full rounded-xl border border-saffron/15 bg-saffron/5 px-5 py-3 md:w-auto">
          <p className="text-xs text-gray-500">{t("કુલ વસ્તુઓ", "Total Items")}</p>
          <p className="mt-1 text-3xl font-black text-saffron">{items.length}</p>
        </div>
      </div>
      {/* ADD FORM */}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 min-w-0 space-y-4 xl:order-1">
        <form
          onSubmit={submit}
          className="grid min-w-0 items-end gap-4 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/75 sm:p-5 md:grid-cols-2 2xl:grid-cols-3"
        >
          <input
            className="input h-11"
            placeholder={t("ખાદ્ય વસ્તુ", "Food item")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            className="input h-11"
            placeholder={t("વસ્તુ કોડ", "Item code")}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />

          <CategoryCombobox
            categories={categories}
            value={form.category}
            placeholder={t("કેટેગરી", "Category")}
            searchPlaceholder={t("કેટેગરી શોધો", "Search category")}
            emptyLabel={t("કેટેગરી મળી નથી", "No category found")}
            onChange={(category) => setForm({ ...form, category })}
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
              className="h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-saffron focus:ring-4 focus:ring-saffron/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
          </div>

          <select
            className="input h-11"
            value={form.foodType}
            onChange={(e) =>
              setForm({
                ...form,
                foodType: e.target.value as any,
              })
            }
          >
            <option value="veg">{t("વેજ", "Veg")}</option>
            <option value="egg">{t("ઈંડા", "Egg")}</option>
            <option value="non-veg">{t("નોન-વેજ", "Non-Veg")}</option>
          </select>

          <button className="btn-primary h-11 w-full px-5 md:w-fit">
            <Plus size={17} />
            {t("ઉમેરો", "Add")}
          </button>
        </form>

        {/* MENU LIST */}
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="group rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-saffron/25 hover:shadow-soft dark:border-white/10 dark:bg-gray-900/75 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white">{item.name}</h3>

                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
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

                <div className="shrink-0 text-right">
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

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <ToggleSwitch
                  checked={item.isAvailable}
                  onChange={() => toggle(item)}
                  label={item.isAvailable ? t("ઉપલબ્ધ", "Available") : t("ઉપલબ્ધ નથી", "Unavailable")}
                />

                <div className="flex gap-2 sm:justify-end">
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
        </div>

        <section className="order-1 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/75 sm:p-5 xl:sticky xl:top-6 xl:order-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-950 dark:text-white">
                {t("કેટેગરી", "Categories")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("મેનુ માટે કેટેગરી ગોઠવો.", "Manage menu categories.")}
              </p>
            </div>
            <span className="rounded-lg bg-saffron/10 px-3 py-1 text-sm font-black text-saffron">
              {categories.length}
            </span>
          </div>

          <form onSubmit={submitCategory} className="mt-4 flex gap-2">
            <input
              className="input min-w-0 flex-1"
              placeholder={t("નવી કેટેગરી", "New category")}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
            <button className="btn-primary px-3" title={t("ઉમેરો", "Add")}>
              <Plus size={17} />
            </button>
          </form>

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{category.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.itemCount} {t("વસ્તુઓ", "items")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditCategory(category)}
                    className="rounded-lg bg-sky-50 p-2 text-sky-700 transition hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                    title={t("સંપાદિત", "Edit")}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(category)}
                    className="rounded-lg bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                    disabled={category.itemCount > 0}
                    title={
                      category.itemCount > 0
                        ? t("પહેલા વસ્તુઓ ખસેડો", "Move items first")
                        : t("કાઢી નાખો", "Delete")
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
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

              <CategoryCombobox
                categories={categories}
                value={editItem.category}
                placeholder={t("કેટેગરી", "Category")}
                searchPlaceholder={t("કેટેગરી શોધો", "Search category")}
                emptyLabel={t("કેટેગરી મળી નથી", "No category found")}
                onChange={(category) =>
                  setEditItem({
                    ...editItem,
                    category,
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
                <option value="egg">{t("ઈંડા", "Egg")}</option>
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
      {editCategory && (
        <div className="fixed inset-0 left-0 top-0 z-[100] grid h-dvh w-screen place-items-center overflow-y-auto bg-gray-950/70 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-white/70 bg-white p-5 shadow-2xl ring-1 ring-gray-950/5 dark:border-white/10 dark:bg-gray-950 dark:ring-white/10">
            <div className="mb-5 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
              <h2 className="text-2xl font-black">{t("કેટેગરી સંપાદિત કરો", "Edit Category")}</h2>

              <button className="btn-soft p-2" onClick={() => setEditCategory(null)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <input
                className="input w-full"
                placeholder={t("કેટેગરી", "Category")}
                value={editCategory.name}
                onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
              />

              <button onClick={updateCategory} className="btn-primary w-full">
                <Save size={18} />
                {t("કેટેગરી અપડેટ કરો", "Update Category")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
