"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Star,
  Trash2,
  Store,
  LogOut,
} from "lucide-react";

type UserStore = {
  id: string;
  user_id: string;
  name: string;
  is_favorite: boolean;
  created_at: string;
};

export default function StoresPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [stores, setStores] = useState<UserStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStore, setNewStore] = useState("");

  useEffect(() => {
    const loadStores = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      setStores(data ?? []);
      setLoading(false);
    };

    loadStores();
  }, [router]);

  const favoriteCount = useMemo(
    () => stores.filter((store) => store.is_favorite).length,
    [stores]
  );

  const addStore = async () => {
    const cleanName = newStore.trim();
    if (!cleanName || !userId || saving) return;

    const exists = stores.some(
      (store) => store.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("stores")
      .insert({
        user_id: userId,
        name: cleanName,
        is_favorite: false,
      })
      .select()
      .single();

    if (!error && data) {
      setStores((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewStore("");
    }

    setSaving(false);
  };

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    const previousStores = stores;
    const nextStores = stores.map((store) =>
      store.id === id ? { ...store, is_favorite: !currentValue } : store
    );

    setStores(nextStores);

    const { error } = await supabase
      .from("stores")
      .update({ is_favorite: !currentValue })
      .eq("id", id);

    if (error) {
      setStores(previousStores);
    }
  };

  const deleteStore = async (id: string, name: string) => {
    const isUsed = stores.length > 0;
    const groceryCheck = await supabase
      .from("grocery_items")
      .select("id")
      .eq("store", name)
      .limit(1);

    if ((groceryCheck.data ?? []).length > 0) {
      alert("This store is being used by grocery items. Please update or delete those items first.");
      return;
    }

    const previousStores = stores;
    setStores((prev) => prev.filter((store) => store.id !== id));

    const { error } = await supabase.from("stores").delete().eq("id", id);

    if (error) {
      setStores(previousStores);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef3fb]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
          <div className="rounded-[28px] border border-[#d9dfeb] bg-white px-8 py-6 shadow-sm">
            <p className="text-sm text-[#5c677d]">Loading stores...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3fb] text-[#0d1730]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f66f5] sm:text-sm">
                Store management
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Manage Stores
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/grocery"
              className="rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:text-base"
            >
              Open Grocery
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c1730] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:text-base"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Saved stores" value={stores.length} />
          <SummaryCard label="Favourite stores" value={favoriteCount} />
          <SummaryCard label="Standard stores" value={stores.length - favoriteCount} />
        </section>

        <section className="mb-6 rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-3 block text-base font-medium text-[#25324a] sm:text-lg">
                Add store
              </label>
              <input
                type="text"
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
                placeholder="Example: Tesco, Lidl, Costco"
                className="h-14 w-full rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addStore();
                }}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={addStore}
                disabled={saving}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0c1730] px-6 text-base font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60 sm:h-16 sm:text-lg md:w-auto"
              >
                <Plus className="h-5 w-5" />
                {saving ? "Adding..." : "Add store"}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4 sm:space-y-5">
          {stores.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#d8dfeb] bg-white p-10 text-center shadow-sm sm:p-16">
              <Store className="mx-auto mb-4 h-12 w-12 text-[#8a94a6]" />
              <h3 className="text-xl font-semibold text-[#0d1730] sm:text-2xl">
                No stores yet
              </h3>
              <p className="mt-3 text-base text-[#667085] sm:text-lg">
                Add your supermarkets here and use them in Grocery.
              </p>
            </div>
          ) : (
            stores.map((store) => (
              <article
                key={store.id}
                className="rounded-[24px] border border-[#d8dfeb] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 sm:rounded-[30px] sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2f5fa] text-[#334155] sm:h-14 sm:w-14">
                      <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold text-[#0d1730] sm:text-2xl">
                        {store.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#667085]">
                        {store.is_favorite ? "Favourite supermarket" : "Standard supermarket"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => toggleFavorite(store.id, store.is_favorite)}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#d8dfeb] bg-white px-4 text-sm font-medium text-[#0d1730] transition hover:bg-[#f8fbff] sm:h-12 sm:px-5 sm:text-base"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          store.is_favorite
                            ? "fill-[#d6a93f] text-[#d6a93f]"
                            : "text-[#667085]"
                        }`}
                      />
                      {store.is_favorite ? "Favourite" : "Mark favourite"}
                    </button>

                    <button
                      onClick={() => deleteStore(store.id, store.name)}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#f0cfc5] bg-[#fff8f6] px-4 text-sm font-medium text-[#df6b47] transition hover:bg-[#fff1ed] sm:h-12 sm:px-5 sm:text-base"
                    >
                      <Trash2 className="h-5 w-5" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-[#d8dfeb] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#667085]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#0d1730]">{value}</p>
    </div>
  );
}
