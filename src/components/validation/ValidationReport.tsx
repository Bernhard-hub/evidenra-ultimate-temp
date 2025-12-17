// src/components/validation/ValidationReport.tsx

import React from 'react';
import {
  IconAlertTriangle as AlertTriangle,
  IconCircleCheck as CheckCircle,
  IconX as XCircle,
  IconShieldCheck as Shield,
  IconClock as Clock,
  IconExternalLink as ExternalLink,
  IconInfoCircle as Info
} from '@tabler/icons-react';
import { ValidationMetadata } from '../../services/ValidatedAIService';

interface ValidationReportProps {
  validation: ValidationMetadata;
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const ValidationReport: React.FC<ValidationReportProps> = ({
  validation,
  onAccept,
  onReject,
  onEdit,
  className = ''
}) => {
  const getConfidenceColor = (score: number): string => {
    if (score > 0.8) return 'text-green-400';
    if (score > 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBackground = (score: number): string => {
    if (score > 0.8) return 'bg-green-500/20 border-green-500/30';
    if (score > 0.5) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'ACCEPT': return 'text-green-400';
      case 'ACCEPT_WITH_WARNINGS': return 'text-yellow-400';
      case 'REVIEW': return 'text-orange-400';
      case 'REJECT': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ACCEPT': return <CheckCircle className="w-4 h-4" />;
      case 'ACCEPT_WITH_WARNINGS': return <AlertTriangle className="w-4 h-4" />;
      case 'REVIEW': return <Info className="w-4 h-4" />;
      case 'REJECT': return <XCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">Validierungsbericht</h3>
        </div>
        {validation.processingTime && (
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            {validation.processingTime}ms
          </div>
        )}
      </div>

      {/* Overall Score */}
      <div className={`rounded-lg border p-3 ${getConfidenceBackground(validation.overallScore)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-white">Zuverlässigkeits-Score</span>
          <span className={`font-bold text-lg ${getConfidenceColor(validation.overallScore)}`}>
            {(validation.overallScore * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              validation.overallScore > 0.8 ? 'bg-green-400' :
              validation.overallScore > 0.5 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${validation.overallScore * 100}%` }}
          />
        </div>
      </div>

      {/* Hallucination Risk */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-white">Halluzinations-Risiko</span>
          <div className={`flex items-center gap-2 ${getActionColor(validation.hallucinationAnalysis.action)}`}>
            {getActionIcon(validation.hallucinationAnalysis.action)}
            <span className="font-medium">{validation.hallucinationAnalysis.action}</span>
          </div>
        </div>
        <p className="text-sm text-gray-300">{validation.hallucinationAnalysis.interpretation}</p>

        {validation.hallucinationAnalysis.score > 0.2 && (
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-red-400 transition-all duration-300"
                style={{ width: `${validation.hallucinationAnalysis.score * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 mt-1">
              Risiko-Score: {(validation.hallucinationAnalysis.score * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Citations */}
      {validation.citations.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <h4 className="font-medium text-white mb-2 flex items-center gap-2">
            Zitationen ({validation.citations.length})
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
              {validation.citations.filter(c => c.isValid).length} gültig
            </span>
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {validation.citations.map((cit, i) => (
              <div key={i} className="flex items-start gap-3 text-sm bg-gray-900/30 rounded p-2">
                <div className="flex-shrink-0 mt-0.5">
                  {cit.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">{cit.text}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>Konfidenz: {(cit.confidence * 100).toFixed(0)}%</span>
                    {cit.crossRefVerified !== undefined && (
                      <span className={`flex items-center gap-1 ${
                        cit.crossRefVerified ? 'text-blue-400' : 'text-gray-500'
                      }`}>
                        <ExternalLink className="w-3 h-3" />
                        {cit.crossRefVerified ? 'CrossRef ✓' : 'CrossRef ✗'}
                      </span>
                    )}
                    {cit.doi && (
                      <span className="text-blue-400">DOI verfügbar</span>
                    )}
                  </div>
                  {cit.warnings.length > 0 && (
                    <div className="mt-1">
                      {cit.warnings.slice(0, 2).map((warning, wi) => (
                        <div key={wi} className="text-xs text-yellow-400">
                          ⚠ {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.hallucinationAnalysis.warnings.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <h4 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Warnungen ({validation.hallucinationAnalysis.warnings.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {validation.hallucinationAnalysis.warnings.slice(0, 5).map((warning, i) => (
              <div key={i} className="text-sm bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                <div className="font-medium text-yellow-400 capitalize">
                  {warning.category}
                </div>
                <div className="text-gray-300">
                  {warning.issue || (warning.matches?.[0] ? `Pattern: "${warning.matches[0]}"` : 'Verdächtiges Muster')}
                </div>
                {warning.matches && warning.matches.length > 1 && (
                  <div className="text-xs text-gray-400 mt-1">
                    +{warning.matches.length - 1} weitere Vorkommen
                  </div>
                )}
              </div>
            ))}
            {validation.hallucinationAnalysis.warnings.length > 5 && (
              <div className="text-xs text-gray-400 text-center py-1">
                +{validation.hallucinationAnalysis.warnings.length - 5} weitere Warnungen
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {validation.hallucinationAnalysis.suggestions.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <h4 className="font-medium text-blue-400 mb-2">Verbesserungsvorschläge</h4>
          <ul className="space-y-1 text-sm text-gray-300">
            {validation.hallucinationAnalysis.suggestions.slice(0, 3).map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Analysiert am {formatTimestamp(validation.timestamp)}
          </div>
          <div className="flex gap-2">
            {onReject && validation.hallucinationAnalysis.action === 'REJECT' && (
              <button
                onClick={onReject}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
              >
                Ablehnen
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
              >
                Bearbeiten
              </button>
            )}
            {onAccept && validation.hallucinationAnalysis.action !== 'REJECT' && (
              <button
                onClick={onAccept}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
              >
                Akzeptieren
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Regeneration Notice */}
      {validation.regenerated && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-sm">
          <div className="flex items-center gap-2 text-blue-400">
            <Info className="w-4 h-4" />
            <span className="font-medium">Inhalt wurde regeneriert</span>
          </div>
          <p className="text-gray-300 mt-1">
            Der ursprüngliche Inhalt wurde aufgrund von Qualitätsproblemen mit strengeren Richtlinien neu generiert.
          </p>
        </div>
      )}
    </div>
  );
};

export default ValidationReport;