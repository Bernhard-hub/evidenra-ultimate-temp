// src/components/validation/CitationAnalyzer.tsx

import React, { useState, useCallback, useRef } from 'react';
import {
  IconSearch as Search,
  IconLoader as Loader,
  IconCircleCheck as CheckCircle,
  IconX as XCircle,
  IconExternalLink as ExternalLink,
  IconAlertTriangle as AlertTriangle,
  IconFileText as FileText,
  IconDownload as Download,
  IconCopy as Copy,
  IconRefresh as RefreshCw
} from '@tabler/icons-react';

import CitationValidator, { CitationValidation } from '../../services/CitationValidator';

interface CitationResult extends CitationValidation {
  text: string;
  suggestions: string[];
}

interface CitationAnalyzerProps {
  className?: string;
}

export const CitationAnalyzer: React.FC<CitationAnalyzerProps> = ({ className = '' }) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CitationResult[]>([]);
  const [showDetails, setShowDetails] = useState<boolean[]>([]);

  const citationValidator = useRef(new CitationValidator()).current;

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    setResults([]);
    setShowDetails([]);

    try {
      // Extrahiere Zitationen
      const citations = citationValidator.extractCitationsFromText(inputText);

      if (citations.length === 0) {
        setResults([]);
        return;
      }

      // Validiere alle Zitationen
      const validations = await citationValidator.validateCitations(citations);

      const newResults: CitationResult[] = citations.map((text, index) => {
        const validation = validations[index];
        return {
          text,
          ...validation,
          suggestions: citationValidator.generateSuggestions(text, validation)
        };
      });

      setResults(newResults);
      setShowDetails(new Array(newResults.length).fill(false));
    } catch (error) {
      console.error('Citation analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, citationValidator]);

  const toggleDetails = (index: number) => {
    setShowDetails(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateReport = () => {
    if (results.length === 0) return;

    let report = '# Citation Analysis Report\n\n';
    report += `Analyzed ${results.length} citation(s) from text\n\n`;

    results.forEach((result, index) => {
      report += `## Citation ${index + 1}\n`;
      report += `**Text:** ${result.text}\n`;
      report += `**Valid:** ${result.isValid ? '✅ Yes' : '❌ No'}\n`;
      report += `**Confidence:** ${(result.confidence * 100).toFixed(1)}%\n`;

      if (result.crossRefVerified !== undefined) {
        report += `**CrossRef Verified:** ${result.crossRefVerified ? '✅ Yes' : '❌ No'}\n`;
      }

      if (result.doi) {
        report += `**DOI:** ${result.doi}\n`;
      }

      if (result.actualTitle) {
        report += `**Title:** ${result.actualTitle}\n`;
      }

      if (result.warnings.length > 0) {
        report += `**Warnings:**\n`;
        result.warnings.forEach(warning => {
          report += `- ${warning}\n`;
        });
      }

      if (result.suggestions.length > 0) {
        report += `**Suggestions:**\n`;
        result.suggestions.forEach(suggestion => {
          report += `- ${suggestion}\n`;
        });
      }

      report += '\n';
    });

    // Download report
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citation-analysis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getValidationColor = (confidence: number, isValid: boolean) => {
    if (!isValid) return 'text-red-400';
    if (confidence > 0.8) return 'text-green-400';
    if (confidence > 0.5) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getValidationBg = (confidence: number, isValid: boolean) => {
    if (!isValid) return 'bg-red-500/20 border-red-500/30';
    if (confidence > 0.8) return 'bg-green-500/20 border-green-500/30';
    if (confidence > 0.5) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-orange-500/20 border-orange-500/30';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-blue-400" />
        <h2 className="text-lg font-bold text-white">Zitations-Analyser</h2>
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Text mit Zitationen einfügen
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Fügen Sie hier Text mit Zitationen ein, z.B.:
'Neueste Forschung zeigt (Smith et al., 2023), dass...'
'Laut einer Studie (Johnson, 2024: S. 45) ist...'
'Die Ergebnisse von (Miller & Brown, 2023) deuten darauf hin...'"
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isAnalyzing}
        />
        <div className="text-xs text-gray-400">
          {inputText.length} Zeichen • Unterstützte Formate: (Author, Year), (Author et al., Year), (Author & Author, Year)
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex gap-2">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !inputText.trim()}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isAnalyzing || !inputText.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Analysiere Zitationen...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Zitationen analysieren
            </>
          )}
        </button>

        {results.length > 0 && (
          <button
            onClick={generateReport}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            title="Bericht herunterladen"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Zusammenfassung</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">{results.length}</div>
                <div className="text-gray-400">Zitationen gefunden</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">
                  {results.filter(r => r.isValid).length}
                </div>
                <div className="text-gray-400">Gültig</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">
                  {results.filter(r => !r.isValid).length}
                </div>
                <div className="text-gray-400">Ungültig</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">
                  {results.filter(r => r.crossRefVerified).length}
                </div>
                <div className="text-gray-400">CrossRef verifiziert</div>
              </div>
            </div>
          </div>

          {/* Citation Details */}
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getValidationBg(result.confidence, result.isValid)}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {result.isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white break-words">
                        {result.text}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className={getValidationColor(result.confidence, result.isValid)}>
                          Konfidenz: {(result.confidence * 100).toFixed(1)}%
                        </span>
                        {result.crossRefVerified !== undefined && (
                          <span className={`flex items-center gap-1 ${
                            result.crossRefVerified ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            <ExternalLink className="w-3 h-3" />
                            CrossRef {result.crossRefVerified ? '✓' : '✗'}
                          </span>
                        )}
                        {result.doi && (
                          <span className="text-blue-400">DOI verfügbar</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => copyToClipboard(result.text)}
                      className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                      title="Zitation kopieren"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => toggleDetails(index)}
                      className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                      title="Details anzeigen"
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-400 transition-transform ${
                        showDetails[index] ? 'rotate-180' : ''
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <div className="mb-2">
                    {result.warnings.slice(0, 2).map((warning, wi) => (
                      <div key={wi} className="flex items-start gap-2 text-sm text-yellow-400 mb-1">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </div>
                    ))}
                    {result.warnings.length > 2 && !showDetails[index] && (
                      <div className="text-xs text-gray-400">
                        +{result.warnings.length - 2} weitere Warnungen
                      </div>
                    )}
                  </div>
                )}

                {/* Details */}
                {showDetails[index] && (
                  <div className="border-t border-gray-600/30 pt-3 mt-3 space-y-3">
                    {/* All Warnings */}
                    {result.warnings.length > 2 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-400 mb-1">Alle Warnungen:</h4>
                        {result.warnings.slice(2).map((warning, wi) => (
                          <div key={wi + 2} className="text-sm text-yellow-400 ml-2">
                            • {warning}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CrossRef Details */}
                    {result.actualTitle && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-400 mb-1">CrossRef Details:</h4>
                        <div className="text-sm text-gray-300 ml-2">
                          <div><strong>Titel:</strong> {result.actualTitle}</div>
                          {result.doi && <div><strong>DOI:</strong> {result.doi}</div>}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {result.suggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-400 mb-1">Verbesserungsvorschläge:</h4>
                        <ul className="text-sm text-gray-300 ml-2 space-y-1">
                          {result.suggestions.map((suggestion, si) => (
                            <li key={si}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Citations Found */}
      {!isAnalyzing && inputText.trim() && results.length === 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-300">Keine Zitationen im Text gefunden</p>
          <p className="text-sm text-gray-400 mt-1">
            Stellen Sie sicher, dass Zitationen im Format (Autor, Jahr) vorliegen
          </p>
        </div>
      )}
    </div>
  );
};

export default CitationAnalyzer;