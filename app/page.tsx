import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  Store,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#eef3fb] text-[#0d1730]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f66f5] sm:mb-4 sm:text-sm">
              Smart Grocery Planner
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              AVO Grocery List
            </h1>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/login"
              className="rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:rounded-2xl sm:px-6 sm:py-3 sm:text-base"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-[#0c1730] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-base"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr] xl:gap-8">
          <div className="rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-8 md:p-10 sm:rounded-[34px]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2f66f5] sm:mb-5 sm:text-sm">
              Premium grocery dashboard
            </div>

            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#0d1730] sm:text-4xl md:text-5xl xl:text-6xl">
              Shop smarter with clarity, structure and style.
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#667085] sm:mt-6 sm:text-lg md:text-xl md:leading-8">
              AVO helps you organise your grocery shopping by category, store and
              priority in one elegant experience inspired by premium productivity
              tools.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0c1730] px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto sm:px-7 sm:py-4 sm:text-lg"
              >
                Open AVO
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full rounded-2xl border border-[#d8dfeb] bg-white px-5 py-3.5 text-center text-base font-semibold text-[#0d1730] transition hover:bg-[#f8fbff] sm:w-auto sm:px-7 sm:py-4 sm:text-lg"
              >
                View dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3 md:mt-10">
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

          <div className="rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-6 sm:rounded-[34px]">
            <div className="min-h-full rounded-[24px] bg-gradient-to-br from-[#081225] via-[#0d1a34] to-[#1d2d47] p-5 text-white sm:rounded-[28px] sm:p-7">
              <h3 className="mb-6 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl lg:text-4xl">
                Why AVO
              </h3>

              <div className="space-y-4">
                <OverviewRow label="Premium and elegant interface" />
                <OverviewRow label="Synced with Supabase" />
                <OverviewRow label="Personal list for each user" />
                <OverviewRow label="Fast filtering by store and category" />
              </div>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5 sm:mt-10">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60 sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  Premium tip
                </div>
                <p className="text-sm leading-7 text-white/85 sm:text-base">
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
    <div className="rounded-2xl bg-white/10 px-4 py-3 text-base font-medium text-white/95 sm:px-5 sm:py-4 sm:text-lg lg:text-2xl">
      {label}
    </div>
  );
}