/**
 * Trial Expired Modal
 * Blocks the app when trial has expired and no valid license exists
 */

import React, { useState } from 'react';
import {
  IconAlertTriangle as AlertTriangle,
  IconKey as Key,
  IconShoppingCart as ShoppingCart,
  IconX as X
} from '@tabler/icons-react';
import { APP_VERSION_DISPLAY, PRODUCT_NAME } from '../config/appConfig';

interface TrialExpiredModalProps {
  isOpen: boolean;
  language: 'de' | 'en';
  onLicenseEnter: (key: string) => Promise<boolean>;
  onPurchase: () => void;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  isOpen,
  language,
  onLicenseEnter,
  onPurchase
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!licenseKey.trim()) {
      setError(language === 'de' ? 'Bitte geben Sie einen Lizenzschluessel ein' : 'Please enter a license key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const success = await onLicenseEnter(licenseKey);
      if (!success) {
        setError(language === 'de' ? 'Ungueltiger Lizenzschluessel' : 'Invalid license key');
      }
    } catch (err) {
      setError(language === 'de' ? 'Fehler bei der Validierung' : 'Validation error');
    } finally {
      setIsValidating(false);
    }
  };

  const texts = {
    de: {
      title: 'Testversion abgelaufen',
      subtitle: `Ihre 30-taegige Testversion von ${PRODUCT_NAME} ist abgelaufen.`,
      enterLicense: 'Lizenzschluessel eingeben',
      placeholder: 'XXXX-XXXX-XXXX-XXXX',
      validate: 'Validieren',
      validating: 'Validiere...',
      or: 'oder',
      purchase: 'Lizenz kaufen',
      features: [
        'Unbegrenzter Zugang zu allen Funktionen',
        'Lebenslange Updates',
        'Prioritaetssupport'
      ]
    },
    en: {
      title: 'Trial Expired',
      subtitle: `Your 30-day trial of ${PRODUCT_NAME} has expired.`,
      enterLicense: 'Enter License Key',
      placeholder: 'XXXX-XXXX-XXXX-XXXX',
      validate: 'Validate',
      validating: 'Validating...',
      or: 'or',
      purchase: 'Purchase License',
      features: [
        'Unlimited access to all features',
        'Lifetime updates',
        'Priority support'
      ]
    }
  };

  const t = texts[language];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
          <p className="text-gray-400">{t.subtitle}</p>
        </div>

        {/* License Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Key className="inline w-4 h-4 mr-1" />
            {t.enterLicense}
          </label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder={t.placeholder}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={isValidating}
            className="w-full mt-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            {isValidating ? t.validating : t.validate}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-gray-500 text-sm">{t.or}</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* Purchase Button */}
        <button
          onClick={onPurchase}
          className="w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          {t.purchase}
        </button>

        {/* Features */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <ul className="space-y-2">
            {t.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Version */}
        <div className="mt-4 text-center text-xs text-gray-600">
          {PRODUCT_NAME} {APP_VERSION_DISPLAY}
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredModal;
