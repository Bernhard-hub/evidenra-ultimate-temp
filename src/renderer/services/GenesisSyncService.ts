/**
 * GENESIS SYNC SERVICE
 * =====================
 * Blitzschnelle Echtzeit-Synchronisation zwischen:
 * - PWA (basic.evidenra.com)
 * - EVIDENRA Basic (Electron)
 * - EVIDENRA Professional (Electron)
 * - EVIDENRA Ultimate (Electron)
 *
 * Features:
 * - Optimistic UI (0ms perceived latency)
 * - Delta Sync (nur geänderte Daten)
 * - Offline Queue (funktioniert ohne Internet)
 * - Realtime WebSocket (sofortige Sync)
 * - Conflict Resolution (Last-Write-Wins mit Merge)
 */

import { supabase } from './supabase';
import type { User, RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export type ClientType = 'pwa' | 'basic' | 'pro' | 'ultimate';

export interface SyncableEntity {
  id: string;
  local_id?: string;
  sync_version?: number;
  updated_at?: string;
  created_at?: string;
}

export interface Project extends SyncableEntity {
  user_id: string;
  title: string;
  description?: string;
  research_question?: string;
  methodology?: string;
  status: 'active' | 'archived';
  last_modified_by?: ClientType;
}

export interface Document extends SyncableEntity {
  project_id: string;
  user_id: string;
  name: string;
  content: string;
  word_count: number;
  type: string;
  metadata?: Record<string, unknown>;
  content_hash?: string;
}

export interface Category extends SyncableEntity {
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  parent_id?: string;
}

export interface Coding extends SyncableEntity {
  project_id: string;
  document_id: string;
  category_id: string;
  user_id: string;
  text: string;
  start_index: number;
  end_index: number;
  memo?: string;
  confidence?: number;
}

export interface SyncQueueItem {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;
  error: string | null;
}

// ============================================
// GENESIS SYNC SERVICE
// ============================================

class GenesisSyncService {
  private user: User | null = null;
  private clientType: ClientType = 'ultimate';
  private clientId: string;
  private realtimeChannel: RealtimeChannel | null = null;
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private lastSyncAt: Date | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private isOnline = navigator.onLine;

  constructor() {
    // Generate unique client ID
    this.clientId = this.getOrCreateClientId();

    // Detect client type
    this.clientType = this.detectClientType();

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Load offline queue from localStorage
    this.loadOfflineQueue();

    console.log(`[GenesisSYNC] Initialized: ${this.clientType} (${this.clientId})`);
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private getOrCreateClientId(): string {
    const key = 'evidenra_client_id';
    let clientId = localStorage.getItem(key);
    if (!clientId) {
      clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(key, clientId);
    }
    return clientId;
  }

  private detectClientType(): ClientType {
    // Check if running in Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // Check app name from Electron
      const appName = (window as any).electronAPI?.getAppName?.() || '';
      if (appName.includes('Ultimate')) return 'ultimate';
      if (appName.includes('Professional') || appName.includes('Pro')) return 'pro';
      return 'basic';
    }
    return 'pwa';
  }

  // ============================================
  // AUTH & CONNECTION
  // ============================================

  async initialize(user: User): Promise<void> {
    this.user = user;
    console.log(`[GenesisSYNC] User connected: ${user.email}`);

    // Register sync session
    await this.registerSyncSession();

    // Subscribe to realtime changes
    this.subscribeToRealtime();

    // Sync pending offline changes
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }

  async disconnect(): Promise<void> {
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.user = null;
    console.log('[GenesisSYNC] Disconnected');
  }

  private async registerSyncSession(): Promise<void> {
    if (!this.user) return;

    try {
      await supabase.from('sync_sessions').upsert({
        user_id: this.user.id,
        client_type: this.clientType,
        client_id: this.clientId,
        last_heartbeat: new Date().toISOString(),
        is_online: true,
      }, {
        onConflict: 'user_id,client_id'
      });
    } catch (error) {
      console.warn('[GenesisSYNC] Could not register sync session:', error);
    }
  }

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================

  private subscribeToRealtime(): void {
    if (!this.user) return;

    this.realtimeChannel = supabase
      .channel(`genesis_sync_${this.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${this.user.id}`,
        },
        (payload) => this.handleRealtimeChange('projects', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${this.user.id}`,
        },
        (payload) => this.handleRealtimeChange('documents', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${this.user.id}`,
        },
        (payload) => this.handleRealtimeChange('categories', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'codings',
          filter: `user_id=eq.${this.user.id}`,
        },
        (payload) => this.handleRealtimeChange('codings', payload)
      )
      .subscribe((status) => {
        console.log(`[GenesisSYNC] Realtime status: ${status}`);
      });
  }

  private handleRealtimeChange(table: string, payload: any): void {
    console.log(`[GenesisSYNC] Realtime ${payload.eventType} on ${table}:`, payload.new?.id || payload.old?.id);

    // Skip if this change came from our own client
    if (payload.new?.last_modified_by === this.clientId) {
      return;
    }

    // Emit to listeners
    this.emit(`${table}:${payload.eventType}`, payload.new || payload.old);
    this.emit(`${table}:change`, {
      type: payload.eventType,
      data: payload.new || payload.old,
      old: payload.old,
    });
  }

  // ============================================
  // EVENT SYSTEM
  // ============================================

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[GenesisSYNC] Error in listener for ${event}:`, error);
      }
    });
  }

  // ============================================
  // OFFLINE QUEUE
  // ============================================

  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('evidenra_sync_queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
        console.log(`[GenesisSYNC] Loaded ${this.syncQueue.length} pending changes`);
      }
    } catch (error) {
      console.warn('[GenesisSYNC] Could not load offline queue:', error);
      this.syncQueue = [];
    }
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('evidenra_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.warn('[GenesisSYNC] Could not save offline queue:', error);
    }
  }

  private addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): void {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Deduplicate: Remove older operations on same record
    this.syncQueue = this.syncQueue.filter(
      (q) => !(q.table_name === item.table_name && q.record_id === item.record_id)
    );

    this.syncQueue.push(queueItem);
    this.saveOfflineQueue();

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0 || !this.user) {
      return;
    }

    this.isSyncing = true;
    console.log(`[GenesisSYNC] Processing ${this.syncQueue.length} queued changes...`);

    const processed: string[] = [];

    for (const item of this.syncQueue) {
      try {
        await this.executeSyncOperation(item);
        processed.push(item.id);
      } catch (error) {
        console.error(`[GenesisSYNC] Failed to sync ${item.table_name}/${item.record_id}:`, error);
        // Keep in queue for retry
      }
    }

    // Remove processed items
    this.syncQueue = this.syncQueue.filter((q) => !processed.includes(q.id));
    this.saveOfflineQueue();

    this.lastSyncAt = new Date();
    this.isSyncing = false;

    console.log(`[GenesisSYNC] Sync complete. ${this.syncQueue.length} items remaining.`);
  }

  private async executeSyncOperation(item: SyncQueueItem): Promise<void> {
    const { operation, table_name, payload } = item;

    switch (operation) {
      case 'INSERT':
        await supabase.from(table_name).insert(payload);
        break;
      case 'UPDATE':
        await supabase.from(table_name).update(payload).eq('id', item.record_id);
        break;
      case 'DELETE':
        await supabase.from(table_name).delete().eq('id', item.record_id);
        break;
    }
  }

  // ============================================
  // ONLINE/OFFLINE HANDLING
  // ============================================

  private handleOnline(): void {
    this.isOnline = true;
    console.log('[GenesisSYNC] Back online - syncing...');
    this.processSyncQueue();
    this.emit('status:online', true);
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log('[GenesisSYNC] Offline - queuing changes');
    this.emit('status:offline', true);
  }

  // ============================================
  // CRUD OPERATIONS WITH SYNC
  // ============================================

  // Projects

  async getProjects(): Promise<Project[]> {
    if (!this.user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', this.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[GenesisSYNC] Error fetching projects:', error);
      return [];
    }

    return data || [];
  }

  async createProject(project: Partial<Project>): Promise<Project | null> {
    if (!this.user) return null;

    const newProject: Partial<Project> = {
      ...project,
      user_id: this.user.id,
      status: 'active',
      last_modified_by: this.clientType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) {
        console.error('[GenesisSYNC] Error creating project:', error);
        return null;
      }

      return data;
    } else {
      // Offline: Generate local ID and queue
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offlineProject = { ...newProject, id: localId, local_id: localId } as Project;

      this.addToQueue({
        operation: 'INSERT',
        table_name: 'projects',
        record_id: localId,
        payload: newProject,
      });

      return offlineProject;
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    if (!this.user) return null;

    const payload = {
      ...updates,
      last_modified_by: this.clientType,
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('[GenesisSYNC] Error updating project:', error);
        return null;
      }

      return data;
    } else {
      this.addToQueue({
        operation: 'UPDATE',
        table_name: 'projects',
        record_id: projectId,
        payload,
      });

      return { id: projectId, ...payload } as Project;
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (this.isOnline) {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) {
        console.error('[GenesisSYNC] Error deleting project:', error);
        return false;
      }
      return true;
    } else {
      this.addToQueue({
        operation: 'DELETE',
        table_name: 'projects',
        record_id: projectId,
        payload: {},
      });
      return true;
    }
  }

  // Documents

  async getDocuments(projectId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GenesisSYNC] Error fetching documents:', error);
      return [];
    }

    return data || [];
  }

  async createDocument(projectId: string, doc: Partial<Document>): Promise<Document | null> {
    if (!this.user) return null;

    const newDoc: Partial<Document> = {
      ...doc,
      project_id: projectId,
      user_id: this.user.id,
      word_count: doc.content?.split(/\s+/).length || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      const { data, error } = await supabase
        .from('documents')
        .insert(newDoc)
        .select()
        .single();

      if (error) {
        console.error('[GenesisSYNC] Error creating document:', error);
        return null;
      }

      return data;
    } else {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offlineDoc = { ...newDoc, id: localId, local_id: localId } as Document;

      this.addToQueue({
        operation: 'INSERT',
        table_name: 'documents',
        record_id: localId,
        payload: newDoc,
      });

      return offlineDoc;
    }
  }

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document | null> {
    const payload = {
      ...updates,
      word_count: updates.content?.split(/\s+/).length || updates.word_count,
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      const { data, error } = await supabase
        .from('documents')
        .update(payload)
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        console.error('[GenesisSYNC] Error updating document:', error);
        return null;
      }

      return data;
    } else {
      this.addToQueue({
        operation: 'UPDATE',
        table_name: 'documents',
        record_id: documentId,
        payload,
      });

      return { id: documentId, ...payload } as Document;
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    if (this.isOnline) {
      const { error } = await supabase.from('documents').delete().eq('id', documentId);
      return !error;
    } else {
      this.addToQueue({
        operation: 'DELETE',
        table_name: 'documents',
        record_id: documentId,
        payload: {},
      });
      return true;
    }
  }

  // Categories

  async getCategories(projectId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GenesisSYNC] Error fetching categories:', error);
      return [];
    }

    return data || [];
  }

  async createCategory(projectId: string, category: Partial<Category>): Promise<Category | null> {
    if (!this.user) return null;

    const newCategory: Partial<Category> = {
      ...category,
      project_id: projectId,
      user_id: this.user.id,
      color: category.color || '#6366f1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      const { data, error } = await supabase
        .from('categories')
        .insert(newCategory)
        .select()
        .single();

      if (error) {
        console.error('[GenesisSYNC] Error creating category:', error);
        return null;
      }

      return data;
    } else {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.addToQueue({
        operation: 'INSERT',
        table_name: 'categories',
        record_id: localId,
        payload: newCategory,
      });

      return { ...newCategory, id: localId, local_id: localId } as Category;
    }
  }

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<Category | null> {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        console.error('[GenesisSYNC] Error updating category:', error);
        return null;
      }

      return data;
    } else {
      this.addToQueue({
        operation: 'UPDATE',
        table_name: 'categories',
        record_id: categoryId,
        payload,
      });

      return { id: categoryId, ...payload } as Category;
    }
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    if (this.isOnline) {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      return !error;
    } else {
      this.addToQueue({
        operation: 'DELETE',
        table_name: 'categories',
        record_id: categoryId,
        payload: {},
      });
      return true;
    }
  }

  // Codings

  async getCodings(projectId: string): Promise<Coding[]> {
    const { data, error } = await supabase
      .from('codings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GenesisSYNC] Error fetching codings:', error);
      return [];
    }

    return data || [];
  }

  async createCoding(coding: Partial<Coding>): Promise<Coding | null> {
    if (!this.user) return null;

    const newCoding: Partial<Coding> = {
      ...coding,
      user_id: this.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      const { data, error } = await supabase
        .from('codings')
        .insert(newCoding)
        .select()
        .single();

      if (error) {
        console.error('[GenesisSYNC] Error creating coding:', error);
        return null;
      }

      return data;
    } else {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.addToQueue({
        operation: 'INSERT',
        table_name: 'codings',
        record_id: localId,
        payload: newCoding,
      });

      return { ...newCoding, id: localId, local_id: localId } as Coding;
    }
  }

  async updateCoding(codingId: string, updates: Partial<Coding>): Promise<Coding | null> {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      const { data, error } = await supabase
        .from('codings')
        .update(payload)
        .eq('id', codingId)
        .select()
        .single();

      if (error) {
        console.error('[GenesisSYNC] Error updating coding:', error);
        return null;
      }

      return data;
    } else {
      this.addToQueue({
        operation: 'UPDATE',
        table_name: 'codings',
        record_id: codingId,
        payload,
      });

      return { id: codingId, ...payload } as Coding;
    }
  }

  async deleteCoding(codingId: string): Promise<boolean> {
    if (this.isOnline) {
      const { error } = await supabase.from('codings').delete().eq('id', codingId);
      return !error;
    } else {
      this.addToQueue({
        operation: 'DELETE',
        table_name: 'codings',
        record_id: codingId,
        payload: {},
      });
      return true;
    }
  }

  // ============================================
  // FULL PROJECT SYNC
  // ============================================

  async syncFullProject(projectId: string): Promise<{
    project: Project | null;
    documents: Document[];
    categories: Category[];
    codings: Coding[];
  }> {
    const [project, documents, categories, codings] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      this.getDocuments(projectId),
      this.getCategories(projectId),
      this.getCodings(projectId),
    ]);

    return {
      project: project.data,
      documents,
      categories,
      codings,
    };
  }

  // ============================================
  // STATUS
  // ============================================

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      pendingChanges: this.syncQueue.length,
      error: null,
    };
  }

  getClientType(): ClientType {
    return this.clientType;
  }

  getClientId(): string {
    return this.clientId;
  }
}

// Export singleton instance
export const genesisSync = new GenesisSyncService();
export default genesisSync;
