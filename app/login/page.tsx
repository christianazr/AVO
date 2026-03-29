'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push('/dashboard')
      }
    }

    checkSession()
  }, [router])

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please complete email and password')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center">
        <div className="grid w-full gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Welcome back
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">Sign in to AVO</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              Access your premium grocery planner and manage your shopping lists.
            </p>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Login</h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter your email and password to continue.
              </p>
            </div>

            <div className="space-y-4">
              <input
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-slate-400 focus:bg-white"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-slate-400 focus:bg-white"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-slate-900 underline underline-offset-4">
                Create one
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}