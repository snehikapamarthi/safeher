'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err) {
      setError('Signup Failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-400 mb-2">SafeHer Signup</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition transform hover:scale-105"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-pink-400 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}