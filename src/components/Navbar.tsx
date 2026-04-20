'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap, LogOut, User, BookOpen, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">BoostieCode</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Курси
                </Link>
                <Link
                  href="/my-courses"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/my-courses')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Мої курси
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive('/admin')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Адмін-панель
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Вийти</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Увійти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
