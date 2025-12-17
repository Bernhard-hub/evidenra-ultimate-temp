// src/services/MasterThesisGenerator.test.ts
// TESTS FÜR MASTER THESIS GENERATOR
// ================================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { MasterThesisGenerator, type CompleteChapter, type ChapterSection } from './MasterThesisGenerator';

// ================================================================================
// TEST HELPERS
// ================================================================================

const createMockChapter = (overrides: Partial<CompleteChapter> = {}): CompleteChapter => ({
  chapterNumber: 2,
  chapterTitle: 'Theoretischer Rahmen',
  abstract: 'Dies ist eine kurze Zusammenfassung des Kapitels.',
  sections: [
    {
      sectionNumber: '2.1',
      sectionTitle: 'Grundlagen',
      content: 'Dies ist ein vollständiger Abschnitt mit ausreichend Text für die Validierung.',
      wordCount: 150,
      containsPlaceholders: false
    }
  ],
  totalWordCount: 150,
  isComplete: true,
  qualityScore: 1.0,
  generatedAt: new Date().toISOString(),
  validationReport: {
    hasPlaceholders: false,
    placeholderCount: 0,
    placeholderLocations: [],
    meetsWordCount: true,
    actualWordCount: 150,
    targetWordCount: 100,
    completenessRate: 1.0,
    recommendations: []
  },
  ...overrides
});

// ================================================================================
// PLACEHOLDER DETECTION TESTS
// ================================================================================

describe('MasterThesisGenerator - Placeholder Detection', () => {

  it('should detect "hier würde" placeholder pattern', () => {
    const textWithPlaceholder = 'Dies ist ein Text. Hier würde eine ausführliche Erklärung folgen.';
    // @ts-ignore - accessing private method for testing
    const hasPlaceholders = MasterThesisGenerator.detectPlaceholders(textWithPlaceholder);
    expect(hasPlaceholders).toBe(true);
  });

  it('should detect "würde folgen" placeholder pattern', () => {
    const textWithPlaceholder = 'An dieser Stelle würde folgen: eine detaillierte Analyse.';
    // @ts-ignore
    const hasPlaceholders = MasterThesisGenerator.detectPlaceholders(textWithPlaceholder);
    expect(hasPlaceholders).toBe(true);
  });

  it('should detect square bracket placeholders', () => {
    const textWithPlaceholder = 'Dies ist ein Text [Platzhalter für weitere Ausführungen].';
    // @ts-ignore
    const hasPlaceholders = MasterThesisGenerator.detectPlaceholders(textWithPlaceholder);
    expect(hasPlaceholders).toBe(true);
  });

  it('should detect ellipsis placeholders', () => {
    const textWithPlaceholder = 'Dies ist ein Text und weitere Aspekte... usw.';
    // @ts-ignore
    const hasPlaceholders = MasterThesisGenerator.detectPlaceholders(textWithPlaceholder);
    expect(hasPlaceholders).toBe(true);
  });

  it('should NOT detect placeholders in complete text', () => {
    const completeText = `
      Die qualitative Forschung ermöglicht es, komplexe soziale Phänomene zu untersuchen.
      Durch den Einsatz offener Interviews können Forscher tiefe Einblicke in die subjektiven
      Erfahrungen der Teilnehmenden gewinnen. Diese Methode erfordert eine sorgfältige Planung
      und Durchführung, um valide Ergebnisse zu erzielen.
    `;
    // @ts-ignore
    const hasPlaceholders = MasterThesisGenerator.detectPlaceholders(completeText);
    expect(hasPlaceholders).toBe(false);
  });

  it('should detect "könnte beschrieben werden" placeholder', () => {
    const textWithPlaceholder = 'Dieser Aspekt könnte beschrieben werden in einem späteren Kapitel.';
    // @ts-ignore
    const hasPlaceholders = MasterThesisGenerator.detectPlaceholders(textWithPlaceholder);
    expect(hasPlaceholders).toBe(true);
  });
});

// ================================================================================
// WORD COUNT TESTS
// ================================================================================

describe('MasterThesisGenerator - Word Count', () => {

  it('should count words correctly in plain text', () => {
    const text = 'Dies ist ein Test mit zehn Wörtern in diesem Satz.';
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(text);
    expect(wordCount).toBe(10);
  });

  it('should count words correctly with markdown formatting', () => {
    const text = '**Dies** ist ein *Test* mit [Link](url) Formatierung.';
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(text);
    expect(wordCount).toBe(7); // "Dies ist ein Test mit Link Formatierung"
  });

  it('should ignore markdown headers in word count', () => {
    const text = '## Überschrift\nDies ist ein Test.';
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(text);
    expect(wordCount).toBe(5); // "Überschrift Dies ist ein Test"
  });

  it('should handle empty text', () => {
    const text = '';
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(text);
    expect(wordCount).toBe(0);
  });

  it('should handle text with multiple spaces', () => {
    const text = 'Dies    ist     ein Test.';
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(text);
    expect(wordCount).toBe(4);
  });
});

// ================================================================================
// VALIDATION TESTS
// ================================================================================

describe('MasterThesisGenerator - Chapter Validation', () => {

  it('should validate complete chapter without placeholders', () => {
    const chapter = createMockChapter({
      sections: [
        {
          sectionNumber: '2.1',
          sectionTitle: 'Abschnitt 1',
          content: 'Vollständiger Text ohne Platzhalter mit ausreichend Inhalt.',
          wordCount: 150,
          containsPlaceholders: false
        }
      ],
      totalWordCount: 150
    });

    // @ts-ignore
    const validation = MasterThesisGenerator.validateChapter(chapter, 100, true);

    expect(validation.hasPlaceholders).toBe(false);
    expect(validation.meetsWordCount).toBe(true);
    expect(validation.completenessRate).toBeGreaterThanOrEqual(0.95);
  });

  it('should detect placeholders in validation', () => {
    const chapter = createMockChapter({
      sections: [
        {
          sectionNumber: '2.1',
          sectionTitle: 'Abschnitt 1',
          content: 'Text mit Platzhalter. Hier würde folgen...',
          wordCount: 150,
          containsPlaceholders: true
        }
      ]
    });

    // @ts-ignore
    const validation = MasterThesisGenerator.validateChapter(chapter, 100, true);

    expect(validation.hasPlaceholders).toBe(true);
    expect(validation.placeholderCount).toBe(1);
    expect(validation.completenessRate).toBeLessThan(0.8);
  });

  it('should detect insufficient word count', () => {
    const chapter = createMockChapter({
      totalWordCount: 50
    });

    // @ts-ignore
    const validation = MasterThesisGenerator.validateChapter(chapter, 100, true);

    expect(validation.meetsWordCount).toBe(false);
    expect(validation.actualWordCount).toBe(50);
    expect(validation.targetWordCount).toBe(100);
  });

  it('should accept 90% of target word count', () => {
    const chapter = createMockChapter({
      totalWordCount: 900
    });

    // @ts-ignore
    const validation = MasterThesisGenerator.validateChapter(chapter, 1000, false);

    expect(validation.meetsWordCount).toBe(true); // 900 >= 1000 * 0.9
  });

  it('should provide recommendations for incomplete chapters', () => {
    const chapter = createMockChapter({
      sections: [
        {
          sectionNumber: '2.1',
          sectionTitle: 'Abschnitt',
          content: 'Hier würde eine Erklärung folgen.',
          wordCount: 50,
          containsPlaceholders: true
        }
      ],
      totalWordCount: 50
    });

    // @ts-ignore
    const validation = MasterThesisGenerator.validateChapter(chapter, 100, true);

    expect(validation.recommendations.length).toBeGreaterThan(0);
    expect(validation.recommendations.some(r => r.includes('Platzhalter'))).toBe(true);
    expect(validation.recommendations.some(r => r.includes('Wortanzahl'))).toBe(true);
  });
});

