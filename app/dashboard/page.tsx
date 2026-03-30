"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session) {
          router.replace("/login");
          return;
        }

        setEmail(session.user.email || "");
        setChecking(false);
      } catch (err) {
        console.error("Dashboard session check failed:", err);
        if (active) {
          router.replace("/login");
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-white/60">Signed in as {email}</p>

        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="rounded-2xl bg-white px-4 py-3 text-black font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}