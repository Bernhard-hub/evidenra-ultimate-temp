/**
 * ═══════════════════════════════════════════════════════════
 * 📚 LITERATURFINDER IMPORT SERVICE
 * ═══════════════════════════════════════════════════════════
 *
 * Importiert Literatur aus dem Literaturfinder in EVIDENRA Ultimate.
 * Unterstützt:
 * - JSON Export aus Literaturfinder
 * - Automatische Dokumenterstellung
 * - Metadaten-Import (DOI, Authors, etc.)
 * - PDF Download wenn verfügbar (Open Access)
 */

export interface LiteraturfinderPaper {
  id: string
  title: string
  authors: string
  year: number
  journal?: string
  publisher: string
  doi?: string
  abstract?: string
  url: string
  openAccessUrl?: string
  institutionalUrl?: string
  libgenUrl?: string
}

export interface LiteraturfinderExport {
  source: 'Literaturfinder'
  exportedAt: string
  version?: string
  papers: LiteraturfinderPaper[]
}

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  documents: ImportedDocument[]
  errors: string[]
}

export interface ImportedDocument {
  id: string
  name: string
  content: string
  wordCount: number
  metadata: {
    source: 'Literaturfinder'
    doi?: string
    authors?: string
    year?: number
    journal?: string
    publisher?: string
    importedAt: string
    accessUrls: {
      original?: string
      openAccess?: string
      institutional?: string
    }
  }
}

