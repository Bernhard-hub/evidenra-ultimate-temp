/**
 * PDF Parse IPC Wrapper
 *
 * Wraps IPC communication with Main Process for PDF processing.
 * Replaces direct pdf-parse imports in renderer.
 */

// TypeScript declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      processPDF: (arrayBuffer: ArrayBuffer) => Promise<any>;
    };
  }
}

/**
 * Process PDF via IPC to Main Process
 * @param arrayBuffer - PDF file as ArrayBuffer
 * @returns PDF data (text, numpages, metadata, info)
 */
export async function pdfParse(arrayBuffer: ArrayBuffer): Promise<any> {
  // Send to Main Process via IPC
  const result = await window.electronAPI.processPDF(arrayBuffer);

  return result;
}

export default pdfParse;
