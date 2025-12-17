// src/components/coding/ExpertCodingPanel.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IconBrain as Brain,
  IconUsers as Users,
  IconChartBar as BarChart,
  IconPlay as Play,
  IconPause as Pause,
  IconDownload as Download,
  IconSettings as Settings,
  IconClockHour4 as Clock,
  IconTarget as Target,
  IconTrophy as Award,
  IconAlertTriangle as AlertTriangle,
  IconCheckCircle as CheckCircle
} from '@tabler/icons-react';

import ThreeExpertCodingSystem, {
  CodingSession,
  CodingSessionConfig,
  TextSegment
} from '../../services/ThreeExpertCodingSystem';
import { ExpertPersona, CodingCategory } from '../../services/ExpertPersonaGenerator';
import ExpertCard from './ExpertCard';
import ReliabilityDashboard from './ReliabilityDashboard';
import CodingProgress from './CodingProgress';

interface ExpertCodingPanelProps {
  project: any;
  apiSettings: any;
  onCodingComplete?: (session: CodingSession) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface CodingState {
  status: 'idle' | 'initializing' | 'coding' | 'paused' | 'completed' | 'error';
  experts: ExpertPersona[];
  currentSession?: CodingSession;
  error?: string;
}

export const ExpertCodingPanel: React.FC<ExpertCodingPanelProps> = ({
  project,
  apiSettings,
  onCodingComplete,
  onError,
  className = ''
}) => {
  const [codingState, setCodingState] = useState<CodingState>({
    status: 'idle',
    experts: []
  });

  const [config, setConfig] = useState<CodingSessionConfig>({
    strictMode: false,
    allowUncertainty: true,
    confidenceThreshold: 0.7,
    requireConsensus: false,
    maxRetries: 1,
    realTimeReliability: true,
    batchSize: 10
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showExpertDetails, setShowExpertDetails] = useState<boolean[]>([]);

  // Coding System als Singleton
  const codingSystem = useMemo(() => new ThreeExpertCodingSystem(), []);

  // Event Listeners für Real-time Updates
  useEffect(() => {
    codingSystem.on('expertsGenerated', ({ experts }) => {
      setCodingState(prev => ({ ...prev, experts, status: 'idle' }));
      setShowExpertDetails(new Array(experts.length).fill(false));
    });

    codingSystem.on('sessionCreated', ({ session }) => {
      setCodingState(prev => ({ ...prev, currentSession: session }));
    });

    codingSystem.on('progressUpdate', ({ progress }) => {
      setCodingState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          progress
        } : undefined
      }));
    });

