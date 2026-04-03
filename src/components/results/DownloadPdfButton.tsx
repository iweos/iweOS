"use client";

import { useState } from "react";
import { buildResultPdfBlob, buildResultPdfZip, triggerPdfDownload } from "@/lib/client/result-pdf";

type DownloadPdfButtonProps = {
  fileName?: string;
  fileNames?: string[];
  bundleName?: string;
};

export default function DownloadPdfButton({ fileName, fileNames, bundleName }: DownloadPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const isBulkDownload = Array.isArray(fileNames) && fileNames.length > 1 && bundleName;

  async function handleDownload() {
    setIsExporting(true);
    try {
      const payload = isBulkDownload
        ? await buildResultPdfZip(bundleName!, fileNames!)
        : await buildResultPdfBlob(fileName ?? fileNames?.[0] ?? "result");
      const { blob, fileName: resolvedFileName } = payload;
      triggerPdfDownload(blob, resolvedFileName);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleDownload} disabled={isExporting}>
      {isExporting ? (isBulkDownload ? "Preparing student files..." : "Preparing PDF...") : isBulkDownload ? "Download student PDFs" : "Download PDF"}
    </button>
  );
}
