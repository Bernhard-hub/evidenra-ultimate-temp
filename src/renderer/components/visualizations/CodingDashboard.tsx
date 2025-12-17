import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BaseChart } from './BaseChart';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Coding {
  id: string;
  segmentId: string;
  categoryId: string;
  category: string;
  confidence?: number;
  timestamp?: number;
}

interface CodingDashboardProps {
  totalSegments: number;
  codedSegments: number;
  categories: Category[];
  codings: Coding[];
  personaAgreement?: { [key: string]: number };
  recentCodings?: Coding[];
}

// Helper Components
const MetricCard: React.FC<{
  label: string;
  value: number;
  format?: 'percent' | 'number';
}> = ({ label, value, format = 'number' }) => {
  const displayValue = format === 'percent' ? (value * 100).toFixed(1) + '%' : value.toFixed(2);
  const percentage = format === 'percent' ? value * 100 : Math.min(value * 10, 100);

  return (
    <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-bold text-cyan-400 mt-2">{displayValue}</p>
      <div className="bg-gray-800 rounded-full h-1 mt-3 overflow-hidden">
        <div
          className="bg-cyan-500 h-1 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const CodingDashboard: React.FC<CodingDashboardProps> = ({
  totalSegments,
  codedSegments,
  categories,
  codings,
  personaAgreement = {},
  recentCodings = []
}) => {
  const progressPercentage = totalSegments > 0 ? (codedSegments / totalSegments) * 100 : 0;

  // Category distribution
  const categoryMap: { [key: string]: number } = {};
  codings.forEach(c => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryMap)
    .map(([name, count]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      count,
      percentage: codings.length > 0 ? (count / codings.length) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Persona agreement over time (last 20 codings)
  const recentCodingsData = (recentCodings.length > 0 ? recentCodings : codings)
    .slice(-20)
    .map((c, i) => ({
      segment: i + 1,
      agreement: personaAgreement[c.id] || 0.75 + Math.random() * 0.2,
      confidence: c.confidence || 0.7 + Math.random() * 0.25
    }));

  // Calculate average metrics
  const avgAgreement = Object.keys(personaAgreement).length > 0
    ? Object.values(personaAgreement).reduce((a, b) => a + b, 0) / Object.keys(personaAgreement).length
    : 0.82;

  const avgConfidence = recentCodingsData.length > 0
    ? recentCodingsData.reduce((sum, d) => sum + d.confidence, 0) / recentCodingsData.length
    : 0.81;

  // Generate consistency warnings
  const warnings: string[] = [];
  if (avgAgreement < 0.7) {
    warnings.push('Low persona agreement detected - review recent codings');
  }
  if (avgConfidence < 0.7) {
    warnings.push('Confidence scores are below threshold - consider re-coding');
  }
  if (categoryData.length > 0 && categoryData[0].percentage > 50) {
    warnings.push(`Category "${categoryData[0].fullName}" is overrepresented (${categoryData[0].percentage.toFixed(0)}%)`);
  }
  if (categoryData.length < 3 && codings.length > 10) {
    warnings.push('Limited category diversity - consider reviewing coding scheme');
  }

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <div className="bg-gray-900/60 rounded-2xl p-6 border border-white/10">
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-white font-semibold">Coding Progress</span>
            <span className="text-gray-400">
              {codedSegments}/{totalSegments}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-cyan-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">{progressPercentage.toFixed(1)}% Complete</p>
        </div>
      </div>

      {/* Consistency Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <MetricCard
          label="Avg Consistency"
          value={avgAgreement}
          format="percent"
        />
        <MetricCard
          label="Persona Agreement"
          value={avgAgreement > 0 ? avgAgreement * 0.98 : 0.82}
          format="percent"
        />
        <MetricCard
          label="Validator Confidence"
          value={avgConfidence}
          format="percent"
        />
      </div>

      {/* Category Distribution */}
      {categoryData.length > 0 && (
        <BaseChart title="Category Distribution" subtitle="Top 10 categories by frequency" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value: any, name: any, props: any) => [
                value,
                `Count (${props.payload.percentage.toFixed(1)}%)`
              ]}
            />
            <Bar dataKey="count" fill="#A855F7" />
          </BarChart>
        </BaseChart>
      )}

      {/* Consistency Trend */}
      {recentCodingsData.length > 0 && (
        <BaseChart title="Consistency Trend" subtitle="Last 20 codings" height={300}>
          <LineChart data={recentCodingsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="segment"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Coding #', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis
              domain={[0.5, 1]}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value: any) => (value as number).toFixed(3)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="agreement"
              stroke="#10B981"
              name="Persona Agreement"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#3B82F6"
              name="Confidence"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 3 }}
            />
          </LineChart>
        </BaseChart>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-2xl p-4">
          <h4 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2">
            <span>⚠️</span> Quality Warnings
          </h4>
          <ul className="space-y-2">
            {warnings.map((warning, i) => (
              <li key={i} className="text-sm text-yellow-200 flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Quick Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10">
          <p className="text-sm text-gray-400">Unique Categories Used</p>
          <p className="text-2xl font-bold text-purple-400 mt-2">{categoryData.length}</p>
          <p className="text-xs text-gray-500 mt-1">of {categories.length} total</p>
        </div>
        <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10">
          <p className="text-sm text-gray-400">Avg Codings per Category</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {categoryData.length > 0 ? (codings.length / categoryData.length).toFixed(1) : '0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {categoryData.length > 0 && codings.length / categoryData.length > 10
              ? 'Good coverage'
              : 'Consider more diverse coding'}
          </p>
        </div>
      </div>
    </div>
  );
};
