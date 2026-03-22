"use client";

import { useState } from "react";
import { buildResultPdfBlob, triggerPdfDownload } from "@/lib/client/result-pdf";

type DownloadPdfButtonProps = {
  fileName: string;
};

export default function DownloadPdfButton({ fileName }: DownloadPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleDownload() {
    setIsExporting(true);
    try {
      const { blob, fileName: resolvedFileName } = await buildResultPdfBlob(fileName);
      triggerPdfDownload(blob, resolvedFileName);
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
