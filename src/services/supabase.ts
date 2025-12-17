// Supabase Client Configuration for EVIDENRA Ultimate
// Enables Magic Link authentication and cloud sync

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zvkoulhziksfxnxkkrmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2a291bGh6aWtzZnhueGtrcm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE3NjQsImV4cCI6MjA3OTk4Nzc2NH0.GJ82Zp37DXICVDvhmjSGo6THSmYcSuykRVgN3z4WWW0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desktop app uses deep-links
    flowType: 'implicit' // Required for desktop apps
  }
})

// Auth Service for Magic Link authentication
export const authService = {
  // Send Magic Link email
  async sendMagicLink(email: string) {
    const redirectUrl = 'https://evidenra.com/auth/callback'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    })
    return { error }
  },

  // Set session from deep-link tokens
  async setSession(accessToken: string, refreshToken: string) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    return { session: data.session, error }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }
}

// Profile Service for user data
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { profile: data, error }
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single()
    return { profile: data, error }
  }
}

// Project Sync Service for cloud backup
export const projectSyncService = {
  async syncProject(userId: string, projectData: any) {
    const { data, error } = await supabase
      .from('projects')
      .upsert({
        user_id: userId,
        project_id: projectData.id,
        data: projectData,
        synced_at: new Date().toISOString()
      })
      .select()
    return { data, error }
  },

  async getProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('synced_at', { ascending: false })
    return { projects: data, error }
  },

  async deleteProject(userId: string, projectId: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)
    return { error }
  }
}

export default supabase
