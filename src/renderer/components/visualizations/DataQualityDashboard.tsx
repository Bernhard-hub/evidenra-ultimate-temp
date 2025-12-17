import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BaseChart } from './BaseChart';

interface Document {
  id: string;
  title: string;
  content: string;
  type?: string;
  wordCount?: number;
}

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
}

interface DataQualityDashboardProps {
  documents: Document[];
  categories: Category[];
  codings: Coding[];
}

// Helper Components
const KPICard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10 text-center hover:border-white/20 transition-all">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-3xl font-bold text-white mt-2">{value}</p>
  </div>
);

// Helper Functions
const calculateDiversity = (docs: Document[]): number => {
  if (docs.length === 0) return 0;
  const types = new Set(docs.map(d => d.type || 'unknown'));
  return Math.min(types.size / 4, 1);
};

const calculateCoherence = (codings: Coding[]): number => {
  if (codings.length === 0) return 0;
  // Simple coherence: ratio of unique categories to total codings
  const uniqueCategories = new Set(codings.map(c => c.category)).size;
  return Math.min(uniqueCategories / Math.max(codings.length * 0.3, 1), 1);
};

const calculateBalance = (codings: Coding[], categories: Category[]): number => {
  if (categories.length === 0 || codings.length === 0) return 0;

  const distribution: { [key: string]: number } = {};
  codings.forEach(c => {
    distribution[c.category] = (distribution[c.category] || 0) + 1;
  });

  const values = Object.values(distribution);
  if (values.length === 0) return 0;

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;

  return Math.exp(-variance / Math.max(avg * avg, 1));
};

const calculateWordCount = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

export const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({
  documents,
  categories,
  codings
}) => {
  // Calculate metrics
  const docsWithWordCount = documents.map(d => ({
    ...d,
    wordCount: d.wordCount || calculateWordCount(d.content || '')
  }));

  const totalWords = docsWithWordCount.reduce((sum, d) => sum + d.wordCount, 0);
  const avgWordsPerDoc = documents.length > 0 ? Math.round(totalWords / documents.length) : 0;

  // Document type distribution
  const typeMap: { [key: string]: number } = {};
  docsWithWordCount.forEach(d => {
    const type = d.type || 'Unknown';
    typeMap[type] = (typeMap[type] || 0) + 1;
  });

  const docTypeData = Object.entries(typeMap).map(([name, value]) => ({
    name,
    value
  }));

  // Word count by document
  const wordCountData = docsWithWordCount.slice(0, 20).map((d, i) => ({
    name: `Doc ${i + 1}`,
    words: d.wordCount,
    title: d.title
  }));

  // Quality scores
  const diversity = calculateDiversity(docsWithWordCount);
  const coverage = Math.min(categories.length / 15, 1);
  const coherence = calculateCoherence(codings);
  const balance = calculateBalance(codings, categories);

  const qualityData = [
    { name: 'Diversity', score: diversity * 100 },
    { name: 'Coverage', score: coverage * 100 },
    { name: 'Coherence', score: coherence * 100 },
    { name: 'Balance', score: balance * 100 }
  ];

  const overallQuality = qualityData.reduce((sum, d) => sum + d.score, 0) / qualityData.length;

  const COLORS = ['#3B82F6', '#A855F7', '#10B981', '#F97316', '#EF4444', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <KPICard label="Documents" value={documents.length} />
        <KPICard label="Total Words" value={totalWords.toLocaleString()} />
        <KPICard label="Categories" value={categories.length} />
        <KPICard label="Codings" value={codings.length} />
      </div>

      {/* Row 1: Pie + Bar */}
      <div className="grid md:grid-cols-2 gap-6">
        {docTypeData.length > 0 && (
          <BaseChart title="Document Type Distribution" height={300}>
            <PieChart>
              <Pie
                data={docTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {docTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </BaseChart>
        )}

        {wordCountData.length > 0 && (
          <BaseChart title="Word Count Distribution" subtitle="First 20 documents" height={300}>
            <BarChart data={wordCountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="words" fill="#3B82F6" />
            </BarChart>
          </BaseChart>
        )}
      </div>

      {/* Row 2: Quality Metrics */}
      {qualityData.length > 0 && (
        <BaseChart title="Research Quality Metrics" subtitle="Higher is better" height={300}>
          <BarChart data={qualityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip
              formatter={(value: any) => `${value.toFixed(1)}%`}
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Bar dataKey="score" fill="#10B981" />
          </BarChart>
        </BaseChart>
      )}

      {/* Overall Quality Score */}
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Overall Data Quality</h3>
            <p className="text-sm text-gray-400 mt-2">
              {documents.length > 0
                ? `Your research data shows ${documents.length} document${documents.length !== 1 ? 's' : ''} with ${
                    diversity > 0.7 ? 'good' : diversity > 0.5 ? 'moderate' : 'limited'
                  } diversity`
                : 'No documents yet'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-green-400">
              {(overallQuality / 10).toFixed(1)}
            </div>
            <div className="text-sm text-gray-400">out of 10</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10">
          <p className="text-sm text-gray-400">Avg Words/Document</p>
          <p className="text-2xl font-bold text-cyan-400 mt-2">{avgWordsPerDoc}</p>
        </div>
        <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10">
          <p className="text-sm text-gray-400">Codings/Document</p>
          <p className="text-2xl font-bold text-purple-400 mt-2">
            {documents.length > 0 ? (codings.length / documents.length).toFixed(1) : '0'}
          </p>
        </div>
        <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10">
          <p className="text-sm text-gray-400">Categories/Document</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {documents.length > 0 ? (categories.length / Math.max(documents.length, 1)).toFixed(1) : '0'}
          </p>
        </div>
      </div>
    </div>
  );
};
