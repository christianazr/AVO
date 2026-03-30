"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Sparkles,
  RefreshCw,
} from "lucide-react";

type Store = {
  id: string;
  name: string;
};

type TrackedItem = {
  id: string;
  user_id: string;
  item_name: string;
  store_id: string | null;
  current_stock: number;
  target_stock: number;
  threshold_percent: number;
  auto_add_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

type GroceryItem = {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  store_id: string | null;
  status: string;
  source?: string | null;
  auto_generated?: boolean | null;
};

type AutoAddResult = {
  inserted: boolean;
  reason:
    | "inserted"
    | "already_exists"
    | "above_threshold"
    | "auto_add_disabled"
    | "invalid_target"
    | "error";
};

export default function AutoConsumptionPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [stores, setStores] = useState<Store[]>([]);
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);

  const [itemName, setItemName] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
  const [targetStock, setTargetStock] = useState("1");
  const [thresholdPercent, setThresholdPercent] = useState("25");
  const [autoAddEnabled, setAutoAddEnabled] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editStoreId, setEditStoreId] = useState("");
  const [editCurrentStock, setEditCurrentStock] = useState("0");
  const [editTargetStock, setEditTargetStock] = useState("1");
  const [editThresholdPercent, setEditThresholdPercent] = useState("25");
  const [editAutoAddEnabled, setEditAutoAddEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

      await Promise.all([
        loadStores(uid),
        loadTrackedItems(uid),
        loadGroceryItems(uid),
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load auto-consumption page.");
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

  async function loadTrackedItems(uid: string) {
    const { data, error } = await supabase
      .from("auto_consumption_items")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setTrackedItems((data || []) as TrackedItem[]);
  }

  async function loadGroceryItems(uid: string) {
    const { data, error } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setGroceryItems((data || []) as GroceryItem[]);
  }

  function clearForm() {
    setItemName("");
    setSelectedStoreId("");
    setCurrentStock("0");
    setTargetStock("1");
    setThresholdPercent("25");
    setAutoAddEnabled(true);
  }

  function resetEditForm() {
    setEditingId(null);
    setEditItemName("");
    setEditStoreId("");
    setEditCurrentStock("0");
    setEditTargetStock("1");
    setEditThresholdPercent("25");
    setEditAutoAddEnabled(true);
  }

  function getStoreName(storeId: string | null) {
    if (!storeId) return "No store selected";
    const store = stores.find((s) => s.id === storeId);
    return store?.name || "Unknown store";
  }

  function getStockPercent(current: number, target: number) {
    if (!target || target <= 0) return 0;
    return Math.round((current / target) * 100);
  }

  function getSuggestedPurchase(current: number, target: number) {
    const diff = target - current;
    return diff > 0 ? diff : 0;
  }

  function getStatus(item: TrackedItem) {
    const stockPercent = getStockPercent(item.current_stock, item.target_stock);

    if (stockPercent <= item.threshold_percent) {
      return {
        label: "Low",
        tone: "bg-red-500/15 text-red-300 border border-red-500/20",
        barClass: "bg-red-400",
      };
    }

    if (stockPercent <= item.threshold_percent + 20) {
      return {
        label: "Watch",
        tone: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
        barClass: "bg-amber-400",
      };
    }

    return {
      label: "Healthy",
      tone: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
      barClass: "bg-emerald-400",
    };
  }

  async function maybeAutoAddToGroceryList(
    item: TrackedItem
  ): Promise<AutoAddResult> {
    try {
      if (!item.auto_add_enabled) {
        console.log("Auto add disabled for:", item.item_name);
        return { inserted: false, reason: "auto_add_disabled" };
      }

      const target = Number(item.target_stock || 0);
      const current = Number(item.current_stock || 0);
      const threshold = Number(item.threshold_percent || 0);

      if (target <= 0) {
        console.log("Invalid target stock for:", item.item_name);
        return { inserted: false, reason: "invalid_target" };
      }

      const stockPercent = (current / target) * 100;

      console.log("Auto-add check", {
        item: item.item_name,
        current,
        target,
        threshold,
        stockPercent,
        store_id: item.store_id,
        user_id: item.user_id,
      });

      if (stockPercent > threshold) {
        console.log("Above threshold, not adding:", item.item_name);
        return { inserted: false, reason: "above_threshold" };
      }

      const suggestedQty = Math.max(target - current, 1);

      const { data: existing, error: existingError } = await supabase
        .from("grocery_items")
        .select("id")
        .eq("user_id", item.user_id)
        .eq("name", item.item_name)
        .eq("store_id", item.store_id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        console.error("Error checking existing grocery item:", existingError);
        throw existingError;
      }

      if (existing) {
        console.log("Pending grocery item already exists for:", item.item_name);
        return { inserted: false, reason: "already_exists" };
      }

      const insertPayload = {
        user_id: item.user_id,
        name: item.item_name,
        quantity: suggestedQty,
        store_id: item.store_id,
        status: "pending",
        source: "auto_consumption",
        auto_generated: true,
      };

      console.log("Inserting grocery item:", insertPayload);

      const { data: insertedRow, error: insertError } = await supabase
        .from("grocery_items")
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error("Insert grocery item failed:", insertError);
        throw insertError;
      }

      console.log("Inserted grocery item successfully:", insertedRow);

      return { inserted: true, reason: "inserted" };
    } catch (err: any) {
      console.error("Auto-add to grocery list failed:", err);
      setError(err?.message || "Automatic grocery insert failed.");
      return { inserted: false, reason: "error" };
    }
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

    const parsedCurrent = Number(currentStock);
    const parsedTarget = Number(targetStock);
    const parsedThreshold = Number(thresholdPercent);

    if (Number.isNaN(parsedCurrent) || parsedCurrent < 0) {
      setError("Current stock must be 0 or higher.");
      return;
    }

    if (Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      setError("Target stock must be greater than 0.");
      return;
    }

    if (
      Number.isNaN(parsedThreshold) ||
      parsedThreshold < 0 ||
      parsedThreshold > 100
    ) {
      setError("Threshold must be between 0 and 100.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        user_id: userId,
        item_name: itemName.trim(),
        store_id: selectedStoreId || null,
        current_stock: parsedCurrent,
        target_stock: parsedTarget,
        threshold_percent: parsedThreshold,
        auto_add_enabled: autoAddEnabled,
      };

      const { data, error } = await supabase
        .from("auto_consumption_items")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      const createdItem = data as TrackedItem;

      const autoAddResult = await maybeAutoAddToGroceryList(createdItem);

      await Promise.all([loadTrackedItems(userId), loadGroceryItems(userId)]);

      clearForm();

      if (autoAddResult.inserted) {
        setMessage("Tracked item added and pushed to grocery list.");
      } else if (autoAddResult.reason === "already_exists") {
        setMessage("Tracked item added. Grocery item was already pending.");
      } else if (autoAddResult.reason === "above_threshold") {
        setMessage(
          "Tracked item added. Stock is above threshold, so it was not pushed."
        );
      } else {
        setMessage("Tracked item added.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not add tracked item.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item: TrackedItem) {
    setEditingId(item.id);
    setEditItemName(item.item_name);
    setEditStoreId(item.store_id || "");
    setEditCurrentStock(String(item.current_stock));
    setEditTargetStock(String(item.target_stock));
    setEditThresholdPercent(String(item.threshold_percent));
    setEditAutoAddEnabled(item.auto_add_enabled);
    setError("");
    setMessage("");
  }

  async function handleSaveEdit(id: string) {
    if (!userId) {
      setError("Auth session missing!");
      return;
    }

    if (!editItemName.trim()) {
      setError("Please enter an item name.");
      return;
    }

    const parsedCurrent = Number(editCurrentStock);
    const parsedTarget = Number(editTargetStock);
    const parsedThreshold = Number(editThresholdPercent);

    if (Number.isNaN(parsedCurrent) || parsedCurrent < 0) {
      setError("Current stock must be 0 or higher.");
      return;
    }

    if (Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      setError("Target stock must be greater than 0.");
      return;
    }

    if (
      Number.isNaN(parsedThreshold) ||
      parsedThreshold < 0 ||
      parsedThreshold > 100
    ) {
      setError("Threshold must be between 0 and 100.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { data, error } = await supabase
        .from("auto_consumption_items")
        .update({
          item_name: editItemName.trim(),
          store_id: editStoreId || null,
          current_stock: parsedCurrent,
          target_stock: parsedTarget,
          threshold_percent: parsedThreshold,
          auto_add_enabled: editAutoAddEnabled,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const updatedItem = data as TrackedItem;

      const autoAddResult = await maybeAutoAddToGroceryList(updatedItem);

      await Promise.all([loadTrackedItems(userId), loadGroceryItems(userId)]);

      resetEditForm();

      if (autoAddResult.inserted) {
        setMessage("Tracked item updated and pushed to grocery list.");
      } else if (autoAddResult.reason === "already_exists") {
        setMessage("Tracked item updated. Grocery item was already pending.");
      } else if (autoAddResult.reason === "above_threshold") {
        setMessage(
          "Tracked item updated. Stock is above threshold, so it was not pushed."
        );
      } else {
        setMessage("Tracked item updated successfully.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not update tracked item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!userId) {
      setError("Auth session missing!");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this tracked item?"
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { error } = await supabase
        .from("auto_consumption_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadTrackedItems(userId);

      if (editingId === id) resetEditForm();

      setMessage("Tracked item deleted successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not delete tracked item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleManualRefresh() {
    if (!userId) {
      setError("Auth session missing!");
      return;
    }

    try {
      setRefreshing(true);
      setError("");
      setMessage("");

      await Promise.all([loadTrackedItems(userId), loadGroceryItems(userId)]);
      setMessage("Data refreshed.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not refresh data.");
    } finally {
      setRefreshing(false);
    }
  }

  const summary = useMemo(() => {
    const total = trackedItems.length;
    const belowThreshold = trackedItems.filter((item) => {
      const pct = getStockPercent(item.current_stock, item.target_stock);
      return pct <= item.threshold_percent;
    }).length;
    const autoEnabled = trackedItems.filter(
      (item) => item.auto_add_enabled
    ).length;

    return {
      total,
      belowThreshold,
      autoEnabled,
    };
  }, [trackedItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded-xl bg-white/10" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-28 rounded-3xl bg-white/5" />
              <div className="h-28 rounded-3xl bg-white/5" />
              <div className="h-28 rounded-3xl bg-white/5" />
            </div>
            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="h-[620px] rounded-3xl bg-white/5" />
              <div className="h-[620px] rounded-3xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-120px] top-[120px] h-[300px] w-[300px] rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[20%] h-[280px] w-[280px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Smart household stock tracking
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Auto-consumption
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base">
              Track home stock levels and automatically push low items into your
              grocery list before you run out.
            </p>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Tracked items</span>
              <Package className="h-5 w-5 text-white/50" />
            </div>
            <div className="text-3xl font-semibold">{summary.total}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Below threshold</span>
              <AlertTriangle className="h-5 w-5 text-red-300/80" />
            </div>
            <div className="text-3xl font-semibold">{summary.belowThreshold}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Auto-add enabled</span>
              <ShoppingCart className="h-5 w-5 text-emerald-300/80" />
            </div>
            <div className="text-3xl font-semibold">{summary.autoEnabled}</div>
          </div>
        </div>

        {(message || error) && (
          <div className="mb-6 space-y-3">
            {message && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Add tracked item</h2>
              <p className="mt-1 text-sm text-white/55">
                Set your target stock and auto-add rules.
              </p>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">Item name</label>
                <input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Milk"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-black/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Store</label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20 focus:bg-black/60"
                >
                  <option value="">No store selected</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Current stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20 focus:bg-black/60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Target stock
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetStock}
                    onChange={(e) => setTargetStock(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20 focus:bg-black/60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Threshold %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholdPercent}
                  onChange={(e) => setThresholdPercent(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20 focus:bg-black/60"
                />
                <p className="mt-2 text-xs leading-relaxed text-white/40">
                  Example: if threshold is 25, the item is auto-added when current
                  stock is 25% or less of target stock.
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                <input
                  type="checkbox"
                  checked={autoAddEnabled}
                  onChange={(e) => setAutoAddEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black"
                />
                <span className="text-sm text-white/85">
                  Enable automatic add to grocery list
                </span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {saving ? "Saving..." : "Add item"}
              </button>
            </form>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Tracked items</h2>
                <p className="mt-1 text-sm text-white/55">
                  Items will be added automatically when stock reaches the threshold.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                {trackedItems.length} items
              </div>
            </div>

            {trackedItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 px-6 py-12 text-center">
                <Package className="mx-auto mb-4 h-10 w-10 text-white/25" />
                <h3 className="text-lg font-medium">No tracked items yet</h3>
                <p className="mt-2 text-sm text-white/45">
                  Add your first product on the left to start tracking stock levels.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {trackedItems.map((item) => {
                  const stockPercent = getStockPercent(
                    item.current_stock,
                    item.target_stock
                  );
                  const suggestedPurchase = getSuggestedPurchase(
                    item.current_stock,
                    item.target_stock
                  );
                  const status = getStatus(item);
                  const isEditing = editingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-white/10 bg-black/25 p-4 sm:p-5"
                    >
                      {!isEditing ? (
                        <>
                          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-semibold tracking-tight">
                                  {item.item_name}
                                </h3>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.tone}`}
                                >
                                  {status.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
                                <span>Store: {getStoreName(item.store_id)}</span>
                                <span>Current: {item.current_stock}</span>
                                <span>Target: {item.target_stock}</span>
                                <span>Stock %: {stockPercent}%</span>
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <button
                                onClick={() => startEditing(item)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 transition hover:bg-red-500/15"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${status.barClass}`}
                              style={{ width: `${Math.min(stockPercent, 100)}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/55">
                            <span>Threshold: {item.threshold_percent}%</span>
                            <span>Suggested purchase: {suggestedPurchase}</span>
                            <span>
                              Auto add: {item.auto_add_enabled ? "Enabled" : "Disabled"}
                            </span>
                            <span>
                              Pending in grocery list:{" "}
                              {groceryItems.some(
                                (g) =>
                                  g.name === item.item_name &&
                                  g.store_id === item.store_id &&
                                  g.status === "pending"
                              )
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm text-white/70">
                                Item name
                              </label>
                              <input
                                value={editItemName}
                                onChange={(e) => setEditItemName(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm text-white/70">
                                Store
                              </label>
                              <select
                                value={editStoreId}
                                onChange={(e) => setEditStoreId(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20"
                              >
                                <option value="">No store selected</option>
                                {stores.map((store) => (
                                  <option key={store.id} value={store.id}>
                                    {store.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <label className="mb-2 block text-sm text-white/70">
                                Current stock
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={editCurrentStock}
                                onChange={(e) => setEditCurrentStock(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm text-white/70">
                                Target stock
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={editTargetStock}
                                onChange={(e) => setEditTargetStock(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm text-white/70">
                                Threshold %
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editThresholdPercent}
                                onChange={(e) => setEditThresholdPercent(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/20"
                              />
                            </div>
                          </div>

                          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                            <input
                              type="checkbox"
                              checked={editAutoAddEnabled}
                              onChange={(e) => setEditAutoAddEnabled(e.target.checked)}
                              className="h-4 w-4 rounded border-white/20 bg-black"
                            />
                            <span className="text-sm text-white/85">
                              Enable automatic add to grocery list
                            </span>
                          </label>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={saving}
                              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Save changes
                            </button>

                            <button
                              onClick={resetEditForm}
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