    codingSystem.on('reliabilityUpdate', ({ metrics }) => {
      setCodingState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          reliabilityMetrics: metrics
        } : undefined
      }));
    });

    codingSystem.on('sessionCompleted', ({ session }) => {
      setCodingState(prev => ({ ...prev, currentSession: session, status: 'completed' }));
      onCodingComplete?.(session);
    });

    codingSystem.on('codingError', ({ segmentId, error }) => {
      console.error(`Coding error for segment ${segmentId}:`, error);
      onError?.(error);
    });

    return () => {
      // Cleanup listeners wenn Component unmounted
    };
  }, [codingSystem, onCodingComplete, onError]);

  const handleInitializeExperts = useCallback(async () => {
    if (!project?.documents || !project?.categories) {
      onError?.('Project must have documents and categories');
      return;
    }

    setCodingState(prev => ({ ...prev, status: 'initializing' }));

    try {
      await codingSystem.initializeExperts(
        project.documents,
        project.categories,
        apiSettings
      );
    } catch (error: any) {
      setCodingState(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
      onError?.(error.message);
    }
  }, [project, apiSettings, codingSystem, onError]);

  const handleStartCoding = useCallback(async () => {
    if (!project?.documents || !project?.categories) {
      onError?.('Project must have documents and categories');
      return;
    }

    setCodingState(prev => ({ ...prev, status: 'coding' }));

    try {
      // Extrahiere Textsegmente aus Dokumenten
      const segments = extractSegmentsFromDocuments(project.documents);

      const session = await codingSystem.performFullAnalysis(
        project.documents,
        segments,
        project.categories,
        config
      );

      setCodingState(prev => ({ ...prev, currentSession: session }));
    } catch (error: any) {
      setCodingState(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
      onError?.(error.message);
    }
  }, [project, config, codingSystem, onError]);

  const handleDownloadReport = useCallback(() => {
    if (!codingState.currentSession) return;

    try {
      const report = codingSystem.generateReliabilityReport();
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expert-coding-report-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError?.('Failed to generate report');
    }
  }, [codingState.currentSession, codingSystem, onError]);

  const handleExpertDetailsToggle = (index: number) => {
    setShowExpertDetails(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'coding': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'initializing': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'coding': return <Brain className="w-5 h-5 animate-pulse" />;
      case 'error': return <AlertTriangle className="w-5 h-5" />;
      case 'initializing': return <Users className="w-5 h-5 animate-spin" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-blue-500/20 ${getStatusColor(codingState.status)}`}>
            {getStatusIcon(codingState.status)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Expert Coding System</h2>
            <p className="text-sm text-gray-400 capitalize">
              Status: {codingState.status.replace(/([A-Z])/g, ' $1').trim()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Coding Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {codingState.currentSession?.reliabilityMetrics && (
            <button
              onClick={handleDownloadReport}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              title="Download Report"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {codingState.status === 'error' && codingState.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Coding Error</span>
          </div>
          <p className="text-red-300">{codingState.error}</p>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="font-medium text-white mb-4">Coding Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.strictMode}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    strictMode: e.target.checked
                  }))}
                  className="rounded border-gray-600 bg-gray-700"
                />
                Strict Mode (Conservative coding)
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.allowUncertainty}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    allowUncertainty: e.target.checked
                  }))}
                  className="rounded border-gray-600 bg-gray-700"
                />
                Allow Uncertainty
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.realTimeReliability}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    realTimeReliability: e.target.checked
                  }))}
                  className="rounded border-gray-600 bg-gray-700"
                />
                Real-time Reliability Monitoring
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Confidence Threshold: {config.confidenceThreshold.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.1"
                  value={config.confidenceThreshold}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    confidenceThreshold: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Batch Size: {config.batchSize}
                </label>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="5"
                  value={config.batchSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    batchSize: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Max Retries: {config.maxRetries}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={config.maxRetries}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    maxRetries: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expert Cards */}
      {codingState.experts.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Generated Expert Personas ({codingState.experts.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {codingState.experts.map((expert, index) => (
              <ExpertCard
                key={index}
                expert={expert}
                number={index + 1}
                isActive={codingState.status === 'coding'}
                showDetails={showExpertDetails[index] || false}
                onToggleDetails={() => handleExpertDetailsToggle(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Progress Display */}
      {codingState.currentSession && (
        <CodingProgress
          session={codingState.currentSession}
          isActive={codingState.status === 'coding'}
        />
      )}

      {/* Reliability Dashboard */}
      {codingState.currentSession?.reliabilityMetrics && (
        <ReliabilityDashboard
          metrics={codingState.currentSession.reliabilityMetrics}
          session={codingState.currentSession}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {codingState.status === 'idle' && (
          <>
            {codingState.experts.length === 0 ? (
              <button
                onClick={handleInitializeExperts}
                disabled={!project?.documents || !apiSettings?.apiKey}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  !project?.documents || !apiSettings?.apiKey
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Users className="w-5 h-5" />
                Generate Expert Personas
              </button>
            ) : (
              <button
                onClick={handleStartCoding}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Expert Coding
              </button>
            )}
          </>
        )}

        {codingState.status === 'completed' && codingState.currentSession && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
              <Award className="w-6 h-6" />
              <span className="text-lg font-medium">Coding Completed!</span>
            </div>
            <p className="text-sm text-gray-400">
              {codingState.currentSession.codings.length} segments coded with{' '}
              {(codingState.currentSession.reliabilityMetrics?.fleissKappa.kappa || 0).toFixed(3)}{' '}
              Fleiss κ
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {codingState.currentSession && (
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-400">
                {codingState.currentSession.progress.segmentsCoded}
              </div>
              <div className="text-xs text-gray-400">Segments Coded</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">
                {codingState.currentSession.reliabilityMetrics ?
                  `${(codingState.currentSession.reliabilityMetrics.unanimousRate * 100).toFixed(0)}%` :
                  '—'
                }
              </div>
              <div className="text-xs text-gray-400">Unanimous</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-400">
                {codingState.currentSession.reliabilityMetrics ?
                  codingState.currentSession.reliabilityMetrics.fleissKappa.kappa.toFixed(3) :
                  '—'
                }
              </div>
              <div className="text-xs text-gray-400">Fleiss κ</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-400">
                {codingState.currentSession.reliabilityMetrics ?
                  codingState.currentSession.reliabilityMetrics.krippendorffAlpha.alpha.toFixed(3) :
                  '—'
                }
              </div>
              <div className="text-xs text-gray-400">Krippendorff α</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Extrahiert Textsegmente aus Projektdokumenten
 */
function extractSegmentsFromDocuments(documents: any[]): TextSegment[] {
  const segments: TextSegment[] = [];

  documents.forEach((doc, docIndex) => {
    const content = doc.content || doc.text || '';

    // Teile in Sätze oder Absätze
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20); // Mindestlänge für sinnvolle Segmente

    sentences.forEach((sentence, sentIndex) => {
      segments.push({
        id: `doc${docIndex}_seg${sentIndex}`,
        text: sentence,
        source: doc.name || doc.filename || `Document ${docIndex + 1}`,
        metadata: {
          documentIndex: docIndex,
          sentenceIndex: sentIndex,
          documentTitle: doc.title || doc.name
        }
      });
    });
  });

  return segments;
}

export default ExpertCodingPanel;