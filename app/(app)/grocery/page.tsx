"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Check,
  Circle,
  Pencil,
  Plus,
  Store,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

type GroceryItem = {
  id: string;
  name: string;
  category: string | null;
  completed: boolean | null;
  store_id: string | null;
  created_at?: string;
};

type StoreType = {
  id: string;
  name: string;
};

const categories = [
  "Fruit & Veg",
  "Dairy",
  "Meat",
  "Fish",
  "Bakery",
  "Frozen",
  "Drinks",
  "Snacks",
  "Cleaning",
  "Household",
  "Other",
];

export default function GroceryPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen text-white">
          <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <p className="text-sm text-white/60">Loading grocery page...</p>
            </div>
          </div>
        </main>
      }
    >
      <GroceryPageContent />
    </Suspense>
  );
}

function GroceryPageContent() {
  const searchParams = useSearchParams();

  const initialStoreParam = searchParams.get("store");
  const initialStatusParam = searchParams.get("status");

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [storeId, setStoreId] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Other");
  const [editStoreId, setEditStoreId] = useState("");

  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [shoppingMode, setShoppingMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialStoreParam) {
      setSelectedStore(initialStoreParam);
    }

    if (
      initialStatusParam === "pending" ||
      initialStatusParam === "completed" ||
      initialStatusParam === "all"
    ) {
      setSelectedStatus(initialStatusParam);
    }
  }, [initialStoreParam, initialStatusParam]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [{ data: itemsData, error: itemsError }, { data: storesData, error: storesError }] =
        await Promise.all([
          supabase.from("grocery_items").select("*").order("created_at", { ascending: false }),
          supabase.from("stores").select("*").order("name", { ascending: true }),
        ]);

      if (itemsError) throw itemsError;
      if (storesError) throw storesError;

      setItems((itemsData as GroceryItem[]) || []);
      setStores((storesData as StoreType[]) || []);
    } catch (error) {
      console.error("Error fetching grocery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!name.trim()) return;

    try {
      const { data, error } = await supabase
        .from("grocery_items")
        .insert([
          {
            name: name.trim(),
            category,
            store_id: storeId || null,
            completed: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [data as GroceryItem, ...prev]);
      setName("");
      setCategory("Other");
      setStoreId("");
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const toggleCompleted = async (item: GroceryItem) => {
    try {
      const { error } = await supabase
        .from("grocery_items")
        .update({ completed: !item.completed })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, completed: !item.completed } : i))
      );
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("grocery_items").delete().eq("id", id);
      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const startEdit = (item: GroceryItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category || "Other");
    setEditStoreId(item.store_id || "");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      const { error } = await supabase
        .from("grocery_items")
        .update({
          name: editName.trim(),
          category: editCategory,
          store_id: editStoreId || null,
        })
        .eq("id", editingId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: editName.trim(),
                category: editCategory,
                store_id: editStoreId || null,
              }
            : item
        )
      );

      cancelEdit();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCategory("Other");
    setEditStoreId("");
  };

  const getStoreName = (storeIdValue: string | null) => {
    if (!storeIdValue) return "No store";
    return stores.find((store) => store.id === storeIdValue)?.name || "Unknown store";
  };

  const activeStoreLabel = useMemo(() => {
    if (selectedStore === "all") return "All stores";
    if (selectedStore === "no-store") return "No store";
    return stores.find((store) => store.id === selectedStore)?.name || "Filtered store";
  }, [selectedStore, stores]);

  const activeStatusLabel = useMemo(() => {
    if (selectedStatus === "pending") return "Pending";
    if (selectedStatus === "completed") return "Completed";
    return "All";
  }, [selectedStatus]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStore =
        selectedStore === "all"
          ? true
          : selectedStore === "no-store"
            ? !item.store_id
            : item.store_id === selectedStore;

      const matchesStatus =
        selectedStatus === "all"
          ? true
          : selectedStatus === "pending"
            ? !item.completed
            : !!item.completed;

      return matchesStore && matchesStatus;
    });
  }, [items, selectedStore, selectedStatus]);

  const pendingCount = items.filter((item) => !item.completed).length;
  const completedCount = items.filter((item) => item.completed).length;

  const visibleItems = useMemo(() => {
    if (!shoppingMode) return filteredItems;
    return filteredItems.filter((item) => !item.completed);
  }, [filteredItems, shoppingMode]);

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
              <Sparkles size={14} />
              Grocery List
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Keep your shopping list clean and organised
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Add items manually, assign categories and stores, filter your list, and use shopping
              mode for a cleaner in-store experience.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80">
                Pending:
                <span className="ml-2 font-semibold text-white">{pendingCount}</span>
              </div>

              <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80">
                Completed:
                <span className="ml-2 font-semibold text-white">{completedCount}</span>
              </div>

              <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80">
                Store:
                <span className="ml-2 font-semibold text-white">{activeStoreLabel}</span>
              </div>

              <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80">
                Status:
                <span className="ml-2 font-semibold text-white">{activeStatusLabel}</span>
              </div>

              <button
                onClick={() => setShoppingMode((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  shoppingMode
                    ? "bg-white text-[#0b1020]"
                    : "border border-white/10 bg-white/10 text-white"
                }`}
              >
                {shoppingMode ? <EyeOff size={16} /> : <Eye size={16} />}
                {shoppingMode ? "Exit Shopping Mode" : "Shopping Mode"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
          {!shoppingMode && (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Add new item</h2>
                <p className="text-sm text-white/60">Quick manual entry</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Item name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Milk"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="text-black">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Store</label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="" className="text-black">
                      No store
                    </option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id} className="text-black">
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={addItem}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1020] transition hover:scale-[1.01]"
                >
                  <Plus size={16} />
                  Add item
                </button>
              </div>
            </div>
          )}

          <div
            className={`rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl ${
              shoppingMode ? "xl:col-span-2" : ""
            }`}
          >
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {shoppingMode ? "Shopping Mode" : "Your items"}
                </h2>
                <p className="text-sm text-white/60">
                  {shoppingMode
                    ? "Focused checklist view for shopping"
                    : "Filter by store or status"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-white/60">Store</label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="all" className="text-black">
                      All stores
                    </option>
                    <option value="no-store" className="text-black">
                      No store
                    </option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id} className="text-black">
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/60">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="all" className="text-black">
                      All
                    </option>
                    <option value="pending" className="text-black">
                      Pending
                    </option>
                    <option value="completed" className="text-black">
                      Completed
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Loading grocery items...</p>
            ) : visibleItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
                No items found.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleItems.map((item) => {
                  const isEditing = editingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-[22px] border border-white/10 bg-white/[0.04] p-4 ${
                        shoppingMode ? "sm:p-5" : ""
                      }`}
                    >
                      {isEditing && !shoppingMode ? (
                        <div className="space-y-3">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                          />

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat} className="text-black">
                                  {cat}
                                </option>
                              ))}
                            </select>

                            <select
                              value={editStoreId}
                              onChange={(e) => setEditStoreId(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                            >
                              <option value="" className="text-black">
                                No store
                              </option>
                              {stores.map((store) => (
                                <option key={store.id} value={store.id} className="text-black">
                                  {store.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              onClick={saveEdit}
                              className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1020]"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <button
                              onClick={() => toggleCompleted(item)}
                              className={`rounded-full border border-white/15 transition ${
                                shoppingMode
                                  ? "mt-0 bg-white/10 p-3 text-white hover:bg-white/15"
                                  : "mt-0.5 bg-white/10 p-2 text-white/80 hover:bg-white/15"
                              }`}
                            >
                              {item.completed ? (
                                <Check size={shoppingMode ? 20 : 16} />
                              ) : (
                                <Circle size={shoppingMode ? 20 : 16} />
                              )}
                            </button>

                            <div className="min-w-0">
                              <p
                                className={`truncate font-medium ${
                                  shoppingMode
                                    ? item.completed
                                      ? "text-base text-white/40 line-through sm:text-lg"
                                      : "text-base text-white sm:text-lg"
                                    : item.completed
                                      ? "text-sm text-white/45 line-through"
                                      : "text-sm text-white"
                                }`}
                              >
                                {item.name}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">
                                  {item.category || "Other"}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white/70">
                                  <Store size={12} />
                                  {getStoreName(item.store_id)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {!shoppingMode && (
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => startEdit(item)}
                                className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white/80 transition hover:bg-white/15"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                onClick={() => deleteItem(item.id)}
                                className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white/80 transition hover:bg-red-500/20 hover:text-red-300"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