// ================================================================================
// EXPORT TESTS
// ================================================================================

describe('MasterThesisGenerator - Export Functions', () => {

  it('should export chapter as markdown', () => {
    const chapter = createMockChapter({
      chapterNumber: 2,
      chapterTitle: 'Theoretischer Rahmen',
      abstract: 'Dies ist das Abstract.',
      sections: [
        {
          sectionNumber: '2.1',
          sectionTitle: 'Grundlagen',
          content: 'Dies ist der Inhalt des Abschnitts.',
          wordCount: 100,
          containsPlaceholders: false
        }
      ]
    });

    const markdown = MasterThesisGenerator.exportAsMarkdown(chapter);

    expect(markdown).toContain('# 2. Theoretischer Rahmen');
    expect(markdown).toContain('**Abstract:** Dies ist das Abstract.');
    expect(markdown).toContain('## 2.1 Grundlagen');
    expect(markdown).toContain('Dies ist der Inhalt des Abschnitts.');
    expect(markdown).toContain('Wortanzahl:');
    expect(markdown).toContain('Qualität:');
  });

  it('should export chapter as plain text', () => {
    const chapter = createMockChapter({
      chapterNumber: 3,
      chapterTitle: 'Methodologie',
      abstract: 'Abstract Text.',
      sections: [
        {
          sectionNumber: '3.1',
          sectionTitle: 'Forschungsdesign',
          content: '**Fett** und *kursiv* und [Link](url) Text.',
          wordCount: 100,
          containsPlaceholders: false
        }
      ]
    });

    const plainText = MasterThesisGenerator.exportAsPlainText(chapter);

    expect(plainText).toContain('3. Methodologie');
    expect(plainText).toContain('Abstract: Abstract Text.');
    expect(plainText).toContain('3.1 Forschungsdesign');
    expect(plainText).toContain('Fett und kursiv und Link Text'); // Markdown entfernt
    expect(plainText).not.toContain('**');
    expect(plainText).not.toContain('*');
    expect(plainText).not.toContain('[');
  });

  it('should handle multiple sections in export', () => {
    const chapter = createMockChapter({
      sections: [
        {
          sectionNumber: '2.1',
          sectionTitle: 'Abschnitt 1',
          content: 'Inhalt 1',
          wordCount: 50,
          containsPlaceholders: false
        },
        {
          sectionNumber: '2.2',
          sectionTitle: 'Abschnitt 2',
          content: 'Inhalt 2',
          wordCount: 50,
          containsPlaceholders: false
        }
      ]
    });

    const markdown = MasterThesisGenerator.exportAsMarkdown(chapter);

    expect(markdown).toContain('## 2.1 Abschnitt 1');
    expect(markdown).toContain('## 2.2 Abschnitt 2');
    expect(markdown).toContain('Inhalt 1');
    expect(markdown).toContain('Inhalt 2');
  });
});

// ================================================================================
// INTEGRATION TESTS (structure validation)
// ================================================================================

