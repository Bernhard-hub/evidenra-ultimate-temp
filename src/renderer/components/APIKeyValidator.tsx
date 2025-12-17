// src/renderer/components/APIKeyValidator.tsx
import React, { useState } from 'react';
import {
  IconCheck as Check,
  IconX as X,
  IconLoader2 as Loader,
  IconAlertCircle as AlertCircle,
  IconShieldCheck as ShieldCheck
} from '@tabler/icons-react';

interface APIKeyValidatorProps {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  language: 'de' | 'en';
}

interface ValidationResult {
  valid: boolean;
  message: string;
  availableModels?: string[];
  tier?: string;
  error?: string;
}

/**
 * API-Key Validator mit Live-Test
 * Testet ob API Key gültig ist und zeigt verfügbare Modelle
 */
export const APIKeyValidator: React.FC<APIKeyValidatorProps> = ({
  provider,
  apiKey,
  language
}) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  /**
   * Validiert Anthropic API Key
   */
  const validateAnthropicKey = async (): Promise<ValidationResult> => {
    // Format-Check
    if (!apiKey.startsWith('sk-ant-')) {
      return {
        valid: false,
        message: language === 'de'
          ? 'Ungültiges Format. Anthropic Keys beginnen mit sk-ant-'
          : 'Invalid format. Anthropic keys start with sk-ant-',
        error: 'INVALID_FORMAT'
      };
    }

    // Test mit einfachem API Call
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      if (response.ok) {
        // Key ist gültig - versuche verfügbare Modelle zu bestimmen
        const availableModels = await testAvailableModels();

        return {
          valid: true,
          message: language === 'de'
            ? '✅ API Key ist gültig und funktioniert!'
            : '✅ API key is valid and working!',
          availableModels,
          tier: 'Standard' // TODO: Tier detection wenn möglich
        };
      } else if (response.status === 401) {
        return {
          valid: false,
          message: language === 'de'
            ? '❌ API Key ist ungültig oder abgelaufen'
            : '❌ API key is invalid or expired',
          error: 'UNAUTHORIZED'
        };
      } else if (response.status === 404) {
        // Key funktioniert, aber Modell nicht verfügbar
        return {
          valid: true,
          message: language === 'de'
            ? '⚠️ API Key gültig, aber kein Zugriff auf Standard-Modell'
            : '⚠️ API key valid, but no access to default model',
          availableModels: await testAvailableModels()
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          message: `Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`,
          error: `HTTP_${response.status}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: language === 'de'
          ? '❌ Netzwerkfehler. Prüfe Internetverbindung.'
          : '❌ Network error. Check internet connection.',
        error: 'NETWORK_ERROR'
      };
    }
  };

  /**
   * Testet welche Modelle mit dem API Key verfügbar sind
   */
  const testAvailableModels = async (): Promise<string[]> => {
    const modelsToTest = [
      'claude-sonnet-4-5',
      'claude-haiku-4-5',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229'
    ];

    const available: string[] = [];

    for (const model of modelsToTest) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 5,
            messages: [{ role: 'user', content: 'hi' }]
          })
        });

        if (response.ok) {
          available.push(model);
        }
      } catch (error) {
        // Skip this model
      }

      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return available;
  };

  /**
   * Validiert OpenAI API Key
   */
  const validateOpenAIKey = async (): Promise<ValidationResult> => {
    // Format-Check
    if (!apiKey.startsWith('sk-')) {
      return {
        valid: false,
        message: language === 'de'
          ? 'Ungültiges Format. OpenAI Keys beginnen mit sk-'
          : 'Invalid format. OpenAI keys start with sk-',
        error: 'INVALID_FORMAT'
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const chatModels = data.data
          .filter((m: any) => m.id.includes('gpt'))
          .map((m: any) => m.id);

        return {
          valid: true,
          message: language === 'de'
            ? '✅ API Key ist gültig und funktioniert!'
            : '✅ API key is valid and working!',
          availableModels: chatModels
        };
      } else if (response.status === 401) {
        return {
          valid: false,
          message: language === 'de'
            ? '❌ API Key ist ungültig oder abgelaufen'
            : '❌ API key is invalid or expired',
          error: 'UNAUTHORIZED'
        };
      } else {
        return {
          valid: false,
          message: `Error ${response.status}`,
          error: `HTTP_${response.status}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: language === 'de'
          ? '❌ Netzwerkfehler. Prüfe Internetverbindung.'
          : '❌ Network error. Check internet connection.',
        error: 'NETWORK_ERROR'
      };
    }
  };

  /**
   * Startet Validierung
   */
  const handleValidate = async () => {
    if (!apiKey) {
      setResult({
        valid: false,
        message: language === 'de'
          ? 'Bitte API Key eingeben'
          : 'Please enter API key',
        error: 'EMPTY_KEY'
      });
      return;
    }

    setTesting(true);
    setResult(null);

    const validationResult = provider === 'anthropic'
      ? await validateAnthropicKey()
      : await validateOpenAIKey();

    setResult(validationResult);
    setTesting(false);
  };

  return (
    <div className="space-y-4">
      {/* Test Button */}
      <button
        onClick={handleValidate}
        disabled={testing || !apiKey}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition flex items-center justify-center gap-2 font-medium"
      >
        {testing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            {language === 'de' ? 'Teste API Key...' : 'Testing API Key...'}
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5" />
            {language === 'de' ? 'API Key testen' : 'Test API Key'}
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div
          className={`
            rounded-xl p-4 border-2
            ${result.valid
              ? 'bg-green-600/20 border-green-500'
              : 'bg-red-600/20 border-red-500'}
          `}
        >
          <div className="flex items-start gap-3">
            {result.valid ? (
              <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
            ) : (
              <X className="w-6 h-6 text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${result.valid ? 'text-green-200' : 'text-red-200'}`}>
                {result.message}
              </p>

              {/* Available Models */}
              {result.availableModels && result.availableModels.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-white mb-2">
                    {language === 'de' ? '✅ Verfügbare Modelle:' : '✅ Available Models:'}
                  </p>
                  <div className="space-y-1">
                    {result.availableModels.map(model => (
                      <div key={model} className="flex items-center gap-2 text-sm text-green-300">
                        <Check className="w-4 h-4" />
                        <code className="bg-black/30 px-2 py-0.5 rounded">{model}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Models Available */}
              {result.availableModels && result.availableModels.length === 0 && result.valid && (
                <div className="mt-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-medium mb-1">
                        {language === 'de' ? 'Keine Modelle verfügbar' : 'No models available'}
                      </p>
                      <p>
                        {language === 'de'
                          ? 'Dein API Key ist gültig, aber hat keinen Zugriff auf die getesteten Modelle. Prüfe dein Anthropic Tier/Subscription.'
                          : 'Your API key is valid, but has no access to the tested models. Check your Anthropic tier/subscription.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tier Info */}
              {result.tier && (
                <div className="mt-2 text-sm text-gray-300">
                  {language === 'de' ? 'Tier:' : 'Tier:'} <span className="font-mono">{result.tier}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 text-sm text-blue-200">
        <p className="font-medium mb-1">💡 {language === 'de' ? 'Info:' : 'Info:'}</p>
        <p>
          {language === 'de'
            ? 'Der Test sendet eine Mini-Anfrage an die API um zu prüfen ob der Key funktioniert. Es entstehen minimale Kosten (~$0.001).'
            : 'The test sends a tiny request to the API to check if the key works. Minimal cost (~$0.001).'}
        </p>
      </div>
    </div>
  );
};

export default APIKeyValidator;
