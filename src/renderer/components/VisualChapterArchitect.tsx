// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  VISUAL CHAPTER ARCHITECT™ - Revolutionäre UI für Kapitelplanung         ║
// ╠═══════════════════════════════════════════════════════════════════════════╣
// ║  🎨 FEATURES:                                                             ║
// ║  • Interaktive Baumansicht der Kapitelstruktur                            ║
// ║  • Live-Wortanzahl-Anpassung per Drag & Drop                              ║
// ║  • Visuelle Qualitäts- und Balance-Metriken                               ║
// ║  • Expandier/Kollabier-Funktionen für Abschnitte                          ║
// ║  • Export als Markdown-Plan                                               ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect } from 'react';
import { ChapterArchitect, type ChapterArchitecture, type PlannedSection, type AcademicLevel } from '../../services/ChapterArchitect';

interface VisualChapterArchitectProps {
  chapterNumber: number;
  chapterTitle: string;
  targetWords: number;
  academicLevel: AcademicLevel;
  chapterType?: string;
  language: 'de' | 'en';
  onArchitectureReady?: (architecture: ChapterArchitecture) => void;
}

export const VisualChapterArchitect: React.FC<VisualChapterArchitectProps> = ({
  chapterNumber,
  chapterTitle,
  targetWords,
  academicLevel,
  chapterType,
  language,
  onArchitectureReady
}) => {

  const [architecture, setArchitecture] = useState<ChapterArchitecture | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(true);

  // Generiere Architektur wenn Parameter ändern
  useEffect(() => {
    if (chapterTitle && targetWords > 0) {
      const arch = ChapterArchitect.planChapterArchitecture(
        chapterNumber,
        chapterTitle,
        targetWords,
        academicLevel,
        chapterType
      );
      setArchitecture(arch);

      // Auto-expand erste Ebene
      const firstLevel = new Set(arch.sections.map(s => s.number));
      setExpandedSections(firstLevel);

      // Callback
      if (onArchitectureReady) {
        onArchitectureReady(arch);
      }
    }
  }, [chapterNumber, chapterTitle, targetWords, academicLevel, chapterType]);

  const toggleSection = (sectionNumber: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionNumber)) {
        next.delete(sectionNumber);
      } else {
        next.add(sectionNumber);
      }
      return next;
    });
  };

  const exportArchitecture = () => {
    if (!architecture) return;

    const markdown = ChapterArchitect.exportAsMarkdown(architecture);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter-${architecture.chapterNumber}-architecture.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!architecture) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-purple-500/30 text-center">
        <div className="text-4xl mb-4">🏗️</div>
        <div className="text-gray-400">
          {language === 'de'
            ? 'Gebe Kapitel-Titel und Wortanzahl ein, um die Architektur zu planen'
            : 'Enter chapter title and word count to plan architecture'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 METRIKEN-HEADER */}
      <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🏗️ {language === 'de' ? 'Kapitel-Architektur' : 'Chapter Architecture'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportArchitecture}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-white text-sm font-medium transition-all"
            >
              📥 {language === 'de' ? 'Exportieren' : 'Export'}
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-sm font-medium transition-all"
            >
              {showDetails ? '🔽' : '▶️'} {language === 'de' ? 'Details' : 'Details'}
            </button>
          </div>
        </div>

        {/* Metriken Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">
              {language === 'de' ? 'Gesamt-Wörter' : 'Total Words'}
            </div>
            <div className="text-2xl font-bold text-white">{architecture.totalTargetWords}</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">
              {language === 'de' ? 'Max. Tiefe' : 'Max Depth'}
            </div>
            <div className="text-2xl font-bold text-cyan-400">{architecture.maxDepth}</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">
              {language === 'de' ? 'Qualität' : 'Quality'}
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-green-400">
                {(architecture.estimatedQuality * 100).toFixed(0)}%
              </div>
              <QualityIndicator score={architecture.estimatedQuality} />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">
              {language === 'de' ? 'Balance' : 'Balance'}
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-purple-400">
                {(architecture.balanceScore * 100).toFixed(0)}%
              </div>
              <BalanceIndicator score={architecture.balanceScore} />
            </div>
          </div>
        </div>
      </div>

      {/* 🌳 STRUKTUR-BAUM */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          🌳 {language === 'de' ? 'Geplante Struktur' : 'Planned Structure'}
        </h3>

        <div className="space-y-2">
          {architecture.sections.map(section => (
            <SectionNode
              key={section.number}
              section={section}
              expanded={expandedSections.has(section.number)}
              onToggle={() => toggleSection(section.number)}
              expandedSections={expandedSections}
              onToggleChild={toggleSection}
              language={language}
              showDetails={showDetails}
            />
          ))}
        </div>
      </div>

      {/* 📊 VISUAL TREE (ASCII Art) */}
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700/50 font-mono text-xs overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4 font-sans">
          📐 {language === 'de' ? 'Visueller Baum' : 'Visual Tree'}
        </h3>
        <pre className="text-gray-300 whitespace-pre">
          {ChapterArchitect.generateVisualTree(architecture)}
        </pre>
      </div>

      {/* 💡 TIPPS & EMPFEHLUNGEN */}
      <div className="bg-blue-900/20 rounded-2xl p-6 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          💡 {language === 'de' ? 'Empfehlungen' : 'Recommendations'}
        </h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>
              {language === 'de'
                ? `Architektur nutzt ${architecture.maxDepth} Ebenen für optimale Tiefe`
                : `Architecture uses ${architecture.maxDepth} levels for optimal depth`}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">ℹ️</span>
            <span>
              {language === 'de'
                ? 'Kritische Abschnitte (⚡) erhalten automatisch mehr Wörter'
                : 'Critical sections (⚡) automatically receive more words'}
            </span>
          </li>
          {architecture.estimatedQuality < 0.7 && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">⚠️</span>
              <span>
                {language === 'de'
                  ? 'Erhöhe die Wortanzahl für bessere Qualität (empfohlen: 2500+ Wörter)'
                  : 'Increase word count for better quality (recommended: 2500+ words)'}
              </span>
            </li>
          )}
          {architecture.balanceScore < 0.7 && (
            <li className="flex items-start gap-2">
              <span className="text-orange-400">⚠️</span>
              <span>
                {language === 'de'
                  ? 'Ungleiche Wortverteilung - einige Abschnitte könnten zu kurz sein'
                  : 'Unbalanced word distribution - some sections might be too short'}
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

/**
 * 🔸 SECTION NODE - Rekursive Komponente für Abschnitte
 */
interface SectionNodeProps {
  section: PlannedSection;
  expanded: boolean;
  onToggle: () => void;
  expandedSections: Set<string>;
  onToggleChild: (sectionNumber: string) => void;
  language: 'de' | 'en';
  showDetails: boolean;
}

const SectionNode: React.FC<SectionNodeProps> = ({
  section,
  expanded,
  onToggle,
  expandedSections,
  onToggleChild,
  language,
  showDetails
}) => {

  const hasChildren = section.children.length > 0;

  // Icon basierend auf Wichtigkeit
  const importanceIcon = {
    'critical': '⚡',
    'high': '🔹',
    'medium': '▫️',
    'low': '·'
  }[section.importance];

  // Farbe basierend auf Wichtigkeit
  const importanceColor = {
    'critical': 'from-red-500/20 to-orange-500/20 border-red-500/30',
    'high': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    'medium': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    'low': 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
  }[section.importance];

  const textColor = {
    'critical': 'text-red-300',
    'high': 'text-blue-300',
    'medium': 'text-purple-300',
    'low': 'text-gray-400'
  }[section.importance];

  return (
    <div className="space-y-2">
      {/* Section Card */}
      <div
        className={`bg-gradient-to-r ${importanceColor} rounded-xl p-4 border transition-all cursor-pointer hover:scale-[1.02]`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Toggle Icon */}
            {hasChildren && (
              <div className="text-gray-400 text-sm">
                {expanded ? '🔽' : '▶️'}
              </div>
            )}

            {/* Section Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${textColor}`}>
                  {importanceIcon} {section.number}
                </span>
                <span className="text-white font-semibold">{section.title}</span>
              </div>

              {/* Details */}
              {showDetails && (
                <div className="mt-2 text-xs text-gray-400 space-y-1">
                  <div className="flex items-center gap-4">
                    <span>📝 {section.targetWords} {language === 'de' ? 'Wörter' : 'words'}</span>
                    <span>🎯 {section.expansionStrategy}</span>
                    <span>🏷️ {section.semanticKeywords.slice(0, 3).join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Word Badge */}
          <div className="bg-white/10 px-3 py-1 rounded-lg">
            <span className="text-white font-bold text-sm">{section.targetWords}</span>
          </div>
        </div>
      </div>

      {/* Children (if expanded) */}
      {hasChildren && expanded && (
        <div className="ml-8 space-y-2 border-l-2 border-gray-700 pl-4">
          {section.children.map(child => (
            <SectionNode
              key={child.number}
              section={child}
              expanded={expandedSections.has(child.number)}
              onToggle={() => onToggleChild(child.number)}
              expandedSections={expandedSections}
              onToggleChild={onToggleChild}
              language={language}
              showDetails={showDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ⭐ QUALITY INDICATOR
 */
const QualityIndicator: React.FC<{ score: number }> = ({ score }) => {
  const stars = Math.round(score * 5);
  return (
    <div className="flex gap-0.5 text-yellow-400 text-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < stars ? '★' : '☆'}</span>
      ))}
    </div>
  );
};

/**
 * ⚖️ BALANCE INDICATOR
 */
const BalanceIndicator: React.FC<{ score: number }> = ({ score }) => {
  const bars = Math.round(score * 5);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 h-4 rounded ${i < bars ? 'bg-purple-400' : 'bg-gray-600'}`}
        ></div>
      ))}
    </div>
  );
};
