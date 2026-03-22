"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function sanitizePdfFileName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "result";
}

function chunkCanvas(sourceCanvas: HTMLCanvasElement, sliceHeight: number) {
  const chunks: HTMLCanvasElement[] = [];
  let offset = 0;

  while (offset < sourceCanvas.height) {
    const chunk = document.createElement("canvas");
    const height = Math.min(sliceHeight, sourceCanvas.height - offset);
    chunk.width = sourceCanvas.width;
    chunk.height = height;
    const context = chunk.getContext("2d");
    if (!context) {
      throw new Error("Unable to prepare PDF export canvas.");
    }
    context.drawImage(sourceCanvas, 0, offset, sourceCanvas.width, height, 0, 0, sourceCanvas.width, height);
    chunks.push(chunk);
    offset += sliceHeight;
  }

  return chunks;
}

export async function buildResultPdfBlob(fileName: string) {
  const pageNodes = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".result-report-card[data-result-export-page='true'], .result-sheet-admin[data-result-export-page='true'], .result-sheet-public[data-result-export-page='true']",
    ),
  );
  if (pageNodes.length === 0) {
    throw new Error("No result pages are available to export.");
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  let isFirstPage = true;

  for (const node of pageNodes) {
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: node.scrollWidth,
      windowWidth: node.scrollWidth,
    });

    const sliceHeightPx = Math.floor((canvas.width * pdfHeight) / pdfWidth);
    const chunks = chunkCanvas(canvas, sliceHeightPx);

    for (const chunk of chunks) {
      if (!isFirstPage) {
        pdf.addPage();
      }

      const imageData = chunk.toDataURL("image/png");
      const renderedHeight = (chunk.height * pdfWidth) / chunk.width;
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, renderedHeight, undefined, "FAST");
      isFirstPage = false;
    }
  }

  const safeName = `${sanitizePdfFileName(fileName)}.pdf`;
  const blob = pdf.output("blob");
  return {
    blob,
    fileName: safeName,
  };
}

export function triggerPdfDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
