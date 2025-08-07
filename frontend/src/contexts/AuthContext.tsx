'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface ClientData {
  id: string
  businessName: string
  email: string
  chatbotId?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  clientData: ClientData | null
  loading: boolean
  signUp: (email: string, password: string, businessName: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: (businessName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  // Sync user with backend clients table
  const syncUserWithBackend = async (user: User, businessName?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseUserId: user.id,
          businessName: businessName || user.user_metadata?.business_name || '',
          email: user.email,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setClientData(data.client)
        return data.client
      } else {
        console.error('Failed to sync user with backend')
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error)
    }
    return null
  }

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await syncUserWithBackend(session.user)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await syncUserWithBackend(session.user)
        } else {
          setClientData(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, businessName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName
          }
        }
      })
      
      if (error) {
        return { error: error as Error }
      }

      // If signup was successful and user is confirmed, sync with backend
      if (data.user) {
        await syncUserWithBackend(data.user, businessName)
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { error: error as Error }
      }

      // Supabase auth state change will automatically sync with backend
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signInWithGoogle = async (businessName?: string) => {
    try {
      const redirectUrl = businessName 
        ? `${window.location.origin}/dashboard?business_name=${encodeURIComponent(businessName)}`
        : `${window.location.origin}/dashboard`
        
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })
      
      if (error) {
        return { error: error as Error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      clientData,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
    }}>
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