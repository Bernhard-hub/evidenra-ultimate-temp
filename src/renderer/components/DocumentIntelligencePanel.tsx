/**
 * Document Intelligence Panel
 * Premium UI for displaying Intelligent Document Understanding results
 */

import React, { useState } from 'react';
import { ProcessedDocument, QualityScore, Section } from '../../services/IntelligentDocumentProcessor';

interface DocumentIntelligencePanelProps {
  document: ProcessedDocument | null;
  onClose?: () => void;
}

export const DocumentIntelligencePanel: React.FC<DocumentIntelligencePanelProps> = ({
  document,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'quality' | 'semantics' | 'raw'>('overview');

  if (!document) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        No document processed yet
      </div>
    );
  }

  const { structure, quality, semantics, stats } = document;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">📚</span>
              <h2 className="text-2xl font-bold text-white">Document Intelligence Report</h2>
            </div>
            {structure.title && (
              <h3 className="text-lg text-purple-100 font-medium mt-2">{structure.title}</h3>
            )}
            {structure.authors.length > 0 && (
              <p className="text-purple-200 text-sm mt-1">
                by {structure.authors.slice(0, 3).join(', ')}
                {structure.authors.length > 3 && ` and ${structure.authors.length - 3} more`}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Quality Score Bar */}
        <div className="mt-4 bg-black/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Overall Quality Score</span>
            <span className="text-2xl font-bold text-white">{quality.overall}/100</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                quality.overall >= 80 ? 'bg-green-500' :
                quality.overall >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${quality.overall}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-900 border-b border-gray-700 px-6">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'structure', label: 'Structure', icon: '📑' },
            { id: 'quality', label: 'Quality', icon: '✨' },
            { id: 'semantics', label: 'Semantics', icon: '🧠' },
            { id: 'raw', label: 'Raw Data', icon: '🔧' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab document={document} />}
        {activeTab === 'structure' && <StructureTab structure={structure} />}
        {activeTab === 'quality' && <QualityTab quality={quality} />}
        {activeTab === 'semantics' && <SemanticsTab semantics={semantics} stats={stats} />}
        {activeTab === 'raw' && <RawDataTab document={document} />}
      </div>
    </div>
  );
};

// ============================================================================
// Overview Tab
// ============================================================================

const OverviewTab: React.FC<{ document: ProcessedDocument }> = ({ document }) => {
  const { structure, quality, semantics, stats } = document;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="📄"
          label="Pages"
          value={structure.metadata.pageCount.toString()}
        />
        <MetricCard
          icon="📝"
          label="Words"
          value={structure.metadata.wordCount.toLocaleString()}
        />
        <MetricCard
          icon="📚"
          label="Sections"
          value={structure.sections.length.toString()}
        />
        <MetricCard
          icon="📎"
          label="References"
          value={structure.references.length.toString()}
        />
      </div>

      {/* Abstract */}
      {structure.abstract && (
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
            <span>📋</span> Abstract
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {structure.abstract.substring(0, 500)}
            {structure.abstract.length > 500 && '...'}
          </p>
        </div>
      )}

      {/* Keywords */}
      {structure.keywords.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
            <span>🏷️</span> Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {structure.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Research Type & Methodology */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">🔬 Research Type</h3>
          <p className="text-gray-300 text-xl font-medium capitalize">{semantics.researchType}</p>
        </div>

        {semantics.methodology.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
            <h3 className="text-lg font-semibold text-green-400 mb-3">🛠️ Methods</h3>
            <div className="flex flex-wrap gap-2">
              {semantics.methodology.map((method, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-green-600/20 border border-green-500/30 rounded text-green-300 text-xs capitalize"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Processing Stats */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-400 mb-3">⚡ Processing Info</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Processing Time:</span>
            <span className="text-gray-300 ml-2 font-medium">
              {structure.metadata.processingTime}ms
            </span>
          </div>
          <div>
            <span className="text-gray-500">Extraction Date:</span>
            <span className="text-gray-300 ml-2 font-medium">
              {new Date(structure.metadata.extractionDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Structure Tab
// ============================================================================

const StructureTab: React.FC<{ structure: any }> = ({ structure }) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-purple-400 mb-4">Document Sections</h3>
        {structure.sections.map((section: Section, idx: number) => (
          <div
            key={section.id}
            className="mb-4 pb-4 border-b border-gray-700 last:border-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-white text-base">{section.title}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 capitalize">
                    Type: {section.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">
                    Pages: {section.startPage}-{section.endPage}
                  </span>
                  <span className="text-xs text-gray-400">
                    {section.content.split(/\s+/).length} words
                  </span>
                  <span className="text-xs text-gray-400">
                    {section.citations.length} citations
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  section.confidence > 0.8 ? 'bg-green-600/20 text-green-400' :
                  section.confidence > 0.5 ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {Math.round(section.confidence * 100)}% confidence
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2 line-clamp-3">
              {section.content.substring(0, 200)}...
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Quality Tab
// ============================================================================

const QualityTab: React.FC<{ quality: QualityScore }> = ({ quality }) => {
  const qualityMetrics = [
    { label: 'Text Extraction', value: quality.textExtraction, icon: '📄' },
    { label: 'Structure Clarity', value: quality.structureClarity, icon: '📑' },
    { label: 'Citation Completeness', value: quality.citationCompleteness, icon: '📎' },
    { label: 'Scientific Rigor', value: quality.scientificRigor, icon: '🔬' },
    { label: 'Readability', value: quality.readability, icon: '📖' }
  ];

  return (
    <div className="space-y-6">
      {/* Quality Metrics */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-purple-400 mb-4">Quality Metrics</h3>
        <div className="space-y-4">
          {qualityMetrics.map((metric, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm flex items-center gap-2">
                  <span>{metric.icon}</span>
                  {metric.label}
                </span>
                <span className={`text-lg font-bold ${
                  metric.value >= 80 ? 'text-green-400' :
                  metric.value >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {metric.value}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    metric.value >= 80 ? 'bg-green-500' :
                    metric.value >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      {quality.issues.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
            <span>⚠️</span> Issues Found
          </h3>
          <ul className="space-y-2">
            {quality.issues.map((issue, idx) => (
              <li key={idx} className="text-red-300 text-sm flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {quality.recommendations.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <span>💡</span> Recommendations
          </h3>
          <ul className="space-y-2">
            {quality.recommendations.map((rec, idx) => (
              <li key={idx} className="text-blue-300 text-sm flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Semantics Tab
// ============================================================================

const SemanticsTab: React.FC<{ semantics: any; stats: any }> = ({ semantics, stats }) => {
  return (
    <div className="space-y-6">
      {/* Main Topics */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-purple-400 mb-3">🎯 Main Topics</h3>
        <div className="flex flex-wrap gap-2">
          {semantics.mainTopics.map((topic: string, idx: number) => (
            <span
              key={idx}
              className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Key Findings */}
      {semantics.findings.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-green-400 mb-3">🔍 Key Findings</h3>
          <ul className="space-y-2">
            {semantics.findings.map((finding: string, idx: number) => (
              <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Limitations */}
      {semantics.limitations.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">⚠️ Limitations</h3>
          <ul className="space-y-2">
            {semantics.limitations.map((limitation: string, idx: number) => (
              <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-yellow-500 mt-1">!</span>
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-blue-400 mb-3">📊 Document Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-xs mb-1">Avg Words/Sentence</div>
            <div className="text-white text-2xl font-bold">{stats.avgWordsPerSentence}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Avg Sentences/Paragraph</div>
            <div className="text-white text-2xl font-bold">{stats.avgSentencesPerParagraph}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Citation Density</div>
            <div className="text-white text-2xl font-bold">{stats.citationDensity}</div>
            <div className="text-gray-500 text-xs">per 1000 words</div>
          </div>
        </div>
      </div>

      {/* Section Balance */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-indigo-400 mb-3">📏 Section Balance</h3>
        <div className="space-y-2">
          {Object.entries(stats.sectionBalance).map(([section, percentage]: [string, any]) => (
            <div key={section}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-sm capitalize">
                  {section.replace('_', ' ')}
                </span>
                <span className="text-gray-400 text-sm">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Raw Data Tab
// ============================================================================

const RawDataTab: React.FC<{ document: ProcessedDocument }> = ({ document }) => {
  const [showFullText, setShowFullText] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-400">Full Text Content</h3>
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
          >
            {showFullText ? 'Hide' : 'Show'} Full Text
          </button>
        </div>
        {showFullText && (
          <pre className="bg-gray-900 p-4 rounded text-gray-300 text-xs overflow-x-auto max-h-96 overflow-y-auto">
            {document.raw.fullText}
          </pre>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-400 mb-3">Technical Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Text Elements:</span>
            <span className="text-gray-300 ml-2 font-medium">
              {document.raw.elements.length.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Pages Processed:</span>
            <span className="text-gray-300 ml-2 font-medium">
              {document.raw.pageTexts.length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Character Count:</span>
            <span className="text-gray-300 ml-2 font-medium">
              {document.structure.metadata.charCount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">File Size:</span>
            <span className="text-gray-300 ml-2 font-medium">
              {(document.structure.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

const MetricCard: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value
}) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-gray-400 text-xs mb-1">{label}</div>
    <div className="text-white text-2xl font-bold">{value}</div>
  </div>
);

export default DocumentIntelligencePanel;
