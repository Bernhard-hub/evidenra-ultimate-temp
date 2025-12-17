// src/renderer/components/ModelSelector.tsx
import React, { useState, useEffect } from 'react';
import { IconCheck as Check, IconAlertCircle as AlertCircle, IconRefresh as RefreshCw } from '@tabler/icons-react';

interface ModelSelectorProps {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  currentModel: string;
  onModelChange: (model: string) => void;
  language: 'de' | 'en';
}

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  cost: string;
  recommended?: boolean;
}

/**
 * Modell-Selektor mit Live-Verfügbarkeits-Check
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  provider,
  apiKey,
  currentModel,
  onModelChange,
  language
}) => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'untested'>>({});

  // Anthropic Modelle
  const anthropicModels: ModelInfo[] = [
    {
      id: 'claude-sonnet-4-5',
      name: 'Claude Sonnet 4.5',
      description: 'Neueste Version, beste Balance',
      cost: '$3/$15 per 1M tokens',
      recommended: true
    },
    {
      id: 'claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      description: 'Schnell & günstig',
      cost: '$1/$5 per 1M tokens'
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (Oct 2024)',
      description: 'Stabile Version',
      cost: '$3/$15 per 1M tokens'
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Schnell & günstig (Legacy)',
      cost: '$0.25/$1.25 per 1M tokens'
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Leistungsstark, teuer',
      cost: '$15/$75 per 1M tokens'
    }
  ];

  // OpenAI Modelle
  const openaiModels: ModelInfo[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Neuestes Omni-Modell',
      cost: '$5/$15 per 1M tokens',
      recommended: true
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Schnell & leistungsstark',
      cost: '$10/$30 per 1M tokens'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Günstig & schnell',
      cost: '$0.50/$1.50 per 1M tokens'
    }
  ];

  const models = provider === 'anthropic' ? anthropicModels : openaiModels;

  /**
   * Testet ob ein Modell verfügbar ist
   */
  const testModel = async (modelId: string) => {
    if (!apiKey) {
      setTestResults(prev => ({ ...prev, [modelId]: 'error' }));
      return;
    }

    setTesting(true);
    setTestResults(prev => ({ ...prev, [modelId]: 'untested' }));

    try {
      const endpoint = provider === 'anthropic'
        ? 'https://api.anthropic.com/v1/messages'
        : 'https://api.openai.com/v1/chat/completions';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const body = provider === 'anthropic'
        ? {
            model: modelId,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          }
        : {
            model: modelId,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setTestResults(prev => ({ ...prev, [modelId]: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, [modelId]: 'error' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [modelId]: 'error' }));
    } finally {
      setTesting(false);
    }
  };

  /**
   * Testet alle Modelle
   */
  const testAllModels = async () => {
    for (const model of models) {
      await testModel(model.id);
      // Kleine Pause zwischen Tests um Rate Limits zu vermeiden
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {language === 'de' ? 'Modell-Auswahl' : 'Model Selection'}
          </h3>
          <p className="text-sm text-gray-400">
            {language === 'de'
              ? `${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} Modelle`
              : `${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} Models`}
          </p>
        </div>
        <button
          onClick={testAllModels}
          disabled={testing || !apiKey}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          {language === 'de' ? 'Alle testen' : 'Test All'}
        </button>
      </div>

      {/* API Key Warning */}
      {!apiKey && (
        <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            {language === 'de'
              ? 'Kein API Key konfiguriert. Bitte API Key eingeben um Modelle zu testen.'
              : 'No API key configured. Please enter API key to test models.'}
          </div>
        </div>
      )}

      {/* Model List */}
      <div className="space-y-2">
        {models.map(model => (
          <div
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={`
              p-4 rounded-xl border-2 cursor-pointer transition-all
              ${currentModel === model.id
                ? 'bg-blue-600/20 border-blue-500'
                : 'bg-white/5 border-white/10 hover:border-white/30'}
              ${model.recommended ? 'ring-2 ring-green-500/50' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">{model.name}</h4>
                  {model.recommended && (
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">
                      {language === 'de' ? 'Empfohlen' : 'Recommended'}
                    </span>
                  )}
                  {currentModel === model.id && (
                    <Check className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-1">{model.description}</p>
                <p className="text-xs text-gray-500">{model.cost}</p>
              </div>

              {/* Test Status */}
              <div className="ml-4">
                {testResults[model.id] === 'success' && (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <Check className="w-4 h-4" />
                    {language === 'de' ? 'Verfügbar' : 'Available'}
                  </div>
                )}
                {testResults[model.id] === 'error' && (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    {language === 'de' ? 'Nicht verfügbar' : 'Unavailable'}
                  </div>
                )}
                {apiKey && !testResults[model.id] && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      testModel(model.id);
                    }}
                    disabled={testing}
                    className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500"
                  >
                    {language === 'de' ? 'Testen' : 'Test'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 text-sm text-blue-200">
        <p className="font-medium mb-1">
          💡 {language === 'de' ? 'Tipp:' : 'Tip:'}
        </p>
        <p>
          {language === 'de'
            ? 'Teste alle Modelle um zu sehen welche mit deinem API Key verfügbar sind. Grünes Häkchen = Funktioniert!'
            : 'Test all models to see which are available with your API key. Green check = Works!'}
        </p>
      </div>
    </div>
  );
};

export default ModelSelector;
