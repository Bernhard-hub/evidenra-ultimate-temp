// UME Tab Component - Unified Methodology Engine
// EVIDENRA Ultimate Exclusive Feature

import React, { useState, useEffect } from 'react';
import {
  IconBrain as Brain,
  IconActivity as Activity,
  IconChartBar as BarChart,
  IconBook as BookOpen,
  IconRefresh as RefreshCw,
  IconDownload as Download,
  IconPlus as Plus,
  IconTrash as Trash,
  IconEdit as Edit
} from '@tabler/icons-react';
import { umeEngine, METHODOLOGIES, type UMECode, type UMECategory, type UMETheme } from '../../services/UnifiedMethodologyEngine';

interface UMETabProps {
  language: 'de' | 'en';
}

export const UMETab: React.FC<UMETabProps> = ({ language }) => {
  const [currentMethodology, setCurrentMethodology] = useState(umeEngine.getMethodology()?.id || 'grounded-theory');
  const [currentPhase, setCurrentPhase] = useState(umeEngine.getCurrentPhase()?.id || 'open-coding');
  const [codes, setCodes] = useState<UMECode[]>([]);
  const [categories, setCategories] = useState<UMECategory[]>([]);
  const [themes, setThemes] = useState<UMETheme[]>([]);
  const [saturation, setSaturation] = useState(0);
  const [density, setDensity] = useState(0);

  useEffect(() => {
    refreshData();
  }, [currentMethodology, currentPhase]);

  const refreshData = () => {
    setCodes(umeEngine.getAllCodes());
    setCategories(umeEngine.getAllCategories());
    setThemes(umeEngine.getAllThemes());
    setSaturation(umeEngine.calculateSaturationLevel());
    setDensity(umeEngine.calculateTheoreticalDensity());
  };

  const handleMethodologyChange = (methodId: string) => {
    umeEngine.setMethodology(methodId);
    setCurrentMethodology(methodId);
    setCurrentPhase(umeEngine.getCurrentPhase()?.id || 'open-coding');
    refreshData();
  };

  const handlePhaseChange = (phaseId: string) => {
    umeEngine.setPhase(phaseId);
    setCurrentPhase(phaseId);
  };

  const handleExportReport = () => {
    const report = umeEngine.exportToReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UME-Analysis-Report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodology = METHODOLOGIES.find(m => m.id === currentMethodology);

  return (
    <div className="tab-content space-y-8 h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-amber-100 to-orange-100 bg-clip-text text-transparent">
          Unified Methodology Engine (UME)
        </h2>
        <p className="text-white text-opacity-60">
          {language === 'de'
            ? 'Integrierte Analyse mit Grounded Theory, Van Manen, Braun/Clarke & Holsti'
            : 'Integrated analysis with Grounded Theory, Van Manen, Braun/Clarke & Holsti'}
        </p>
      </div>

      {/* Methodology Selection */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Brain className="w-6 h-6 text-amber-400" />
          {language === 'de' ? 'Methodologie auswählen' : 'Select Methodology'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {METHODOLOGIES.map(method => (
            <button
              key={method.id}
              onClick={() => handleMethodologyChange(method.id)}
              className={`p-6 rounded-xl border transition-all text-left group ${
                currentMethodology === method.id
                  ? 'bg-gradient-to-br from-amber-900/40 to-orange-800/30 border-amber-500/50'
                  : 'bg-gradient-to-br from-gray-900/40 to-gray-800/20 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-3xl mb-2">{method.icon}</div>
              <h4 className={`text-lg font-bold ${currentMethodology === method.id ? 'text-amber-300' : 'text-white group-hover:text-amber-300'}`}>
                {method.name}
              </h4>
              <p className="text-white/50 text-sm mt-1">{method.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Current Phase */}
      {methodology && (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            {language === 'de' ? 'Aktuelle Phase' : 'Current Phase'}: {methodology.name}
          </h3>
          <div className="flex flex-wrap gap-3">
            {methodology.phases.map(phase => (
              <button
                key={phase.id}
                onClick={() => handlePhaseChange(phase.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentPhase === phase.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {phase.order}. {phase.name}
              </button>
            ))}
          </div>

          {/* Phase Details */}
          {methodology.phases.find(p => p.id === currentPhase) && (
            <div className="mt-6 p-4 bg-white/5 rounded-xl">
              <p className="text-white/80">
                {methodology.phases.find(p => p.id === currentPhase)?.description}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-white/50 text-sm font-semibold mb-2">{language === 'de' ? 'Techniken' : 'Techniques'}</h5>
                  <ul className="text-white/70 text-sm space-y-1">
                    {methodology.phases.find(p => p.id === currentPhase)?.techniques.map((t, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-white/50 text-sm font-semibold mb-2">{language === 'de' ? 'Outputs' : 'Outputs'}</h5>
                  <ul className="text-white/70 text-sm space-y-1">
                    {methodology.phases.find(p => p.id === currentPhase)?.outputs.map((o, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Status */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-green-400" />
            {language === 'de' ? 'Analyse-Status' : 'Analysis Status'}
          </h3>
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Download className="w-4 h-4" />
            {language === 'de' ? 'Bericht exportieren' : 'Export Report'}
          </button>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{codes.length}</div>
            <div className="text-white/50 text-sm">{language === 'de' ? 'Codes' : 'Codes'}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{categories.length}</div>
            <div className="text-white/50 text-sm">{language === 'de' ? 'Kategorien' : 'Categories'}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-pink-400">{themes.length}</div>
            <div className="text-white/50 text-sm">{language === 'de' ? 'Themen' : 'Themes'}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{(saturation * 100).toFixed(0)}%</div>
            <div className="text-white/50 text-sm">{language === 'de' ? 'Sättigung' : 'Saturation'}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{(density * 100).toFixed(0)}%</div>
            <div className="text-white/50 text-sm">{language === 'de' ? 'Theor. Dichte' : 'Theor. Density'}</div>
          </div>
        </div>

        {/* Saturation Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>{language === 'de' ? 'Theoretische Sättigung' : 'Theoretical Saturation'}</span>
            <span>{(saturation * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${saturation * 100}%` }}
            />
          </div>
          <p className="text-white/40 text-xs mt-2">
            {saturation >= 0.8
              ? (language === 'de' ? '✓ Sättigung erreicht - Bereit für Theoriebildung' : '✓ Saturation reached - Ready for theory building')
              : (language === 'de' ? 'Weitere Kodierung empfohlen für vollständige Sättigung' : 'Further coding recommended for complete saturation')}
          </p>
        </div>
      </div>

      {/* Cross-Methodology Integration Notice */}
      <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔬</div>
          <div>
            <h4 className="text-lg font-bold text-amber-300">
              {language === 'de' ? 'UME Methodologische Integration' : 'UME Methodological Integration'}
            </h4>
            <p className="text-white/60 text-sm mt-1">
              {language === 'de'
                ? 'Die Unified Methodology Engine ermöglicht die nahtlose Integration verschiedener qualitativer Methoden. Codes und Kategorien aus verschiedenen Ansätzen können kombiniert und cross-validiert werden.'
                : 'The Unified Methodology Engine enables seamless integration of different qualitative methods. Codes and categories from various approaches can be combined and cross-validated.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UMETab;
