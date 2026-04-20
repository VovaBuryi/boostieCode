'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({
  children,
  adminOnly = false
}: {
  children: React.ReactNode
  adminOnly?: boolean
}) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (adminOnly && !isAdmin) {
        router.push('/')
      }
    }
  }, [user, loading, isAdmin, router, adminOnly])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Доступ заборонено</h1>
          <p className="text-gray-600">Ця сторінка доступна тільки адміністраторам</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
