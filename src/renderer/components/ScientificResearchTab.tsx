// src/renderer/components/ScientificResearchTab.tsx
import React, { useState, useMemo } from 'react';
import {
  IconNotebook as BookOpen,
  IconBrain as Brain,
  IconAlertTriangle as AlertTriangle,
  IconChartBar as BarChart3,
  IconFileCheck as CheckCircle2,
  IconRefresh as RefreshCw,
  IconPlus as Plus,
  IconX as X,
  IconEdit as Edit,
  IconInfoCircle as InfoCircle
} from '@tabler/icons-react';

import ScientificServices from '../../services/ScientificResearchServices';
import QualityServices from '../../services/ReflexivityAndQualityServices';
import { HelpTooltip, MemoTypeHelp, ReflexivityHelp } from './HelpTooltip';
import type {
  ResearchMemo,
  MemoType,
  BiasWarning,
  ReflexivityStatement,
  QualityCriteriaReport
} from '../../types/ResearchTypes';

interface ScientificResearchTabProps {
  project: any;
  onUpdateProject: (updates: any) => void;
  language: 'de' | 'en';
}

const ScientificResearchTab: React.FC<ScientificResearchTabProps> = ({
  project,
  onUpdateProject,
  language
}) => {
  const [activeSection, setActiveSection] = useState<'memos' | 'reflexivity' | 'bias' | 'quality'>('memos');
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [showReflexivityDialog, setShowReflexivityDialog] = useState(false);

  // Memos State
  const [newMemo, setNewMemo] = useState<{
    type: MemoType;
    title: string;
    content: string;
    category?: string;
  }>({
    type: 'theoretical',
    title: '',
    content: ''
  });

  // Reflexivity Statement State
  const [newReflexivity, setNewReflexivity] = useState({
    researcherBackground: '',
    theoreticalPerspective: '',
    epistemologicalStance: 'constructivist' as 'positivist' | 'constructivist' | 'critical' | 'pragmatist' | 'other',
    influenceOnInterpretation: ''
  });

  // Initialize project scientific data if not exists
  const scientificData = useMemo(() => ({
    memos: project.memos || [],
    reflexivityStatements: project.reflexivityStatements || [],
    biasWarnings: project.biasWarnings || [],
    saturationAnalysis: project.saturationAnalysis || []
  }), [project]);

  // ============================================================================
  // MEMO MANAGEMENT
  // ============================================================================

  const handleCreateMemo = () => {
    if (!newMemo.title || !newMemo.content) {
      alert(language === 'de' ? 'Bitte Titel und Inhalt eingeben' : 'Please enter title and content');
      return;
    }

    const memo = ScientificServices.Memo.createMemo(
      newMemo.type,
      newMemo.title,
      newMemo.content,
      'Researcher', // TODO: Get from user settings
      newMemo.category ? { category: newMemo.category } : undefined
    );

    onUpdateProject({
      memos: [...scientificData.memos, memo]
    });

    setNewMemo({ type: 'theoretical', title: '', content: '' });
    setShowMemoDialog(false);
  };

  const handleDeleteMemo = (memoId: string) => {
    if (confirm(language === 'de' ? 'Memo wirklich löschen?' : 'Really delete memo?')) {
      onUpdateProject({
        memos: scientificData.memos.filter((m: ResearchMemo) => m.id !== memoId)
      });
    }
  };

  const memoDensity = useMemo(() => {
    if (!project.categories || project.categories.length === 0) return null;
    return ScientificServices.Memo.analyzeMemoDensity(
      scientificData.memos,
      project.categories
    );
  }, [scientificData.memos, project.categories]);

  // ============================================================================
  // REFLEXIVITY MANAGEMENT
  // ============================================================================

  const handleCreateReflexivity = () => {
    if (!newReflexivity.researcherBackground || !newReflexivity.theoreticalPerspective || !newReflexivity.influenceOnInterpretation) {
      alert(language === 'de' ? 'Bitte alle Pflichtfelder ausfüllen' : 'Please fill in all required fields');
      return;
    }

    const reflexivityStatement: ReflexivityStatement = {
      id: `reflex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      researcherBackground: newReflexivity.researcherBackground,
      theoreticalPerspective: newReflexivity.theoreticalPerspective,
      epistemologicalStance: newReflexivity.epistemologicalStance,
      acknowledgedBiases: [],
      methodologicalDecisions: [],
      influenceOnInterpretation: newReflexivity.influenceOnInterpretation,
      challengesToAssumptions: [],
      learningPoints: []
    };

    onUpdateProject({
      reflexivityStatements: [...scientificData.reflexivityStatements, reflexivityStatement]
    });

    setNewReflexivity({
      researcherBackground: '',
      theoreticalPerspective: '',
      epistemologicalStance: 'constructivist',
      influenceOnInterpretation: ''
    });
    setShowReflexivityDialog(false);
  };

  // ============================================================================
  // BIAS DETECTION
  // ============================================================================

  const biasWarnings = useMemo(() => {
    return ScientificServices.BiasDetection.analyzeProject(project);
  }, [project]);

  const handleAcknowledgeBias = (biasId: string, mitigationNote: string) => {
    const updatedWarnings = biasWarnings.map((w: BiasWarning) =>
      w.id === biasId
        ? { ...w, acknowledged: true, mitigated: true, mitigationNote }
        : w
    );

    onUpdateProject({
      biasWarnings: updatedWarnings
    });
  };

  // ============================================================================
  // QUALITY CRITERIA
  // ============================================================================

  const qualityReport = useMemo(() => {
    return QualityServices.QualityCriteria.generateReport({
      ...project,
      memos: scientificData.memos,
      reflexivityStatements: scientificData.reflexivityStatements,
      biasWarnings: biasWarnings
    });
  }, [project, scientificData, biasWarnings]);

  // ============================================================================
  // SATURATION ANALYSIS
  // ============================================================================

  const saturationAnalysis = useMemo(() => {
    if (!project.categories || !project.codings) return null;

    // Mock iterations for now - TODO: Track real iterations
    const iterations = project.saturationAnalysis || [
      { iteration: 1, timestamp: new Date(), newConcepts: 10 },
      { iteration: 2, timestamp: new Date(), newConcepts: 7 },
      { iteration: 3, timestamp: new Date(), newConcepts: 4 },
      { iteration: 4, timestamp: new Date(), newConcepts: 2 },
      { iteration: 5, timestamp: new Date(), newConcepts: 1 }
    ];

    return QualityServices.Saturation.analyzeSaturation(
      project.categories,
      project.codings || [],
      iterations
    );
  }, [project.categories, project.codings, project.saturationAnalysis]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-black/30 backdrop-blur-xl border-b border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              {language === 'de' ? 'Wissenschaftliche Rigorosität' : 'Scientific Rigor'}
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              {language === 'de'
                ? 'Memos, Reflexivität, Bias-Awareness & Gütekriterien'
                : 'Memos, Reflexivity, Bias-Awareness & Quality Criteria'}
            </p>
          </div>

          {/* Quality Score Badge */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-white">
              {qualityReport.overallQualityScore.toFixed(0)}
            </div>
            <div className="text-xs text-white/80">
              {language === 'de' ? 'Qualitäts-Score' : 'Quality Score'}
            </div>
            <div className="text-xs mt-1">
              {qualityReport.readyForPublication
                ? <span className="text-green-300">✅ Publikationsreif</span>
                : <span className="text-yellow-300">⚠️ Noch nicht bereit</span>}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'memos', label: language === 'de' ? 'Memos' : 'Memos', icon: BookOpen },
            { id: 'reflexivity', label: language === 'de' ? 'Reflexivität' : 'Reflexivity', icon: Brain },
            { id: 'bias', label: language === 'de' ? 'Bias-Warnungen' : 'Bias Warnings', icon: AlertTriangle },
            { id: 'quality', label: language === 'de' ? 'Gütekriterien' : 'Quality Criteria', icon: BarChart3 }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                ${activeSection === section.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'}
              `}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
              {section.id === 'memos' && scientificData.memos.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {scientificData.memos.length}
                </span>
              )}
              {section.id === 'bias' && biasWarnings.length > 0 && (
                <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs">
                  {biasWarnings.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* MEMOS SECTION */}
        {activeSection === 'memos' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                <div className="text-2xl font-bold text-white">
                  {scientificData.memos.length}
                </div>
                <div className="text-sm text-gray-300">
                  {language === 'de' ? 'Gesamt Memos' : 'Total Memos'}
                </div>
              </div>
              {memoDensity && (
                <>
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                    <div className="text-2xl font-bold text-white">
                      {memoDensity.averageMemosPerCategory.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-300">
                      {language === 'de' ? 'Memos/Kategorie' : 'Memos/Category'}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                    <div className="text-2xl font-bold text-white">
                      {memoDensity.wellDocumentedCategories.length}
                    </div>
                    <div className="text-sm text-gray-300">
                      {language === 'de' ? 'Gut dokumentiert' : 'Well Documented'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Add Memo Button */}
            <button
              onClick={() => setShowMemoDialog(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl p-4 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              {language === 'de' ? 'Neues Forschungs-Memo' : 'New Research Memo'}
            </button>

            {/* Memo List */}
            <div className="space-y-3">
              {scientificData.memos.map((memo: ResearchMemo) => (
                <div
                  key={memo.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:border-purple-400/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`
                          px-2 py-1 rounded-lg text-xs font-medium
                          ${memo.type === 'theoretical' ? 'bg-purple-600 text-white' :
                            memo.type === 'methodological' ? 'bg-blue-600 text-white' :
                            memo.type === 'reflexive' ? 'bg-green-600 text-white' :
                            memo.type === 'analytical' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'}
                        `}>
                          {memo.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(memo.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {memo.title}
                      </h3>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {memo.content.substring(0, 200)}
                        {memo.content.length > 200 && '...'}
                      </p>
                      {memo.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {memo.tags.map(tag => (
                            <span key={tag} className="bg-white/10 px-2 py-0.5 rounded text-xs text-gray-300">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMemo(memo.id)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {scientificData.memos.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{language === 'de' ? 'Noch keine Memos vorhanden' : 'No memos yet'}</p>
                  <p className="text-sm mt-2">
                    {language === 'de'
                      ? 'Erstelle theoretische, methodische oder reflexive Memos'
                      : 'Create theoretical, methodological or reflexive memos'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REFLEXIVITY SECTION */}
        {activeSection === 'reflexivity' && (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {language === 'de' ? 'Forscher-Positionierung' : 'Researcher Positioning'}
              </h3>
              {scientificData.reflexivityStatements.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <p className="text-gray-300 mb-4">
                    {language === 'de'
                      ? 'Noch kein Reflexivitäts-Statement erstellt'
                      : 'No reflexivity statement yet'}
                  </p>
                  <button
                    onClick={() => setShowReflexivityDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all"
                  >
                    {language === 'de' ? 'Jetzt erstellen' : 'Create Now'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {scientificData.reflexivityStatements.map((stmt: ReflexivityStatement) => {
                    const assessment = QualityServices.Reflexivity.assessReflexivityLevel(stmt);
                    return (
                      <div key={stmt.id} className="bg-black/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white">
                            Reflexivitäts-Score: {assessment.score}/100
                          </h4>
                          <div className={`
                            px-3 py-1 rounded-lg text-sm font-medium
                            ${assessment.score >= 80 ? 'bg-green-600 text-white' :
                              assessment.score >= 60 ? 'bg-yellow-600 text-white' :
                              'bg-red-600 text-white'}
                          `}>
                            {assessment.score >= 80 ? '✅ Exzellent' :
                             assessment.score >= 60 ? '⚠️ Gut' :
                             '❌ Unzureichend'}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">Epistemologie:</p>
                            <p className="text-white">{stmt.epistemologicalStance}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Acknowledged Biases:</p>
                            <p className="text-white">{stmt.acknowledgedBiases.length}</p>
                          </div>
                        </div>

                        {assessment.gaps.length > 0 && (
                          <div className="mt-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3">
                            <p className="text-sm font-medium text-yellow-300 mb-2">
                              {language === 'de' ? 'Verbesserungspotenzial:' : 'Improvement Opportunities:'}
                            </p>
                            <ul className="text-sm text-yellow-200 space-y-1">
                              {assessment.gaps.map((gap, i) => (
                                <li key={i}>• {gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BIAS WARNINGS SECTION */}
        {activeSection === 'bias' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              {['critical', 'high', 'medium', 'low'].map(severity => {
                const count = biasWarnings.filter((w: BiasWarning) => w.severity === severity).length;
                return (
                  <div key={severity} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-sm text-gray-300 capitalize">{severity}</div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              {biasWarnings.map((warning: BiasWarning) => (
                <div
                  key={warning.id}
                  className={`
                    bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-l-4
                    ${warning.severity === 'critical' ? 'border-red-600' :
                      warning.severity === 'high' ? 'border-orange-600' :
                      warning.severity === 'medium' ? 'border-yellow-600' :
                      'border-green-600'}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {warning.severity === 'critical' ? '🔴' :
                         warning.severity === 'high' ? '🟠' :
                         warning.severity === 'medium' ? '🟡' : '🟢'}
                        {warning.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Type: {warning.type} | Detected: {new Date(warning.detectedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {warning.mitigated && (
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                        ✅ Mitigiert
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-300 mb-3">{warning.description}</p>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-purple-400 hover:text-purple-300 mb-2">
                      Details anzeigen
                    </summary>
                    <div className="bg-black/30 rounded-lg p-3 space-y-2">
                      <div>
                        <p className="font-medium text-white mb-1">Evidenz:</p>
                        <ul className="text-gray-300 space-y-1">
                          {warning.evidence.map((e, i) => (
                            <li key={i}>• {e}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">Empfohlene Maßnahmen:</p>
                        <ul className="text-gray-300 space-y-1">
                          {warning.mitigation.map((m, i) => (
                            <li key={i}>
                              <span className={`
                                font-medium
                                ${m.priority === 'high' ? 'text-red-400' :
                                  m.priority === 'medium' ? 'text-yellow-400' :
                                  'text-green-400'}
                              `}>
                                [{m.priority.toUpperCase()}]
                              </span> {m.strategy}: {m.implementation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              ))}

              {biasWarnings.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-lg font-medium text-green-400">
                    {language === 'de' ? 'Keine kritischen Biases erkannt!' : 'No critical biases detected!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUALITY CRITERIA SECTION */}
        {activeSection === 'quality' && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-center">
              <div className="text-6xl font-bold text-white mb-2">
                {qualityReport.overallQualityScore.toFixed(0)}
              </div>
              <div className="text-xl text-white/90 mb-4">
                {language === 'de' ? 'Gesamt-Qualität (Lincoln & Guba)' : 'Overall Quality (Lincoln & Guba)'}
              </div>
              <div className="flex gap-4 justify-center text-sm">
                <div className={`px-3 py-1 rounded-lg ${qualityReport.passesMinimumStandards ? 'bg-green-600' : 'bg-red-600'}`}>
                  {qualityReport.passesMinimumStandards ? '✅' : '❌'} Minimum Standards
                </div>
                <div className={`px-3 py-1 rounded-lg ${qualityReport.readyForPublication ? 'bg-green-600' : 'bg-yellow-600'}`}>
                  {qualityReport.readyForPublication ? '✅' : '⚠️'} Publication Ready
                </div>
              </div>
            </div>

            {/* Critical Issues */}
            {qualityReport.criticalIssues.length > 0 && (
              <div className="bg-red-600/20 border border-red-600/30 rounded-2xl p-4">
                <h3 className="text-lg font-bold text-red-300 mb-2">
                  🔴 {language === 'de' ? 'Kritische Probleme' : 'Critical Issues'}
                </h3>
                <ul className="text-sm text-red-200 space-y-1">
                  {qualityReport.criticalIssues.map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* How to Improve Scores - Info Panel */}
            <div className="bg-blue-600/20 border border-blue-600/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <InfoCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-300 mb-3">
                    {language === 'de' ? '💡 Wie verbessere ich meine Gütekriterien-Scores?' : '💡 How to Improve Your Quality Scores?'}
                  </h3>

                  <div className="space-y-4 text-sm text-gray-300">
                    <div>
                      <p className="font-semibold text-white mb-2">📊 Dependability (Verlässlichkeit):</p>
                      <ul className="space-y-1 ml-4">
                        <li>• <span className="text-blue-300">Audit Trail:</span> Jeder Eintrag = +2 Punkte (max 100 bei 50 Einträgen)</li>
                        <li>• <span className="text-blue-300">Methodologische Memos:</span> 1 Memo = +20 Punkte (max 100 bei 5 Memos)</li>
                        <li>• <span className="text-blue-300">Methodische Entscheidungen dokumentieren:</span> 1 Entscheidung = +10 Punkte (max 100 bei 10 Entscheidungen)</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-white mb-2">🎯 Credibility (Glaubwürdigkeit):</p>
                      <ul className="space-y-1 ml-4">
                        <li>• Triangulation: Multiple Kodierer, Datenquellen, Methoden</li>
                        <li>• Member Checking: Teilnehmenden-Validierung</li>
                        <li>• Peer Debriefing: Diskussion mit Kollegen</li>
                        <li>• Theoretische Memos erstellen zur Dichte</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-white mb-2">🔍 Reflexivity (Reflexivität):</p>
                      <ul className="space-y-1 ml-4">
                        <li>• <span className="text-blue-300">Reflexivitäts-Statement erstellen</span> (siehe "Reflexivität"-Tab)</li>
                        <li>• Mindestens 100 Zeichen pro Feld = +20 Punkte</li>
                        <li>• Reflexive Memos schreiben über eigene Vorannahmen</li>
                      </ul>
                    </div>

                    <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 mt-4">
                      <p className="text-green-300 font-medium mb-1">✨ Schnellstart:</p>
                      <ol className="space-y-1 ml-4 text-green-200">
                        <li>1. Erstelle ein <strong>Reflexivitäts-Statement</strong> (Reflexivität-Tab)</li>
                        <li>2. Schreibe <strong>5 methodologische Memos</strong> (Memos-Tab → Methodological)</li>
                        <li>3. Dokumentiere <strong>methodische Entscheidungen</strong> in Memos</li>
                        <li>4. Nutze die <strong>Info-Icons (ℹ️)</strong> in den Dialogen für Beispiele!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Dimensions */}
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: 'credibility', label: 'Credibility', color: 'purple' },
                { key: 'transferability', label: 'Transferability', color: 'blue' },
                { key: 'dependability', label: 'Dependability', color: 'green' },
                { key: 'confirmability', label: 'Confirmability', color: 'yellow' },
                { key: 'reflexivity', label: 'Reflexivity', color: 'pink' }
              ].map(({ key, label, color }) => {
                const score = qualityReport[key as keyof QualityCriteriaReport].score;
                return (
                  <div key={key} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-300">{label}</h4>
                      <span className="text-2xl font-bold text-white">{score.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2">
                      <div
                        className={`bg-${color}-600 h-2 rounded-full transition-all`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Saturation Analysis */}
            {saturationAnalysis && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">
                  📈 {language === 'de' ? 'Theoretische Sättigung' : 'Theoretical Saturation'}
                </h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Sättigung:</p>
                    <p className="text-2xl font-bold text-white">
                      {(saturationAnalysis.saturationScore * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Kategorien gesättigt:</p>
                    <p className="text-2xl font-bold text-white">
                      {saturationAnalysis.categoriesSaturated}/{saturationAnalysis.categoriesAnalyzed}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Empfehlung:</p>
                    <p className={`text-lg font-medium ${
                      saturationAnalysis.recommendation === 'saturation_reached' ? 'text-green-400' :
                      saturationAnalysis.recommendation === 'approaching_saturation' ? 'text-yellow-400' :
                      'text-orange-400'
                    }`}>
                      {saturationAnalysis.recommendation === 'saturation_reached' ? '✅ Erreicht' :
                       saturationAnalysis.recommendation === 'approaching_saturation' ? '⚠️ Fast erreicht' :
                       '⏳ Weiter kodieren'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{saturationAnalysis.reasonForRecommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MEMO DIALOG */}
      {showMemoDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">
                {language === 'de' ? 'Neues Forschungs-Memo' : 'New Research Memo'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  {language === 'de' ? 'Memo-Typ' : 'Memo Type'}
                  {newMemo.type && MemoTypeHelp.de[newMemo.type] && (
                    <HelpTooltip
                      title={MemoTypeHelp.de[newMemo.type].title}
                      content={MemoTypeHelp.de[newMemo.type].content}
                      score={MemoTypeHelp.de[newMemo.type].score}
                      example={MemoTypeHelp.de[newMemo.type].example}
                      position="right"
                    />
                  )}
                </label>
                <select
                  value={newMemo.type}
                  onChange={(e) => setNewMemo({ ...newMemo, type: e.target.value as MemoType })}
                  className="w-full bg-slate-700 border border-white/20 rounded-xl text-white px-4 py-2"
                >
                  <option value="theoretical">Theoretical</option>
                  <option value="methodological">Methodological</option>
                  <option value="reflexive">Reflexive</option>
                  <option value="analytical">Analytical</option>
                  <option value="ethical">Ethical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {language === 'de' ? 'Titel' : 'Title'}
                </label>
                <input
                  type="text"
                  value={newMemo.title}
                  onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
                  className="w-full bg-slate-700 border border-white/20 rounded-xl text-white px-4 py-2"
                  placeholder="z.B. Emerging Pattern: Digital Stress"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {language === 'de' ? 'Inhalt' : 'Content'}
                </label>
                <textarea
                  value={newMemo.content}
                  onChange={(e) => setNewMemo({ ...newMemo, content: e.target.value })}
                  rows={10}
                  className="w-full bg-slate-700 border border-white/20 rounded-xl text-white px-4 py-2"
                  placeholder={language === 'de'
                    ? 'Beschreibe deine Beobachtungen, theoretischen Überlegungen, methodischen Entscheidungen...'
                    : 'Describe your observations, theoretical considerations, methodological decisions...'}
                />
              </div>

              {project.categories && project.categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {language === 'de' ? 'Verknüpfte Kategorie (optional)' : 'Related Category (optional)'}
                  </label>
                  <select
                    value={newMemo.category || ''}
                    onChange={(e) => setNewMemo({ ...newMemo, category: e.target.value || undefined })}
                    className="w-full bg-slate-700 border border-white/20 rounded-xl text-white px-4 py-2"
                  >
                    <option value="">-- Keine --</option>
                    {project.categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowMemoDialog(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-all"
              >
                {language === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateMemo}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl py-3 transition-all"
              >
                {language === 'de' ? 'Memo erstellen' : 'Create Memo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFLEXIVITY DIALOG */}
      {showReflexivityDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">
                {language === 'de' ? 'Reflexivitäts-Statement erstellen' : 'Create Reflexivity Statement'}
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                {language === 'de'
                  ? 'Dokumentieren Sie Ihre Position als Forscher*in und Ihren Einfluss auf die Forschung'
                  : 'Document your position as researcher and your influence on the research'}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  {language === 'de' ? 'Forscher-Hintergrund *' : 'Researcher Background *'}
                  <HelpTooltip
                    title={ReflexivityHelp.de.researcherBackground.title}
                    content={ReflexivityHelp.de.researcherBackground.content}
                    score={ReflexivityHelp.de.researcherBackground.score}
                    example={ReflexivityHelp.de.researcherBackground.example}
                    position="right"
                  />
                </label>
                <textarea
                  value={newReflexivity.researcherBackground}
                  onChange={(e) => setNewReflexivity({ ...newReflexivity, researcherBackground: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-700 border border-white/20 rounded-xl text-white px-4 py-2"
                  placeholder={language === 'de'
                    ? 'z.B. Akademischer Hintergrund, berufliche Erfahrung, persönliche Verbindung zum Thema...'
                    : 'e.g. Academic background, professional experience, personal connection to the topic...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  {language === 'de' ? 'Theoretische Perspektive *' : 'Theoretical Perspective *'}
                  <HelpTooltip
                    title={ReflexivityHelp.de.theoreticalPerspective.title}
                    content={ReflexivityHelp.de.theoreticalPerspective.content}
                    score={ReflexivityHelp.de.theoreticalPerspective.score}
                    example={ReflexivityHelp.de.theoreticalPerspective.example}
                    position="right"
                  />
                </label>
                <textarea
                  value={newReflexivity.theoreticalPerspective}
                  onChange={(e) => setNewReflexivity({ ...newReflexivity, theoreticalPerspective: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-700 border border-white/20 rounded-xl text-white px-4 py-2"
                  placeholder={language === 'de'
                    ? 'z.B. Grounded Theory, Phänomenologie, Interpretative Phenomenological Analysis...'
                    : 'e.g. Grounded Theory, Phenomenology, Interpretative Phenomenological Analysis...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {language === 'de' ? 'Epistemologische Haltung' : 'Epistemological Stance'}
                </label>
                <select
                  value={newReflexivity.epistemologicalStance}
                  onChange={(e) => setNewReflexivity({ ...newReflexivity, epistemologicalStance: e.target.value as any })}
                  className="w-full bg-slate-700 border border-white/20 rounded-xl text-white px-4 py-2"
                >
                  <option value="constructivist">Constructivist (Konstruktivistisch)</option>
                  <option value="positivist">Positivist (Positivistisch)</option>
                  <option value="critical">Critical (Kritisch)</option>
                  <option value="pragmatist">Pragmatist (Pragmatisch)</option>
                  <option value="other">Other (Andere)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  {language === 'de' ? 'Einfluss auf Interpretation *' : 'Influence on Interpretation *'}
                  <HelpTooltip
                    title={ReflexivityHelp.de.influenceOnInterpretation.title}
                    content={ReflexivityHelp.de.influenceOnInterpretation.content}
                    score={ReflexivityHelp.de.influenceOnInterpretation.score}
                    example={ReflexivityHelp.de.influenceOnInterpretation.example}
                    position="right"
                  />
                </label>
                <textarea
                  value={newReflexivity.influenceOnInterpretation}
                  onChange={(e) => setNewReflexivity({ ...newReflexivity, influenceOnInterpretation: e.target.value })}
                  rows={5}
                  className="w-full bg-slate-700 border border-white/20 rounded-xl text-white px-4 py-2"
                  placeholder={language === 'de'
                    ? 'Wie könnten Ihre Vorannahmen, Ihr Hintergrund und Ihre Perspektive die Interpretation der Daten beeinflussen?'
                    : 'How might your preconceptions, background, and perspective influence the interpretation of the data?'}
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowReflexivityDialog(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-all"
              >
                {language === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateReflexivity}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl py-3 transition-all"
              >
                {language === 'de' ? 'Statement erstellen' : 'Create Statement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScientificResearchTab;
