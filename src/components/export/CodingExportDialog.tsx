// CodingExportDialog.tsx - Scientific Coding Export Dialog
// Allows users to export codings with configurable context levels

import React, { useState, useMemo } from 'react';
import {
  IconDownload,
  IconX,
  IconFileText,
  IconCode,
  IconTable,
  IconFileTypePdf,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconFilter,
  IconAdjustments
} from '@tabler/icons-react';
import { ExportService, CodingExportOptions, defaultExportOptions } from '../../services/ExportService';
import { ContextLevel } from '../../services/ContextExtractor';

interface CodingExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

type ExportFormat = 'md' | 'html' | 'atlas' | 'maxqda' | 'spss' | 'nvivo';

interface FormatOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
}

interface ContextOption {
  id: ContextLevel;
  name: string;
  description: string;
}

const formatOptions: FormatOption[] = [
  { id: 'md', name: 'Markdown', description: 'Wissenschaftlich, gut lesbar', icon: <IconFileText size={20} />, extension: '.md' },
  { id: 'html', name: 'HTML', description: 'Interaktiv, druckbar', icon: <IconCode size={20} />, extension: '.html' },
  { id: 'atlas', name: 'ATLAS.ti', description: 'Import in ATLAS.ti', icon: <IconFileTypePdf size={20} />, extension: '.txt' },
  { id: 'maxqda', name: 'MAXQDA', description: 'Import in MAXQDA', icon: <IconFileTypePdf size={20} />, extension: '.txt' },
  { id: 'spss', name: 'SPSS/Excel', description: 'Tabellarisch (CSV)', icon: <IconTable size={20} />, extension: '.csv' },
  { id: 'nvivo', name: 'NVivo', description: 'XML für NVivo', icon: <IconFileTypePdf size={20} />, extension: '.xml' }
];

const contextOptions: ContextOption[] = [
  { id: 'none', name: 'Kein Kontext', description: 'Nur kodierter Text' },
  { id: 'sentence', name: '±1 Satz', description: 'Umgebende Sätze' },
  { id: 'narrow', name: 'Standard (±50 Wörter)', description: 'Empfohlen für die meisten Fälle' },
  { id: 'broad', name: 'Breit (±150 Wörter)', description: 'Mehr Kontext für komplexe Analysen' },
  { id: 'paragraph', name: 'Absatz', description: 'Gesamter Absatz' },
  { id: 'section', name: 'Abschnitt', description: 'Bis zur nächsten Überschrift' }
];

export const CodingExportDialog: React.FC<CodingExportDialogProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html');
  const [contextLevel, setContextLevel] = useState<ContextLevel>('narrow');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState({
    includeLineNumbers: true,
    includeDocumentName: true,
    includeMemos: true,
    includeOtherCodes: true,
    includeConfidence: true,
    includeTimestamp: true,
    highlightCoding: true
  });
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterDocuments, setFilterDocuments] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Count filtered codings
  const filteredCount = useMemo(() => {
    if (!project?.codings) return 0;

    let codings = project.codings;

    if (filterCategories.length > 0) {
      codings = codings.filter((c: any) => filterCategories.includes(c.categoryId));
    }

    if (filterDocuments.length > 0) {
      codings = codings.filter((c: any) => filterDocuments.includes(c.documentId));
    }

    if (minConfidence > 0) {
      codings = codings.filter((c: any) => (c.confidence || 0) >= minConfidence / 100);
    }

    return codings.length;
  }, [project?.codings, filterCategories, filterDocuments, minConfidence]);

  const handleExport = async () => {
    if (!project) return;

    setIsExporting(true);

    try {
      const exportOptions: Partial<CodingExportOptions> = {
        format: selectedFormat,
        contextLevel,
        ...options,
        filterCategories: filterCategories.length > 0 ? filterCategories : undefined,
        filterDocuments: filterDocuments.length > 0 ? filterDocuments : undefined,
        minConfidence: minConfidence > 0 ? minConfidence / 100 : undefined
      };

      const content = ExportService.exportCodingsWithContext(project, exportOptions);

      // Get file extension
      const format = formatOptions.find(f => f.id === selectedFormat);
      const extension = format?.extension || '.txt';

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${project.name || 'Kodierungen'}_${timestamp}${extension}`;

      // Download
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export fehlgeschlagen: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFilterCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleDocument = (documentId: string) => {
    setFilterDocuments(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconDownload className="text-white" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Kodierungs-Export</h2>
              <p className="text-indigo-200 text-sm">Wissenschaftlich nachvollziehbar exportieren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Export-Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.map(format => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    selectedFormat === format.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={selectedFormat === format.id ? 'text-indigo-600' : 'text-gray-500'}>
                      {format.icon}
                    </span>
                    <span className={`font-medium ${selectedFormat === format.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {format.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{format.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Context Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Kontext-Umfang
            </label>
            <div className="space-y-2">
              {contextOptions.map(ctx => (
                <label
                  key={ctx.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    contextLevel === ctx.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="contextLevel"
                    checked={contextLevel === ctx.id}
                    onChange={() => setContextLevel(ctx.id)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div className="flex-1">
                    <span className={`font-medium ${contextLevel === ctx.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {ctx.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {ctx.description}
                    </span>
                  </div>
                  {ctx.id === 'narrow' && (
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                      Empfohlen
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            <IconAdjustments size={16} />
            <span>Erweiterte Optionen</span>
            {showAdvanced ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'includeDocumentName', label: 'Dokumentname' },
                  { key: 'includeLineNumbers', label: 'Zeilennummern' },
                  { key: 'includeTimestamp', label: 'Zeitstempel' },
                  { key: 'includeConfidence', label: 'Konfidenzwerte' },
                  { key: 'includeMemos', label: 'Memos/Anmerkungen' },
                  { key: 'includeOtherCodes', label: 'Andere Codes am Segment' },
                  { key: 'highlightCoding', label: 'Kodierung hervorheben' }
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(options as any)[opt.key]}
                      onChange={e => setOptions({ ...options, [opt.key]: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* Confidence Slider */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Minimale Konfidenz: {minConfidence}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minConfidence}
                  onChange={e => setMinConfidence(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Category Filter */}
              {project?.categories?.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <IconFilter size={14} className="inline mr-1" />
                    Kategorien filtern (alle = leer lassen)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {project.categories.map((cat: any) => (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs transition-all ${
                          filterCategories.includes(cat.id)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100'
                        }`}
                      >
                        {filterCategories.includes(cat.id) && <IconCheck size={12} className="inline mr-1" />}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Filter */}
              {project?.documents?.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <IconFilter size={14} className="inline mr-1" />
                    Dokumente filtern (alle = leer lassen)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {project.documents.map((doc: any) => (
                      <button
                        key={doc.id}
                        onClick={() => toggleDocument(doc.id)}
                        className={`px-3 py-1 rounded-full text-xs transition-all ${
                          filterDocuments.includes(doc.id)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100'
                        }`}
                      >
                        {filterDocuments.includes(doc.id) && <IconCheck size={12} className="inline mr-1" />}
                        {doc.name?.substring(0, 20)}{doc.name?.length > 20 ? '...' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-indigo-600">{filteredCount}</span> Kodierung(en) werden exportiert
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || filteredCount === 0}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exportiere...
                </>
              ) : (
                <>
                  <IconDownload size={18} />
                  Exportieren
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingExportDialog;
