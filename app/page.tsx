"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#eef3fb] text-[#0d1b4c]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        {/* Top bar */}
        <header className="flex items-center justify-between py-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2f5bff] sm:text-xs">
              Smart Grocery Planner
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#0d1b4c] shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.10)] sm:px-7 sm:text-base"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="rounded-2xl bg-[#07194a] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(7,25,74,0.25)] transition hover:-translate-y-0.5 hover:bg-[#0b2366] sm:px-7 sm:text-base"
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Hero title */}
        <section className="pt-8 sm:pt-10">
          <h1 className="text-4xl font-semibold tracking-tight text-[#0b1742] sm:text-5xl lg:text-6xl">
            AVO Grocery List
          </h1>
        </section>

        {/* Main content */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Left card */}
          <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2f5bff] sm:text-xs">
              Premium Grocery Dashboard
            </p>

            <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-[#0b1742] sm:text-5xl lg:text-[72px]">
              Shop smarter with clarity, structure and style.
            </h2>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-500 sm:text-xl">
              AVO helps you organise your grocery shopping by category, store
              and priority in one elegant experience inspired by premium
              productivity tools.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07194a] px-6 py-4 text-base font-semibold text-white shadow-[0_12px_32px_rgba(7,25,74,0.25)] transition hover:-translate-y-0.5 hover:bg-[#0b2366]"
              >
                Open AVO
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-[#f8fbff] px-6 py-4 text-base font-semibold text-[#0d1b4c] transition hover:-translate-y-0.5 hover:bg-white"
              >
                View dashboard
              </Link>
            </div>

            {/* Bottom feature tiles */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-[#f8fbff] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Store className="h-5 w-5 text-[#2f5bff]" />
                </div>
                <h3 className="text-base font-semibold text-[#0b1742]">
                  Store-based planning
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Keep each item linked to the right supermarket.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#f8fbff] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <ShoppingBag className="h-5 w-5 text-[#2f5bff]" />
                </div>
                <h3 className="text-base font-semibold text-[#0b1742]">
                  Clean grocery flows
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add, edit and manage items in a more intuitive way.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#f8fbff] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <LayoutDashboard className="h-5 w-5 text-[#2f5bff]" />
                </div>
                <h3 className="text-base font-semibold text-[#0b1742]">
                  Elegant dashboard
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Premium layout designed for desktop and mobile.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#f8fbff] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-[#2f5bff]" />
                </div>
                <h3 className="text-base font-semibold text-[#0b1742]">
                  Personal workspace
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Synced with your account and isolated per user.
                </p>
              </div>
            </div>
          </div>

          {/* Right card */}
          <aside className="rounded-[34px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-5">
            <div className="h-full rounded-[28px] bg-[radial-gradient(circle_at_top,_#0b245f_0%,_#07194a_45%,_#04102f_100%)] p-6 text-white sm:p-7">
              <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Why AVO
              </h3>

              <div className="mt-7 space-y-4">
                {[
                  "Premium and elegant interface",
                  "Synced with Supabase",
                  "Personal list for each user",
                  "Fast filtering by store and category",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] bg-white/12 px-5 py-5 backdrop-blur-sm"
                  >
                    <p className="text-xl leading-8 text-white sm:text-[21px]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[26px] border border-white/10 bg-white/8 p-5">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75">
                  <Sparkles className="h-4 w-4" />
                  Premium Tip
                </div>

                <p className="mt-3 text-base leading-7 text-white/85">
                  AVO is built to feel calm, refined and efficient, so your
                  grocery routine feels less cluttered and more intentional.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-white/85">
                    <CheckCircle2 className="h-4 w-4" />
                    Category organisation
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/85">
                    <CheckCircle2 className="h-4 w-4" />
                    Store management
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/85">
                    <CheckCircle2 className="h-4 w-4" />
                    Mobile-friendly layout
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
