// src/renderer/components/AdminStoragePanel.tsx
// Admin Panel zur Überwachung des Supabase-Speicherverbrauchs

import React, { useState, useEffect } from 'react';
import {
  IconDatabase,
  IconUsers,
  IconFolder,
  IconFile,
  IconCategory,
  IconCode,
  IconAlertTriangle,
  IconRefresh,
  IconX,
  IconChartBar
} from '@tabler/icons-react';
import { supabase } from '../services/supabase';

// Admin User ID - nur dieser User sieht das Panel
const ADMIN_USER_ID = '5a2fa143-c5d4-4200-8d06-92ddec83c533';

// Supabase Free Plan Limits
const FREE_PLAN_DB_LIMIT_MB = 500;
const WARNING_THRESHOLD = 0.8; // 80%

interface StorageStats {
  totalUsers: number;
  totalProjects: number;
  totalDocuments: number;
  totalCategories: number;
  totalCodings: number;
  estimatedSizeMB: number;
  percentUsed: number;
  lastChecked: Date;
}

interface AdminStoragePanelProps {
  language: 'de' | 'en';
}

export const AdminStoragePanel: React.FC<AdminStoragePanelProps> = ({
  language
}) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === ADMIN_USER_ID) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.log('Admin check failed:', err);
      }
    };
    checkAdmin();
  }, []);

  const fetchStats = async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      // Parallele Abfragen für alle Tabellen
      const [
        { count: userCount },
        { count: projectCount },
        { count: documentCount },
        { count: categoryCount },
        { count: codingCount },
        { data: documentsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('codings').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('content')
      ]);

      // Schätzung der Datenbankgröße basierend auf Inhalten
      let estimatedBytes = 0;

      // Dokumente (Hauptspeicherverbrauch durch content)
      if (documentsData) {
        documentsData.forEach(doc => {
          if (doc.content) {
            estimatedBytes += new Blob([doc.content]).size;
          }
        });
      }

      // Zusätzlicher Overhead pro Eintrag (Metadaten, Indizes)
      const overheadPerRow = 500; // ~500 bytes pro Zeile
      estimatedBytes += (projectCount || 0) * overheadPerRow;
      estimatedBytes += (documentCount || 0) * overheadPerRow * 2; // Dokumente haben mehr Metadaten
      estimatedBytes += (categoryCount || 0) * overheadPerRow;
      estimatedBytes += (codingCount || 0) * overheadPerRow;
      estimatedBytes += (userCount || 0) * overheadPerRow;

      const estimatedSizeMB = estimatedBytes / (1024 * 1024);
      const percentUsed = (estimatedSizeMB / FREE_PLAN_DB_LIMIT_MB) * 100;

      setStats({
        totalUsers: userCount || 0,
        totalProjects: projectCount || 0,
        totalDocuments: documentCount || 0,
        totalCategories: categoryCount || 0,
        totalCodings: codingCount || 0,
        estimatedSizeMB,
        percentUsed,
        lastChecked: new Date()
      });
    } catch (err) {
      console.error('Error fetching storage stats:', err);
      setError(language === 'de'
        ? 'Fehler beim Laden der Statistiken'
        : 'Error loading statistics');
    } finally {
      setLoading(false);
    }
  };

  // Initial laden
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  // Nicht anzeigen wenn kein Admin oder dismissed
  if (!isAdmin || dismissed) return null;

  // Kompakte Warnung wenn >80%
  if (stats && stats.percentUsed >= WARNING_THRESHOLD * 100 && !expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-pulse">
        <div
          onClick={() => setExpanded(true)}
          className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg cursor-pointer flex items-center gap-3 hover:bg-red-700 transition"
        >
          <IconAlertTriangle className="w-6 h-6" />
          <div>
            <div className="font-bold">
              {language === 'de' ? 'Speicher-Warnung!' : 'Storage Warning!'}
            </div>
            <div className="text-sm opacity-90">
              {stats.percentUsed.toFixed(1)}% {language === 'de' ? 'belegt' : 'used'}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="ml-2 p-1 hover:bg-red-800 rounded"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Kompakter Badge wenn <80%
  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setExpanded(true)}
          className={`
            px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition
            ${stats && stats.percentUsed >= 60
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700'}
            text-white
          `}
        >
          <IconDatabase className="w-5 h-5" />
          <span className="font-medium">
            {stats ? `${stats.percentUsed.toFixed(1)}%` : '...'}
          </span>
        </button>
      </div>
    );
  }

  // Erweitertes Panel
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconChartBar className="w-5 h-5 text-white" />
            <span className="font-bold text-white">
              {language === 'de' ? 'Admin: Speicher-Status' : 'Admin: Storage Status'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-1.5 hover:bg-white/20 rounded-lg transition"
            >
              <IconRefresh className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition"
            >
              <IconX className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : stats ? (
            <>
              {/* Speicher-Balken */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    {language === 'de' ? 'Datenbank' : 'Database'}
                  </span>
                  <span className={`font-mono ${
                    stats.percentUsed >= 80 ? 'text-red-400' :
                    stats.percentUsed >= 60 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {stats.estimatedSizeMB.toFixed(1)} / {FREE_PLAN_DB_LIMIT_MB} MB
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      stats.percentUsed >= 80 ? 'bg-red-500' :
                      stats.percentUsed >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
                  />
                </div>
                {stats.percentUsed >= 80 && (
                  <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <IconAlertTriangle className="w-4 h-4" />
                    {language === 'de'
                      ? 'Speicher fast voll! Upgrade auf Pro Plan empfohlen.'
                      : 'Storage almost full! Upgrade to Pro Plan recommended.'}
                  </div>
                )}
              </div>

              {/* Statistiken Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatItem
                  icon={IconUsers}
                  label={language === 'de' ? 'Benutzer' : 'Users'}
                  value={stats.totalUsers}
                />
                <StatItem
                  icon={IconFolder}
                  label={language === 'de' ? 'Projekte' : 'Projects'}
                  value={stats.totalProjects}
                />
                <StatItem
                  icon={IconFile}
                  label={language === 'de' ? 'Dokumente' : 'Documents'}
                  value={stats.totalDocuments}
                />
                <StatItem
                  icon={IconCategory}
                  label={language === 'de' ? 'Kategorien' : 'Categories'}
                  value={stats.totalCategories}
                />
                <StatItem
                  icon={IconCode}
                  label={language === 'de' ? 'Kodierungen' : 'Codings'}
                  value={stats.totalCodings}
                  span2
                />
              </div>

              {/* Letzte Aktualisierung */}
              <div className="text-xs text-gray-500 text-center">
                {language === 'de' ? 'Zuletzt geprüft:' : 'Last checked:'}{' '}
                {stats.lastChecked.toLocaleTimeString()}
              </div>
            </>
          ) : loading ? (
            <div className="text-center py-4">
              <IconRefresh className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
              <div className="text-sm text-gray-400">
                {language === 'de' ? 'Lade Statistiken...' : 'Loading statistics...'}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Hilfskomponente für Statistik-Anzeige
const StatItem: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  span2?: boolean;
}> = ({ icon: Icon, label, value, span2 }) => (
  <div className={`bg-gray-800/50 rounded-xl p-3 ${span2 ? 'col-span-2' : ''}`}>
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
    <div className="text-xl font-bold text-white mt-1">
      {value.toLocaleString()}
    </div>
  </div>
);

export default AdminStoragePanel;
