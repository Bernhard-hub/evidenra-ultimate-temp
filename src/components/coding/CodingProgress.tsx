// src/components/coding/CodingProgress.tsx

import React, { useEffect, useState } from 'react';
import {
  IconProgress as Progress,
  IconClock as Clock,
  IconTarget as Target,
  IconBrain as Brain,
  IconUsers as Users,
  IconChartBar as BarChart,
  IconLoader as Loader
} from '@tabler/icons-react';

import { CodingSession } from '../../services/ThreeExpertCodingSystem';

interface CodingProgressProps {
  session: CodingSession;
  isActive?: boolean;
  className?: string;
}

export const CodingProgress: React.FC<CodingProgressProps> = ({
  session,
  isActive = false,
  className = ''
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer für Echtzeit-Updates
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const startTime = new Date(session.startTime).getTime();
      const now = Date.now();
      setElapsedTime(now - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, session.startTime]);

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatEstimatedTime = (milliseconds?: number): string => {
    if (!milliseconds) return '—';

    const totalSeconds = Math.floor(milliseconds / 1000);
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const getProgressColor = () => {
    const percentage = session.progress.percentage;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusMessage = () => {
    switch (session.status) {
      case 'initialized':
        return 'Ready to start coding';
      case 'coding':
        return `Coding in progress - ${session.progress.segmentsCoded}/${session.progress.totalSegments} segments`;
      case 'analyzing':
        return 'Analyzing reliability metrics...';
      case 'completed':
        return 'Coding completed successfully!';
      default:
        return 'Unknown status';
    }
  };

  // Berechne Kodierungsstatistiken
  const codingStats = session.codings.length > 0 ? {
    unanimous: session.codings.filter(c => c.consensus.isUnanimous).length,
    majority: session.codings.filter(c => c.consensus.isMajority && !c.consensus.isUnanimous).length,
    split: session.codings.filter(c => !c.consensus.isMajority).length,
    avgConfidence: session.codings.reduce((sum, c) => sum + c.consensus.confidenceScore, 0) / session.codings.length
  } : null;

  return (
    <div className={`bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20' : 'bg-gray-600/20'}`}>
            {isActive ? (
              <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            ) : (
              <Target className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Coding Progress</h3>
            <p className="text-sm text-gray-400">{getStatusMessage()}</p>
          </div>
        </div>

        {/* Session Info */}
        <div className="text-right text-sm">
          <div className="text-gray-300">Session: {session.id.slice(-8)}</div>
          <div className="text-gray-400">
            {session.experts.length} experts • {session.categories.length} categories
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">
            Progress: {session.progress.segmentsCoded}/{session.progress.totalSegments} segments
          </span>
          <span className="font-medium text-white">
            {session.progress.percentage.toFixed(1)}%
          </span>
        </div>

        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${session.progress.percentage}%` }}
            />
          </div>

          {/* Progress Animation */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
          )}
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[25, 50, 75, 100].map((milestone, index) => (
            <div
              key={milestone}
              className={`text-center py-1 rounded ${
                session.progress.percentage >= milestone
                  ? 'text-green-400 bg-green-500/10'
                  : 'text-gray-500'
              }`}
            >
              {milestone}%
            </div>
          ))}
        </div>
      </div>

      {/* Timing Information */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Elapsed Time</span>
          </div>
          <div className="text-lg font-bold text-blue-400">
            {formatTime(isActive ? elapsedTime :
              (session.endTime ?
                new Date(session.endTime).getTime() - new Date(session.startTime).getTime() :
                0)
            )}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Remaining</span>
          </div>
          <div className="text-lg font-bold text-green-400">
            {isActive ? formatEstimatedTime(session.progress.estimatedTimeRemaining) : '—'}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3 text-center md:col-span-1 col-span-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BarChart className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Rate</span>
          </div>
          <div className="text-lg font-bold text-purple-400">
            {session.progress.segmentsCoded > 0 && elapsedTime > 0
              ? `${((session.progress.segmentsCoded / (elapsedTime / 1000)) * 60).toFixed(1)}/min`
              : '—'
            }
          </div>
        </div>
      </div>

      {/* Live Coding Statistics */}
      {codingStats && (
        <div className="space-y-3">
          <h4 className="font-medium text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-yellow-400" />
            Agreement Statistics ({session.codings.length} coded)
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900/30 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-400">
                {codingStats.unanimous}
              </div>
              <div className="text-xs text-gray-400">Unanimous</div>
              <div className="text-xs text-green-300">
                {((codingStats.unanimous / session.codings.length) * 100).toFixed(0)}%
              </div>
            </div>

            <div className="bg-gray-900/30 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-400">
                {codingStats.majority}
              </div>
              <div className="text-xs text-gray-400">Majority</div>
              <div className="text-xs text-blue-300">
                {((codingStats.majority / session.codings.length) * 100).toFixed(0)}%
              </div>
            </div>

            <div className="bg-gray-900/30 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-red-400">
                {codingStats.split}
              </div>
              <div className="text-xs text-gray-400">Split</div>
              <div className="text-xs text-red-300">
                {((codingStats.split / session.codings.length) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Average Confidence */}
          <div className="bg-gray-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Average Confidence</span>
              <span className="text-sm font-medium text-white">
                {(codingStats.avgConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  codingStats.avgConfidence > 0.8 ? 'bg-green-500' :
                  codingStats.avgConfidence > 0.6 ? 'bg-blue-500' :
                  codingStats.avgConfidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${codingStats.avgConfidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Real-time Reliability Preview */}
      {session.reliabilityMetrics && session.configuration.realTimeReliability && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Live Reliability (Interim)
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/30 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-400 mb-1">Fleiss' Kappa</div>
              <div className={`text-lg font-bold ${
                session.reliabilityMetrics.fleissKappa.kappa > 0.6 ? 'text-green-400' :
                session.reliabilityMetrics.fleissKappa.kappa > 0.4 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {session.reliabilityMetrics.fleissKappa.kappa.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500">
                {session.reliabilityMetrics.fleissKappa.interpretation}
              </div>
            </div>

            <div className="bg-gray-900/30 rounded-lg p-3 text-center">
              <div className="text-sm text-gray-400 mb-1">Krippendorff α</div>
              <div className={`text-lg font-bold ${
                session.reliabilityMetrics.krippendorffAlpha.alpha > 0.67 ? 'text-green-400' :
                session.reliabilityMetrics.krippendorffAlpha.alpha > 0.4 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {session.reliabilityMetrics.krippendorffAlpha.alpha.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500">
                {session.reliabilityMetrics.krippendorffAlpha.reliability}
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            * Interim metrics updated every {session.configuration.batchSize} segments
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="bg-gray-900/20 rounded-lg p-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-gray-400">Mode:</span>
            <span className="ml-2 text-white">
              {session.configuration.strictMode ? 'Strict' : 'Standard'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Uncertainty:</span>
            <span className="ml-2 text-white">
              {session.configuration.allowUncertainty ? 'Allowed' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Threshold:</span>
            <span className="ml-2 text-white">
              {session.configuration.confidenceThreshold.toFixed(1)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Batch Size:</span>
            <span className="ml-2 text-white">
              {session.configuration.batchSize}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingProgress;