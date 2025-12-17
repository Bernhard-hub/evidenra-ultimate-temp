// src/components/coding/ExpertCard.tsx

import React from 'react';
import {
  IconUser as User,
  IconBrain as Brain,
  IconBook as BookOpen,
  IconEye as Eye,
  IconAlertTriangle as AlertTriangle,
  IconBulb as Lightbulb,
  IconGraduationCap as GraduationCap,
  IconTarget as Target,
  IconMicroscope as Microscope
} from '@tabler/icons-react';

import { ExpertPersona } from '../../services/ExpertPersonaGenerator';

interface ExpertCardProps {
  expert: ExpertPersona;
  number: number;
  isActive?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  className?: string;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({
  expert,
  number,
  isActive = false,
  showDetails = false,
  onToggleDetails,
  className = ''
}) => {
  const disciplineColors = {
    psychology: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    sociology: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    medicine: 'bg-green-500/20 border-green-500/40 text-green-300',
    education: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
    anthropology: 'bg-red-500/20 border-red-500/40 text-red-300'
  };

  const getDisciplineColor = (discipline: string) => {
    return disciplineColors[discipline as keyof typeof disciplineColors] ||
           'bg-gray-500/20 border-gray-500/40 text-gray-300';
  };

  const getDisciplineIcon = (discipline: string) => {
    const icons = {
      psychology: Brain,
      sociology: User,
      medicine: Target,
      education: GraduationCap,
      anthropology: Eye
    };

    const IconComponent = icons[discipline as keyof typeof icons] || Brain;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className={`
      bg-gray-800/50 backdrop-blur-sm rounded-lg border
      ${isActive ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-700'}
      p-4 space-y-4 transition-all duration-300
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getDisciplineColor(expert.disciplinaryPerspective)}`}>
            {getDisciplineIcon(expert.disciplinaryPerspective)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{expert.name}</h3>
              <span className="text-sm text-blue-400">#{number}</span>
            </div>
            <p className="text-sm text-gray-400">{expert.title}</p>
          </div>
        </div>

        {/* Status Indicator */}
        {isActive && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Active
          </div>
        )}
      </div>

      {/* Key Information */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Microscope className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">{expert.theoreticalLens}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 truncate">{expert.codingFocus}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">{expert.yearsOfExperience} years experience</span>
        </div>
      </div>

      {/* Expertise Tags */}
      <div className="flex flex-wrap gap-1">
        {expert.expertise.slice(0, 3).map((area, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs truncate"
          >
            {area}
          </span>
        ))}
        {expert.expertise.length > 3 && (
          <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
            +{expert.expertise.length - 3}
          </span>
        )}
      </div>

      {/* Toggle Details Button */}
      {onToggleDetails && (
        <button
          onClick={onToggleDetails}
          className="w-full text-center text-sm text-blue-400 hover:text-blue-300 py-1 border-t border-gray-700 transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-3 border-t border-gray-700 pt-3 animate-fadeIn">
          {/* Background */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <BookOpen className="w-4 h-4" />
              Background
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {expert.background}
            </p>
          </div>

          {/* Methodological Approach */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <Microscope className="w-4 h-4" />
              Method
            </h4>
            <p className="text-xs text-gray-300">
              {expert.methodologicalApproach}
            </p>
          </div>

          {/* Key Questions */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <Lightbulb className="w-4 h-4" />
              Key Questions
            </h4>
            <ul className="space-y-1">
              {expert.keyQuestions.slice(0, 2).map((question, index) => (
                <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Strengths & Limitations */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-green-400 mb-2">
                <Eye className="w-4 h-4" />
                Strengths
              </h4>
              <p className="text-xs text-gray-300">
                Strong focus on <span className="text-green-400">{expert.codingFocus}</span> through {expert.theoreticalLens} lens
              </p>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-yellow-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Potential Blind Spots
              </h4>
              <p className="text-xs text-gray-300">
                May miss <span className="text-yellow-400">{expert.blindSpots}</span>
              </p>
            </div>
          </div>

          {/* Publication Focus */}
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Publications</h4>
            <div className="flex flex-wrap gap-1">
              {expert.publicationFocus.map((area, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertCard;