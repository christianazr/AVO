import Link from "next/link";
import { ArrowRight, CheckCircle2, ShoppingBag, Store, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#eef3fb] text-[#0d1730]">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#2f66f5]">
              Smart Grocery Planner
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              AVO Grocery List
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-[#d8dfeb] bg-white px-6 py-3 text-base font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff]"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-2xl bg-[#0c1730] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-[34px] border border-[#d8dfeb] bg-white p-8 shadow-sm md:p-10">
            <div className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2f66f5]">
              Premium grocery dashboard
            </div>

            <h2 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-[#0d1730] md:text-6xl">
              Shop smarter with clarity, structure and style.
            </h2>

            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#667085]">
              AVO helps you organise your grocery shopping by category, store and
              priority in one elegant experience inspired by premium productivity tools.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0c1730] px-7 py-4 text-lg font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Open AVO
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-[#d8dfeb] bg-white px-7 py-4 text-lg font-semibold text-[#0d1730] transition hover:bg-[#f8fbff]"
              >
                View dashboard
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <FeatureCard
                icon={<ShoppingBag className="h-5 w-5" />}
                title="Smart lists"
                text="Track essentials and keep your shopping beautifully organised."
              />
              <FeatureCard
                icon={<Store className="h-5 w-5" />}
                title="Store filters"
                text="Split your list by Tesco, Lidl, Costco and more."
              />
              <FeatureCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Progress view"
                text="Monitor completed and pending items instantly."
              />
            </div>
          </div>

          <div className="rounded-[34px] border border-[#d8dfeb] bg-white p-6 shadow-sm">
            <div className="rounded-[28px] bg-gradient-to-br from-[#081225] via-[#0d1a34] to-[#1d2d47] p-7 text-white min-h-full">
              <h3 className="mb-8 text-4xl font-semibold tracking-tight">
                Why AVO
              </h3>

              <div className="space-y-4">
                <OverviewRow label="Premium and elegant interface" />
                <OverviewRow label="Synced with Supabase" />
                <OverviewRow label="Personal list for each user" />
                <OverviewRow label="Fast filtering by store and category" />
              </div>

              <div className="mt-10 rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-white/60">
                  <Sparkles className="h-4 w-4" />
                  Premium tip
                </div>
                <p className="text-base leading-7 text-white/85">
                  Use favourites for repeat purchases and keep your weekly shopping
                  routine much faster.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#dde3ee] bg-[#f8fbff] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f0ff] text-[#2f66f5]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#0d1730]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#667085]">{text}</p>
    </div>
  );
}

function OverviewRow({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-5 py-4 text-lg font-medium text-white/95">
      {label}
    </div>
  );
}