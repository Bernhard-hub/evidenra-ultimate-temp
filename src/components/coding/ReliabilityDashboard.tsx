// src/components/coding/ReliabilityDashboard.tsx

import React from 'react';
import {
  IconChartBar as BarChart,
  IconTarget as Target,
  IconUsers as Users,
  IconCircleCheck as CheckCircle,
  IconAlertTriangle as AlertTriangle,
  IconTrophy as Trophy,
  IconEye as Eye,
  IconInfoCircle as Info,
  IconTrendingUp as TrendingUp
} from '@tabler/icons-react';

import { ReliabilityMetrics, CodingSession } from '../../services/ThreeExpertCodingSystem';

interface ReliabilityDashboardProps {
  metrics: ReliabilityMetrics;
  session: CodingSession;
  className?: string;
}

export const ReliabilityDashboard: React.FC<ReliabilityDashboardProps> = ({
  metrics,
  session,
  className = ''
}) => {
  const getReliabilityColor = (value: number, type: 'kappa' | 'alpha') => {
    if (type === 'kappa') {
      if (value >= 0.8) return 'text-green-400 bg-green-500/20 border-green-500/30';
      if (value >= 0.6) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      if (value >= 0.4) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    } else {
      if (value >= 0.8) return 'text-green-400 bg-green-500/20 border-green-500/30';
      if (value >= 0.67) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    }
  };

  const getReliabilityIcon = (value: number, type: 'kappa' | 'alpha') => {
    const threshold = type === 'kappa' ? 0.6 : 0.67;
    if (value >= threshold) {
      return <CheckCircle className="w-5 h-5" />;
    }
    return <AlertTriangle className="w-5 h-5" />;
  };

  const interpretKappa = (kappa: number) => {
    if (kappa >= 0.8) return 'Almost Perfect';
    if (kappa >= 0.6) return 'Substantial';
    if (kappa >= 0.4) return 'Moderate';
    if (kappa >= 0.2) return 'Fair';
    return 'Poor';
  };

  const interpretAlpha = (alpha: number) => {
    if (alpha >= 0.8) return 'Excellent';
    if (alpha >= 0.67) return 'Good';
    return 'Insufficient';
  };

  // Berechne Kategorieverteilung für Visualization
  const totalCodings = Object.values(metrics.categoryDistribution).reduce((a, b) => a + b, 0);
  const categoryPercentages = Object.entries(metrics.categoryDistribution).map(([category, count]) => ({
    category,
    count,
    percentage: (count / totalCodings) * 100
  }));

  // Experten-Übereinstimmungsmatrix für Display
  const expertPairs = [
    { pair: 'Expert 1 ↔ Expert 2', agreement: metrics.expertAgreementMatrix[0][1] },
    { pair: 'Expert 1 ↔ Expert 3', agreement: metrics.expertAgreementMatrix[0][2] },
    { pair: 'Expert 2 ↔ Expert 3', agreement: metrics.expertAgreementMatrix[1][2] }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <BarChart className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Inter-Rater Reliability</h3>
          <p className="text-sm text-gray-400">
            Statistical analysis of coding agreement
          </p>
        </div>
      </div>

      {/* Main Reliability Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fleiss' Kappa */}
        <div className={`rounded-lg border p-4 ${getReliabilityColor(metrics.fleissKappa.kappa, 'kappa')}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getReliabilityIcon(metrics.fleissKappa.kappa, 'kappa')}
              <h4 className="font-medium">Fleiss' Kappa</h4>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {metrics.fleissKappa.kappa.toFixed(3)}
              </div>
              <div className="text-xs opacity-75">
                {interpretKappa(metrics.fleissKappa.kappa)}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>95% CI:</span>
              <span>
                [{metrics.fleissKappa.confidenceInterval.lower.toFixed(3)}, {metrics.fleissKappa.confidenceInterval.upper.toFixed(3)}]
              </span>
            </div>
            <div className="flex justify-between">
              <span>p-value:</span>
              <span className={metrics.fleissKappa.significance.isSignificant ? 'text-green-300' : 'text-red-300'}>
                {metrics.fleissKappa.significance.pValue.toFixed(6)}
                {metrics.fleissKappa.significance.isSignificant && ' *'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Standard Error:</span>
              <span>{metrics.fleissKappa.standardError.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Krippendorff's Alpha */}
        <div className={`rounded-lg border p-4 ${getReliabilityColor(metrics.krippendorffAlpha.alpha, 'alpha')}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getReliabilityIcon(metrics.krippendorffAlpha.alpha, 'alpha')}
              <h4 className="font-medium">Krippendorff's α</h4>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {metrics.krippendorffAlpha.alpha.toFixed(3)}
              </div>
              <div className="text-xs opacity-75">
                {interpretAlpha(metrics.krippendorffAlpha.alpha)}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>95% CI (Bootstrap):</span>
              <span>
                [{metrics.krippendorffAlpha.confidenceInterval.lower.toFixed(3)}, {metrics.krippendorffAlpha.confidenceInterval.upper.toFixed(3)}]
              </span>
            </div>
            <div className="flex justify-between">
              <span>Reliability:</span>
              <span className="capitalize font-medium">
                {metrics.krippendorffAlpha.reliability}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bootstrap Samples:</span>
              <span>{metrics.krippendorffAlpha.bootstrapSamples}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agreement Statistics */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Agreement Statistics
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {(metrics.unanimousRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Unanimous Agreement</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(metrics.unanimousRate * session.codings.length)} segments
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-blue-400">
              {(metrics.consensusRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Majority Consensus</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(metrics.consensusRate * session.codings.length)} segments
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-purple-400">
              {metrics.averageConfidence.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Avg Confidence</div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
              <div
                className="bg-purple-400 h-1.5 rounded-full transition-all"
                style={{ width: `${metrics.averageConfidence * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {session.codings.length}
            </div>
            <div className="text-xs text-gray-400">Total Segments</div>
            <div className="text-xs text-gray-500 mt-1">
              {session.categories.length} categories
            </div>
          </div>
        </div>
      </div>

      {/* Expert Pairwise Agreement */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Expert Pairwise Agreement
        </h4>

        <div className="space-y-3">
          {expertPairs.map((pair, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{pair.pair}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${(pair.agreement || 0) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-blue-400 w-12 text-right">
                  {((pair.agreement || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          Category Usage Distribution
        </h4>

        <div className="space-y-3">
          {categoryPercentages.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300 truncate flex-1 mr-3">
                  {item.category}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {item.count} uses
                  </span>
                  <span className="text-sm font-medium text-green-400 w-12 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-green-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Category Agreement (from Fleiss) */}
      {metrics.fleissKappa.perCategoryAgreement && (
        <div className="bg-gray-800/30 rounded-lg p-4">
          <h4 className="font-medium text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-400" />
            Per-Category Agreement
          </h4>

          <div className="space-y-2">
            {metrics.fleissKappa.perCategoryAgreement.map((cat, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-300">{cat.category}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-orange-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${cat.agreement * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-orange-400 w-12 text-right">
                    {(cat.agreement * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interpretation & Recommendations */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          Statistical Interpretation
        </h4>

        <div className="space-y-3 text-sm">
          {/* Overall Assessment */}
          <div className={`p-3 rounded border ${
            metrics.fleissKappa.kappa >= 0.6 && metrics.krippendorffAlpha.alpha >= 0.67
              ? 'bg-green-500/10 border-green-500/20 text-green-300'
              : metrics.fleissKappa.kappa >= 0.4 || metrics.krippendorffAlpha.alpha >= 0.4
              ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            <div className="font-medium mb-1">
              {metrics.fleissKappa.kappa >= 0.6 && metrics.krippendorffAlpha.alpha >= 0.67
                ? '✅ Excellent Reliability'
                : metrics.fleissKappa.kappa >= 0.4 || metrics.krippendorffAlpha.alpha >= 0.4
                ? '⚠️ Moderate Reliability'
                : '❌ Poor Reliability'
              }
            </div>
            <div>
              {metrics.fleissKappa.kappa >= 0.6 && metrics.krippendorffAlpha.alpha >= 0.67
                ? 'Both metrics indicate high inter-rater reliability. The coding scheme is reliable for research conclusions.'
                : metrics.fleissKappa.kappa >= 0.4 || metrics.krippendorffAlpha.alpha >= 0.4
                ? 'Moderate reliability detected. Consider refining coding guidelines and providing additional training.'
                : 'Low reliability indicates significant disagreement. Coding scheme revision recommended.'
              }
            </div>
          </div>

          {/* Statistical Significance */}
          <div className="text-gray-300">
            <strong>Statistical Significance:</strong>{' '}
            {metrics.fleissKappa.significance.isSignificant
              ? 'The observed agreement is statistically significant (p < 0.05), indicating reliability better than chance.'
              : 'The agreement is not statistically significant, suggesting reliability may not exceed chance levels.'
            }
          </div>

          {/* Recommendations */}
          <div className="text-gray-300">
            <strong>Recommendations:</strong>
            <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
              {metrics.fleissKappa.kappa >= 0.8 ? (
                <li>Excellent reliability - proceed with confidence</li>
              ) : metrics.fleissKappa.kappa >= 0.6 ? (
                <>
                  <li>Good reliability for most research purposes</li>
                  <li>Monitor categories with lower agreement rates</li>
                </>
              ) : (
                <>
                  <li>Revise coding guidelines for clarity</li>
                  <li>Provide additional coder training</li>
                  <li>Consider consolidating similar categories</li>
                  <li>Review segments with persistent disagreement</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReliabilityDashboard;