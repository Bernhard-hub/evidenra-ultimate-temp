# Visualization Components

Professional-grade data visualization components for qualitative research analysis.

## 📦 Components Overview

### 1. BaseChart
**File:** `BaseChart.tsx`

Foundation component for all charts with built-in export functionality.

**Features:**
- Responsive container using recharts
- Export to PNG, SVG, PDF
- Consistent styling
- Optional title and subtitle
- Customizable height

**Usage:**
```tsx
<BaseChart title="My Chart" subtitle="Description" height={300}>
  <BarChart data={data}>
    {/* Chart content */}
  </BarChart>
</BaseChart>
```

---

### 2. DataQualityDashboard
**File:** `DataQualityDashboard.tsx`

Comprehensive dashboard for analyzing research data quality.

**Visualizations:**
- KPI Cards (Documents, Words, Categories, Codings)
- Document Type Distribution (Pie Chart)
- Word Count Distribution (Bar Chart)
- Research Quality Metrics (4 dimensions)
- Overall Quality Score (0-10)
- Additional Statistics

**Props:**
```typescript
{
  documents: Document[];
  categories: Category[];
  codings: Coding[];
}
```

**Metrics Calculated:**
- **Diversity:** Variety of document types
- **Coverage:** Number of categories vs. ideal (15)
- **Coherence:** Distribution of codings across categories
- **Balance:** Even distribution of codings

**Quality Grade:**
- 9-10: Excellent research quality
- 7-9: Good research quality
- 5-7: Needs improvement
- <5: Critical issues

---

### 3. CodingDashboard
**File:** `CodingDashboard.tsx`

Real-time dashboard for monitoring coding progress and quality.

**Features:**
- Progress bar with percentage
- Consistency metrics (3 cards)
- Category distribution chart
- Consistency trend over time
- Quality warnings
- Quick statistics

**Props:**
```typescript
{
  totalSegments: number;
  codedSegments: number;
  categories: Category[];
  codings: Coding[];
  personaAgreement?: {[key: string]: number};
  recentCodings?: Coding[];
}
```

**Warnings Generated:**
- Low persona agreement (<0.7)
- Low confidence scores (<0.7)
- Category overrepresentation (>50%)
- Limited category diversity

---

### 4. PatternNetwork
**File:** `PatternNetwork.tsx`

Interactive D3 force-directed graph for pattern co-occurrence visualization.

**Features:**
- Draggable nodes
- Zoom and pan
- Node size = Pattern frequency
- Node color = Pattern significance
- Link thickness = Co-occurrence strength
- Click to select patterns
- Responsive to container size

**Props:**
```typescript
{
  patterns: string[];
  cooccurrences: {[key: string]: number};
}
```

**Interactions:**
- **Drag nodes:** Rearrange the network
- **Scroll:** Zoom in/out
- **Click node:** Show details
- **Hover:** Highlight and enlarge node

---

## 🛠️ Utilities

### chartExport.ts
**File:** `src/utils/chartExport.ts`

Export utilities for all visualization formats.

**Functions:**

```typescript
// Export single chart as PNG
await exportChartAsPNG('chart-id', 'filename.png');

// Export single chart as SVG
await exportChartAsSVG('chart-id', 'filename.svg');

// Export single chart as PDF
await exportChartAsPDF('chart-id', 'filename.pdf', { width: 7.5, height: 5 });

// Export multiple charts as PDF report
await exportAllChartsAsReport(
  ['chart-1', 'chart-2', 'chart-3'],
  'report.pdf'
);
```

---

## 🎨 Styling

### Color Palette

```javascript
// Primary Colors
const COLORS = [
  '#3B82F6', // Blue
  '#A855F7', // Purple
  '#10B981', // Green
  '#F97316', // Orange
  '#EF4444', // Red
  '#F59E0B'  // Amber
];

// Background Colors
bg-gray-900/40  // Chart backgrounds
bg-gray-900/60  // Card backgrounds
bg-gray-800     // Progress bars

// Text Colors
text-white      // Primary text
text-gray-400   // Secondary text
text-cyan-400   // Highlights
text-purple-400 // Accents
```

### Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

---

## 📊 Example Integrations

### Simple Integration (Analysis Tab)

```tsx
import { DataQualityDashboard } from './components/visualizations';

function AnalysisTab({ project }) {
  return (
    <div>
      <h2>Data Quality Analysis</h2>
      <DataQualityDashboard
        documents={project.documents}
        categories={project.categories}
        codings={project.codings}
      />
    </div>
  );
}
```

### Advanced Integration (Coding Tab with Split View)

```tsx
import { CodingDashboard } from './components/visualizations';

function CodingTab({ project }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Coding Interface */}
      <div className="col-span-2">
        {/* Your coding interface */}
      </div>

      {/* Right: Live Dashboard */}
      <div className="col-span-1">
        <CodingDashboard
          totalSegments={calculateTotalSegments(project.documents)}
          codedSegments={project.codings.length}
          categories={project.categories}
          codings={project.codings}
          personaAgreement={{}}
          recentCodings={project.codings.slice(-20)}
        />
      </div>
    </div>
  );
}
```

