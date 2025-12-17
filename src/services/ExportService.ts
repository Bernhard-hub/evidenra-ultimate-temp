// ExportService.ts - Universal Export Service for Reports and Data
// Supports: HTML, ATLAS.ti, MAXQDA, SPSS, NVivo with Context
// Version 2.0 - Scientific Context Export

import { ContextExtractor, ContextLevel, ExtractedContext } from './ContextExtractor';

// Export Options Interface
export interface CodingExportOptions {
  format: 'md' | 'html' | 'atlas' | 'maxqda' | 'spss' | 'nvivo';
  contextLevel: ContextLevel;
  customContextWords?: number;
  includeLineNumbers: boolean;
  includeDocumentName: boolean;
  includeMemos: boolean;
  includeOtherCodes: boolean;
  includeConfidence: boolean;
  includeTimestamp: boolean;
  highlightCoding: boolean;
  filterCategories?: string[];
  filterDocuments?: string[];
  minConfidence?: number;
}

// Default export options
export const defaultExportOptions: CodingExportOptions = {
  format: 'md',
  contextLevel: 'narrow',
  includeLineNumbers: true,
  includeDocumentName: true,
  includeMemos: true,
  includeOtherCodes: true,
  includeConfidence: true,
  includeTimestamp: true,
  highlightCoding: true
};

// Enriched coding with context
interface EnrichedCoding {
  id: string;
  documentId: string;
  categoryId: string;
  text: string;
  confidence: number;
  hasConsensus?: boolean;
  timestamp?: string;
  memo?: string;
  // Enriched fields
  documentName?: string;
  categoryName?: string;
  categoryColor?: string;
  contextBefore: string;
  contextAfter: string;
  lineNumber?: number;
  sectionTitle?: string;
  otherCodes: string[];
  startPosition?: number;
  endPosition?: number;
}

export class ExportService {
  /**
   * Export codings with scientific context - Main entry point
   */
  static exportCodingsWithContext(
    project: any,
    options: Partial<CodingExportOptions> = {}
  ): string {
    const opts = { ...defaultExportOptions, ...options };

    // Filter codings
    let codings = [...(project.codings || [])];

    if (opts.filterCategories?.length) {
      codings = codings.filter((c: any) =>
        opts.filterCategories!.includes(c.categoryId)
      );
    }

    if (opts.filterDocuments?.length) {
      codings = codings.filter((c: any) =>
        opts.filterDocuments!.includes(c.documentId)
      );
    }

    if (opts.minConfidence !== undefined) {
      codings = codings.filter((c: any) =>
        (c.confidence || 0) >= opts.minConfidence!
      );
    }

    // Enrich codings with context
    const enrichedCodings = codings.map((coding: any) =>
      this.enrichCoding(coding, project, opts)
    );

    // Export based on format
    switch (opts.format) {
      case 'md':
        return this.exportToMarkdownWithContext(enrichedCodings, project, opts);
      case 'html':
        return this.exportToHTMLWithContext(enrichedCodings, project, opts);
      case 'atlas':
        return this.exportToATLAStiWithContext(enrichedCodings, project, opts);
      case 'maxqda':
        return this.exportToMAXQDAWithContext(enrichedCodings, project, opts);
      case 'nvivo':
        return this.exportToNVivoWithContext(enrichedCodings, project, opts);
      case 'spss':
        return this.exportToSPSSWithContext(enrichedCodings, project, opts);
      default:
        return this.exportToMarkdownWithContext(enrichedCodings, project, opts);
    }
  }

