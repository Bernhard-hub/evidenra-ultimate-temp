import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'

// Supabase Configuration - EVIDENRA Ultimate (shared with PWA)
const supabaseUrl = 'https://zvkoulhziksfxnxkkrmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2a291bGh6aWtzZnhueGtrcm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE3NjQsImV4cCI6MjA3OTk4Nzc2NH0.GJ82Zp37DXICVDvhmjSGo6THSmYcSuykRVgN3z4WWW0'

// Create Supabase client with Electron-compatible settings
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disabled for Electron - no URL-based auth
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    lock: {
      // Disable lock manager in Electron (causes warnings)
      acquireLock: false,
    } as unknown as undefined, // Type workaround for Electron compatibility
  },
})

// Types
export interface UserProfile {
  id: string
  email: string
  trial_start: string
  subscription: 'trial' | 'premium' | 'expired'
  gumroad_sale_id?: string
  upgraded_at?: string
  created_at: string
  last_seen: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description?: string
  research_question?: string
  methodology?: string
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  project_id: string
  name: string
  content: string
  word_count: number
  type: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Category {
  id: string
  project_id: string
  name: string
  description?: string
  color: string
  parent_id?: string
  created_at: string
}

export interface Coding {
  id: string
  project_id: string
  document_id: string
  category_id: string
  text: string
  start_index: number
  end_index: number
  memo?: string
  confidence?: number
  created_at: string
}

// Auth Functions
export const authService = {
  // Send Magic Link
  async sendMagicLink(email: string): Promise<{ error: Error | null }> {
    // Redirect URL for Basic app
    const redirectUrl = `${window.location.origin}/auth/callback`

    console.log('[EVIDENRA Ultimate] Magic link redirect URL:', redirectUrl)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })
    return { error }
  },

  // Get current session
  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    const { data, error } = await supabase.auth.getSession()
    return { session: data.session, error }
  },

  // Get current user
  async getUser(): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.getUser()
    return { user: data.user, error }
  },

  // Sign out
  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// User Profile Functions
export const profileService = {
  // Get or create user profile
  async getOrCreateProfile(user: User): Promise<{ profile: UserProfile | null; error: Error | null }> {
    // First, try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      // Update last_seen
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)

      return { profile: existingProfile, error: null }
    }

    // Create new profile with trial
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        trial_start: new Date().toISOString(),
        subscription: 'trial',
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
      .select()
      .single()

    return { profile: newProfile, error: createError }
  },

  // Check subscription status
  async checkSubscription(userId: string): Promise<{
    status: 'trial' | 'premium' | 'expired'
    daysRemaining: number
    canUse: boolean
  }> {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription, trial_start, email, is_admin')
      .eq('id', userId)
      .single()

    if (!profile) {
      return { status: 'expired', daysRemaining: 0, canUse: false }
    }

    // Admin-Check: Server-Side ueber is_admin Feld in Datenbank
    if (profile.is_admin === true) {
      console.log('[EVIDENRA] Admin-Zugriff aktiviert')
      return { status: 'premium', daysRemaining: -1, canUse: true }
    }

    if (profile.subscription === 'premium') {
      return { status: 'premium', daysRemaining: -1, canUse: true }
    }

    // Calculate trial days remaining
    const trialStart = new Date(profile.trial_start)
    const now = new Date()
    const daysPassed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, 30 - daysPassed)

    if (daysRemaining > 0) {
      return { status: 'trial', daysRemaining, canUse: true }
    }

    return { status: 'expired', daysRemaining: 0, canUse: false }
  },

  // Upgrade to premium (called by webhook)
  async upgradeToPremium(
    email: string,
    gumroadSaleId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    const { error } = await supabase
      .from('users')
      .update({
        subscription: 'premium',
        gumroad_sale_id: gumroadSaleId,
        upgraded_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase())

    return { success: !error, error }
  },
}

