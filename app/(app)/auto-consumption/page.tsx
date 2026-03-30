"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  Store as StoreIcon,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type Store = {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
};

type AutoConsumptionItem = {
  id: string;
  user_id: string;
  product_name: string | null;
  category: string | null;
  store_id: string | null;
  threshold_percent: number | null;
  current_stock_percent: number | null;
  is_active: boolean | null;
  pushed_to_grocery?: boolean | null;
  last_pushed_at?: string | null;
  created_at?: string | null;
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
  "Baby",
  "Other",
];

export default function AutoConsumptionPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<AutoConsumptionItem[]>([]);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Other");
  const [selectedStore, setSelectedStore] = useState("");
  const [thresholdPercent, setThresholdPercent] = useState(25);
  const [currentStockPercent, setCurrentStockPercent] = useState(100);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storeMap = useMemo(() => {
    return new Map(stores.map((store) => [store.id, store.name]));
  }, [stores]);

  async function loadPageData() {
    setLoadingPage(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Unable to load user session.");
      setLoadingPage(false);
      return;
    }

    setUserId(user.id);

    const [storesRes, itemsRes] = await Promise.all([
      supabase
        .from("stores")
        .select("id, user_id, name, created_at")
        .eq("user_id", user.id)
        .order("name", { ascending: true }),

      supabase
        .from("auto_consumption_items")
        .select(
          "id, user_id, product_name, category, store_id, threshold_percent, current_stock_percent, is_active, pushed_to_grocery, last_pushed_at, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (storesRes.error) {
      console.error("Error loading stores:", storesRes.error);
      setError("Failed to load stores.");
    } else {
      setStores(storesRes.data || []);
    }

    if (itemsRes.error) {
      console.error("Error loading auto-consumption items:", itemsRes.error);
      setError("Failed to load auto-consumption items.");
    } else {
      setItems(itemsRes.data || []);
    }

    setLoadingPage(false);
  }

  useEffect(() => {
    loadPageData();
  }, []);

  function resetForm() {
    setProductName("");
    setCategory("Other");
    setSelectedStore("");
    setThresholdPercent(25);
    setCurrentStockPercent(100);
    setEditingItemId(null);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      setError("No active user found.");
      return;
    }

    if (!productName.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (thresholdPercent < 1 || thresholdPercent > 100) {
      setError("Threshold must be between 1 and 100.");
      return;
    }

    if (currentStockPercent < 0 || currentStockPercent > 100) {
      setError("Current stock must be between 0 and 100.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      user_id: userId,
      product_name: productName.trim(),
      category,
      store_id: selectedStore || null,
      threshold_percent: thresholdPercent,
      current_stock_percent: currentStockPercent,
      is_active: true,
    };

    if (editingItemId) {
      const { error } = await supabase
        .from("auto_consumption_items")
        .update(payload)
        .eq("id", editingItemId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating auto-consumption item:", error);
        setError("Failed to update auto-consumption item.");
        setSaving(false);
        return;
      }

      setSuccess("Auto-consumption item updated successfully.");
    } else {
      const { error } = await supabase
        .from("auto_consumption_items")
        .insert([payload]);

      if (error) {
        console.error("Error creating auto-consumption item:", error);
        setError("Failed to create auto-consumption item.");
        setSaving(false);
        return;
      }

      setSuccess("Auto-consumption item created successfully.");
    }

    await runAutoCheck(false);
    await loadPageData();
    resetForm();
    setSaving(false);
  }

  function handleEditItem(item: AutoConsumptionItem) {
    setEditingItemId(item.id);
    setProductName(item.product_name || "");
    setCategory(item.category || "Other");
    setSelectedStore(item.store_id || "");
    setThresholdPercent(item.threshold_percent ?? 25);
    setCurrentStockPercent(item.current_stock_percent ?? 100);
    setError("");
    setSuccess("");
  }

  async function handleDeleteItem(itemId: string) {
    if (!userId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this auto-consumption item?"
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("auto_consumption_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting auto-consumption item:", error);
      setError("Failed to delete auto-consumption item.");
      return;
    }

    if (editingItemId === itemId) {
      resetForm();
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setSuccess("Auto-consumption item deleted successfully.");
  }

  async function handleToggleItem(item: AutoConsumptionItem) {
    if (!userId) return;

    const { error } = await supabase
      .from("auto_consumption_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error toggling auto-consumption item:", error);
      setError("Failed to update auto-consumption item status.");
      return;
    }

    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id
          ? { ...current, is_active: !current.is_active }
          : current
      )
    );
  }

  async function handleQuickStockUpdate(
    itemId: string,
    newStockPercent: number
  ) {
    if (!userId) return;

    setError("");
    setSuccess("");

    const safeValue = Math.max(0, Math.min(100, newStockPercent));

    const { error } = await supabase
      .from("auto_consumption_items")
      .update({ current_stock_percent: safeValue })
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating stock:", error);
      setError("Failed to update stock percentage.");
      return;
    }

    await runAutoCheck(false);
    await loadPageData();
    setSuccess("Stock percentage updated.");
  }

  async function runAutoCheck(showSuccessMessage = true) {
    setRunningCheck(true);
    setError("");

    const resetRes = await supabase.rpc("reset_auto_consumption_push_flags");
    if (resetRes.error) {
      console.error("Error resetting push flags:", resetRes.error);
      setError("Failed to reset auto-consumption flags.");
      setRunningCheck(false);
      return;
    }

    const pushRes = await supabase.rpc("push_auto_consumption_to_grocery");
    if (pushRes.error) {
      console.error("Error pushing auto-consumption items:", pushRes.error);
      setError("Failed to push auto-consumption items to Grocery.");
      setRunningCheck(false);
      return;
    }

    if (showSuccessMessage) {
      setSuccess("Auto check completed successfully.");
    }

    setRunningCheck(false);
  }

  function getStockBadgeClasses(current: number, threshold: number) {
    if (current <= threshold) {
      return "border border-amber-400/20 bg-amber-500/10 text-amber-200";
    }
    return "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }

  return (
    <main className="min-h-screen bg-[#030b22] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-r from-teal-900/40 via-slate-900/80 to-indigo-900/50 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90">
            <Sparkles size={16} />
            <span>Auto Consumption</span>
          </div>

          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Automate recurring grocery items
          </h1>

          <p className="mt-4 max-w-3xl text-base text-white/70 sm:text-xl">
            Create product rules using remaining stock percentage, assign a
            store, and push items to Grocery automatically when they fall below
            your threshold.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={async () => {
                await runAutoCheck(true);
                await loadPageData();
              }}
              disabled={runningCheck}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={18} className={runningCheck ? "animate-spin" : ""} />
              {runningCheck ? "Running auto check..." : "Run auto check"}
            </button>
          </div>
        </section>

        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-200">
            <AlertCircle size={18} className="mt-0.5" />
            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-emerald-200">
            <CheckCircle2 size={18} className="mt-0.5" />
            <p>{success}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] sm:p-6">
            <h2 className="text-2xl font-semibold">
              {editingItemId ? "Edit item" : "Add new item"}
            </h2>
            <p className="mt-1 text-white/60">
              Trigger by remaining stock percentage
            </p>

            <form onSubmit={handleSaveItem} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Product name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Milk"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-white/25"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none transition focus:border-white/25"
                >
                  {categories.map((item) => (
                    <option key={item} value={item} className="text-black">
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Store
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none transition focus:border-white/25"
                >
                  <option value="" className="text-black">
                    No store
                  </option>

                  {stores.map((store) => (
                    <option
                      key={store.id}
                      value={store.id}
                      className="text-black"
                    >
                      {store.name}
                    </option>
                  ))}
                </select>

                {stores.length === 0 ? (
                  <p className="mt-3 text-sm text-yellow-300">
                    No stores found yet. Create one in Stores if you want to
                    assign a shop here.
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-white/50">
                    Select one of your saved stores.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Threshold percentage
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={thresholdPercent}
                    onChange={(e) =>
                      setThresholdPercent(Number(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="min-w-[74px] rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center font-medium">
                    {thresholdPercent}%
                  </div>
                </div>

                <p className="mt-3 text-sm text-white/50">
                  When stock falls below {thresholdPercent}%, the item can be
                  pushed to Grocery.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Current stock percentage
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={currentStockPercent}
                    onChange={(e) =>
                      setCurrentStockPercent(Number(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="min-w-[74px] rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center font-medium">
                    {currentStockPercent}%
                  </div>
                </div>

                <p className="mt-3 text-sm text-white/50">
                  Use this to simulate remaining stock for the product.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-semibold text-slate-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={18} />
                  {saving
                    ? "Saving..."
                    : editingItemId
                    ? "Update item"
                    : "Add item"}
                </button>

                {editingItemId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-medium text-white/85 transition hover:bg-white/10"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] sm:p-6">
            <h2 className="text-2xl font-semibold">
              Your auto-consumption items
            </h2>
            <p className="mt-1 text-white/60">
              Items linked to your products, categories and stores
            </p>

            <div className="mt-6">
              {loadingPage ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-8 text-white/50">
                  Loading items...
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-8 text-white/50">
                  No auto-consumption items yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const threshold = item.threshold_percent ?? 25;
                    const current = item.current_stock_percent ?? 100;
                    const belowThreshold = current <= threshold;

                    return (
                      <div
                        key={item.id}
                        className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                              <button
                                type="button"
                                onClick={() => handleToggleItem(item)}
                                className="mt-1 text-white/75 transition hover:text-white"
                                aria-label={
                                  item.is_active ? "Disable item" : "Enable item"
                                }
                              >
                                {item.is_active ? (
                                  <CheckCircle2 size={22} />
                                ) : (
                                  <Circle size={22} />
                                )}
                              </button>

                              <div>
                                <h3 className="text-lg font-semibold">
                                  {item.product_name || "Unnamed item"}
                                </h3>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/65">
                                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                    {item.category || "Other"}
                                  </span>

                                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                    Threshold {threshold}%
                                  </span>

                                  <span
                                    className={`rounded-full px-3 py-1 ${getStockBadgeClasses(
                                      current,
                                      threshold
                                    )}`}
                                  >
                                    Stock {current}%
                                  </span>

                                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                    <StoreIcon size={14} />
                                    {item.store_id
                                      ? storeMap.get(item.store_id) ||
                                        "Unknown store"
                                      : "No store"}
                                  </span>

                                  <span
                                    className={`rounded-full px-3 py-1 ${
                                      item.is_active
                                        ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                                        : "border border-white/10 bg-white/5 text-white/55"
                                    }`}
                                  >
                                    {item.is_active ? "Active" : "Paused"}
                                  </span>

                                  {belowThreshold ? (
                                    <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-amber-200">
                                      Ready for Grocery
                                    </span>
                                  ) : null}

                                  {item.pushed_to_grocery ? (
                                    <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-sky-200">
                                      Sent to Grocery
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleEditItem(item)}
                                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/80 transition hover:bg-white/10 hover:text-white"
                                aria-label="Edit item"
                              >
                                <Pencil size={18} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/80 transition hover:bg-red-500/15 hover:text-red-200"
                                aria-label="Delete item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-white/60">
                                  Quick stock update
                                </p>
                                <p className="mt-1 text-sm text-white/40">
                                  Update stock and let the rule re-check Grocery.
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {[100, 75, 50, 25, 10, 0].map((value) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                      handleQuickStockUpdate(item.id, value)
                                    }
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                                  >
                                    {value}%
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
