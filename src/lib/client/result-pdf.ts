"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";

export type ResultPdfProgress =
  | {
      stage: "capturing";
      current: number;
      total: number;
      label?: string;
    }
  | {
      stage: "zipping";
      current: number;
      total: number;
    }
  | {
      stage: "complete";
      current: number;
      total: number;
    };

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

function getResultExportNodes() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      ".result-report-card[data-result-export-page='true'], .result-sheet-admin[data-result-export-page='true'], .result-sheet-public[data-result-export-page='true']",
    ),
  );
}

async function buildPdfDocumentFromNode(node: HTMLElement) {
  return buildPdfDocumentFromNodeWithScale(node, 2);
}

async function buildPdfDocumentFromNodeWithScale(node: HTMLElement, scale: number) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const canvas = await html2canvas(node, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: node.scrollWidth,
    windowWidth: node.scrollWidth,
  });

  const sliceHeightPx = Math.floor((canvas.width * pdfHeight) / pdfWidth);
  const chunks = chunkCanvas(canvas, sliceHeightPx);

  let isFirstPage = true;
  for (const chunk of chunks) {
    if (!isFirstPage) {
      pdf.addPage();
    }

    const imageData = chunk.toDataURL("image/png");
    const renderedHeight = (chunk.height * pdfWidth) / chunk.width;
    pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, renderedHeight, undefined, "FAST");
    isFirstPage = false;
  }

  return pdf;
}

export async function buildResultPdfBlob(fileName: string, onProgress?: (progress: ResultPdfProgress) => void) {
  const pageNodes = getResultExportNodes();
  if (pageNodes.length === 0) {
    throw new Error("No result pages are available to export.");
  }

  onProgress?.({ stage: "capturing", current: 0, total: 1, label: fileName });
  const pdf = await buildPdfDocumentFromNode(pageNodes[0]);
  const safeName = `${sanitizePdfFileName(fileName)}.pdf`;
  const blob = pdf.output("blob");
  onProgress?.({ stage: "complete", current: 1, total: 1 });
  return {
    blob,
    fileName: safeName,
  };
}

export async function buildResultPdfZip(
  bundleName: string,
  fileNames: string[],
  onProgress?: (progress: ResultPdfProgress) => void,
) {
  const pageNodes = getResultExportNodes();
  if (pageNodes.length === 0) {
    throw new Error("No result pages are available to export.");
  }

  if (pageNodes.length !== fileNames.length) {
    throw new Error("The number of result pages does not match the number of student file names.");
  }

  const zip = new JSZip();

  for (let index = 0; index < pageNodes.length; index += 1) {
    onProgress?.({
      stage: "capturing",
      current: index + 1,
      total: pageNodes.length,
      label: fileNames[index],
    });
    const pdf = await buildPdfDocumentFromNodeWithScale(pageNodes[index], 1.45);
    const safeName = `${sanitizePdfFileName(fileNames[index])}.pdf`;
    const blob = pdf.output("blob");
    zip.file(safeName, blob);
  }

  onProgress?.({ stage: "zipping", current: pageNodes.length, total: pageNodes.length });
  const archiveBlob = await zip.generateAsync({ type: "blob" });
  onProgress?.({ stage: "complete", current: pageNodes.length, total: pageNodes.length });
  return {
    blob: archiveBlob,
    fileName: `${sanitizePdfFileName(bundleName)}.zip`,
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
