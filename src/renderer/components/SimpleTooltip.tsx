// src/renderer/components/SimpleTooltip.tsx
import React, { useState, useRef, useEffect } from 'react';

interface SimpleTooltipProps {
  content: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number; // Verzögerung in ms bevor Tooltip erscheint
  children: React.ReactNode;
}

/**
 * Leichtgewichtiges Tooltip für normale Buttons
 * - Erscheint beim Hover
 * - Zeigt kurze Erklärung + optional Keyboard Shortcut
 * - Keine Icons, kein Beispiel (für komplexe Tooltips → HelpTooltip verwenden)
 */
export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  shortcut,
  position = 'top',
  delay = 500,
  children
}) => {
  const [show, setShow] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsReady(true);
      setShow(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsReady(false);
    setShow(false);
  };

  // Auto-Positioning: Verhindert dass Tooltip abgeschnitten wird
  useEffect(() => {
    if (show && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      const tooltipRect = tooltip.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      // Prüfe ob Tooltip aus dem Viewport ragt
      if (position === 'top' && tooltipRect.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltipRect.bottom > viewportHeight) {
        newPosition = 'top';
      } else if (position === 'left' && tooltipRect.left < 0) {
        newPosition = 'right';
      } else if (position === 'right' && tooltipRect.right > viewportWidth) {
        newPosition = 'left';
      }

      // Prüfe horizontale Überlappung für top/bottom
      if ((newPosition === 'top' || newPosition === 'bottom')) {
        if (tooltipRect.left < 0) {
          tooltip.style.left = '0';
          tooltip.style.transform = 'none';
        } else if (tooltipRect.right > viewportWidth) {
          tooltip.style.left = 'auto';
          tooltip.style.right = '0';
          tooltip.style.transform = 'none';
        }
      }

      setActualPosition(newPosition);
    }
  }, [show, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {show && isReady && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-[9999] px-3 py-2 bg-slate-900 border border-blue-500/30 rounded-lg shadow-xl
            text-sm text-white whitespace-nowrap pointer-events-none
            ${actualPosition === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
            ${actualPosition === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : ''}
            ${actualPosition === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' : ''}
            ${actualPosition === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : ''}
            animate-fadeIn
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-200">{content}</span>
            {shortcut && (
              <kbd className="px-2 py-0.5 bg-slate-700 rounded text-xs text-blue-300 border border-slate-600">
                {shortcut}
              </kbd>
            )}
          </div>

          {/* Arrow */}
          <div
            className={`
              absolute w-2 h-2 bg-slate-900 border-blue-500/30 transform rotate-45
              ${actualPosition === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r' : ''}
              ${actualPosition === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l' : ''}
              ${actualPosition === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r' : ''}
              ${actualPosition === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Tooltip-Texte Datenbank (Deutsch)
 */
export const TooltipTexts = {
  de: {
    // Kodierung
    startCoding: 'Startet den AI-gestützten 3-Persona Kodierungsprozess',
    dynamicCoding: 'Erweiterte KI-Kodierung mit individuellen Personas',
    stopCoding: 'Beendet den laufenden Kodierungsprozess',
    exportCodings: 'Exportiert alle Kodierungen als CSV oder JSON',

    // AKIH / Thesis Writing
    generateBasis: 'Erstellt 500-Wörter Zusammenfassung (~$0.10-0.30)',
    generateExtended: 'Erstellt erweiterten Bericht mit Pattern Recognition (~$0.30-0.60)',
    generateUltimate: 'Erstellt vollständigen 6-Kapitel Artikel (~$0.50-1.20)',

    // Memos & Reflexivity
    addMemo: 'Erstellt ein neues Forschungs-Memo (theoretical, methodological, reflexive, analytical, ethical)',
    addReflexivity: 'Dokumentiert deine Position als Forscher*in',

    // Visualisierungen
    showDashboard: 'Zeigt AKIH Score Dashboard mit allen Metriken',
    showCodingProgress: 'Zeigt Kodierungsfortschritt und Statistiken',
    showQualityCriteria: 'Zeigt Gütekriterien nach Lincoln & Guba',

    // Export/Import
    exportProject: 'Exportiert das gesamte Projekt als .evidenra Datei',
    importProject: 'Importiert ein bestehendes Projekt',
    exportReport: 'Exportiert Bericht als PDF, DOCX oder Markdown',

    // Settings
    refreshModels: 'Aktualisiert verfügbare AI-Modelle vom Provider',
    testApiKey: 'Testet ob API Key gültig ist',
    toggleExtension: 'Wechselt zwischen API und Browser Extension',

    // Documents
    uploadDocuments: 'Lädt PDF, DOCX, TXT oder Markdown Dateien hoch',
    deleteDocument: 'Löscht Dokument (kann nicht rückgängig gemacht werden)',

    // Categories
    addCategory: 'Erstellt neue Kategorie für die Kodierung',
    deleteCategory: 'Löscht Kategorie und alle zugehörigen Kodierungen',
    mergeCategories: 'Führt mehrere Kategorien zu einer zusammen',

    // Navigation
    navDashboard: 'Übersicht über Projekt und AKIH Score',
    navDocuments: 'Dokumente hochladen und verwalten',
    navCoding: 'AI-gestützte Kodierung mit 3 Personas',
    navCategories: 'Kategorien erstellen und organisieren',
    navVisualization: 'Interaktive Visualisierungen und Dashboards',
    navThesis: 'AI-gestützte Thesis & Artikel-Erstellung',
    navScience: 'Memos, Reflexivität, Bias & Gütekriterien',
    navExport: 'Projekt, Daten und Berichte exportieren',

    // Thesis Writing
    selectDocuments: 'Wählt Dokumente für Thesis-Erstellung aus',
    generateChapter: 'Generiert einzelnes Kapitel mit AI',
    generateFullThesis: 'Generiert komplette Thesis mit allen Kapiteln',
    saveThesis: 'Speichert Thesis als DOCX oder PDF',

    // Scientific Research
    viewBiasWarnings: 'Zeigt erkannte Bias-Warnungen an',
    calculateQuality: 'Berechnet Gütekriterien nach Lincoln & Guba',
    showSaturation: 'Zeigt theoretische Sättigung an',

    // Buttons (generisch)
    save: 'Speichert Änderungen',
    cancel: 'Bricht Vorgang ab',
    delete: 'Löscht Element (kann nicht rückgängig gemacht werden)',
    edit: 'Bearbeitet Element',
    download: 'Lädt Datei herunter',
    upload: 'Lädt Datei hoch',
    refresh: 'Aktualisiert Daten',
    reset: 'Setzt auf Standardwerte zurück',
    close: 'Schließt Dialog'
  },

  en: {
    // Kodierung
    startCoding: 'Starts AI-powered 3-Persona coding process',
    dynamicCoding: 'Advanced AI coding with custom personas',
    stopCoding: 'Stops the running coding process',
    exportCodings: 'Exports all codings as CSV or JSON',

    // AKIH / Thesis Writing
    generateBasis: 'Creates 500-word summary (~$0.10-0.30)',
    generateExtended: 'Creates extended report with pattern recognition (~$0.30-0.60)',
    generateUltimate: 'Creates complete 6-chapter article (~$0.50-1.20)',

    // Memos & Reflexivity
    addMemo: 'Creates new research memo (theoretical, methodological, reflexive, analytical, ethical)',
    addReflexivity: 'Documents your position as researcher',

    // Visualisierungen
    showDashboard: 'Shows AKIH Score Dashboard with all metrics',
    showCodingProgress: 'Shows coding progress and statistics',
    showQualityCriteria: 'Shows quality criteria (Lincoln & Guba)',

    // Export/Import
    exportProject: 'Exports entire project as .evidenra file',
    importProject: 'Imports existing project',
    exportReport: 'Exports report as PDF, DOCX or Markdown',

    // Settings
    refreshModels: 'Refreshes available AI models from provider',
    testApiKey: 'Tests if API key is valid',
    toggleExtension: 'Switches between API and browser extension',

    // Documents
    uploadDocuments: 'Uploads PDF, DOCX, TXT or Markdown files',
    deleteDocument: 'Deletes document (cannot be undone)',

    // Categories
    addCategory: 'Creates new category for coding',
    deleteCategory: 'Deletes category and all associated codings',
    mergeCategories: 'Merges multiple categories into one',

    // Navigation
    navDashboard: 'Overview of project and AKIH score',
    navDocuments: 'Upload and manage documents',
    navCoding: 'AI-powered coding with 3 personas',
    navCategories: 'Create and organize categories',
    navVisualization: 'Interactive visualizations and dashboards',
    navThesis: 'AI-powered thesis & article creation',
    navScience: 'Memos, reflexivity, bias & quality criteria',
    navExport: 'Export project, data and reports'
  }
};

/**
 * Tooltip-Wrapper für beliebige Elemente (auch <div> mit onClick)
 * Nutzt React.cloneElement um Hover-Events hinzuzufügen
 */
export const WithTooltip: React.FC<{
  content: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactElement;
}> = ({ content, shortcut, position = 'top', delay = 300, children }) => {
  return (
    <SimpleTooltip content={content} shortcut={shortcut} position={position} delay={delay}>
      {children}
    </SimpleTooltip>
  );
};

export default SimpleTooltip;