describe('MasterThesisGenerator - Structure Validation', () => {

  it('should create valid ChapterContext interface', () => {
    const context = {
      thesisTitle: 'Meine Masterarbeit',
      thesisTopic: 'Qualitative Forschung',
      chapterNumber: 2,
      chapterTitle: 'Theorie',
      targetWords: 3000,
      researchQuestions: ['Frage 1', 'Frage 2'],
      methodology: 'Grounded Theory'
    };

    // Validate structure
    expect(context.thesisTitle).toBeDefined();
    expect(context.chapterNumber).toBe(2);
    expect(context.targetWords).toBeGreaterThan(0);
  });

  it('should create valid CompleteChapter structure', () => {
    const chapter = createMockChapter();

    expect(chapter.chapterNumber).toBeDefined();
    expect(chapter.chapterTitle).toBeDefined();
    expect(chapter.abstract).toBeDefined();
    expect(Array.isArray(chapter.sections)).toBe(true);
    expect(chapter.totalWordCount).toBeGreaterThanOrEqual(0);
    expect(chapter.isComplete).toBeDefined();
    expect(chapter.qualityScore).toBeGreaterThanOrEqual(0);
    expect(chapter.qualityScore).toBeLessThanOrEqual(1);
    expect(chapter.validationReport).toBeDefined();
  });

  it('should create valid ValidationReport structure', () => {
    const chapter = createMockChapter();
    const report = chapter.validationReport;

    expect(typeof report.hasPlaceholders).toBe('boolean');
    expect(typeof report.placeholderCount).toBe('number');
    expect(Array.isArray(report.placeholderLocations)).toBe(true);
    expect(typeof report.meetsWordCount).toBe('boolean');
    expect(typeof report.completenessRate).toBe('number');
    expect(Array.isArray(report.recommendations)).toBe(true);
  });
});

// ================================================================================
// EDGE CASES
// ================================================================================

describe('MasterThesisGenerator - Edge Cases', () => {

  it('should handle empty section content', () => {
    const text = '';
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(text);
    // @ts-ignore
    const hasPlaceholders = MasterThesisGenerator.detectPlaceholders(text);

    expect(wordCount).toBe(0);
    expect(hasPlaceholders).toBe(false);
  });

  it('should handle very long text', () => {
    const longText = 'Wort '.repeat(10000);
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(longText);

    expect(wordCount).toBe(10000);
  });

  it('should handle text with special characters', () => {
    const text = 'Test: mit (vielen) [verschiedenen] {Zeichen}!? & § $ %.';
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(text);

    expect(wordCount).toBeGreaterThan(0);
  });

  it('should handle German umlauts', () => {
    const text = 'Über Ästhetik und Qualität der Öffentlichkeit.';
    // @ts-ignore
    const wordCount = MasterThesisGenerator.countWords(text);

    expect(wordCount).toBe(6);
  });

  it('should calculate completeness rate correctly', () => {
    const perfectChapter = createMockChapter({
      sections: [{
        sectionNumber: '1.1',
        sectionTitle: 'Test',
        content: 'Perfect content',
        wordCount: 1000,
        containsPlaceholders: false
      }],
      totalWordCount: 1000
    });

    // @ts-ignore
    const validation = MasterThesisGenerator.validateChapter(perfectChapter, 1000, true);

    expect(validation.completenessRate).toBe(1.0);
  });
});

// ================================================================================
// SYSTEM PROMPT TESTS
// ================================================================================

describe('MasterThesisGenerator - System Prompts', () => {

  it('should generate outline system prompt with correct language', () => {
    // @ts-ignore
    const promptDE = MasterThesisGenerator.getOutlineSystemPrompt({ language: 'de', academicLevel: 'master' });
    // @ts-ignore
    const promptEN = MasterThesisGenerator.getOutlineSystemPrompt({ language: 'en', academicLevel: 'master' });

    expect(promptDE).toContain('wissenschaftlich');
    expect(promptEN).toContain('academic');
  });

  it('should generate section system prompt with anti-placeholder rules', () => {
    // @ts-ignore
    const prompt = MasterThesisGenerator.getSectionSystemPrompt({
      language: 'de',
      academicLevel: 'master',
      citationStyle: 'APA'
    });

    expect(prompt).toContain('VERBOTEN');
    expect(prompt).toContain('hier würde');
    expect(prompt).toContain('ERFORDERLICH');
    expect(prompt).toContain('vollständig');
  });

  it('should include citation style in prompts', () => {
    // @ts-ignore
    const promptAPA = MasterThesisGenerator.getSectionSystemPrompt({
      language: 'de',
      academicLevel: 'master',
      citationStyle: 'APA'
    });

    expect(promptAPA).toContain('APA');
  });
});
