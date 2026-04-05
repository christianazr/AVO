"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  Warehouse,
  Sparkles,
  CheckCircle2,
  Minus,
} from "lucide-react";

type StoreType = {
  id: string;
  name: string;
};

type AutoConsumptionItem = {
  id: string;
  name: string;
  category: string | null;
  store_id: string | null;
  threshold_percentage: number | null;
  current_quantity: number | null;
  target_quantity: number | null;
  is_active: boolean | null;
  grocery_pushed: boolean | null;
  created_at?: string;
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function AutoConsumptionPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [items, setItems] = useState<AutoConsumptionItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [storeId, setStoreId] = useState("");
  const [thresholdPercentage, setThresholdPercentage] = useState(25);
  const [targetQuantity, setTargetQuantity] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Other");
  const [editStoreId, setEditStoreId] = useState("");
  const [editThresholdPercentage, setEditThresholdPercentage] = useState(25);
  const [editTargetQuantity, setEditTargetQuantity] = useState(1);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/");
        return;
      }

      if (!mounted) return;
      setUserId(session.user.id);

      await Promise.all([
        fetchStores(session.user.id),
        fetchAutoItems(session.user.id),
      ]);

      if (mounted) setLoading(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function fetchStores(uid: string) {
    const { data, error } = await supabase
      .from("stores")
      .select("id, name")
      .eq("user_id", uid)
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setStores((data || []) as StoreType[]);
  }

  async function fetchAutoItems(uid: string) {
    const { data, error } = await supabase
      .from("auto_consumption_items")
      .select(
        "id, name, category, store_id, threshold_percentage, current_quantity, target_quantity, is_active, grocery_pushed, created_at"
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setItems((data || []) as AutoConsumptionItem[]);
  }

  function getStoreName(storeIdValue: string | null) {
    if (!storeIdValue) return "No store";
    return stores.find((s) => s.id === storeIdValue)?.name || "Unknown store";
  }

  function getCurrentQuantity(item: AutoConsumptionItem) {
    return Math.max(0, safeNumber(item.current_quantity, 0));
  }

  function getTargetQuantity(item: AutoConsumptionItem) {
    return Math.max(1, safeNumber(item.target_quantity, 1));
  }

  function getStockPercentage(item: AutoConsumptionItem) {
    const current = getCurrentQuantity(item);
    const target = getTargetQuantity(item);
    return clamp(Math.round((current / target) * 100), 0, 999);
  }

  function isReadyForGrocery(item: AutoConsumptionItem) {
    const threshold = safeNumber(item.threshold_percentage, 25);
    return getStockPercentage(item) <= threshold;
  }

  async function ensureGrocerySync(
    item: AutoConsumptionItem,
    nextCurrentQty?: number,
    nextTargetQty?: number
  ) {
    if (!userId) return;

    const threshold = safeNumber(item.threshold_percentage, 25);
    const current = Math.max(
      0,
      nextCurrentQty ?? safeNumber(item.current_quantity, 0)
    );
    const target = Math.max(
      1,
      nextTargetQty ?? safeNumber(item.target_quantity, 1)
    );
    const percentage = clamp(Math.round((current / target) * 100), 0, 999);
    const shouldPush = percentage <= threshold;

    if (shouldPush) {
      const { data: existing } = await supabase
        .from("grocery_items")
        .select("id")
        .eq("user_id", userId)
        .eq("name", item.name)
        .eq("completed", false)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("grocery_items").insert({
          user_id: userId,
          name: item.name,
          category: item.category || "Other",
          store_id: item.store_id,
          completed: false,
        });
      }

      await supabase
        .from("auto_consumption_items")
        .update({ grocery_pushed: true })
        .eq("id", item.id);

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, grocery_pushed: true } : it
        )
      );
    } else {
      await supabase
        .from("auto_consumption_items")
        .update({ grocery_pushed: false })
        .eq("id", item.id);

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, grocery_pushed: false } : it
        )
      );
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanTarget = Math.max(1, Math.floor(targetQuantity));

    if (!cleanName) {
      setSaving(false);
      setError("Please enter a product name.");
      return;
    }

    const payload = {
      user_id: userId,
      name: cleanName,
      category,
      store_id: storeId || null,
      threshold_percentage: thresholdPercentage,
      current_quantity: cleanTarget,
      target_quantity: cleanTarget,
      is_active: true,
      grocery_pushed: false,
    };

    const { data, error } = await supabase
      .from("auto_consumption_items")
      .insert(payload)
      .select(
        "id, name, category, store_id, threshold_percentage, current_quantity, target_quantity, is_active, grocery_pushed, created_at"
      )
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data) {
      setItems((prev) => [data as AutoConsumptionItem, ...prev]);
      setName("");
      setCategory("Other");
      setStoreId("");
      setThresholdPercentage(25);
      setTargetQuantity(1);
      setSuccess("Item added successfully.");
    }
  }

  function startEdit(item: AutoConsumptionItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category || "Other");
    setEditStoreId(item.store_id || "");
    setEditThresholdPercentage(safeNumber(item.threshold_percentage, 25));
    setEditTargetQuantity(getTargetQuantity(item));
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditCategory("Other");
    setEditStoreId("");
    setEditThresholdPercentage(25);
    setEditTargetQuantity(1);
  }

  async function saveEdit(item: AutoConsumptionItem) {
    const cleanName = editName.trim();
    const cleanTarget = Math.max(1, Math.floor(editTargetQuantity));

    if (!cleanName) {
      setError("Please enter a product name.");
      return;
    }

    const updatePayload = {
      name: cleanName,
      category: editCategory,
      store_id: editStoreId || null,
      threshold_percentage: editThresholdPercentage,
      target_quantity: cleanTarget,
      current_quantity: Math.min(getCurrentQuantity(item), cleanTarget),
    };

    const { error } = await supabase
      .from("auto_consumption_items")
      .update(updatePayload)
      .eq("id", item.id);

    if (error) {
      setError(error.message);
      return;
    }

    const updatedItem: AutoConsumptionItem = {
      ...item,
      ...updatePayload,
    };

    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? updatedItem : it))
    );

    await ensureGrocerySync(
      updatedItem,
      updatePayload.current_quantity,
      updatePayload.target_quantity
    );

    cancelEdit();
    setSuccess("Item updated successfully.");
  }

  async function deleteItem(itemId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this auto-consumption item?"
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("auto_consumption_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      setError(error.message);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setSuccess("Item deleted successfully.");
  }

  async function toggleActive(item: AutoConsumptionItem) {
    const nextValue = !(item.is_active ?? true);

    const { error } = await supabase
      .from("auto_consumption_items")
      .update({ is_active: nextValue })
      .eq("id", item.id);

    if (error) {
      setError(error.message);
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, is_active: nextValue } : it
      )
    );
  }

  async function updateCurrentQuantity(item: AutoConsumptionItem, nextQty: number) {
    const cleanQty = clamp(Math.floor(nextQty), 0, getTargetQuantity(item));

    const { error } = await supabase
      .from("auto_consumption_items")
      .update({ current_quantity: cleanQty })
      .eq("id", item.id);

    if (error) {
      setError(error.message);
      return;
    }

    const updatedItem = { ...item, current_quantity: cleanQty };
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? updatedItem : it))
    );

    await ensureGrocerySync(updatedItem, cleanQty, getTargetQuantity(item));
  }

  async function updateTargetQuantity(item: AutoConsumptionItem, nextTarget: number) {
    const cleanTarget = Math.max(1, Math.floor(nextTarget));
    const adjustedCurrent = Math.min(getCurrentQuantity(item), cleanTarget);

    const { error } = await supabase
      .from("auto_consumption_items")
      .update({
        target_quantity: cleanTarget,
        current_quantity: adjustedCurrent,
      })
      .eq("id", item.id);

    if (error) {
      setError(error.message);
      return;
    }

    const updatedItem = {
      ...item,
      target_quantity: cleanTarget,
      current_quantity: adjustedCurrent,
    };

    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? updatedItem : it))
    );

    await ensureGrocerySync(updatedItem, adjustedCurrent, cleanTarget);
  }

  const readyCount = useMemo(
    () => items.filter((item) => isReadyForGrocery(item)).length,
    [items]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0b1533_0%,_#050816_45%,_#02040c_100%)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-white/70">Loading auto-consumption...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0b1533_0%,_#050816_45%,_#02040c_100%)] text-white">
      <div className="border-b border-white/10 bg-[#071129]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg shadow-blue-500/10">
              <span className="text-lg font-bold">AVO</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">AVO</h1>
              <p className="text-sm text-white/60">Premium grocery planner</p>
            </div>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              <Home size={18} />
              Dashboard
            </Link>
            <Link
              href="/grocery"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              <ShoppingCart size={18} />
              Grocery
            </Link>
            <Link
              href="/auto-consumption"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10"
            >
              <Sparkles size={18} />
              Auto Consumption
            </Link>
            <Link
              href="/stores"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              <Warehouse size={18} />
              Stores
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {(error || success) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold tracking-tight">
                Add new item
              </h2>
              <p className="mt-2 text-white/60">
                Trigger by remaining stock percentage based on quantity.
              </p>
            </div>

            <form onSubmit={handleAddItem} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Product name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Milk"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-blue-400/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none focus:border-blue-400/50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Store
                </label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none focus:border-blue-400/50"
                >
                  <option value="" className="bg-slate-900">
                    No store
                  </option>
                  {stores.map((store) => (
                    <option
                      key={store.id}
                      value={store.id}
                      className="bg-slate-900"
                    >
                      {store.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-white/45">
                  Select one of your saved stores.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Threshold percentage
                </label>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={thresholdPercentage}
                    onChange={(e) =>
                      setThresholdPercentage(Number(e.target.value))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20"
                  />
                  <div className="min-w-[88px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center font-semibold">
                    {thresholdPercentage}%
                  </div>
                </div>

                <p className="mt-3 text-sm text-white/45">
                  When stock falls below {thresholdPercentage}%, the item can be
                  pushed to Grocery.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Target stock quantity
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setTargetQuantity((prev) => Math.max(1, prev - 1))
                    }
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                  >
                    <Minus size={18} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    value={targetQuantity}
                    onChange={(e) =>
                      setTargetQuantity(
                        Math.max(1, safeNumber(e.target.value, 1))
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-lg font-semibold outline-none focus:border-blue-400/50"
                  />

                  <button
                    type="button"
                    onClick={() => setTargetQuantity((prev) => prev + 1)}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <p className="mt-3 text-sm text-white/45">
                  New items start full, so current stock will initially match the
                  target quantity.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-semibold text-slate-900 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} />
                {saving ? "Adding..." : "Add item"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Your auto-consumption items
                </h2>
                <p className="mt-2 text-white/60">
                  Quantity-based stock tracking with automatic grocery trigger.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <CheckCircle2 size={16} />
                {readyCount} ready for Grocery
              </div>
            </div>

            <div className="space-y-5">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-white/55">
                  No auto-consumption items yet.
                </div>
              ) : (
                items.map((item) => {
                  const stockPercentage = getStockPercentage(item);
                  const currentQty = getCurrentQuantity(item);
                  const targetQty = getTargetQuantity(item);
                  const ready = isReadyForGrocery(item);
                  const active = item.is_active ?? true;

                  return (
                    <div
                      key={item.id}
                      className="rounded-[28px] border border-white/10 bg-white/5 p-5"
                    >
                      {editingId === item.id ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm text-white/75">
                                Product name
                              </label>
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none focus:border-blue-400/50"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm text-white/75">
                                Category
                              </label>
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none focus:border-blue-400/50"
                              >
                                {categories.map((cat) => (
                                  <option
                                    key={cat}
                                    value={cat}
                                    className="bg-slate-900"
                                  >
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm text-white/75">
                                Store
                              </label>
                              <select
                                value={editStoreId}
                                onChange={(e) => setEditStoreId(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none focus:border-blue-400/50"
                              >
                                <option value="" className="bg-slate-900">
                                  No store
                                </option>
                                {stores.map((store) => (
                                  <option
                                    key={store.id}
                                    value={store.id}
                                    className="bg-slate-900"
                                  >
                                    {store.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm text-white/75">
                                Threshold %
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={editThresholdPercentage}
                                onChange={(e) =>
                                  setEditThresholdPercentage(
                                    clamp(
                                      safeNumber(e.target.value, 25),
                                      0,
                                      100
                                    )
                                  )
                                }
                                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none focus:border-blue-400/50"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-white/75">
                              Target stock quantity
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditTargetQuantity((prev) =>
                                    Math.max(1, prev - 1)
                                  )
                                }
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                              >
                                <Minus size={16} />
                              </button>

                              <input
                                type="number"
                                min={1}
                                value={editTargetQuantity}
                                onChange={(e) =>
                                  setEditTargetQuantity(
                                    Math.max(
                                      1,
                                      safeNumber(e.target.value, 1)
                                    )
                                  )
                                }
                                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center font-semibold outline-none focus:border-blue-400/50"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setEditTargetQuantity((prev) => prev + 1)
                                }
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => saveEdit(item)}
                              className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 transition hover:scale-[1.01]"
                            >
                              Save changes
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-medium text-white/80 transition hover:bg-white/15"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="flex min-w-0 gap-4">
                              <button
                                type="button"
                                onClick={() => toggleActive(item)}
                                className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                  active
                                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                    : "border-white/10 bg-white/5 text-white/40"
                                }`}
                                title={active ? "Active" : "Inactive"}
                              >
                                <CheckCircle2 size={16} />
                              </button>

                              <div className="min-w-0">
                                <h3 className="truncate text-2xl font-semibold tracking-tight">
                                  {item.name}
                                </h3>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                                    {item.category || "Other"}
                                  </span>

                                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                                    Threshold {safeNumber(item.threshold_percentage, 25)}%
                                  </span>

                                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                                    Stock {stockPercentage}%
                                  </span>

                                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                                    {getStoreName(item.store_id)}
                                  </span>

                                  <span
                                    className={`rounded-full px-4 py-2 text-sm ${
                                      active
                                        ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                                        : "border border-white/10 bg-white/5 text-white/60"
                                    }`}
                                  >
                                    {active ? "Active" : "Inactive"}
                                  </span>

                                  {ready && (
                                    <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
                                      Ready for Grocery
                                    </span>
                                  )}

                                  {item.grocery_pushed && (
                                    <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
                                      Sent to Grocery
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                              >
                                <Pencil size={20} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-red-500/15"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
                            <div className="grid gap-5 lg:grid-cols-2">
                              <div>
                                <p className="text-lg font-medium text-white/90">
                                  Current stock
                                </p>
                                <p className="mt-1 text-sm text-white/45">
                                  Update the quantity with numeric controls.
                                </p>

                                <div className="mt-4 flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCurrentQuantity(item, currentQty - 1)
                                    }
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                                  >
                                    <ChevronLeft size={18} />
                                  </button>

                                  <input
                                    type="number"
                                    min={0}
                                    max={targetQty}
                                    value={currentQty}
                                    onChange={(e) =>
                                      updateCurrentQuantity(
                                        item,
                                        safeNumber(e.target.value, currentQty)
                                      )
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-xl font-semibold outline-none focus:border-blue-400/50"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCurrentQuantity(item, currentQty + 1)
                                    }
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                                  >
                                    <ChevronRight size={18} />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <p className="text-lg font-medium text-white/90">
                                  Target stock
                                </p>
                                <p className="mt-1 text-sm text-white/45">
                                  Modify each item’s ideal quantity individually.
                                </p>

                                <div className="mt-4 flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateTargetQuantity(item, targetQty - 1)
                                    }
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                                  >
                                    <Minus size={18} />
                                  </button>

                                  <input
                                    type="number"
                                    min={1}
                                    value={targetQty}
                                    onChange={(e) =>
                                      updateTargetQuantity(
                                        item,
                                        safeNumber(e.target.value, targetQty)
                                      )
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-xl font-semibold outline-none focus:border-blue-400/50"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateTargetQuantity(item, targetQty + 1)
                                    }
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
                                  >
                                    <Plus size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