export class LiteraturfinderImportService {
  /**
   * Importiere Literaturfinder Export
   */
  async importFromJson(jsonData: string | LiteraturfinderExport): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      documents: [],
      errors: []
    }

    try {
      // Parse JSON wenn String
      const data: LiteraturfinderExport = typeof jsonData === 'string'
        ? JSON.parse(jsonData)
        : jsonData

      // Validiere Export-Format
      if (data.source !== 'Literaturfinder') {
        result.errors.push('Ungültiges Export-Format: Nicht von Literaturfinder')
        return result
      }

      if (!data.papers || !Array.isArray(data.papers)) {
        result.errors.push('Keine Papers im Export gefunden')
        return result
      }

      console.log(`📚 Importiere ${data.papers.length} Papers aus Literaturfinder...`)

      // Importiere jedes Paper
      for (const paper of data.papers) {
        try {
          const document = await this.createDocumentFromPaper(paper)
          result.documents.push(document)
          result.imported++
        } catch (error) {
          result.failed++
          result.errors.push(`Fehler bei "${paper.title}": ${error}`)
        }
      }

      result.success = result.imported > 0

      console.log(`✅ Import abgeschlossen: ${result.imported} erfolgreich, ${result.failed} fehlgeschlagen`)

      return result
    } catch (error) {
      result.errors.push(`Import-Fehler: ${error}`)
      return result
    }
  }

  /**
   * Erstelle EVIDENRA Dokument aus Paper
   */
  private async createDocumentFromPaper(paper: LiteraturfinderPaper): Promise<ImportedDocument> {
    // Erstelle Dokument-Inhalt
    let content = ''

    // Titel
    content += `# ${paper.title}\n\n`

    // Metadaten Block
    content += `## Bibliographische Informationen\n\n`
    content += `**Autor(en):** ${paper.authors}\n`
    content += `**Jahr:** ${paper.year}\n`

    if (paper.journal) {
      content += `**Journal:** ${paper.journal}\n`
    }

    content += `**Verlag:** ${paper.publisher}\n`

    if (paper.doi) {
      content += `**DOI:** ${paper.doi}\n`
    }

    content += `\n`

    // Abstract
    if (paper.abstract) {
      content += `## Abstract\n\n${paper.abstract}\n\n`
    }

    // Zugangs-Links
    content += `## Zugang\n\n`
    content += `- **Original:** ${paper.url}\n`

    if (paper.openAccessUrl) {
      content += `- **Open Access:** ${paper.openAccessUrl}\n`
    }

    if (paper.institutionalUrl) {
      content += `- **Institutionell:** ${paper.institutionalUrl}\n`
    }

    // Word Count
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length

    return {
      id: `litfinder_${paper.id}_${Date.now()}`,
      name: this.sanitizeFilename(paper.title),
      content,
      wordCount,
      metadata: {
        source: 'Literaturfinder',
        doi: paper.doi,
        authors: paper.authors,
        year: paper.year,
        journal: paper.journal,
        publisher: paper.publisher,
        importedAt: new Date().toISOString(),
        accessUrls: {
          original: paper.url,
          openAccess: paper.openAccessUrl,
          institutional: paper.institutionalUrl
        }
      }
    }
  }

  /**
   * Versuche PDF herunterzuladen (Open Access)
   */
  async downloadOpenAccessPdf(paper: LiteraturfinderPaper): Promise<{
    success: boolean
    content?: string
    error?: string
  }> {
    if (!paper.openAccessUrl) {
      return { success: false, error: 'Keine Open Access URL verfügbar' }
    }

    try {
      // Versuche PDF zu laden
      const response = await fetch(paper.openAccessUrl)

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` }
      }

      const contentType = response.headers.get('content-type')

      if (contentType?.includes('pdf')) {
        // PDF gefunden - müsste mit DocumentProcessor verarbeitet werden
        return {
          success: true,
          content: `[PDF verfügbar: ${paper.openAccessUrl}]`
        }
      }

      // HTML-Seite (Landing Page)
      return {
        success: false,
        error: 'URL führt zu Landing Page, nicht direkt zum PDF'
      }
    } catch (error) {
      return {
        success: false,
        error: `Download fehlgeschlagen: ${error}`
      }
    }
  }

  /**
   * Prüfe ob Literaturfinder Export im localStorage vorhanden
   */
  checkLocalStorageImport(): LiteraturfinderExport | null {
    try {
      const data = localStorage.getItem('literaturfinder_export')
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.source === 'Literaturfinder') {
          return parsed
        }
      }
    } catch {
      // Ignore
    }
    return null
  }

  /**
   * Lösche Import aus localStorage
   */
  clearLocalStorageImport(): void {
    localStorage.removeItem('literaturfinder_export')
  }

  /**
   * Hilfsfunktion: Säubere Dateinamen
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200) // Max Länge
  }

  /**
   * Generiere BibTeX Eintrag
   */
  generateBibTeX(paper: LiteraturfinderPaper): string {
    const id = paper.doi?.replace(/[\/\.]/g, '_') || `paper_${Date.now()}`
    const firstAuthor = paper.authors.split(',')[0].split(' ').pop() || 'unknown'
    const key = `${firstAuthor}${paper.year}`

    return `@article{${key},
  title = {${paper.title.replace(/[{}]/g, '')}},
  author = {${paper.authors}},
  year = {${paper.year}},
  journal = {${paper.journal || ''}},
  publisher = {${paper.publisher}},
  doi = {${paper.doi || ''}},
  url = {${paper.url}}
}`
  }

  /**
   * Generiere APA Zitation
   */
  generateAPACitation(paper: LiteraturfinderPaper): string {
    const authors = this.formatAuthorsAPA(paper.authors)
    const year = paper.year || 'n.d.'
    const title = paper.title
    const journal = paper.journal ? `*${paper.journal}*` : ''
    const doi = paper.doi ? `https://doi.org/${paper.doi}` : ''

    if (journal) {
      return `${authors} (${year}). ${title}. ${journal}. ${doi}`
    }

    return `${authors} (${year}). ${title}. ${paper.publisher}. ${doi}`
  }

  private formatAuthorsAPA(authors: string): string {
    const authorList = authors.split(',').map(a => a.trim())

    if (authorList.length === 1) {
      return this.formatSingleAuthorAPA(authorList[0])
    }

    if (authorList.length === 2) {
      return `${this.formatSingleAuthorAPA(authorList[0])} & ${this.formatSingleAuthorAPA(authorList[1])}`
    }

    if (authorList.length > 2) {
      return `${this.formatSingleAuthorAPA(authorList[0])} et al.`
    }

    return authors
  }

  private formatSingleAuthorAPA(author: string): string {
    const parts = author.trim().split(' ')
    if (parts.length >= 2) {
      const lastName = parts[parts.length - 1]
      const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ')
      return `${lastName}, ${initials}`
    }
    return author
  }
}

// Singleton Export
export const literaturfinderImportService = new LiteraturfinderImportService()
