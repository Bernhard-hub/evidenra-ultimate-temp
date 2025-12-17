/**
 * INTEGRATION SNIPPETS
 *
 * Fertige Code-Blöcke zum Einfügen in App.tsx
 * Einfach kopieren und an der richtigen Stelle einfügen!
 */

// ============================================
// SNIPPET 1: Analysis Tab Integration
// ============================================
// Einfügen am Ende des Analysis Tabs (vor dem schließenden </div>)

/*
{/!* Data Quality Visualizations *!/}
<div className="mt-8">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-2xl font-bold flex items-center">
      <BarChart3 className="w-7 h-7 mr-2 text-green-400" />
      {language === 'de' ? 'Datenqualität Visualisierung' : 'Data Quality Visualization'}
    </h3>
    <button
      onClick={() => {
        // Optional: Download als PDF
        exportAllChartsAsReport(
          ['chart-document-type-distribution', 'chart-word-count-distribution'],
          'data-quality-report.pdf'
        );
      }}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
    >
      {language === 'de' ? '📄 Report exportieren' : '📄 Export Report'}
    </button>
  </div>

  <DataQualityDashboard
    documents={project.documents || []}
    categories={project.categories || []}
    codings={project.codings || []}
  />
</div>
*/

// ============================================
// SNIPPET 2: Coding Tab Integration (Sidebar Variant)
// ============================================
// Einfügen im Coding Tab, am besten am Ende vor dem schließenden </div>

/*
{/!* Coding Dashboard Sidebar *!/}
<div className="mt-8">
  <h3 className="text-xl font-semibold mb-4 flex items-center">
    <Activity className="w-6 h-6 mr-2 text-cyan-400" />
    {language === 'de' ? 'Live Dashboard' : 'Live Dashboard'}
  </h3>

  <CodingDashboard
    totalSegments={project.documents.reduce((sum, d) => {
      const segments = d.segments || [];
      return sum + segments.length;
    }, 0)}
    codedSegments={project.codings?.length || 0}
    categories={project.categories || []}
    codings={project.codings || []}
    personaAgreement={{
      // Optional: Füge echte Persona Agreement Daten hinzu
      // 'coding-id-1': 0.85,
      // 'coding-id-2': 0.92,
    }}
    recentCodings={(project.codings || []).slice(-20)}
  />
</div>
*/

// ============================================
// SNIPPET 3: Patterns Tab Integration
// ============================================
// Einfügen am Anfang des Patterns Tabs (nach der Überschrift)

/*
{/!* Pattern Network Visualization *!/}
<div className="mb-8">
  <PatternNetwork
    patterns={project.patterns?.map(p => p.name || p.pattern || String(p)) || []}
    cooccurrences={
      (() => {
        const cooc: {[key: string]: number} = {};
        const patterns = project.patterns || [];

        // Berechne Co-occurrences basierend auf gemeinsamen Dokumenten
        patterns.forEach((p1, i) => {
          patterns.slice(i + 1).forEach(p2 => {
            const p1Name = p1.name || p1.pattern || String(p1);
            const p2Name = p2.name || p2.pattern || String(p2);
            const key = `${p1Name}-${p2Name}`;

            // Vereinfachte Co-occurrence Berechnung
            // TODO: Ersetze mit echter Logik basierend auf deinen Daten
            const p1Docs = p1.documentSpread || 1;
            const p2Docs = p2.documentSpread || 1;
            cooc[key] = Math.min(p1Docs, p2Docs);
          });
        });

        return cooc;
      })()
    }
  />
</div>
*/

// ============================================
// SNIPPET 4: Coding Tab 2-Column Layout (Erweitert)
// ============================================
// Ersetze den gesamten Coding Tab Content mit diesem Layout

/*
{activeTab === 'coding' && (
  <div className="tab-content h-full flex flex-col">
    <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
      {language === 'de' ? '3-Persona Kodierung' : '3-Persona Coding'}
    </h2>

    {/!* 2-Spalten Grid *!/}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
      {/!* Linke Seite: Bestehende Coding-Interface (2 Spalten) *!/}
      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-4">
        {/!* HIER: Alle bestehenden Coding-Elemente einfügen *!/}
        {/!* z.B. Persona Cards, Segment List, etc. *!/}

        <div className="bg-gray-900/40 rounded-2xl p-6 border border-white/10">
          <p className="text-gray-400">
            {language === 'de'
              ? 'Dein bestehendes Coding-Interface hier...'
              : 'Your existing coding interface here...'}
          </p>
        </div>
      </div>

      {/!* Rechte Seite: Dashboard (1 Spalte) *!/}
      <div className="lg:col-span-1 overflow-y-auto">
        <div className="sticky top-0 space-y-4">
          <CodingDashboard
            totalSegments={project.documents.reduce((sum, d) => sum + (d.segments?.length || 0), 0)}
            codedSegments={project.codings?.length || 0}
            categories={project.categories || []}
            codings={project.codings || []}
            personaAgreement={{}}
            recentCodings={(project.codings || []).slice(-20)}
          />
        </div>
      </div>
    </div>
  </div>
)}
*/

// ============================================
// SNIPPET 5: Quality Score Card (für Sidebar)
// ============================================
// Einfügen in der Sidebar, z.B. unter den Tab-Buttons

