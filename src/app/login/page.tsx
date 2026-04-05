'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'request'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  const switchMode = (m: 'signin' | 'request') => {
    setMode(m)
    setError(null)
    setSuccess(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-xl font-semibold text-gray-900">Kuba<span className="text-brand-600">Ventures</span></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-base font-semibold text-gray-900 mb-6">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>

          {success ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-3">
              Account created! Check your email to confirm, then sign in.
            </div>
          ) : (
            <form onSubmit={mode === 'signin' ? handleSignIn : handleRequest} className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              {mode === 'request' && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="text-xs font-medium text-gray-700">Full name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-xs font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {(mode === 'signin' || mode === 'request') && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className="text-xs font-medium text-gray-700">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account')}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          {mode === 'signin' ? (
            <>Don't have an account?{' '}
              <button onClick={() => switchMode('request')} className="text-gray-600 underline hover:text-gray-900">
                Create one
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => switchMode('signin')} className="text-gray-600 underline hover:text-gray-900">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