### Pattern Network with Custom Data

```tsx
import { PatternNetwork } from './components/visualizations';

function PatternsTab({ project }) {
  // Calculate co-occurrences
  const cooccurrences = {};
  project.patterns.forEach((p1, i) => {
    project.patterns.slice(i + 1).forEach(p2 => {
      const key = `${p1.name}-${p2.name}`;
      cooccurrences[key] = calculateCooccurrence(p1, p2);
    });
  });

  return (
    <div>
      <h2>Pattern Co-Occurrence Network</h2>
      <PatternNetwork
        patterns={project.patterns.map(p => p.name)}
        cooccurrences={cooccurrences}
      />
    </div>
  );
}
```

---

## 🚀 Performance Tips

### 1. Memoization for Large Datasets

```tsx
import { useMemo } from 'react';

const chartData = useMemo(() => {
  return calculateChartData(project.documents);
}, [project.documents]);
```

### 2. Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const DataQualityDashboard = lazy(() =>
  import('./components/visualizations/DataQualityDashboard')
);

<Suspense fallback={<LoadingSpinner />}>
  <DataQualityDashboard {...props} />
</Suspense>
```

### 3. Debounced Updates

```tsx
import { debounce } from 'lodash';

const updateVisualization = debounce((data) => {
  setChartData(data);
}, 300);
```

---

## 🧪 Testing

### Unit Tests Example

```typescript
import { render, screen } from '@testing-library/react';
import { DataQualityDashboard } from './DataQualityDashboard';

test('renders quality score', () => {
  const mockData = {
    documents: [/* ... */],
    categories: [/* ... */],
    codings: [/* ... */]
  };

  render(<DataQualityDashboard {...mockData} />);

  expect(screen.getByText(/Overall Data Quality/i)).toBeInTheDocument();
});
```

---

## 🐛 Troubleshooting

### Issue: Charts not rendering

**Solution:**
1. Check if data arrays are empty
2. Ensure parent container has height
3. Check browser console for errors
4. Verify recharts is installed: `npm install recharts`

### Issue: D3 network not interactive

**Solution:**
1. Ensure patterns array is not empty
2. Check if SVG has proper dimensions
3. Verify D3 is installed: `npm install d3 @types/d3`

### Issue: Export not working

**Solution:**
1. Install dependencies: `npm install html2canvas jspdf`
2. Ensure chart has unique `chartId` prop
3. Check if element is visible in DOM
4. Try PNG export first (most reliable)

### Issue: Performance problems

**Solution:**
1. Limit data to last N items (e.g., 100-200)
2. Use `React.memo()` for components
3. Debounce state updates
4. Consider pagination for large lists

---

## 📝 Customization Guide

### Change Chart Colors

**In Component:**
```tsx
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
```

### Change Default Height

**In BaseChart:**
```tsx
height = 400 // Change default from 300 to 400
```

### Add New Chart Type

**Example: Add Sankey Diagram:**

```tsx
// Create SankeyChart.tsx
import { BaseChart } from './BaseChart';
// Import sankey library
import { Sankey } from 'recharts-sankey';

export const SankeyChart = ({ data }) => (
  <BaseChart title="Flow Diagram" height={400}>
    <Sankey data={data}>
      {/* Sankey configuration */}
    </Sankey>
  </BaseChart>
);
```

### Customize Export

**In chartExport.ts:**
```tsx
// Change PDF orientation
const pdf = new jsPDF({
  orientation: 'landscape', // or 'portrait'
  unit: 'mm',
  format: 'a4'
});
```

---

## 📚 Dependencies

```json
{
  "recharts": "^2.x.x",
  "d3": "^7.x.x",
  "framer-motion": "^10.x.x",
  "html2canvas": "^1.x.x",
  "jspdf": "^2.x.x",
  "@types/d3": "^7.x.x"
}
```

---

## 🎯 Future Enhancements

- [ ] Add Sankey diagram for coding flow
- [ ] Timeline visualization for temporal analysis
- [ ] Heatmap for category-document matrix
- [ ] Sunburst chart for hierarchical categories
- [ ] Interactive filters and drill-downs
- [ ] Real-time collaboration indicators
- [ ] Animation on data changes
- [ ] Accessibility improvements (ARIA labels)
- [ ] Theme switcher (Dark/Light mode)
- [ ] Custom color palette picker

---

## 📖 References

- [Recharts Documentation](https://recharts.org/)
- [D3.js Documentation](https://d3js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)

---

## 🤝 Contributing

When adding new visualizations:

1. Extend `BaseChart` for consistency
2. Follow existing naming conventions
3. Add TypeScript types for all props
4. Include export functionality
5. Make responsive (mobile-friendly)
6. Add to `index.ts` exports
7. Update this README
8. Add integration snippet to `INTEGRATION_SNIPPETS.tsx`

---

## 📄 License

Part of Evidenra Professional - All Rights Reserved

---

**Version:** 1.0.0
**Last Updated:** 2025-10-22
**Author:** Claude Code