// Project Functions
export const projectService = {
  // Get all projects for user
  async getProjects(userId: string): Promise<{ projects: Project[]; error: Error | null }> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    return { projects: data || [], error }
  },

  // Create project
  async createProject(
    userId: string,
    project: Partial<Project>
  ): Promise<{ project: Project | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: project.title || 'Neues Projekt',
        description: project.description,
        research_question: project.research_question,
        methodology: project.methodology,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    return { project: data, error }
  },

  // Update project
  async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<{ project: Project | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single()

    return { project: data, error }
  },

  // Delete project
  async deleteProject(projectId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    return { error }
  },

  // Get full project with all related data
  async getFullProject(projectId: string): Promise<{
    project: Project | null
    documents: Document[]
    categories: Category[]
    codings: Coding[]
    error: Error | null
  }> {
    const [projectRes, docsRes, catsRes, codingsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('documents').select('*').eq('project_id', projectId),
      supabase.from('categories').select('*').eq('project_id', projectId),
      supabase.from('codings').select('*').eq('project_id', projectId),
    ])

    return {
      project: projectRes.data,
      documents: docsRes.data || [],
      categories: catsRes.data || [],
      codings: codingsRes.data || [],
      error: projectRes.error || docsRes.error || catsRes.error || codingsRes.error,
    }
  },
}

// Document Functions
export const documentService = {
  // Add document to project
  async addDocument(
    projectId: string,
    doc: Partial<Document>
  ): Promise<{ document: Document | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        name: doc.name || 'Dokument',
        content: doc.content || '',
        word_count: doc.word_count || 0,
        type: doc.type || 'text',
        metadata: doc.metadata,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    return { document: data, error }
  },

  // Update document
  async updateDocument(
    documentId: string,
    updates: Partial<Document>
  ): Promise<{ document: Document | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single()

    return { document: data, error }
  },

  // Delete document
  async deleteDocument(documentId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('documents').delete().eq('id', documentId)
    return { error }
  },
}

// Category Functions
export const categoryService = {
  // Add category
  async addCategory(
    projectId: string,
    category: Partial<Category>
  ): Promise<{ category: Category | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        project_id: projectId,
        name: category.name || 'Neue Kategorie',
        description: category.description,
        color: category.color || '#6366f1',
        parent_id: category.parent_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    return { category: data, error }
  },

  // Update category
  async updateCategory(
    categoryId: string,
    updates: Partial<Category>
  ): Promise<{ category: Category | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single()

    return { category: data, error }
  },

  // Delete category
  async deleteCategory(categoryId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    return { error }
  },
}

// Coding Functions
export const codingService = {
  // Add coding
  async addCoding(
    coding: Partial<Coding>
  ): Promise<{ coding: Coding | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('codings')
      .insert({
        project_id: coding.project_id,
        document_id: coding.document_id,
        category_id: coding.category_id,
        text: coding.text || '',
        start_index: coding.start_index || 0,
        end_index: coding.end_index || 0,
        memo: coding.memo,
        confidence: coding.confidence,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    return { coding: data, error }
  },

  // Update coding
  async updateCoding(
    codingId: string,
    updates: Partial<Coding>
  ): Promise<{ coding: Coding | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('codings')
      .update(updates)
      .eq('id', codingId)
      .select()
      .single()

    return { coding: data, error }
  },

  // Delete coding
  async deleteCoding(codingId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('codings').delete().eq('id', codingId)
    return { error }
  },

  // Get codings by document
  async getCodingsByDocument(documentId: string): Promise<{ codings: Coding[]; error: Error | null }> {
    const { data, error } = await supabase
      .from('codings')
      .select('*')
      .eq('document_id', documentId)
      .order('start_index', { ascending: true })

    return { codings: data || [], error }
  },

  // Get codings by category
  async getCodingsByCategory(categoryId: string): Promise<{ codings: Coding[]; error: Error | null }> {
    const { data, error } = await supabase
      .from('codings')
      .select('*')
      .eq('category_id', categoryId)

    return { codings: data || [], error }
  },
}

// Realtime Subscriptions
export const realtimeService = {
  // Subscribe to project changes
  subscribeToProject(projectId: string, callback: (payload: unknown) => void) {
    return supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          filter: `project_id=eq.${projectId}`,
        },
        callback
      )
      .subscribe()
  },

  // Unsubscribe
  unsubscribe(channel: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(channel)
  },
}

export default supabase
