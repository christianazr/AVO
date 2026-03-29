"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function GroceryPage() {
  return (
    <main className="min-h-screen bg-[#eef3fb] text-[#0d1730]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f66f5] sm:text-sm">
              Grocery section
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Grocery List
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <section className="rounded-[28px] border border-[#d8dfeb] bg-white p-6 shadow-sm sm:rounded-[34px] sm:p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2f66f5]">
            <ShoppingBag className="h-6 w-6" />
          </div>

          <h2 className="text-2xl font-semibold text-[#0d1730] sm:text-3xl">
            Your grocery items
          </h2>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[#667085] sm:text-lg">
            This page is ready to become your dedicated grocery management area.
            In the next step, we can move the full grocery list, filters, quantity
            controls, favourites and delete actions here.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-[#d8dfeb] bg-[#f8fbff] p-6 text-[#667085]">
            Placeholder page ready.
          </div>
        </section>
      </div>
    </main>
  );
}