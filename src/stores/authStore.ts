// Auth Store for EVIDENRA Ultimate
// Zustand-based state management for Magic Link authentication

import { create } from 'zustand'
import { authService, profileService } from '../services/supabase'

interface User {
  id: string
  email: string
  created_at?: string
}

interface Profile {
  id: string
  display_name?: string
  avatar_url?: string
  subscription_tier?: string
  updated_at?: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  sendMagicLink: (email: string) => Promise<{ success: boolean; error: string | null }>
  setSessionFromTokens: (accessToken: string, refreshToken: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null })
    try {
      const { session, error } = await authService.getSession()
      if (error) throw error

      if (session?.user) {
        const { profile } = await profileService.getProfile(session.user.id)
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at
          },
          profile,
          isAuthenticated: true,
          isLoading: false
        })
      } else {
        set({ user: null, profile: null, isAuthenticated: false, isLoading: false })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      })
    }
  },

  sendMagicLink: async (email: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await authService.sendMagicLink(email)
      set({ isLoading: false })
      if (error) {
        set({ error: error.message })
        return { success: false, error: error.message }
      }
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send magic link'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  setSessionFromTokens: async (accessToken: string, refreshToken: string) => {
    set({ isLoading: true, error: null })
    try {
      const { session, error } = await authService.setSession(accessToken, refreshToken)
      if (error) throw error

      if (session?.user) {
        const { profile } = await profileService.getProfile(session.user.id)
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at
          },
          profile,
          isAuthenticated: true,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Session set error:', error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to authenticate'
      })
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    try {
      await authService.signOut()
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Sign out error:', error)
      set({ isLoading: false })
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get()
    if (!user) return

    try {
      const { profile, error } = await profileService.updateProfile(user.id, updates)
      if (error) throw error
      set({ profile })
    } catch (error) {
      console.error('Profile update error:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to update profile' })
    }
  },

  clearError: () => set({ error: null })
}))

export default useAuthStore
