'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-xl text-gray-400">Loading SafeHer...</p>
    </div>
  )
}