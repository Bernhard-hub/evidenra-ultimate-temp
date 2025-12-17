/**
 * Context Menu Setup für EVIDENRA Professional
 * Fügt Rechtsklick-Menü für Cut, Copy, Paste, Select All hinzu
 */

const { Menu, MenuItem } = require('electron');

/**
 * Initialisiert das Kontextmenü für das BrowserWindow
 * @param {BrowserWindow} window - Das Hauptfenster
 */
function setupContextMenu(window) {
  window.webContents.on('context-menu', (event, params) => {
    const { selectionText, isEditable, editFlags } = params;

    // Nur für editierbare Felder (Input, Textarea etc.)
    if (isEditable) {
      const template = [];

      // Ausschneiden
      if (editFlags.canCut) {
        template.push({
          label: 'Ausschneiden',
          accelerator: 'Ctrl+X',
          role: 'cut'
        });
      }

      // Kopieren
      if (editFlags.canCopy || selectionText) {
        template.push({
          label: 'Kopieren',
          accelerator: 'Ctrl+C',
          role: 'copy'
        });
      }

      // Einfügen
      if (editFlags.canPaste) {
        template.push({
          label: 'Einfügen',
          accelerator: 'Ctrl+V',
          role: 'paste'
        });
      }

      // Separator
      if (template.length > 0) {
        template.push({ type: 'separator' });
      }

      // Alles markieren
      if (editFlags.canSelectAll) {
        template.push({
          label: 'Alles markieren',
          accelerator: 'Ctrl+A',
          role: 'selectAll'
        });
      }

      // Menü anzeigen wenn es Einträge gibt
      if (template.length > 0) {
        const menu = Menu.buildFromTemplate(template);
        menu.popup({ window });
      }
    }
    // Für nicht-editierbare Bereiche (Text-Auswahl)
    else if (selectionText) {
      const template = [
        {
          label: 'Kopieren',
          accelerator: 'Ctrl+C',
          role: 'copy'
        }
      ];

      const menu = Menu.buildFromTemplate(template);
      menu.popup({ window });
    }
  });

  console.log('✅ Kontextmenü aktiviert');
}

module.exports = { setupContextMenu };
