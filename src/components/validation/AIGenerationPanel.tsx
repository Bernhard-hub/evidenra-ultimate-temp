// src/components/validation/AIGenerationPanel.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  IconBrain as Brain,
  IconShieldCheck as Shield,
  IconLoader as Loader,
  IconAlertTriangle as AlertTriangle,
  IconSettings as Settings,
  IconRefresh as RefreshCw,
  IconDownload as Download,
  IconCopy as Copy
} from '@tabler/icons-react';

import ValidatedAIService, { ValidatedContent, APISettings } from '../../services/ValidatedAIService';
import ValidationReport from './ValidationReport';

interface AIGenerationPanelProps {
  project?: any;
  apiSettings: APISettings;
  onGenerate?: (content: ValidatedContent) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface GenerationOptions {
  strictMode: boolean;
  requireCitations: boolean;
  confidenceThreshold: number;
  maxRetries: number;
}

export const AIGenerationPanel: React.FC<AIGenerationPanelProps> = ({
  project,
  apiSettings,
  onGenerate,
  onError,
  className = ''
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [validatedContent, setValidatedContent] = useState<ValidatedContent | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    strictMode: false,
    requireCitations: true,
    confidenceThreshold: 0.7,
    maxRetries: 1
  });

  // Validierungsservice als Singleton
  const validatedAI = useMemo(() => new ValidatedAIService(), []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      onError?.('Bitte geben Sie einen Prompt ein');
      return;
    }

    if (!apiSettings.apiKey) {
      onError?.('API-Schlüssel fehlt');
      return;
    }

    setIsGenerating(true);
    setValidatedContent(null);

    try {
      const result = await validatedAI.generateValidatedContent(
        generatePromptFromProject(prompt, project),
        apiSettings,
        generationOptions
      );

      setValidatedContent(result);

      // Warnungen anzeigen
      if (result.warnings.length > 0) {
        console.warn('Validierungswarnungen:', result.warnings);
        // Hier könnte eine Toast-Notification gezeigt werden
      }

      onGenerate?.(result);
    } catch (error: any) {
      console.error('Generation failed:', error);
      onError?.(error.message || 'Generierung fehlgeschlagen');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, project, apiSettings, generationOptions, validatedAI, onGenerate, onError]);

  const handleAccept = useCallback(() => {
    if (validatedContent) {
      onGenerate?.(validatedContent);
      // Optional: Content in Zwischenablage kopieren
      navigator.clipboard.writeText(validatedContent.content);
    }
  }, [validatedContent, onGenerate]);

  const handleReject = useCallback(() => {
    setValidatedContent(null);
  }, []);

  const handleEdit = useCallback(() => {
    if (validatedContent) {
      // Öffne Editor mit dem generierten Content
      setPrompt(validatedContent.content);
      setValidatedContent(null);
    }
  }, [validatedContent]);

  const copyContent = useCallback(() => {
    if (validatedContent) {
      navigator.clipboard.writeText(validatedContent.content);
      // Toast notification könnte hier gezeigt werden
    }
  }, [validatedContent]);

  const downloadReport = useCallback(() => {
    if (!validatedContent) return;

    const report = validatedAI.generateValidationReport(validatedContent);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [validatedContent, validatedAI]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <h2 className="text-lg font-bold text-white">KI-Generierung mit Validierung</h2>
        </div>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`p-2 rounded-lg transition-colors ${
            showOptions ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Generierungsoptionen"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-white">Validierungsoptionen</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={generationOptions.strictMode}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    strictMode: e.target.checked
                  }))}
                  className="rounded border-gray-600 bg-gray-700"
                />
                Strenger Modus
              </label>
              <p className="text-xs text-gray-400">Besonders konservative Generierung</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={generationOptions.requireCitations}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    requireCitations: e.target.checked
                  }))}
                  className="rounded border-gray-600 bg-gray-700"
                />
                Zitationen erforderlich
              </label>
              <p className="text-xs text-gray-400">Warnung wenn keine Quellen gefunden</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-300">
                Konfidenz-Schwellwert: {generationOptions.confidenceThreshold.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.1"
                value={generationOptions.confidenceThreshold}
                onChange={(e) => setGenerationOptions(prev => ({
                  ...prev,
                  confidenceThreshold: parseFloat(e.target.value)
                }))}
                className="w-full"
              />
              <p className="text-xs text-gray-400">Mindest-Zuverlässigkeit für Akzeptanz</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-300">
                Max. Wiederholungen: {generationOptions.maxRetries}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={generationOptions.maxRetries}
                onChange={(e) => setGenerationOptions(prev => ({
                  ...prev,
                  maxRetries: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <p className="text-xs text-gray-400">Automatische Regenerierung bei Problemen</p>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Beschreiben Sie, was Sie generieren möchten..."
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isGenerating}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{prompt.length} Zeichen</span>
          <span>
            Provider: {apiSettings.provider} | Model: {apiSettings.model}
          </span>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || !apiSettings.apiKey}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            isGenerating || !prompt.trim() || !apiSettings.apiKey
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generiere & Validiere...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Mit Validierung generieren
            </>
          )}
        </button>

        {validatedContent && (
          <button
            onClick={copyContent}
            className="px-3 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            title="Inhalt kopieren"
          >
            <Copy className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Generated Content */}
      {validatedContent && (
        <div className="space-y-4">
          {/* Content Preview */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h3 className="font-medium text-white">Generierter Inhalt</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  validatedContent.confidence > 0.8 ? 'bg-green-500/20 text-green-400' :
                  validatedContent.confidence > 0.5 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {(validatedContent.confidence * 100).toFixed(1)}% Vertrauen
                </span>
                {validatedContent.requiresReview && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">
                    Überprüfung erforderlich
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="max-h-64 overflow-y-auto text-sm text-gray-300 whitespace-pre-wrap">
                {validatedContent.content}
              </div>
            </div>
          </div>

          {/* Validation Report */}
          <ValidationReport
            validation={validatedContent.validation}
            onAccept={handleAccept}
            onReject={handleReject}
            onEdit={handleEdit}
          />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {validatedContent.warnings.length > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  {validatedContent.warnings.length} Warnung(en)
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadReport}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Bericht herunterladen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Generiert erweiterten Prompt basierend auf Projekt-Context
 */
function generatePromptFromProject(basePrompt: string, project: any): string {
  if (!project) return basePrompt;

  let contextualPrompt = basePrompt;

  // Projekt-Kontext hinzufügen falls verfügbar
  if (project.title) {
    contextualPrompt += `\n\nProjekt-Kontext: ${project.title}`;
  }

  if (project.description) {
    contextualPrompt += `\nProjekt-Beschreibung: ${project.description}`;
  }

  if (project.keywords && project.keywords.length > 0) {
    contextualPrompt += `\nRelevante Schlüsselwörter: ${project.keywords.join(', ')}`;
  }

  return contextualPrompt;
}

export default AIGenerationPanel;