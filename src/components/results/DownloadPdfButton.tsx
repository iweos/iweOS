"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type DownloadPdfButtonProps = {
  fileName: string;
};

function sanitizeFileName(value: string) {
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

export default function DownloadPdfButton({ fileName }: DownloadPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleDownload() {
    setIsExporting(true);
    try {
      const pageNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-result-export-page='true']"));
      if (pageNodes.length === 0) {
        throw new Error("No result pages are available to export.");
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pdfWidth;
      const usableHeight = pdfHeight;

      let isFirstPage = true;

      for (const node of pageNodes) {
        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: Math.max(node.scrollWidth, 900),
        });

        const sliceHeightPx = Math.floor((canvas.width * usableHeight) / usableWidth);
        const chunks = chunkCanvas(canvas, sliceHeightPx);

        for (const chunk of chunks) {
          if (!isFirstPage) {
            pdf.addPage();
          }

          const imageData = chunk.toDataURL("image/png");
          const renderedHeight = (chunk.height * usableWidth) / chunk.width;
          pdf.addImage(imageData, "PNG", 0, 0, usableWidth, renderedHeight, undefined, "FAST");
          isFirstPage = false;
        }
      }

      pdf.save(`${sanitizeFileName(fileName)}.pdf`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={isExporting}>
      {isExporting ? "Preparing PDF..." : "Download PDF"}
    </button>
  );
}

