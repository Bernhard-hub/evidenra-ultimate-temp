/**
 * GENESIS SYNC PROVIDER
 * =====================
 * React Context Provider für Genesis Sync Integration
 * Ermöglicht Cloud-Synchronisation zwischen PWA und Electron Apps
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, profileService, type UserProfile } from '../services/supabase';
import { genesisSync, type SyncStatus, type Project as SyncProject } from '../services/GenesisSyncService';
import type { User, Session } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

interface GenesisSyncContextType {
  // Auth State
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Sync State
  syncStatus: SyncStatus;
  isCloudEnabled: boolean;

  // Subscription Status
  subscription: {
    status: 'trial' | 'premium' | 'expired';
    daysRemaining: number;
    canUse: boolean;
  };

  // Auth Actions
  sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Sync Actions
  enableCloudSync: () => void;
  disableCloudSync: () => void;

  // Cloud Projects (optional feature)
  cloudProjects: SyncProject[];
  loadCloudProjects: () => Promise<void>;

  // UI State
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showSyncStatus: boolean;
  setShowSyncStatus: (show: boolean) => void;
}

const defaultSyncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncAt: null,
  pendingChanges: 0,
  error: null,
};

const defaultSubscription = {
  status: 'trial' as const,
  daysRemaining: 30,
  canUse: true,
};

// ============================================
// CONTEXT
// ============================================

const GenesisSyncContext = createContext<GenesisSyncContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface GenesisSyncProviderProps {
  children: ReactNode;
}

export function GenesisSyncProvider({ children }: GenesisSyncProviderProps) {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState(defaultSubscription);

  // Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [cloudProjects, setCloudProjects] = useState<SyncProject[]>([]);

  // UI State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  // ============================================
  // AUTH INITIALIZATION
  // ============================================

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Check existing session
        const { session } = await authService.getSession();

        if (session?.user && mounted) {
          setUser(session.user);

          // Get or create profile
          const { profile: userProfile } = await profileService.getOrCreateProfile(session.user);
          if (userProfile && mounted) {
            setProfile(userProfile);
          }

          // Check subscription
          const subStatus = await profileService.checkSubscription(session.user.id);
          if (mounted) {
            setSubscription(subStatus);
          }

          // Initialize Genesis Sync
          await genesisSync.initialize(session.user);
          if (mounted) {
            setIsCloudEnabled(true);
          }
        } else if (mounted) {
          // No session - show login modal on first start
          const skipped = sessionStorage.getItem('evidenra_login_skipped');
          if (!skipped) {
            setShowLoginModal(true);
          }
        }
      } catch (error) {
        console.error('[GenesisSyncProvider] Init error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen to auth changes
    const { data: { subscription: authSubscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('[GenesisSyncProvider] Auth event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);

          // Get or create profile
          const { profile: userProfile } = await profileService.getOrCreateProfile(session.user);
          if (userProfile) {
            setProfile(userProfile);
          }

          // Check subscription
          const subStatus = await profileService.checkSubscription(session.user.id);
          setSubscription(subStatus);

          // Initialize Genesis Sync
          await genesisSync.initialize(session.user);
          setIsCloudEnabled(true);
          setShowLoginModal(false);

        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsCloudEnabled(false);
          setCloudProjects([]);
          await genesisSync.disconnect();
        }
      }
    );

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  // ============================================
  // SYNC STATUS POLLING
  // ============================================

  useEffect(() => {
    if (!isCloudEnabled) return;

    const interval = setInterval(() => {
      setSyncStatus(genesisSync.getStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, [isCloudEnabled]);

  // ============================================
  // AUTH ACTIONS
  // ============================================

  const sendMagicLink = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await authService.sendMagicLink(email);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setIsCloudEnabled(false);
    setCloudProjects([]);
  }, []);

  // ============================================
  // SYNC ACTIONS
  // ============================================

  const enableCloudSync = useCallback(() => {
    if (user) {
      setIsCloudEnabled(true);
      genesisSync.initialize(user);
    } else {
      setShowLoginModal(true);
    }
  }, [user]);

  const disableCloudSync = useCallback(() => {
    setIsCloudEnabled(false);
    genesisSync.disconnect();
  }, []);

  const loadCloudProjects = useCallback(async () => {
    if (!user || !isCloudEnabled) return;

    try {
      const projects = await genesisSync.getProjects();
      setCloudProjects(projects);
    } catch (error) {
      console.error('[GenesisSyncProvider] Load projects error:', error);
    }
  }, [user, isCloudEnabled]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: GenesisSyncContextType = {
    // Auth State
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,

    // Sync State
    syncStatus,
    isCloudEnabled,

    // Subscription
    subscription,

    // Auth Actions
    sendMagicLink,
    signOut,

    // Sync Actions
    enableCloudSync,
    disableCloudSync,

    // Cloud Projects
    cloudProjects,
    loadCloudProjects,

    // UI State
    showLoginModal,
    setShowLoginModal,
    showSyncStatus,
    setShowSyncStatus,
  };

  return (
    <GenesisSyncContext.Provider value={value}>
      {children}
    </GenesisSyncContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useGenesisSyncContext(): GenesisSyncContextType {
  const context = useContext(GenesisSyncContext);
  if (context === undefined) {
    throw new Error('useGenesisSyncContext must be used within a GenesisSyncProvider');
  }
  return context;
}

// ============================================
// CLOUD SYNC STATUS COMPONENT
// ============================================

export function CloudSyncIndicator() {
  const { isCloudEnabled, syncStatus, user, setShowLoginModal, setShowSyncStatus } = useGenesisSyncContext();

  if (!isCloudEnabled || !user) {
    return (
      <button
        onClick={() => setShowLoginModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg text-sm transition-all"
        title="Cloud Sync aktivieren"
      >
        <span className="w-2 h-2 rounded-full bg-gray-500" />
        <span className="text-gray-400">Offline</span>
      </button>
    );
  }

  const statusColor = syncStatus.isSyncing
    ? 'bg-blue-500 animate-pulse'
    : syncStatus.isOnline
      ? 'bg-green-500'
      : 'bg-yellow-500';

  const statusText = syncStatus.isSyncing
    ? 'Syncing...'
    : syncStatus.isOnline
      ? `Synced${syncStatus.pendingChanges > 0 ? ` (${syncStatus.pendingChanges} pending)` : ''}`
      : 'Offline';

  return (
    <button
      onClick={() => setShowSyncStatus(true)}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg text-sm transition-all"
      title={`Genesis Sync: ${statusText}`}
    >
      <span className={`w-2 h-2 rounded-full ${statusColor}`} />
      <span className="text-gray-300">{statusText}</span>
      <span className="text-gray-500 text-xs">{user.email?.split('@')[0]}</span>
    </button>
  );
}

// ============================================
// LOGIN MODAL COMPONENT
// ============================================

export function CloudLoginModal() {
  const { showLoginModal, setShowLoginModal, sendMagicLink, isAuthenticated } = useGenesisSyncContext();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  if (!showLoginModal || isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    const result = await sendMagicLink(email);

    if (result.success) {
      setStatus('sent');
    } else {
      setStatus('error');
      setError(result.error || 'Fehler beim Senden');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🧬</span>
            Genesis Cloud Sync
          </h2>
          <button
            onClick={() => setShowLoginModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {status === 'sent' ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-lg font-semibold text-white mb-2">Magic Link gesendet!</h3>
            <p className="text-gray-400 mb-4">
              Prüfe deine E-Mail ({email}) und klicke auf den Link um dich anzumelden.
            </p>
            <button
              onClick={() => {
                setStatus('idle');
                setEmail('');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Andere E-Mail verwenden
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6">
              Melde dich an um deine Projekte zwischen allen Geräten und Apps zu synchronisieren.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">E-Mail Adresse</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={status === 'sending'}
                />
              </div>

              {status === 'error' && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending' || !email.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Sende...' : 'Magic Link senden'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-gray-500 text-xs text-center mb-3">
                Kein Passwort nötig - du erhältst einen sicheren Login-Link per E-Mail.
              </p>

              {/* Skip Login Button */}
              <button
                onClick={() => {
                  sessionStorage.setItem('evidenra_login_skipped', 'true');
                  setShowLoginModal(false);
                }}
                className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Ohne Login fortfahren (nur lokal)
              </button>
            </div>

            {/* Benefits Info */}
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2 font-medium">Mit Login kannst du:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Projekte zwischen Web-App & Desktop synchronisieren</li>
                <li>• Bei Upgrade (Basic → Pro → Ultimate) Daten mitnehmen</li>
                <li>• Auf allen Geräten arbeiten</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// SYNC STATUS MODAL COMPONENT
