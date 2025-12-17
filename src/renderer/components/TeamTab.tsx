// Team Tab Component - Team Collaboration & Intercoder Reliability
// EVIDENRA Ultimate Exclusive Feature

import React, { useState, useEffect } from 'react';
import {
  IconUsers as Users,
  IconUserPlus as UserPlus,
  IconMail as Mail,
  IconShare as Share,
  IconChartBar as BarChart,
  IconCheck as Check,
  IconX as X,
  IconLoader as Loader,
  IconCrown as Crown,
  IconTrash as Trash,
  IconRefresh as RefreshCw,
  IconLock as Lock,
  IconClipboard as ClipboardCheck
} from '@tabler/icons-react';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'coder' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  lastActive?: string;
  codingsCount: number;
}

interface IntercoderResult {
  coderId1: string;
  coderId2: string;
  agreementPercent: number;
  kappa: number;
  overlappingSegments: number;
  disagreeingSegments: number;
}

interface TeamTabProps {
  language: 'de' | 'en';
  projectId?: string;
  isAuthenticated?: boolean;
  onShareProject?: () => void;
}

export const TeamTab: React.FC<TeamTabProps> = ({ language, projectId, isAuthenticated, onShareProject }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'coder' | 'viewer'>('coder');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [intercoderResults, setIntercoderResults] = useState<IntercoderResult[]>([]);
  const [calculatingReliability, setCalculatingReliability] = useState(false);

  // My role selection (before login)
  const [myRole, setMyRole] = useState<'researcher' | 'supervisor' | 'coder' | 'student'>('researcher');
  const [myName, setMyName] = useState('');

  // Simulated data for demo
  useEffect(() => {
    // In production, this would fetch from Supabase
    const demoMembers: TeamMember[] = [
      {
        id: 'owner-1',
        email: 'you@example.com',
        name: 'Sie (Owner)',
        role: 'owner',
        status: 'active',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        codingsCount: 0
      }
    ];
    setTeamMembers(demoMembers);
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError(language === 'de' ? 'Bitte geben Sie eine gültige E-Mail-Adresse ein' : 'Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    setError(null);

    // Create invitation data with team discount
    const inviteData = {
      email: inviteEmail,
      role: inviteRole,
      projectId: projectId || 'default',
      projectName: 'Forschungsprojekt', // Could be dynamic
      invitedAt: new Date().toISOString(),
      inviterName: myName || 'EVIDENRA User',
      discount: 20 // 20% Team-Rabatt für eingeladene Mitglieder
    };

    // Generate magic link token
    const token = btoa(JSON.stringify(inviteData));
    const inviteLink = `https://evidenra.com/join/${token}`;

    // Create email content
    const roleLabel = inviteRole === 'coder'
      ? (language === 'de' ? 'Codierer' : 'Coder')
      : (language === 'de' ? 'Betrachter' : 'Viewer');

    const emailSubject = encodeURIComponent(
      language === 'de'
        ? `Einladung: EVIDENRA Ultimate Forschungsprojekt`
        : `Invitation: EVIDENRA Ultimate Research Project`
    );

    const emailBody = encodeURIComponent(
      language === 'de'
        ? `Hallo,

Sie wurden von ${myName || 'einem Forscher'} eingeladen, an einem EVIDENRA Ultimate Forschungsprojekt als ${roleLabel} teilzunehmen.

════════════════════════════════════════
   HIER KLICKEN UM BEIZUTRETEN:

   ${inviteLink}

   (Link kopieren und im Browser öffnen)
════════════════════════════════════════

Als Teammitglied erhalten Sie 20% Rabatt auf EVIDENRA Ultimate!

Was ist EVIDENRA Ultimate?
• Professionelle Software für qualitative Datenanalyse
• KI-gestützte Transkription & Codierung
• Team-Kollaboration in Echtzeit
• Intercoder-Reliabilität berechnen

Bei Fragen wenden Sie sich bitte an ${myName || 'den Projektleiter'}.

Mit freundlichen Grüßen,
Das EVIDENRA Team

---
Link funktioniert nicht? Kopieren Sie diese URL:
${inviteLink}`
        : `Hello,

You have been invited by ${myName || 'a researcher'} to participate in an EVIDENRA Ultimate research project as a ${roleLabel}.

════════════════════════════════════════
   CLICK HERE TO JOIN:

   ${inviteLink}

   (Copy link and open in browser)
════════════════════════════════════════

As a team member, you get 20% off EVIDENRA Ultimate!

What is EVIDENRA Ultimate?
• Professional software for qualitative data analysis
• AI-powered transcription & coding
• Real-time team collaboration
• Calculate intercoder reliability

If you have questions, please contact ${myName || 'the project leader'}.

Best regards,
The EVIDENRA Team

---
Link not working? Copy this URL:
${inviteLink}`
    );

    // Add member to local list
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      email: inviteEmail,
      name: inviteEmail.split('@')[0],
      role: inviteRole,
      status: 'pending',
      joinedAt: new Date().toISOString(),
      codingsCount: 0
    };
    setTeamMembers(prev => [...prev, newMember]);

    // Copy invite link to clipboard
    await navigator.clipboard.writeText(inviteLink).catch(() => {});

    // Open email client with pre-filled email
    const mailtoLink = `mailto:${inviteEmail}?subject=${emailSubject}&body=${emailBody}`;
    window.open(mailtoLink, '_blank');

    setInviteEmail('');
    setIsInviting(false);
    setSuccess(language === 'de'
      ? `E-Mail-Programm geöffnet für ${inviteEmail}! Einladungslink auch in Zwischenablage kopiert.`
      : `Email client opened for ${inviteEmail}! Invitation link also copied to clipboard.`);
    setTimeout(() => setSuccess(null), 5000);
  };

  const removeMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const calculateIntercoderReliability = () => {
    if (teamMembers.filter(m => m.role === 'coder' && m.status === 'active').length < 2) {
      setError(language === 'de'
        ? 'Mindestens 2 aktive Codierer benötigt für Intercoder-Reliabilität'
        : 'At least 2 active coders required for intercoder reliability');
      return;
    }

    setCalculatingReliability(true);

    // Simulate calculation
    setTimeout(() => {
      const results: IntercoderResult[] = [
        {
          coderId1: 'coder-1',
          coderId2: 'coder-2',
          agreementPercent: 87.5,
          kappa: 0.82,
          overlappingSegments: 45,
          disagreeingSegments: 6
        }
      ];
      setIntercoderResults(results);
      setCalculatingReliability(false);
    }, 2000);
  };

  const getRoleBadge = (role: TeamMember['role']) => {
    const roleColors = {
      owner: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      coder: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    const roleLabels = {
      owner: language === 'de' ? 'Besitzer' : 'Owner',
      admin: 'Admin',
      coder: language === 'de' ? 'Codierer' : 'Coder',
      viewer: language === 'de' ? 'Betrachter' : 'Viewer'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${roleColors[role]} flex items-center gap-1`}>
        {role === 'owner' && <Crown className="w-3 h-3" />}
        {roleLabels[role]}
      </span>
    );
  };

  const getStatusBadge = (status: TeamMember['status']) => {
    const statusColors = {
      active: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      inactive: 'bg-red-500/20 text-red-400'
    };
    const statusLabels = {
      active: language === 'de' ? 'Aktiv' : 'Active',
      pending: language === 'de' ? 'Ausstehend' : 'Pending',
      inactive: language === 'de' ? 'Inaktiv' : 'Inactive'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  return (
    <div className="tab-content space-y-8 h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
          {language === 'de' ? 'Team Zusammenarbeit' : 'Team Collaboration'}
        </h2>
        <p className="text-white text-opacity-60">
          {language === 'de'
            ? 'Arbeiten Sie gemeinsam an Forschungsprojekten und berechnen Sie Intercoder-Reliabilität'
            : 'Collaborate on research projects and calculate intercoder reliability'}
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
          <X className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-green-300">{success}</span>
        </div>
      )}

      {/* My Role Selection - Always visible */}
      <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/40 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <Crown className="w-5 h-5 text-indigo-400" />
          {language === 'de' ? 'Meine Rolle im Projekt' : 'My Role in Project'}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">
              {language === 'de' ? 'Ihr Name' : 'Your Name'}
            </label>
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder={language === 'de' ? 'Name eingeben...' : 'Enter your name...'}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">
              {language === 'de' ? 'Ihre Rolle' : 'Your Role'}
            </label>
            <select
              value={myRole}
              onChange={(e) => setMyRole(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="researcher" className="bg-gray-800">{language === 'de' ? 'Forscher/in (Hauptverantwortlich)' : 'Researcher (Principal)'}</option>
              <option value="supervisor" className="bg-gray-800">{language === 'de' ? 'Betreuer/in / Supervisor' : 'Supervisor'}</option>
              <option value="coder" className="bg-gray-800">{language === 'de' ? 'Codierer/in' : 'Coder'}</option>
              <option value="student" className="bg-gray-800">{language === 'de' ? 'Student/in / Praktikant/in' : 'Student / Intern'}</option>
            </select>
          </div>
        </div>

        {/* Role Description */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          {myRole === 'researcher' && (
            <p className="text-white/70 text-sm">
              {language === 'de'
                ? 'Als Forscher/in haben Sie vollen Zugriff auf alle Funktionen. Sie können das Kategoriensystem erstellen, Codierer einladen und die Intercoder-Reliabilität berechnen.'
                : 'As a researcher, you have full access to all features. You can create the category system, invite coders, and calculate intercoder reliability.'}
            </p>
          )}
          {myRole === 'supervisor' && (
            <p className="text-white/70 text-sm">
              {language === 'de'
                ? 'Als Betreuer/in können Sie das Projekt überwachen, Feedback geben und die Qualität der Codierungen überprüfen.'
                : 'As a supervisor, you can monitor the project, provide feedback, and review the quality of codings.'}
            </p>
          )}
          {myRole === 'coder' && (
            <p className="text-white/70 text-sm">
              {language === 'de'
                ? 'Als Codierer/in können Sie Dokumente codieren und Ihre Codierungen mit anderen Teammitgliedern vergleichen.'
                : 'As a coder, you can code documents and compare your codings with other team members.'}
            </p>
          )}
          {myRole === 'student' && (
            <p className="text-white/70 text-sm">
              {language === 'de'
                ? 'Als Student/in oder Praktikant/in können Sie das Codieren lernen und unter Anleitung arbeiten.'
                : 'As a student or intern, you can learn coding and work under supervision.'}
            </p>
          )}
        </div>
      </div>

      {/* Not Authenticated Warning */}
      {!isAuthenticated && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6 flex items-center gap-4">
          <Lock className="w-8 h-8 text-yellow-400" />
          <div>
            <h4 className="font-bold text-yellow-300">
              {language === 'de' ? 'Anmeldung erforderlich für Team-Funktionen' : 'Sign-in Required for Team Features'}
            </h4>
            <p className="text-yellow-300/70 text-sm">
              {language === 'de'
                ? 'Ihre Rolle wird lokal gespeichert. Melden Sie sich im Account-Tab an, um Team-Einladungen zu versenden.'
                : 'Your role is saved locally. Sign in via the Account tab to send team invitations.'}
            </p>
          </div>
        </div>
      )}

      {/* Invite Team Members */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <UserPlus className="w-6 h-6 text-purple-400" />
          {language === 'de' ? 'Teammitglied einladen' : 'Invite Team Member'}
        </h3>

        <div className="flex gap-4">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={language === 'de' ? 'E-Mail-Adresse' : 'Email address'}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'coder' | 'viewer')}
            className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="coder" className="bg-gray-800">{language === 'de' ? 'Codierer' : 'Coder'}</option>
            <option value="viewer" className="bg-gray-800">{language === 'de' ? 'Betrachter' : 'Viewer'}</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={isInviting}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white font-semibold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInviting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {language === 'de' ? 'Lädt...' : 'Sending...'}
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                {language === 'de' ? 'Einladen' : 'Invite'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" />
          {language === 'de' ? 'Team Mitglieder' : 'Team Members'} ({teamMembers.length})
        </h3>

        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{member.name}</span>
                    {getRoleBadge(member.role)}
                    {getStatusBadge(member.status)}
                  </div>
                  <span className="text-white/50 text-sm">{member.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white/70 text-sm">{member.codingsCount} {language === 'de' ? 'Codierungen' : 'codings'}</div>
                </div>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intercoder Reliability */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart className="w-6 h-6 text-emerald-400" />
            {language === 'de' ? 'Intercoder-Reliabilität' : 'Intercoder Reliability'}
          </h3>
          <button
            onClick={calculateIntercoderReliability}
            disabled={calculatingReliability}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg text-white font-semibold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
          >
            {calculatingReliability ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {language === 'de' ? 'Berechne...' : 'Calculating...'}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {language === 'de' ? 'Berechnen' : 'Calculate'}
              </>
            )}
          </button>
        </div>

        {intercoderResults.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{language === 'de'
              ? 'Klicken Sie "Berechnen" um die Übereinstimmung zwischen Codierern zu analysieren'
              : 'Click "Calculate" to analyze agreement between coders'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {intercoderResults.map((result, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-emerald-400">{result.agreementPercent.toFixed(1)}%</div>
                    <div className="text-white/50 text-sm">{language === 'de' ? 'Übereinstimmung' : 'Agreement'}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">{result.kappa.toFixed(2)}</div>
                    <div className="text-white/50 text-sm">Cohen's κ</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400">{result.overlappingSegments}</div>
                    <div className="text-white/50 text-sm">{language === 'de' ? 'Überlappend' : 'Overlapping'}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-400">{result.disagreeingSegments}</div>
                    <div className="text-white/50 text-sm">{language === 'de' ? 'Abweichend' : 'Disagreeing'}</div>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                    style={{ width: `${result.agreementPercent}%` }}
                  />
                </div>
                <p className="text-white/60 text-sm mt-2">
                  {result.kappa >= 0.8
                    ? (language === 'de' ? '✓ Ausgezeichnete Übereinstimmung (κ ≥ 0.80)' : '✓ Excellent agreement (κ ≥ 0.80)')
                    : result.kappa >= 0.6
                      ? (language === 'de' ? '⚠ Gute Übereinstimmung (0.60 ≤ κ < 0.80)' : '⚠ Good agreement (0.60 ≤ κ < 0.80)')
                      : (language === 'de' ? '⚠ Mäßige Übereinstimmung (κ < 0.60)' : '⚠ Moderate agreement (κ < 0.60)')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Project */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Share className="w-8 h-8 text-purple-400" />
            <div>
              <h4 className="text-lg font-bold text-purple-300">
                {language === 'de' ? 'Projekt teilen' : 'Share Project'}
              </h4>
              <p className="text-white/60 text-sm">
                {language === 'de'
                  ? 'Generieren Sie einen Einladungslink für Ihr Team'
                  : 'Generate an invitation link for your team'}
              </p>
            </div>
          </div>
          <button
            onClick={onShareProject}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Share className="w-5 h-5" />
            {language === 'de' ? 'Link erstellen' : 'Create Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamTab;
