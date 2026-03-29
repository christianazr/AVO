"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, ArrowRight, ShoppingBag, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setSuccess("Account created successfully. You can now access your dashboard.");
        setIsLogin(true);
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#eef3fb] text-[#0d1730]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 md:px-8 lg:px-10">
        <div className="grid w-full gap-8 xl:grid-cols-[1.2fr_0.9fr]">
          <section className="rounded-[34px] border border-[#d8dfeb] bg-white p-8 shadow-sm md:p-10">
            <div className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#2f66f5]">
              Smart Grocery Planner
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-[#0d1730] md:text-6xl">
              Grocery planning with clarity and style.
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#667085]">
              Organise your shopping list, manage stores, and keep every essential
              beautifully structured in one premium experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className="rounded-2xl bg-[#0c1730] px-7 py-4 text-lg font-semibold text-white shadow-sm">
                AVO Grocery List
              </div>
              <div className="rounded-2xl border border-[#d8dfeb] bg-white px-7 py-4 text-lg font-semibold text-[#0d1730]">
                Premium Dashboard
              </div>
            </div>

            <div className="mt-10 rounded-[28px] border border-[#dde3ee] bg-[#f8fbff] p-6">
              <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#2f66f5]">
                Why AVO
              </div>

              <div className="space-y-4">
                <InfoRow
                  icon={<ShoppingBag className="h-5 w-5" />}
                  title="Organised shopping"
                  text="Keep all your grocery items in one place, sorted by category and store."
                />
                <InfoRow
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Premium experience"
                  text="Enjoy a cleaner interface inspired by modern luxury productivity apps."
                />
                <InfoRow
                  icon={<ArrowRight className="h-5 w-5" />}
                  title="Synced everywhere"
                  text="Your list is stored in Supabase so you can access it across devices."
                />
              </div>
            </div>
          </section>

          <section className="rounded-[34px] border border-[#d8dfeb] bg-white p-6 shadow-sm md:p-8">
            <div className="rounded-[28px] bg-gradient-to-br from-[#081225] via-[#0d1a34] to-[#1d2d47] p-7 text-white">
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                {isLogin ? "Welcome back" : "Create account"}
              </div>

              <h2 className="text-4xl font-semibold tracking-tight">
                {isLogin ? "Access your dashboard" : "Start with AVO"}
              </h2>

              <p className="mt-4 text-lg leading-7 text-white/75">
                {isLogin
                  ? "Sign in to manage your grocery list with the same premium experience across all devices."
                  : "Create your account and start organising your grocery shopping beautifully."}
              </p>

              <form onSubmit={handleAuth} className="mt-8 space-y-5">
                {!isLogin && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-white/85">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white placeholder:text-white/40 outline-none transition focus:border-white/25"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-3 block text-sm font-medium text-white/85">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 pl-11 pr-4 text-base text-white placeholder:text-white/40 outline-none transition focus:border-white/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-white/85">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 pl-11 pr-4 text-base text-white placeholder:text-white/40 outline-none transition focus:border-white/25"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-[#ffb4a2]/30 bg-[#ffede8] px-4 py-3 text-sm text-[#ffb4a2]">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-[#8ed0b5]/30 bg-[#eaf8f1] px-4 py-3 text-sm text-[#9be2c4]">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-base font-semibold text-[#0d1730] transition hover:bg-white/90 disabled:opacity-60"
                >
                  {loading ? "Please wait..." : isLogin ? "Log in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-white/70">
                {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setSuccess("");
                  }}
                  className="font-semibold text-white underline underline-offset-4"
                >
                  {isLogin ? "Create one" : "Log in"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2f66f5]">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[#0d1730]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#667085]">{text}</p>
      </div>
    </div>
  );
}