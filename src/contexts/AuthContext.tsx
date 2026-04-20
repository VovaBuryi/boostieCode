'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await getSupabase().auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: isAdmin } = await getSupabase().rpc('get_user_admin_status', {
          user_id: session.user.id
        })
        setIsAdmin(isAdmin ?? false)
      }

      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: isAdmin } = await getSupabase().rpc('get_user_admin_status', {
            user_id: session.user.id
          })
          setIsAdmin(isAdmin ?? false)
        } else {
          setIsAdmin(false)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

  const signOut = async () => {
    await getSupabase().auth.signOut()
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isAuthenticated, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