/*
<div className="p-4 bg-gray-900/60 rounded-2xl border border-white/10 mt-4">
  <p className="text-xs text-gray-400 mb-2">
    {language === 'de' ? 'Datenqualität' : 'Data Quality'}
  </p>
  <div className="flex items-baseline gap-2">
    <span className="text-3xl font-bold text-green-400">
      {(() => {
        const docs = project.documents || [];
        const cats = project.categories || [];
        const codings = project.codings || [];

        if (docs.length === 0) return '0.0';

        // Vereinfachter Quality Score
        const diversity = Math.min(new Set(docs.map(d => d.type)).size / 4, 1);
        const coverage = Math.min(cats.length / 15, 1);
        const balance = codings.length > 0 ? 0.8 : 0.3;

        const score = (diversity + coverage + balance) / 3 * 10;
        return score.toFixed(1);
      })()}
    </span>
    <span className="text-sm text-gray-400">/10</span>
  </div>
  <div className="bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
    <div
      className="bg-gradient-to-r from-green-500 to-cyan-500 h-1.5"
      style={{
        width: `${(() => {
          const docs = project.documents || [];
          const cats = project.categories || [];
          const codings = project.codings || [];

          if (docs.length === 0) return 0;

          const diversity = Math.min(new Set(docs.map(d => d.type)).size / 4, 1);
          const coverage = Math.min(cats.length / 15, 1);
          const balance = codings.length > 0 ? 0.8 : 0.3;

          return ((diversity + coverage + balance) / 3 * 100);
        })()}%`
      }}
    />
  </div>
</div>
*/

// ============================================
// SNIPPET 6: Progress Toast Notifications
// ============================================
// Füge diese useEffect irgendwo in die Komponente ein (nach useState declarations)

/*
// Real-time Progress Toasts
useEffect(() => {
  const totalSegments = project.documents.reduce((sum, d) => sum + (d.segments?.length || 0), 0);
  const codedSegments = project.codings?.length || 0;

  if (totalSegments === 0) return;

  const progress = Math.floor((codedSegments / totalSegments) * 100);

  // Zeige Meilenstein-Toasts
  const milestones = [25, 50, 75, 100];
  if (milestones.includes(progress) && !window.shownMilestone?.[progress]) {
    if (!window.shownMilestone) window.shownMilestone = {};
    window.shownMilestone[progress] = true;

    const messages = {
      25: '🎯 Erste 25% geschafft! Weiter so!',
      50: '🔥 Halbzeit erreicht! Du bist auf dem richtigen Weg!',
      75: '⭐ 75% Complete! Fast geschafft!',
      100: '🎉 Glückwunsch! Alle Segmente kodiert!'
    };

    // Zeige Toast (ersetze mit deinem Toast-System)
    console.log(messages[progress as keyof typeof messages]);
  }
}, [project.codings, project.documents]);
*/

// ============================================
// SNIPPET 7: Export Helper Function
// ============================================
// Füge diese Funktion in deine Komponente ein

/*
const handleExportDataQualityReport = async () => {
  try {
    const { exportAllChartsAsReport } = await import('../../utils/chartExport');

    await exportAllChartsAsReport(
      [
        'chart-document-type-distribution',
        'chart-word-count-distribution',
        'chart-research-quality-metrics'
      ],
      `data-quality-report-${new Date().toISOString().split('T')[0]}.pdf`
    );

    // Zeige Success Message
    console.log('Report exported successfully!');
  } catch (error) {
    console.error('Export failed:', error);
  }
};
*/

// ============================================
// SNIPPET 8: Mini Visualization Dashboard (Compact)
// ============================================
// Für Tabs mit wenig Platz - zeigt nur Key Metrics

/*
<div className="grid md:grid-cols-4 gap-4">
  <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10 text-center">
    <p className="text-sm text-gray-400">Documents</p>
    <p className="text-3xl font-bold text-white mt-2">{project.documents?.length || 0}</p>
  </div>
  <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10 text-center">
    <p className="text-sm text-gray-400">Categories</p>
    <p className="text-3xl font-bold text-purple-400 mt-2">{project.categories?.length || 0}</p>
  </div>
  <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10 text-center">
    <p className="text-sm text-gray-400">Codings</p>
    <p className="text-3xl font-bold text-cyan-400 mt-2">{project.codings?.length || 0}</p>
  </div>
  <div className="bg-gray-900/60 rounded-2xl p-4 border border-white/10 text-center">
    <p className="text-sm text-gray-400">Progress</p>
    <p className="text-3xl font-bold text-green-400 mt-2">
      {(() => {
        const total = project.documents.reduce((sum, d) => sum + (d.segments?.length || 0), 0);
        const coded = project.codings?.length || 0;
        return total > 0 ? Math.floor((coded / total) * 100) : 0;
      })()}%
    </p>
  </div>
</div>
*/

// ============================================
// WICHTIGE HINWEISE
// ============================================

/*
1. Imports am Anfang der Datei sicherstellen:
   import { DataQualityDashboard, CodingDashboard, PatternNetwork } from './components/visualizations';

2. Optional: Export Utils importieren:
   import { exportAllChartsAsReport } from '../utils/chartExport';

3. Icons sicherstellen (falls nicht vorhanden):
   import { BarChart3, Activity } from '@tabler/icons-react';

4. Typescript Errors beheben:
   - Stelle sicher, dass project.documents, project.categories, etc. definiert sind
   - Füge || [] hinzu um leere Arrays als Fallback zu haben

5. Performance:
   - Für große Datasets (>1000 items) erwäge React.memo() für die Visualisierungskomponenten
   - Nutze useMemo() für schwere Berechnungen

6. Mobile Responsiveness:
   - Die Komponenten sind responsive
   - Auf kleinen Bildschirmen: lg:grid-cols-3 → grid-cols-1
   - Teste auf verschiedenen Bildschirmgrößen

7. Dark Mode:
   - Alle Komponenten sind für Dark Mode optimiert
   - Falls du Light Mode hinzufügen willst, passe die Farben in den Komponenten an
*/

export {};