  /**
   * Enrich a single coding with context information
   */
  private static enrichCoding(
    coding: any,
    project: any,
    options: CodingExportOptions
  ): EnrichedCoding {
    const doc = project.documents?.find((d: any) => d.id === coding.documentId);
    const category = project.categories?.find((c: any) =>
      c.id === coding.categoryId || c.name === coding.category
    );

    // Find position in document
    let startPos = coding.startPosition;
    let endPos = coding.endPosition;

    if ((startPos === undefined || endPos === undefined) && doc?.content && coding.text) {
      const position = ContextExtractor.findTextPosition(doc.content, coding.text);
      if (position) {
        startPos = position.start;
        endPos = position.end;
      } else {
        startPos = 0;
        endPos = coding.text.length;
      }
    }

    // Extract context
    let contextBefore = '';
    let contextAfter = '';

    if (options.contextLevel !== 'none' && doc?.content) {
      const context = ContextExtractor.extractContext(
        doc.content,
        startPos || 0,
        endPos || (startPos || 0) + (coding.text?.length || 0),
        {
          level: options.contextLevel,
          customWords: options.customContextWords
        }
      );
      contextBefore = context.before;
      contextAfter = context.after;
    }

    // Get line number
    const lineNumber = doc?.content && startPos !== undefined
      ? ContextExtractor.getLineNumber(doc.content, startPos)
      : undefined;

    // Get section title
    const sectionTitle = doc?.content && startPos !== undefined
      ? ContextExtractor.findSectionTitle(doc.content, startPos)
      : undefined;

    // Find other codes at the same segment
    const otherCodes: string[] = [];
    if (options.includeOtherCodes && startPos !== undefined && endPos !== undefined) {
      project.codings?.forEach((c: any) => {
        if (c.id !== coding.id && c.documentId === coding.documentId) {
          const cStart = c.startPosition ?? doc?.content?.indexOf(c.text) ?? -1;
          const cEnd = c.endPosition ?? (cStart + (c.text?.length || 0));

          // Check for overlap
          if (cStart !== -1 && !(endPos! < cStart || cEnd < startPos!)) {
            const cat = project.categories?.find((cat: any) =>
              cat.id === c.categoryId || cat.name === c.category
            );
            if (cat?.name && !otherCodes.includes(cat.name)) {
              otherCodes.push(cat.name);
            }
          }
        }
      });
    }

    return {
      id: coding.id,
      documentId: coding.documentId,
      categoryId: coding.categoryId,
      text: coding.text || '',
      confidence: coding.confidence || 0,
      hasConsensus: coding.hasConsensus,
      timestamp: coding.timestamp || coding.dateCreated,
      memo: coding.memo,
      documentName: doc?.name,
      categoryName: category?.name || coding.category,
      categoryColor: category?.color,
      contextBefore,
      contextAfter,
      lineNumber,
      sectionTitle: sectionTitle || undefined,
      otherCodes,
      startPosition: startPos,
      endPosition: endPos
    };
  }

  /**
   * Export to Markdown with scientific context
   */
  private static exportToMarkdownWithContext(
    codings: EnrichedCoding[],
    project: any,
    options: CodingExportOptions
  ): string {
    const timestamp = new Date().toLocaleString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let output = `# Kodierungs-Export: ${project.name}\n\n`;
    output += `**Exportiert am:** ${timestamp}\n`;
    output += `**Anzahl Kodierungen:** ${codings.length}\n`;
    output += `**Kontext-Level:** ${this.getContextLevelLabel(options.contextLevel)}\n`;
    output += `**Generiert mit:** EVIDENRA\n\n`;
    output += `---\n\n`;

    // Group by category
    const byCategory = this.groupByCategory(codings);

    for (const [categoryName, categoryCodngs] of Object.entries(byCategory)) {
      output += `## Kategorie: ${categoryName}\n\n`;
      output += `*${categoryCodngs.length} Kodierung(en)*\n\n`;

      categoryCodngs.forEach((coding, index) => {
        output += `### Kodierung #${index + 1}\n\n`;

        // Metadata
        if (options.includeDocumentName && coding.documentName) {
          let location = `**Dokument:** ${coding.documentName}`;
          if (options.includeLineNumbers && coding.lineNumber) {
            location += ` (Zeile ${coding.lineNumber})`;
          }
          output += location + '\n';
        }

        if (coding.sectionTitle) {
          output += `**Abschnitt:** ${coding.sectionTitle}\n`;
        }

        if (options.includeTimestamp && coding.timestamp) {
          output += `**Kodiert am:** ${new Date(coding.timestamp).toLocaleString('de-DE')}\n`;
        }

        if (options.includeConfidence) {
          output += `**Konfidenz:** ${Math.round(coding.confidence * 100)}%`;
          if (coding.hasConsensus !== undefined) {
            output += coding.hasConsensus ? ' ✓ Konsens' : ' ⚠ Kein Konsens';
          }
          output += '\n';
        }

        output += '\n';

        // Context and coded text
        if (coding.contextBefore) {
          output += `> **Kontext davor:**\n`;
          output += `> ${coding.contextBefore.split('\n').join('\n> ')}\n\n`;
        }

        output += `> **[KODIERTE STELLE]**\n`;
        output += `> ${coding.text.split('\n').join('\n> ')}\n\n`;

        if (coding.contextAfter) {
          output += `> **Kontext danach:**\n`;
          output += `> ${coding.contextAfter.split('\n').join('\n> ')}\n\n`;
        }

        // Memo
        if (options.includeMemos && coding.memo) {
          output += `**Memo:** ${coding.memo}\n\n`;
        }

        // Other codes
        if (options.includeOtherCodes && coding.otherCodes.length > 0) {
          output += `**Weitere Codes an dieser Stelle:** ${coding.otherCodes.join(', ')}\n\n`;
        }

        output += `---\n\n`;
      });
    }

    output += `\n*Wissenschaftlicher Export generiert mit EVIDENRA - Qualitative Inhaltsanalyse*\n`;

    return output;
  }