// ============================================

export function CloudSyncStatusModal() {
  const {
    showSyncStatus,
    setShowSyncStatus,
    user,
    profile,
    syncStatus,
    subscription,
    signOut,
    cloudProjects,
    loadCloudProjects
  } = useGenesisSyncContext();

  useEffect(() => {
    if (showSyncStatus) {
      loadCloudProjects();
    }
  }, [showSyncStatus, loadCloudProjects]);

  if (!showSyncStatus || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🧬</span>
            Genesis Sync Status
          </h2>
          <button
            onClick={() => setShowSyncStatus(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{user.email}</p>
              <p className="text-gray-400 text-sm">
                {subscription.status === 'premium' ? '⭐ Premium' :
                 subscription.status === 'trial' ? `🎁 Trial (${subscription.daysRemaining} Tage)` :
                 '❌ Abgelaufen'}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          <h3 className="text-white font-semibold mb-3">Sync Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Verbindung</p>
              <p className="text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Ausstehend</p>
              <p className="text-white">{syncStatus.pendingChanges} Änderungen</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Letzte Sync</p>
              <p className="text-white">
                {syncStatus.lastSyncAt
                  ? new Date(syncStatus.lastSyncAt).toLocaleTimeString('de-DE')
                  : 'Nie'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Client</p>
              <p className="text-white">{genesisSync.getClientType().toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Cloud Projects */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          <h3 className="text-white font-semibold mb-3">Cloud Projekte ({cloudProjects.length})</h3>
          {cloudProjects.length === 0 ? (
            <p className="text-gray-400 text-sm">Keine Projekte in der Cloud.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cloudProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                  <span className="text-white">{project.title}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(project.updated_at || '').toLocaleDateString('de-DE')}
                  </span>
                </div>
              ))}
              {cloudProjects.length > 5 && (
                <p className="text-gray-500 text-sm">+{cloudProjects.length - 5} weitere...</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowSyncStatus(false)}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Schließen
          </button>
          <button
            onClick={async () => {
              await signOut();
              setShowSyncStatus(false);
            }}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenesisSyncProvider;
