/**
 * useGenesisSync Hook
 * ===================
 * React Hook für die Integration des Genesis Sync Service
 *
 * Usage:
 * const { projects, syncStatus, createProject, ... } = useGenesisSync(user);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { genesisSync, type Project, type Document, type Category, type Coding, type SyncStatus } from '../services/GenesisSyncService';
import type { User } from '@supabase/supabase-js';

interface UseGenesisSyncReturn {
  // Data
  projects: Project[];
  currentProject: Project | null;
  documents: Document[];
  categories: Category[];
  codings: Coding[];

  // Status
  syncStatus: SyncStatus;
  isLoading: boolean;
  error: string | null;

  // Project Operations
  loadProjects: () => Promise<void>;
  createProject: (project: Partial<Project>) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  selectProject: (project: Project | null) => void;

  // Document Operations
  loadDocuments: (projectId: string) => Promise<void>;
  createDocument: (projectId: string, doc: Partial<Document>) => Promise<Document | null>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;

  // Category Operations
  loadCategories: (projectId: string) => Promise<void>;
  createCategory: (projectId: string, category: Partial<Category>) => Promise<Category | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Coding Operations
  loadCodings: (projectId: string) => Promise<void>;
  createCoding: (coding: Partial<Coding>) => Promise<Coding | null>;
  updateCoding: (id: string, updates: Partial<Coding>) => Promise<Coding | null>;
  deleteCoding: (id: string) => Promise<boolean>;

  // Full Project Sync
  syncFullProject: (projectId: string) => Promise<void>;
}

export function useGenesisSync(user: User | null): UseGenesisSyncReturn {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [codings, setCodings] = useState<Coding[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncAt: null,
    pendingChanges: 0,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // Initialize sync service when user changes
  useEffect(() => {
    if (user) {
      console.log('[useGenesisSync] Initializing for user:', user.email);
      genesisSync.initialize(user);

      // Subscribe to realtime updates
      const unsub1 = genesisSync.on('projects:change', (data: any) => {
        console.log('[useGenesisSync] Projects changed:', data);
        loadProjects();
      });

      const unsub2 = genesisSync.on('documents:change', () => {
        if (currentProject) {
          loadDocuments(currentProject.id);
        }
      });

      const unsub3 = genesisSync.on('categories:change', () => {
        if (currentProject) {
          loadCategories(currentProject.id);
        }
      });

      const unsub4 = genesisSync.on('codings:change', () => {
        if (currentProject) {
          loadCodings(currentProject.id);
        }
      });

      const unsub5 = genesisSync.on('status:online', () => {
        setSyncStatus((prev) => ({ ...prev, isOnline: true }));
      });

      const unsub6 = genesisSync.on('status:offline', () => {
        setSyncStatus((prev) => ({ ...prev, isOnline: false }));
      });

      unsubscribersRef.current = [unsub1, unsub2, unsub3, unsub4, unsub5, unsub6];

      // Initial load
      loadProjects();

      return () => {
        unsubscribersRef.current.forEach((unsub) => unsub());
        genesisSync.disconnect();
      };
    }
  }, [user]);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(genesisSync.getStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // PROJECT OPERATIONS
  // ============================================

  const loadProjects = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const loadedProjects = await genesisSync.getProjects();
      setProjects(loadedProjects);
      setError(null);
    } catch (err) {
      console.error('[useGenesisSync] Error loading projects:', err);
      setError('Fehler beim Laden der Projekte');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createProject = useCallback(async (project: Partial<Project>): Promise<Project | null> => {
    const newProject = await genesisSync.createProject(project);
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
    }
    return newProject;
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>): Promise<Project | null> => {
    const updated = await genesisSync.updateProject(id, updates);
    if (updated) {
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (currentProject?.id === id) {
        setCurrentProject(updated);
      }
    }
    return updated;
  }, [currentProject]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    const success = await genesisSync.deleteProject(id);
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    }
    return success;
  }, [currentProject]);

  const selectProject = useCallback((project: Project | null) => {
    setCurrentProject(project);
    if (project) {
      loadDocuments(project.id);
      loadCategories(project.id);
      loadCodings(project.id);
    } else {
      setDocuments([]);
      setCategories([]);
      setCodings([]);
    }
  }, []);

  // ============================================
  // DOCUMENT OPERATIONS
  // ============================================

  const loadDocuments = useCallback(async (projectId: string) => {
    const docs = await genesisSync.getDocuments(projectId);
    setDocuments(docs);
  }, []);

  const createDocument = useCallback(async (projectId: string, doc: Partial<Document>): Promise<Document | null> => {
    const newDoc = await genesisSync.createDocument(projectId, doc);
    if (newDoc) {
      setDocuments((prev) => [...prev, newDoc]);
    }
    return newDoc;
  }, []);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>): Promise<Document | null> => {
    const updated = await genesisSync.updateDocument(id, updates);
    if (updated) {
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    }
    return updated;
  }, []);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    const success = await genesisSync.deleteDocument(id);
    if (success) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
    return success;
  }, []);

  // ============================================
  // CATEGORY OPERATIONS
  // ============================================

  const loadCategories = useCallback(async (projectId: string) => {
    const cats = await genesisSync.getCategories(projectId);
    setCategories(cats);
  }, []);

  const createCategory = useCallback(async (projectId: string, category: Partial<Category>): Promise<Category | null> => {
    const newCat = await genesisSync.createCategory(projectId, category);
    if (newCat) {
      setCategories((prev) => [...prev, newCat]);
    }
    return newCat;
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>): Promise<Category | null> => {
    const updated = await genesisSync.updateCategory(id, updates);
    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    const success = await genesisSync.deleteCategory(id);
    if (success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    return success;
  }, []);

  // ============================================
  // CODING OPERATIONS
  // ============================================

  const loadCodings = useCallback(async (projectId: string) => {
    const loadedCodings = await genesisSync.getCodings(projectId);
    setCodings(loadedCodings);
  }, []);

  const createCoding = useCallback(async (coding: Partial<Coding>): Promise<Coding | null> => {
    const newCoding = await genesisSync.createCoding(coding);
    if (newCoding) {
      setCodings((prev) => [...prev, newCoding]);
    }
    return newCoding;
  }, []);

  const updateCoding = useCallback(async (id: string, updates: Partial<Coding>): Promise<Coding | null> => {
    const updated = await genesisSync.updateCoding(id, updates);
    if (updated) {
      setCodings((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
    return updated;
  }, []);

  const deleteCoding = useCallback(async (id: string): Promise<boolean> => {
    const success = await genesisSync.deleteCoding(id);
    if (success) {
      setCodings((prev) => prev.filter((c) => c.id !== id));
    }
    return success;
  }, []);

  // ============================================
  // FULL PROJECT SYNC
  // ============================================

  const syncFullProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const { project, documents: docs, categories: cats, codings: codes } =
        await genesisSync.syncFullProject(projectId);

      if (project) {
        setCurrentProject(project);
        setDocuments(docs);
        setCategories(cats);
        setCodings(codes);
      }
    } catch (err) {
      console.error('[useGenesisSync] Error syncing project:', err);
      setError('Fehler beim Synchronisieren');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Data
    projects,
    currentProject,
    documents,
    categories,
    codings,

    // Status
    syncStatus,
    isLoading,
    error,

    // Project Operations
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    selectProject,

    // Document Operations
    loadDocuments,
    createDocument,
    updateDocument,
    deleteDocument,

    // Category Operations
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Coding Operations
    loadCodings,
    createCoding,
    updateCoding,
    deleteCoding,

    // Full Project Sync
    syncFullProject,
  };
}

export default useGenesisSync;
