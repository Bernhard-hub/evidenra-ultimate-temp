import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportChartAsPNG(
  elementId: string,
  filename: string = 'chart.png'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#1f2937',
      scale: 2,
      logging: false,
      useCORS: true
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
  }
}

export async function exportChartAsSVG(
  elementId: string,
  filename: string = 'chart.svg'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const svg = element.querySelector('svg');
    if (!svg) {
      console.error('No SVG element found');
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const link = document.createElement('a');
    link.href = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    link.download = filename;
    link.click();
  } catch (error) {
    console.error('Error exporting chart as SVG:', error);
  }
}

export async function exportChartAsPDF(
  elementId: string,
  filename: string = 'chart.pdf',
  options: { width?: number; height?: number } = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#1f2937',
      scale: 2,
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: options.width && options.width > (options.height || 0) ? 'landscape' : 'portrait',
      unit: 'in',
      format: 'letter'
    });

    const imgWidth = options.width || 7.5;
    const imgHeight = options.height || 5;

    pdf.addImage(imgData, 'PNG', 0.5, 0.5, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting chart as PDF:', error);
  }
}

export async function exportAllChartsAsReport(
  elementIds: string[],
  filename: string = 'report.pdf'
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });

    for (let i = 0; i < elementIds.length; i++) {
      const element = document.getElementById(elementIds[i]);
      if (!element) continue;

      const canvas = await html2canvas(element, {
        backgroundColor: '#1f2937',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0.5, 0.5, 7.5, 5);
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting charts as report:', error);
  }
}
