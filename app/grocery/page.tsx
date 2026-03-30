"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  ShoppingCart,
  Trash2,
  Store as StoreIcon,
  Package,
} from "lucide-react";

type GroceryItem = {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  category: string | null;
  store_id: string | null;
  status: string;
  source?: string | null;
  auto_generated?: boolean | null;
  created_at?: string;
};

type Store = {
  id: string;
  name: string;
};

type FilterType = "all" | "pending" | "completed";

export default function GroceryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");

  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("Other");
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void initializePage();
  }, []);

  async function initializePage() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        setError("Auth session missing!");
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      await Promise.all([loadStores(uid), loadGroceryItems(uid)]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load grocery page.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStores(uid: string) {
    const { data, error } = await supabase
      .from("stores")
      .select("id, name")
      .eq("user_id", uid)
      .order("name", { ascending: true });

    if (error) throw error;
    setStores((data || []) as Store[]);
  }

  async function loadGroceryItems(uid: string) {
    const { data, error } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setItems((data || []) as GroceryItem[]);
  }

  function getStoreName(storeId: string | null) {
    if (!storeId) return "No store";
    const store = stores.find((s) => s.id === storeId);
    return store?.name || "No store";
  }

  function clearForm() {
    setItemName("");
    setQuantity("1");
    setCategory("Other");
    setSelectedStoreId("");
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      setError("Auth session missing!");
      return;
    }

    if (!itemName.trim()) {
      setError("Please enter an item name.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        user_id: userId,
        name: itemName.trim(),
        quantity: parsedQuantity,
        category,
        store_id: selectedStoreId || null,
        status: "pending",
      };

      const { error } = await supabase.from("grocery_items").insert(payload);

      if (error) throw error;

      await loadGroceryItems(userId);
      clearForm();
      setMessage("Item added successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not add item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkDone(id: string) {
    if (!userId) return;

    try {
      setError("");
      setMessage("");

      const { error } = await supabase
        .from("grocery_items")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;

      await loadGroceryItems(userId);
      setMessage("Item marked as completed.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not update item.");
    }
  }

  async function handleMarkPending(id: string) {
    if (!userId) return;

    try {
      setError("");
      setMessage("");

      const { error } = await supabase
        .from("grocery_items")
        .update({ status: "pending" })
        .eq("id", id);

      if (error) throw error;

      await loadGroceryItems(userId);
      setMessage("Item moved back to pending.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not update item.");
    }
  }

  async function handleDeleteItem(id: string) {
    if (!userId) return;

    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const { error } = await supabase
        .from("grocery_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadGroceryItems(userId);
      setMessage("Item deleted successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not delete item.");
    }
  }

  const filteredItems = useMemo(() => {
    if (filter === "pending") {
      return items.filter((item) => item.status === "pending");
    }
    if (filter === "completed") {
      return items.filter((item) => item.status === "completed");
    }
    return items;
  }, [items, filter]);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((item) => item.status === "pending").length;
    const completed = items.filter((item) => item.status === "completed").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, completed, progress };
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f6fb] text-[#0b2463]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-xl bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-4">
              <div className="h-28 rounded-3xl bg-white" />
              <div className="h-28 rounded-3xl bg-white" />
              <div className="h-28 rounded-3xl bg-white" />
              <div className="h-28 rounded-3xl bg-white" />
            </div>
            <div className="grid gap-6 xl:grid-cols-[520px_minmax(0,1fr)]">
              <div className="h-[560px] rounded-3xl bg-white" />
              <div className="h-[560px] rounded-3xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-[#0b2463]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            <ShoppingCart className="h-3.5 w-3.5" />
            Organised grocery planning
          </div>

          <h1 className="text-4xl font-semibold tracking-tight">Grocery list</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
            Organise your shopping items, keep track of what is still pending, and
            manage your list with a clean mobile-friendly layout.
          </p>
        </div>

        {(message || error) && (
          <div className="mb-6 space-y-3">
            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm text-slate-500">Total items</div>
            <div className="text-4xl font-semibold">{stats.total}</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm text-slate-500">Pending</div>
            <div className="text-4xl font-semibold">{stats.pending}</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm text-slate-500">Completed</div>
            <div className="text-4xl font-semibold">{stats.completed}</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm text-slate-500">Progress</div>
            <div className="text-4xl font-semibold">{stats.progress}%</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[520px_minmax(0,1fr)]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-3xl font-semibold">Add item</h2>

            <form onSubmit={handleAddItem} className="mt-8 space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  Item name
                </label>
                <input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Milk"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-[#0b2463] outline-none transition focus:border-[#0b2463]/30 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-[#0b2463] outline-none transition focus:border-[#0b2463]/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-[#0b2463] outline-none transition focus:border-[#0b2463]/30 focus:bg-white"
                  >
                    <option>Food</option>
                    <option>Drinks</option>
                    <option>Cleaning</option>
                    <option>Household</option>
                    <option>Toiletries</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  Store
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xl text-[#0b2463] outline-none transition focus:border-[#0b2463]/30 focus:bg-white"
                >
                  <option value="">No store selected</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0b2463] px-5 py-4 text-lg font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Add item"}
              </button>
            </form>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-semibold">Your items</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilter("all")}
                  className={`rounded-2xl px-6 py-3 text-lg font-semibold transition ${
                    filter === "all"
                      ? "bg-[#0b2463] text-white"
                      : "border border-slate-200 bg-white text-[#0b2463]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={`rounded-2xl px-6 py-3 text-lg font-semibold transition ${
                    filter === "pending"
                      ? "bg-[#0b2463] text-white"
                      : "border border-slate-200 bg-white text-[#0b2463]"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`rounded-2xl px-6 py-3 text-lg font-semibold transition ${
                    filter === "completed"
                      ? "bg-[#0b2463] text-white"
                      : "border border-slate-200 bg-white text-[#0b2463]"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-[28px] border border-slate-200 bg-[#f7f9fc] p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-2xl font-semibold">Shopping progress</h3>
                <span className="text-2xl font-semibold">{stats.progress}%</span>
              </div>

              <div className="h-5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#0b2463]"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                <Package className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                <h3 className="text-xl font-semibold">No items found</h3>
                <p className="mt-2 text-slate-500">
                  Add a new item or change the selected filter.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[28px] border border-slate-200 bg-[#fafbfd] p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-semibold">{item.name}</h3>

                          <span
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                              item.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.status === "completed" ? "Completed" : "Pending"}
                          </span>

                          {item.auto_generated && (
                            <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-600">
                              Auto-added
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-lg text-slate-600">
                          <span className="rounded-full bg-slate-100 px-4 py-2">
                            Qty: {item.quantity}
                          </span>

                          <span className="rounded-full bg-slate-100 px-4 py-2">
                            {item.category || "Other"}
                          </span>

                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                            <StoreIcon className="h-4 w-4" />
                            {getStoreName(item.store_id)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {item.status === "pending" ? (
                          <button
                            onClick={() => handleMarkDone(item.id)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#0b2463] px-6 py-3 text-lg font-semibold text-white transition hover:opacity-95"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                            Mark done
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkPending(item.id)}
                            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-lg font-semibold text-[#0b2463] transition hover:bg-slate-50"
                          >
                            Mark pending
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-6 py-3 text-lg font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}