'use client';

import { createContext, useContext, ReactNode } from 'react';
import {
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
  useSession,
} from 'next-auth/react';

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name?: string | null;
    isAdmin?: boolean;
  } | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user = session?.user ?? null;
  const loading = status === 'loading';
  const isAdmin = user?.isAdmin ?? false;

  const signIn = async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        return { error: new Error(result.error) };
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!response.ok) {
        return { error: new Error(data.error || 'Registration failed') };
      }
      return { error: null };
    } catch (error: unknown) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error('Registration failed. Unexpected response format.'),
      };
    }
  };

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/' });
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
