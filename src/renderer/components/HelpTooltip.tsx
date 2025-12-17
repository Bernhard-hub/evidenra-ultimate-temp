// src/renderer/components/HelpTooltip.tsx
import React, { useState } from 'react';
import { IconInfoCircle as InfoCircle } from '@tabler/icons-react';

interface HelpTooltipProps {
  title: string;
  content: string | React.ReactNode;
  example?: string;
  score?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  example,
  score,
  position = 'top'
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-blue-400 hover:text-blue-300 transition-colors ml-2"
      >
        <InfoCircle className="w-5 h-5" />
      </button>

      {show && (
        <div
          className={`
            absolute z-50 w-80 bg-slate-800 border border-blue-500/50 rounded-xl shadow-2xl p-4
            ${position === 'top' ? 'bottom-full mb-2' : ''}
            ${position === 'bottom' ? 'top-full mt-2' : ''}
            ${position === 'left' ? 'right-full mr-2' : ''}
            ${position === 'right' ? 'left-full ml-2' : ''}
          `}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <InfoCircle className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-white">{title}</h4>
          </div>

          {/* Content */}
          <div className="text-sm text-gray-300 mb-3">
            {content}
          </div>

          {/* Score Info */}
          {score && (
            <div className="bg-blue-900/30 rounded-lg p-2 mb-3">
              <div className="text-xs text-blue-300 font-medium mb-1">📊 Scoring:</div>
              <div className="text-xs text-gray-300">{score}</div>
            </div>
          )}

          {/* Example */}
          {example && (
            <div className="bg-green-900/30 rounded-lg p-3 border-l-2 border-green-500">
              <div className="text-xs text-green-300 font-medium mb-1">💡 Beispiel:</div>
              <div className="text-xs text-gray-300 italic">{example}</div>
            </div>
          )}

          {/* Arrow */}
          <div
            className={`
              absolute w-3 h-3 bg-slate-800 border-blue-500/50 transform rotate-45
              ${position === 'top' ? 'bottom-[-6px] left-4 border-b border-r' : ''}
              ${position === 'bottom' ? 'top-[-6px] left-4 border-t border-l' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};

// Memo Types Help Data
export const MemoTypeHelp = {
  de: {
    methodological: {
      title: 'Methodologisches Memo',
      content: 'Dokumentiert methodische Entscheidungen, Sampling-Strategien und Forschungsprozesse.',
      score: '1 Memo = +20 Punkte für Methodological Coherence (max 100 bei 5 Memos)',
      example: 'Titel: "Sampling-Strategie"\nInhalt: "Purposive Sampling gewählt, weil maximale Variation angestrebt. Theoretisches Sampling fortgeführt bis Sättigung bei Kategorie X erreicht."'
    },
    theoretical: {
      title: 'Theoretisches Memo',
      content: 'Verknüpft Daten mit Theorie, entwickelt konzeptuelle Ideen und theoretische Insights.',
      score: 'Trägt zur theoretischen Dichte und Credibility bei',
      example: 'Titel: "Emergente Theorie: Digital Stress"\nInhalt: "Teilnehmende berichten konsistent über Druck durch ständige Erreichbarkeit. Verbindung zu Baumann\'s Konzept flüssiger Moderne..."'
    },
    analytical: {
      title: 'Analytisches Memo',
      content: 'Analysiert Muster, Beziehungen zwischen Kategorien und emergente Themen.',
      score: 'Unterstützt Confirmability durch dokumentierte Analyse-Schritte',
      example: 'Titel: "Muster: Generationenunterschiede"\nInhalt: "Auffällig: Digital Natives zeigen andere Coping-Strategien als Generation X. Kategorie "Medienkompetenz" scheint Moderator..."'
    },
    reflexive: {
      title: 'Reflexives Memo',
      content: 'Reflektiert eigene Rolle, Bias und Einfluss auf die Interpretation.',
      score: 'Direkt: +Punkte für Reflexivity Score',
      example: 'Titel: "Eigene Vorannahmen hinterfragt"\nInhalt: "Merke: Meine Annahme, dass Social Media nur negativ ist, wurde durch die Daten herausgefordert. Teilnehmende berichten auch positive Aspekte..."'
    },
    ethical: {
      title: 'Ethisches Memo',
      content: 'Dokumentiert ethische Überlegungen, Datenschutz und sensible Themen.',
      score: 'Zeigt forschungsethische Sorgfalt',
      example: 'Titel: "Anonymisierung sensibler Daten"\nInhalt: "Entschieden: Namen von Social Media Plattformen pseudonymisiert. Direkte Zitate nur mit expliziter Zustimmung..."'
    }
  }
};

// Reflexivity Help Data
export const ReflexivityHelp = {
  de: {
    researcherBackground: {
      title: 'Forscher-Hintergrund',
      content: 'Beschreiben Sie Ihre akademische Ausbildung, berufliche Erfahrung und persönliche Verbindung zum Forschungsthema.',
      score: 'Mindestens 100 Zeichen = +20 Punkte für Reflexivity',
      example: 'Ich bin promovierte Medienpädagogin mit 10 Jahren Erfahrung in der Lehrerbildung. Meine eigene Sozialisation in den 1990er Jahren (prä-digitale Ära) prägt meine Perspektive auf digitale Medien. Beruflich arbeite ich seit 2015 mit Digital Natives...'
    },
    theoreticalPerspective: {
      title: 'Theoretische Perspektive',
      content: 'Welcher theoretische Rahmen leitet Ihre Forschung? Grounded Theory, Phänomenologie, etc.',
      score: 'Mindestens 100 Zeichen = +20 Punkte für Reflexivity',
      example: 'Diese Studie folgt der Grounded Theory nach Charmaz (2014). Ziel ist nicht Hypothesen-Testing, sondern Theorie-Entwicklung aus den Daten. Parallel nutze ich Sensitizing Concepts von Baacke\'s Medienkompetenzbegriff als initiale Linse...'
    },
    influenceOnInterpretation: {
      title: 'Einfluss auf Interpretation',
      content: 'Wie beeinflusst Ihre Position die Dateninterpretation? Welche Vorannahmen bringen Sie mit?',
      score: 'Mindestens 100 Zeichen = +20 Punkte für Reflexivity',
      example: 'Als Medienpädagogin habe ich tendenziell eine bildungsoptimistische Perspektive. Risiko: Übersehen negativer Aspekte digitaler Medien. Gegenmaßnahme: Bewusst nach disconfirming evidence gesucht. Peer-Debriefing mit kritischerem Kollegen...'
    },
    methodologicalDecisions: {
      title: 'Methodische Entscheidungen',
      content: 'Dokumentieren Sie JEDE wichtige methodische Entscheidung mit Begründung und erwogenen Alternativen.',
      score: '1 Entscheidung = +10 Punkte (max 100 bei 10 Entscheidungen)',
      example: 'Entscheidung: "3-Persona Kodierung statt zweiter Kodierer"\nBegründung: "Ressourcen-limitiert, aber Inter-Rater Reliabilität wichtig"\nAlternativen: "Single Coding mit Peer Debriefing erwogen, aber 3-Persona liefert systematischere Triangulation"'
    }
  }
};

export default HelpTooltip;
