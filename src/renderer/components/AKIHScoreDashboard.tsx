// 🎯 AKIH Score Dashboard Component
// Visual dashboard for displaying AKIH quality scores

import React from 'react';
import { AKIHMethodology, AKIHScoreComponents } from '../../services/AKIHMethodology';
import AKIHScoreService from '../services/AKIHScoreService';
import type { ProjectData } from '../../types';
import {
  IconTrendingUp as TrendingUp,
  IconTrendingDown as TrendingDown,
  IconCircleCheck as CheckCircle,
  IconAlertTriangle as AlertTriangle,
  IconStar as Star,
  IconTarget as Target,
  IconShieldCheck as Shield
} from '@tabler/icons-react';

interface AKIHScoreDashboardProps {
  projectData: ProjectData;
  language?: 'de' | 'en';
  showDetailedMetrics?: boolean;
  showSuggestions?: boolean;
  previousScore?: number; // For trend calculation
}

export const AKIHScoreDashboard: React.FC<AKIHScoreDashboardProps> = ({
  projectData,
  language = 'de',
  showDetailedMetrics = true,
  showSuggestions = true,
  previousScore
}) => {

  // Calculate AKIH Score
  const score = AKIHMethodology.calculateAKIHScore(projectData);
  const summary = AKIHScoreService.getScoreSummary(score, language);

  // Calculate trend if previous score provided
  const trend = previousScore
    ? AKIHScoreService.calculateTrend(score.totalScore, previousScore)
    : null;

  // Get status icon based on quality level
  const getStatusIcon = () => {
    switch (score.qualityLevel) {
      case 'excellent':
        return <Star className="w-8 h-8 text-yellow-400" />;
      case 'good':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'acceptable':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {language === 'de' ? 'AKIH Qualitätsscore' : 'AKIH Quality Score'}
              </h3>
              <p className="text-sm text-white/60">
                {language === 'de'
                  ? 'AI-gestützte Kodierende Inhaltsanalyse Hybrid'
                  : 'AI-Assisted Hybrid Coding Content Analysis'}
              </p>
            </div>
          </div>

          {trend && (
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
              {trend.trend === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : trend.trend === 'down' ? (
                <TrendingDown className="w-5 h-5 text-red-400" />
              ) : (
                <div className="w-5 h-5" />
              )}
              <span className={`text-sm font-medium ${
                trend.trend === 'up' ? 'text-green-400' :
                trend.trend === 'down' ? 'text-red-400' :
                'text-white/60'
              }`}>
                {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Score Display */}
        <div className="flex items-end gap-6 mb-6">
          <div>
            <div className="text-6xl font-bold" style={{ color: summary.color }}>
              {summary.totalScore.toFixed(1)}
            </div>
            <div className="text-2xl text-white/40">/ 100</div>
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{summary.qualityIcon}</span>
              <span className="text-xl font-semibold text-white">
                {summary.quality}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${summary.totalScore}%`,
                  backgroundColor: summary.color
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-sm text-white/60 mb-1">
              {language === 'de' ? 'Kodierungen' : 'Codings'}
            </div>
            <div className="text-2xl font-bold text-white">
              {score.metrics.totalCodings}
            </div>
            <div className="text-xs text-white/40 mt-1">
              {score.metrics.validatedCodings} {language === 'de' ? 'validiert' : 'validated'}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-sm text-white/60 mb-1">
              {language === 'de' ? 'Abdeckung' : 'Coverage'}
            </div>
            <div className="text-2xl font-bold text-white">
              {(score.coverage * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-white/40 mt-1">
              {score.metrics.analyzedDocuments}/{score.metrics.totalDocuments} {language === 'de' ? 'Dokumente' : 'docs'}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-sm text-white/60 mb-1">
              {language === 'de' ? 'Sättigung' : 'Saturation'}
            </div>
            <div className="text-2xl font-bold text-white">
              {(score.saturation * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-white/40 mt-1">
              {language === 'de' ? 'Theoretisch' : 'Theoretical'}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {showDetailedMetrics && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            {language === 'de' ? 'Detaillierte Metriken' : 'Detailed Metrics'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {summary.components.map((comp, idx) => {
              const statusColor =
                comp.status === 'excellent' ? 'text-green-400' :
                comp.status === 'good' ? 'text-blue-400' :
                comp.status === 'warning' ? 'text-yellow-400' :
                'text-red-400';

              const statusIcon =
                comp.status === 'excellent' ? '🟢' :
                comp.status === 'good' ? '🔵' :
                comp.status === 'warning' ? '🟡' :
                '🔴';

              return (
                <div key={idx} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/80">
                      {comp.name}
                    </span>
                    <span className="text-xs">{statusIcon}</span>
                  </div>

                  <div className="flex items-end gap-2">
                    <span className={`text-2xl font-bold ${statusColor}`}>
                      {comp.percentage}
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300`}
                      style={{
                        width: comp.percentage,
                        backgroundColor:
                          comp.status === 'excellent' ? '#10b981' :
                          comp.status === 'good' ? '#3b82f6' :
                          comp.status === 'warning' ? '#f59e0b' :
                          '#ef4444'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      {showSuggestions && summary.suggestions.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-6 border border-white/10">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            {language === 'de' ? 'Verbesserungsvorschläge' : 'Improvement Suggestions'}
          </h4>

          <div className="space-y-3">
            {summary.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Methodology Info */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20">
            <Star className="w-6 h-6 text-purple-300" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2">
              {language === 'de' ? 'AKIH-Methodik' : 'AKIH Methodology'}
            </h4>
            <p className="text-sm text-white/70 leading-relaxed">
              {language === 'de'
                ? 'Die AKIH-Methode kombiniert KI-gestützte qualitative Inhaltsanalyse mit regelgeleiteter menschlicher Interaktion. Der Score basiert auf 8 wissenschaftlich fundierten Komponenten und übertrifft traditionelle QDA-Software wie Atlas.ti und MAXQDA.'
                : 'The AKIH methodology combines AI-assisted qualitative content analysis with rule-guided human interaction. The score is based on 8 scientifically validated components and surpasses traditional QDA software like Atlas.ti and MAXQDA.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
                {language === 'de' ? 'Wissenschaftlich validiert' : 'Scientifically validated'}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
                {language === 'de' ? 'Publikationsreif' : 'Publication-ready'}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-200 border border-green-500/30">
                {language === 'de' ? 'Reproduzierbar' : 'Reproducible'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AKIHScoreDashboard;
