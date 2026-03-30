"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Pencil,
  Plus,
  RotateCw,
  Save,
  Sparkles,
  Store,
  Trash2,
  X,
  CalendarClock,
} from "lucide-react";

type StoreType = {
  id: string;
  name: string;
};

type AutoConsumptionRule = {
  id: string;
  product_name: string;
  category: string | null;
  store_id: string | null;
  frequency_days: number | null;
  last_generated_at: string | null;
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

export default function AutoConsumptionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<AutoConsumptionRule[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Other");
  const [storeId, setStoreId] = useState("");
  const [frequencyDays, setFrequencyDays] = useState("7");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editCategory, setEditCategory] = useState("Other");
  const [editStoreId, setEditStoreId] = useState("");
  const [editFrequencyDays, setEditFrequencyDays] = useState("7");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [{ data: rulesData, error: rulesError }, { data: storesData, error: storesError }] =
        await Promise.all([
          supabase.from("auto_consumption_rules").select("*").order("created_at", { ascending: false }),
          supabase.from("stores").select("*").order("name", { ascending: true }),
        ]);

      if (rulesError) throw rulesError;
      if (storesError) throw storesError;

      setRules((rulesData as AutoConsumptionRule[]) || []);
      setStores((storesData as StoreType[]) || []);
    } catch (error) {
      console.error("Error fetching auto consumption data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    if (!productName.trim()) return;

    try {
      setSaving(true);

      const payload = {
        product_name: productName.trim(),
        category,
        store_id: storeId || null,
        frequency_days: Number(frequencyDays) || 7,
        last_generated_at: null,
      };

      const { data, error } = await supabase
        .from("auto_consumption_rules")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setRules((prev) => [data as AutoConsumptionRule, ...prev]);
      setProductName("");
      setCategory("Other");
      setStoreId("");
      setFrequencyDays("7");
    } catch (error) {
      console.error("Error adding auto consumption rule:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase.from("auto_consumption_rules").delete().eq("id", id);
      if (error) throw error;

      setRules((prev) => prev.filter((rule) => rule.id !== id));
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const startEdit = (rule: AutoConsumptionRule) => {
    setEditingId(rule.id);
    setEditProductName(rule.product_name);
    setEditCategory(rule.category || "Other");
    setEditStoreId(rule.store_id || "");
    setEditFrequencyDays(String(rule.frequency_days || 7));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditProductName("");
    setEditCategory("Other");
    setEditStoreId("");
    setEditFrequencyDays("7");
  };

  const saveEdit = async () => {
    if (!editingId || !editProductName.trim()) return;

    try {
      const updates = {
        product_name: editProductName.trim(),
        category: editCategory,
        store_id: editStoreId || null,
        frequency_days: Number(editFrequencyDays) || 7,
      };

      const { error } = await supabase
        .from("auto_consumption_rules")
        .update(updates)
        .eq("id", editingId);

      if (error) throw error;

      setRules((prev) =>
        prev.map((rule) =>
          rule.id === editingId
            ? {
                ...rule,
                product_name: editProductName.trim(),
                category: editCategory,
                store_id: editStoreId || null,
                frequency_days: Number(editFrequencyDays) || 7,
              }
            : rule
        )
      );

      cancelEdit();
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const generateNow = async (rule: AutoConsumptionRule) => {
    try {
      const insertPayload = {
        name: rule.product_name,
        category: rule.category || "Other",
        store_id: rule.store_id || null,
        completed: false,
      };

      const { error: insertError } = await supabase.from("grocery_items").insert([insertPayload]);
      if (insertError) throw insertError;

      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("auto_consumption_rules")
        .update({ last_generated_at: nowIso })
        .eq("id", rule.id);

      if (updateError) throw updateError;

      setRules((prev) =>
        prev.map((item) =>
          item.id === rule.id ? { ...item, last_generated_at: nowIso } : item
        )
      );
    } catch (error) {
      console.error("Error generating grocery item:", error);
    }
  };

  const getStoreName = (value: string | null) => {
    if (!value) return "No store";
    return stores.find((store) => store.id === value)?.name || "Unknown store";
  };

  const formatLastGenerated = (value: string | null) => {
    if (!value) return "Never generated";
    return new Date(value).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
              <Sparkles size={14} />
              Auto Consumption
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Automate recurring grocery items
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Create recurring product rules and generate grocery items faster with category and
              store already assigned.
            </p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Add new rule</h2>
              <p className="text-sm text-white/60">Create a recurring grocery pattern</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">Product name</label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
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

              <div>
                <label className="mb-2 block text-sm text-white/70">Frequency (days)</label>
                <input
                  type="number"
                  min="1"
                  value={frequencyDays}
                  onChange={(e) => setFrequencyDays(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <button
                onClick={addRule}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1020] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Plus size={16} />
                {saving ? "Saving..." : "Add rule"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Your auto-consumption rules</h2>
              <p className="text-sm text-white/60">Generate products into grocery list instantly</p>
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Loading rules...</p>
            ) : rules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
                No auto-consumption rules yet.
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => {
                  const isEditing = editingId === rule.id;

                  return (
                    <div
                      key={rule.id}
                      className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            value={editProductName}
                            onChange={(e) => setEditProductName(e.target.value)}
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

                          <input
                            type="number"
                            min="1"
                            value={editFrequencyDays}
                            onChange={(e) => setEditFrequencyDays(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                          />

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              onClick={saveEdit}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1020]"
                            >
                              <Save size={15} />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
                            >
                              <X size={15} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {rule.product_name}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">
                                {rule.category || "Other"}
                              </span>

                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white/70">
                                <Store size={12} />
                                {getStoreName(rule.store_id)}
                              </span>

                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white/70">
                                <CalendarClock size={12} />
                                Every {rule.frequency_days || 7} days
                              </span>
                            </div>

                            <p className="mt-3 text-xs text-white/45">
                              Last generated: {formatLastGenerated(rule.last_generated_at)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => generateNow(rule)}
                              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1020] transition hover:scale-[1.01]"
                            >
                              <RotateCw size={15} />
                              Generate now
                            </button>

                            <button
                              onClick={() => startEdit(rule)}
                              className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white/80 transition hover:bg-white/15"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white/80 transition hover:bg-red-500/20 hover:text-red-300"
                            >
                              <Trash2 size={16} />
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
        </section>
      </div>
    </main>
  );
}
