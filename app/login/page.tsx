"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Lock,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (session) {
          router.replace("/dashboard");
          return;
        }

        setChecking(false);
      } catch (err) {
        console.error("Login session check failed:", err);
        if (active) setChecking(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.replace("/dashboard");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) throw error;

      setSuccess("Account created successfully. You can now sign in.");
      setIsLogin(true);
      setPassword("");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-5 text-sm text-white/70 backdrop-blur-xl">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-80px] h-[280px] w-[280px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-120px] top-[120px] h-[340px] w-[340px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[20%] h-[320px] w-[320px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="order-2 lg:order-1">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Premium grocery planning
          </div>

          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Welcome to AVO
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-white/60">
            A more elegant way to manage stores, grocery lists and home stock in one premium workspace.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
              <ShoppingBag className="mb-3 h-5 w-5 text-white/70" />
              <h3 className="text-lg font-medium">Organised lists</h3>
              <p className="mt-2 text-sm text-white/55">
                Group your shopping by store and keep everything easy to review.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
              <Sparkles className="mb-3 h-5 w-5 text-white/70" />
              <h3 className="text-lg font-medium">Smart stock tracking</h3>
              <p className="mt-2 text-sm text-white/55">
                Auto-consumption helps push low-stock items into your grocery workflow.
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                {isLogin ? "Sign in" : "Create account"}
              </h2>
              <p className="mt-2 text-sm text-white/55">
                {isLogin
                  ? "Access your premium grocery dashboard."
                  : "Create your AVO account in seconds."}
              </p>
            </div>

            {(error || success) && (
              <div className="mb-5 space-y-3">
                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {success}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="mb-2 block text-sm text-white/70">Full name</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <User className="h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Christian"
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-white/70">Email</label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Mail className="h-4 w-4 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Lock className="h-4 w-4 text-white/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-white/55">
              {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
                className="font-medium text-white underline underline-offset-4"
              >
                {isLogin ? "Create one" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}