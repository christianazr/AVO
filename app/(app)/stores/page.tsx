"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Plus, Save, Sparkles, Store, Trash2, X } from "lucide-react";

type StoreType = {
  id: string;
  name: string;
  created_at?: string;
};

export default function StoresPage() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);

  const [newStoreName, setNewStoreName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const addStore = async () => {
    if (!newStoreName.trim()) return;

    try {
      const { data, error } = await supabase
        .from("stores")
        .insert([{ name: newStoreName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setStores((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewStoreName("");
    } catch (error) {
      console.error("Error adding store:", error);
    }
  };

  const startEdit = (store: StoreType) => {
    setEditingId(store.id);
    setEditingName(store.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    try {
      const { error } = await supabase
        .from("stores")
        .update({ name: editingName.trim() })
        .eq("id", editingId);

      if (error) throw error;

      setStores((prev) =>
        prev
          .map((store) =>
            store.id === editingId ? { ...store, name: editingName.trim() } : store
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      cancelEdit();
    } catch (error) {
      console.error("Error updating store:", error);
    }
  };

  const deleteStore = async (id: string) => {
    try {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;

      setStores((prev) => prev.filter((store) => store.id !== id));
    } catch (error) {
      console.error("Error deleting store:", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
              <Sparkles size={14} />
              Store Management
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Organise your stores
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Create, rename and delete supermarkets or favourite shopping places to keep your
              grocery planning structured.
            </p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Add new store</h2>
              <p className="text-sm text-white/60">Create a supermarket or shop</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">Store name</label>
                <input
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Tesco"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>

              <button
                onClick={addStore}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1020] transition hover:scale-[1.01]"
              >
                <Plus size={16} />
                Add store
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">All stores</h2>
              <p className="text-sm text-white/60">Manage your saved list of stores</p>
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Loading stores...</p>
            ) : stores.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
                No stores yet.
              </div>
            ) : (
              <div className="space-y-3">
                {stores.map((store) => {
                  const isEditing = editingId === store.id;

                  return (
                    <div
                      key={store.id}
                      className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
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
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/80">
                              <Store size={18} />
                            </div>
                            <p className="truncate text-sm font-medium text-white">{store.name}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(store)}
                              className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white/80 transition hover:bg-white/15"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => deleteStore(store.id)}
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