  /**
   * Export to HTML with context and highlighting
   */
  private static exportToHTMLWithContext(
    codings: EnrichedCoding[],
    project: any,
    options: CodingExportOptions
  ): string {
    const timestamp = new Date().toLocaleString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const byCategory = this.groupByCategory(codings);

    let codingsHTML = '';

    for (const [categoryName, categoryCodngs] of Object.entries(byCategory)) {
      codingsHTML += `
        <div class="category-section">
          <h2 class="category-title">
            <span class="category-badge">${categoryName}</span>
            <span class="category-count">${categoryCodngs.length} Kodierung(en)</span>
          </h2>
      `;

      categoryCodngs.forEach((coding, index) => {
        const color = coding.categoryColor || '#667eea';

        codingsHTML += `
          <div class="coding-entry">
            <div class="coding-header">
              <span class="coding-number">#${index + 1}</span>
              ${options.includeDocumentName && coding.documentName ? `
                <span class="document-ref">
                  📄 ${coding.documentName}
                  ${options.includeLineNumbers && coding.lineNumber ? `<span class="line-ref">Zeile ${coding.lineNumber}</span>` : ''}
                </span>
              ` : ''}
              ${options.includeConfidence ? `
                <span class="confidence" title="Konfidenz">
                  ${Math.round(coding.confidence * 100)}%
                  ${coding.hasConsensus ? '✓' : ''}
                </span>
              ` : ''}
            </div>

            ${coding.sectionTitle ? `<div class="section-title">📑 ${coding.sectionTitle}</div>` : ''}

            <div class="coding-context">
              ${coding.contextBefore ? `
                <div class="context-before">${this.escapeHTML(coding.contextBefore)}</div>
              ` : ''}

              <div class="coded-segment" style="border-left-color: ${color}; ${options.highlightCoding ? `background: ${color}15;` : ''}">
                ${this.escapeHTML(coding.text)}
              </div>

              ${coding.contextAfter ? `
                <div class="context-after">${this.escapeHTML(coding.contextAfter)}</div>
              ` : ''}
            </div>

            <div class="coding-meta">
              ${options.includeMemos && coding.memo ? `
                <div class="memo">📝 ${this.escapeHTML(coding.memo)}</div>
              ` : ''}
              ${options.includeOtherCodes && coding.otherCodes.length > 0 ? `
                <div class="other-codes">🏷️ Weitere Codes: ${coding.otherCodes.join(', ')}</div>
              ` : ''}
              ${options.includeTimestamp && coding.timestamp ? `
                <div class="timestamp">🕐 ${new Date(coding.timestamp).toLocaleString('de-DE')}</div>
              ` : ''}
            </div>
          </div>
        `;
      });

      codingsHTML += `</div>`;
    }

    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="generator" content="EVIDENRA">
    <title>Kodierungs-Export: ${project.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 40px;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header .meta {
            opacity: 0.9;
            font-size: 14px;
        }

        .header .meta span {
            margin-right: 20px;
        }

        .content {
            padding: 40px;
        }

        .category-section {
            margin-bottom: 40px;
        }

        .category-title {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
        }

        .category-badge {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: 600;
        }

        .category-count {
            color: #718096;
            font-size: 14px;
            font-weight: normal;
        }

        .coding-entry {
            background: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
        }

        .coding-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .coding-number {
            background: #667eea;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
        }

        .document-ref {
            color: #4a5568;
            font-size: 14px;
        }

        .line-ref {
            color: #718096;
            margin-left: 8px;
        }

        .confidence {
            margin-left: auto;
            background: #e6fffa;
            color: #047857;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
        }

        .section-title {
            color: #667eea;
            font-size: 13px;
            margin-bottom: 12px;
        }

        .coding-context {
            margin: 20px 0;
        }

        .context-before, .context-after {
            color: #64748b;
            font-size: 14px;
            padding: 12px 16px;
            background: #f1f5f9;
            border-radius: 8px;
            margin: 8px 0;
            font-style: italic;
        }

        .coded-segment {
            background: #fef3c7;
            border-left: 4px solid #667eea;
            padding: 16px 20px;
            margin: 12px 0;
            border-radius: 0 8px 8px 0;
            font-size: 15px;
            line-height: 1.7;
        }

        .coding-meta {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 13px;
            color: #64748b;
        }

        .coding-meta > div {
            margin-bottom: 8px;
        }

        .memo {
            background: #fffbeb;
            padding: 10px 14px;
            border-radius: 6px;
            color: #92400e;
        }

        .other-codes {
            color: #667eea;
        }

        .footer {
            background: #f8fafc;
            padding: 30px 40px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
            border-top: 1px solid #e2e8f0;
        }

        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .coding-entry { break-inside: avoid; }
        }

        @media (max-width: 768px) {
            .header, .content, .footer { padding: 20px; }
            .coding-header { flex-direction: column; align-items: flex-start; }
            .confidence { margin-left: 0; margin-top: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Kodierungs-Export: ${this.escapeHTML(project.name)}</h1>
            <div class="meta">
                <span>📅 ${timestamp}</span>
                <span>📝 ${codings.length} Kodierungen</span>
                <span>📏 Kontext: ${this.getContextLevelLabel(options.contextLevel)}</span>
            </div>
        </div>

        <div class="content">
            ${codingsHTML}
        </div>

        <div class="footer">
            <strong>Wissenschaftlicher Export</strong> generiert mit EVIDENRA<br>
            Qualitative Inhaltsanalyse mit KI-Unterstützung
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Export to ATLAS.ti format with context
   */
  private static exportToATLAStiWithContext(
    codings: EnrichedCoding[],
    project: any,
    options: CodingExportOptions
  ): string {
    let output = `____________________________________________________
ATLAS.ti Project Export (with Context)
Generated by EVIDENRA
Date: ${new Date().toLocaleString('de-DE')}
Context Level: ${this.getContextLevelLabel(options.contextLevel)}
____________________________________________________

PROJECT: ${project.name}
DOCUMENTS: ${project.documents?.length || 0}
CODES: ${project.categories?.length || 0}
QUOTATIONS: ${codings.length}

____________________________________________________
CODE SYSTEM
____________________________________________________

`;

    project.categories?.forEach((cat: any, index: number) => {
      const count = codings.filter(c => c.categoryName === cat.name).length;
      output += `[CODE ${index + 1}]\n`;
      output += `Name: ${cat.name}\n`;
      output += `Description: ${cat.description || 'No description'}\n`;
      output += `Frequency: ${count}\n\n`;
    });

    output += `
____________________________________________________
QUOTATIONS WITH CONTEXT
____________________________________________________

`;

    codings.forEach((coding, index) => {
      output += `${'='.repeat(70)}\n`;
      output += `[QUOTATION ${index + 1}]\n`;
      output += `${'='.repeat(70)}\n`;
      output += `Document: ${coding.documentName || 'Unknown'}\n`;
      if (coding.lineNumber) {
        output += `Position: Line ${coding.lineNumber}\n`;
      }
      if (coding.sectionTitle) {
        output += `Section: ${coding.sectionTitle}\n`;
      }
      output += `Code: ${coding.categoryName || 'Unknown'}\n`;
      output += `Confidence: ${Math.round(coding.confidence * 100)}%\n`;
      if (coding.timestamp) {
        output += `Coded: ${new Date(coding.timestamp).toLocaleString('de-DE')}\n`;
      }
      output += `\n`;

      if (coding.contextBefore) {
        output += `--- CONTEXT BEFORE ---\n`;
        output += `${coding.contextBefore}\n\n`;
      }

      output += `--- CODED SEGMENT ---\n`;
      output += `>>> ${coding.text}\n\n`;

      if (coding.contextAfter) {
        output += `--- CONTEXT AFTER ---\n`;
        output += `${coding.contextAfter}\n\n`;
      }

      if (coding.memo) {
        output += `--- MEMO ---\n`;
        output += `${coding.memo}\n\n`;
      }

      if (coding.otherCodes.length > 0) {
        output += `--- OTHER CODES ---\n`;
        coding.otherCodes.forEach(code => output += `- ${code}\n`);
        output += `\n`;
      }

      output += `\n`;
    });

    output += `
____________________________________________________
END OF EXPORT
____________________________________________________
`;

    return output;
  }

  /**
   * Export to MAXQDA format with context
   */
  private static exportToMAXQDAWithContext(
    codings: EnrichedCoding[],
    project: any,
    options: CodingExportOptions
  ): string {
    let output = `MAXQDA Project Export (with Context)
Generated by EVIDENRA
${new Date().toLocaleString('de-DE')}
Context Level: ${this.getContextLevelLabel(options.contextLevel)}

Project: ${project.name}
Documents: ${project.documents?.length || 0}
Codes: ${project.categories?.length || 0}
Coded Segments: ${codings.length}

${'='.repeat(80)}
CODE SYSTEM
${'='.repeat(80)}

`;

    project.categories?.forEach((cat: any) => {
      const count = codings.filter(c => c.categoryName === cat.name).length;
      output += `\\${cat.name}\n`;
      output += `  Description: ${cat.description || 'None'}\n`;
      output += `  Frequency: ${count}\n\n`;
    });

    output += `
${'='.repeat(80)}
CODED SEGMENTS WITH CONTEXT
${'='.repeat(80)}

`;

    // Group by document
    const byDocument = new Map<string, EnrichedCoding[]>();
    codings.forEach(coding => {
      const docName = coding.documentName || 'Unknown';
      if (!byDocument.has(docName)) {
        byDocument.set(docName, []);
      }
      byDocument.get(docName)!.push(coding);
    });

    for (const [docName, docCodings] of byDocument) {
      output += `\nDocument: ${docName}\n`;
      output += `${'-'.repeat(80)}\n\n`;

      docCodings.forEach((coding, index) => {
        output += `[${index + 1}] Code: ${coding.categoryName}\n`;
        if (coding.lineNumber) {
          output += `    Line: ${coding.lineNumber}\n`;
        }
        output += `    Confidence: ${Math.round(coding.confidence * 100)}%\n\n`;

        if (coding.contextBefore) {
          output += `    [Context Before]\n`;
          output += `    ${coding.contextBefore.split('\n').join('\n    ')}\n\n`;
        }

        output += `    [CODED]\n`;
        output += `    >>> ${coding.text.split('\n').join('\n    >>> ')}\n\n`;

        if (coding.contextAfter) {
          output += `    [Context After]\n`;
          output += `    ${coding.contextAfter.split('\n').join('\n    ')}\n\n`;
        }

        if (coding.memo) {
          output += `    [Memo] ${coding.memo}\n\n`;
        }

        if (coding.otherCodes.length > 0) {
          output += `    [Other Codes] ${coding.otherCodes.join(', ')}\n\n`;
        }

        output += `${'-'.repeat(40)}\n\n`;
      });
    }

    return output;
  }

  /**
   * Export to NVivo format with context
   */
  private static exportToNVivoWithContext(
    codings: EnrichedCoding[],
    project: any,
    options: CodingExportOptions
  ): string {
    let output = `<?xml version="1.0" encoding="UTF-8"?>
<!-- NVivo Project Export with Context -->
<!-- Generated by EVIDENRA -->
<!-- Date: ${new Date().toISOString()} -->
<!-- Context Level: ${this.getContextLevelLabel(options.contextLevel)} -->

<NVivoExport>
  <Project Name="${this.escapeXML(project.name)}">
    <Documents Count="${project.documents?.length || 0}"/>
    <Codes Count="${project.categories?.length || 0}"/>
    <References Count="${codings.length}"/>
  </Project>

  <Sources>
`;

    project.documents?.forEach((doc: any) => {
      output += `    <Source Name="${this.escapeXML(doc.name)}" Type="Text">
      <WordCount>${doc.wordCount || 0}</WordCount>
    </Source>\n`;
    });

    output += `  </Sources>

  <Nodes>
`;

    project.categories?.forEach((cat: any) => {
      const count = codings.filter(c => c.categoryName === cat.name).length;
      output += `    <Node Name="${this.escapeXML(cat.name)}">
      <Description>${this.escapeXML(cat.description || '')}</Description>
      <References>${count}</References>
    </Node>\n`;
    });

    output += `  </Nodes>

  <CodingReferences>
`;

    codings.forEach((coding, index) => {
      output += `    <Reference ID="${index + 1}">
      <Source>${this.escapeXML(coding.documentName || 'Unknown')}</Source>
      <Node>${this.escapeXML(coding.categoryName || 'Unknown')}</Node>
      <Position>
        <Line>${coding.lineNumber || 0}</Line>
        <Start>${coding.startPosition || 0}</Start>
        <End>${coding.endPosition || 0}</End>
      </Position>
      <Confidence>${Math.round(coding.confidence * 100)}</Confidence>
      ${coding.sectionTitle ? `<Section>${this.escapeXML(coding.sectionTitle)}</Section>` : ''}
      <ContextBefore>${this.escapeXML(coding.contextBefore)}</ContextBefore>
      <Text>${this.escapeXML(coding.text)}</Text>
      <ContextAfter>${this.escapeXML(coding.contextAfter)}</ContextAfter>
      ${coding.memo ? `<Memo>${this.escapeXML(coding.memo)}</Memo>` : ''}
      ${coding.otherCodes.length > 0 ? `<OtherCodes>${coding.otherCodes.map(c => this.escapeXML(c)).join(', ')}</OtherCodes>` : ''}
    </Reference>\n`;
    });

    output += `  </CodingReferences>
</NVivoExport>`;

    return output;
  }

  /**
   * Export to SPSS format with context
   */
  private static exportToSPSSWithContext(
    codings: EnrichedCoding[],
    project: any,
    options: CodingExportOptions
  ): string {
    let output = `* SPSS Data File with Context\n`;
    output += `* Generated by EVIDENRA\n`;
    output += `* Date: ${new Date().toISOString()}\n`;
    output += `* Project: ${project.name}\n`;
    output += `* Context Level: ${this.getContextLevelLabel(options.contextLevel)}\n`;
    output += `*\n`;
    output += `* Variable Definitions:\n`;
    output += `* ID - Unique identifier\n`;
    output += `* DocumentName - Source document\n`;
    output += `* CategoryName - Code/Category name\n`;
    output += `* LineNumber - Line in document\n`;
    output += `* Confidence - Confidence score (0-100)\n`;
    output += `* ContextBefore - Text before coding\n`;
    output += `* CodedText - The coded segment\n`;
    output += `* ContextAfter - Text after coding\n`;
    output += `* Memo - Analyst memo\n`;
    output += `* OtherCodes - Other codes at same position\n`;
    output += `*\n\n`;

    // CSV Header
    output += `ID,DocumentName,CategoryName,LineNumber,Confidence,ContextBefore,CodedText,ContextAfter,Memo,OtherCodes\n`;

    codings.forEach((coding, index) => {
      const row = [
        index + 1,
        `"${(coding.documentName || '').replace(/"/g, '""')}"`,
        `"${(coding.categoryName || '').replace(/"/g, '""')}"`,
        coding.lineNumber || 0,
        Math.round(coding.confidence * 100),
        `"${(coding.contextBefore || '').replace(/"/g, '""').substring(0, 500)}"`,
        `"${(coding.text || '').replace(/"/g, '""').substring(0, 500)}"`,
        `"${(coding.contextAfter || '').replace(/"/g, '""').substring(0, 500)}"`,
        `"${(coding.memo || '').replace(/"/g, '""')}"`,
        `"${coding.otherCodes.join('; ')}"`
      ].join(',');

      output += row + '\n';
    });

    output += `\n* Total records: ${codings.length}\n`;

    return output;
  }

  // ============= Helper Methods =============

  private static groupByCategory(codings: EnrichedCoding[]): Record<string, EnrichedCoding[]> {
    const grouped: Record<string, EnrichedCoding[]> = {};
    codings.forEach(coding => {
      const cat = coding.categoryName || 'Unbekannt';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(coding);
    });
    return grouped;
  }

  private static getContextLevelLabel(level: ContextLevel): string {
    const labels: Record<ContextLevel, string> = {
      'none': 'Kein Kontext',
      'sentence': '±1 Satz',
      'narrow': '±50 Wörter',
      'broad': '±150 Wörter',
      'paragraph': 'Gesamter Absatz',
      'section': 'Gesamter Abschnitt',
      'custom': 'Benutzerdefiniert'
    };
    return labels[level] || level;
  }

  private static escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // ============= Legacy Methods (kept for compatibility) =============

  /**
   * Convert Markdown to HTML with professional styling
   */
  static markdownToHTML(markdown: string, title: string = 'EVIDENRA Report'): string {
    let html = markdown;
    html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    html = html.replace(/#{4}\s*(.+?)(?:\n|$)/g, '<h4>$1</h4>\n');
    html = html.replace(/#{3}\s*(.+?)(?:\n|$)/g, '<h3>$1</h3>\n');
    html = html.replace(/#{2}\s*(.+?)(?:\n|$)/g, '<h2>$1</h2>\n');
    html = html.replace(/#{1}\s+(.+?)(?:\n|$)/g, '<h1>$1</h1>\n');
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/^[\*\-]\s+(.+)$/gim, '<li>$1</li>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '').replace(/<p>\s*<\/p>/g, '');

    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.8; color: #2c3e50; max-width: 900px; margin: 0 auto; padding: 40px; }
        h1, h2, h3 { color: #1a202c; margin-top: 30px; }
        h1 { border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        p { margin-bottom: 15px; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        ul { padding-left: 25px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>${html}</body>
</html>`;
  }

  /**
   * Legacy export methods - redirect to new system
   */
  static exportToATLASti(project: any, options?: any): string {
    return this.exportCodingsWithContext(project, { format: 'atlas', contextLevel: 'narrow', ...options });
  }

  static exportToMAXQDA(project: any): string {
    return this.exportCodingsWithContext(project, { format: 'maxqda', contextLevel: 'narrow' });
  }

  static exportToSPSS(project: any): string {
    return this.exportCodingsWithContext(project, { format: 'spss', contextLevel: 'narrow' });
  }

  static exportToNVivo(project: any): string {
    return this.exportCodingsWithContext(project, { format: 'nvivo', contextLevel: 'narrow' });
  }

  static async exportReport(
    content: string,
    format: 'html' | 'md',
    filename: string,
    title?: string
  ): Promise<Blob> {
    let exportContent: string;
    let mimeType: string;

    if (format === 'html') {
      exportContent = this.markdownToHTML(content, title || filename);
      mimeType = 'text/html';
    } else {
      exportContent = content;
      mimeType = 'text/markdown';
    }

    return new Blob([exportContent], { type: mimeType });
  }
}

export default ExportService;
