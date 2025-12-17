import React, { useState } from 'react';
import { ResponsiveContainer } from 'recharts';
import { exportChartAsPNG, exportChartAsSVG, exportChartAsPDF } from '../../../utils/chartExport';

interface BaseChartProps {
  data: any[];
  title?: string;
  subtitle?: string;
  exportable?: boolean;
  height?: number;
  children: React.ReactNode;
  chartId?: string;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  data,
  title,
  subtitle,
  exportable = true,
  height = 300,
  children,
  chartId
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const elementId = chartId || `chart-${title?.replace(/\s+/g, '-').toLowerCase()}`;

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    setIsExporting(true);
    try {
      const filename = `${title?.replace(/\s+/g, '_').toLowerCase() || 'chart'}.${format}`;

      switch (format) {
        case 'png':
          await exportChartAsPNG(elementId, filename);
          break;
        case 'svg':
          await exportChartAsSVG(elementId, filename);
          break;
        case 'pdf':
          await exportChartAsPDF(elementId, filename);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-gray-900/40 rounded-2xl p-6 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}

      <div id={elementId} className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </div>

      {exportable && (
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => handleExport('png')}
            disabled={isExporting}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PNG
          </button>
          <button
            onClick={() => handleExport('svg')}
            disabled={isExporting}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SVG
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PDF
          </button>
        </div>
      )}

      {isExporting && (
        <div className="text-xs text-gray-400 mt-2 text-right">
          Exporting...
        </div>
      )}
    </div>
  );
};
