// Account Tab Component - Magic Link Authentication
// EVIDENRA Ultimate with Supabase Integration

import React, { useState, useEffect } from 'react';
import {
  IconSparkles as Sparkles,
  IconRefresh as RefreshCw,
  IconLock as Lock,
  IconLockOpen as Unlock,
  IconLogout as LogOut,
  IconUser as User,
  IconCloud as Cloud,
  IconCheck as Check,
  IconX as X,
  IconLoader as Loader
} from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';

interface AccountTabProps {
  language: 'de' | 'en';
}

export const AccountTab: React.FC<AccountTabProps> = ({ language }) => {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    user,
    profile,
    isLoading,
    isAuthenticated,
    error,
    initialize,
    sendMagicLink,
    signOut,
    clearError
  } = useAuthStore();

  useEffect(() => {
    initialize();

    // Listen for auth callback from electron deep-link
    if (window.electron?.onAuthCallback) {
      window.electron.onAuthCallback(async (tokens: { access_token: string; refresh_token: string }) => {
        const { setSessionFromTokens } = useAuthStore.getState();
        await setSessionFromTokens(tokens.access_token, tokens.refresh_token);
        setMagicLinkSent(false);
      });
    }
  }, []);

  const handleSendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      setSendError(language === 'de' ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein' : 'Please enter a valid email address');
      return;
    }

    setSendError(null);
    const { success, error: sendErr } = await sendMagicLink(email);

    if (success) {
      setMagicLinkSent(true);
    } else {
      setSendError(sendErr || (language === 'de' ? 'Fehler beim Senden' : 'Failed to send'));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMagicLinkSent(false);
    setEmail('');
  };

  return (
    <div className="tab-content space-y-8 h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
          {language === 'de' ? 'Account & Sync' : 'Account & Sync'}
        </h2>
        <p className="text-white text-opacity-60">
          {language === 'de'
            ? 'Melden Sie sich an um Projekte zu synchronisieren'
            : 'Sign in to sync your projects across devices'}
        </p>
      </div>

      {/* Authenticated View */}
      {isAuthenticated && user ? (
        <>
          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">{profile?.display_name || user.email}</h3>
                <p className="text-white/60">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {language === 'de' ? 'Verifiziert' : 'Verified'}
                  </span>
                  {profile?.subscription_tier && (
                    <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-sm">
                      {profile.subscription_tier}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {language === 'de' ? 'Abmelden' : 'Sign Out'}
              </button>
            </div>
          </div>

          {/* Sync Status */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Cloud className="w-6 h-6 text-cyan-400" />
              {language === 'de' ? 'Cloud Synchronisation' : 'Cloud Sync'}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-cyan-400">0</div>
                <div className="text-white/50 text-sm">{language === 'de' ? 'Projekte sync' : 'Projects synced'}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400">✓</div>
                <div className="text-white/50 text-sm">{language === 'de' ? 'Verbunden' : 'Connected'}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">-</div>
                <div className="text-white/50 text-sm">{language === 'de' ? 'Letzte Sync' : 'Last sync'}</div>
              </div>
            </div>

            <button className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-semibold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform">
              <RefreshCw className="w-5 h-5" />
              {language === 'de' ? 'Jetzt synchronisieren' : 'Sync Now'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Magic Link Login */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Magic Link Login</h3>
                <p className="text-white/60">
                  {language === 'de' ? 'Passwortlos per E-Mail anmelden' : 'Sign in passwordlessly via email'}
                </p>
              </div>
            </div>

            {magicLinkSent ? (
              <div className="space-y-4">
                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                  <div className="text-4xl mb-3">✉️</div>
                  <h4 className="text-xl font-bold text-green-400 mb-2">
                    {language === 'de' ? 'Magic Link gesendet!' : 'Magic Link Sent!'}
                  </h4>
                  <p className="text-white/70">
                    {language === 'de'
                      ? `Wir haben einen Login-Link an ${email} gesendet. Klicken Sie auf den Link in der E-Mail um sich anzumelden.`
                      : `We sent a login link to ${email}. Click the link in the email to sign in.`}
                  </p>
                </div>
                <button
                  onClick={() => setMagicLinkSent(false)}
                  className="w-full px-6 py-3 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 transition-colors"
                >
                  {language === 'de' ? 'Andere E-Mail verwenden' : 'Use different email'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSendError(null);
                  }}
                  placeholder={language === 'de' ? 'Ihre E-Mail-Adresse' : 'Your email address'}
                  className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none transition-colors"
                />
                {sendError && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {sendError}
                  </p>
                )}
                {error && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {error}
                  </p>
                )}
                <button
                  onClick={handleSendMagicLink}
                  disabled={isLoading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-semibold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {language === 'de' ? 'Wird gesendet...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {language === 'de' ? 'Magic Link senden' : 'Send Magic Link'}
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <p className="text-white/70 text-sm">
                {language === 'de'
                  ? '💡 Sie erhalten einen Link per E-Mail, mit dem Sie sich sofort anmelden können - ohne Passwort!'
                  : '💡 You will receive an email with a link to sign in instantly - no password needed!'}
              </p>
            </div>
          </div>

          {/* Not Signed In Sync Status */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-blue-400" />
              {language === 'de' ? 'Sync Status' : 'Sync Status'}
            </h3>
            <div className="bg-white/5 rounded-xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {language === 'de' ? 'Nicht angemeldet' : 'Not signed in'}
                </p>
                <p className="text-white/50 text-sm">
                  {language === 'de'
                    ? 'Melden Sie sich an um Cloud-Sync zu aktivieren'
                    : 'Sign in to enable cloud sync'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Features Info */}
      <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-blue-300 mb-4">
          {language === 'de' ? 'Cloud Sync Vorteile' : 'Cloud Sync Benefits'}
        </h4>
        <ul className="space-y-2 text-white/70 text-sm">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            {language === 'de' ? 'Projekte auf allen Geräten verfügbar' : 'Access projects on all devices'}
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            {language === 'de' ? 'Automatische Backups in der Cloud' : 'Automatic cloud backups'}
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            {language === 'de' ? 'Team-Kollaboration (ULTIMATE)' : 'Team collaboration (ULTIMATE)'}
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            {language === 'de' ? 'Verlauf und Versionen' : 'History and versions'}
          </li>
        </ul>
      </div>
    </div>
  );
};

// Type declaration for electron window object
declare global {
  interface Window {
    electron?: {
      shell: {
        openExternal: (url: string) => Promise<void>;
      };
      onAuthCallback: (callback: (tokens: { access_token: string; refresh_token: string }) => void) => void;
    };
  }
}

export default AccountTab;
