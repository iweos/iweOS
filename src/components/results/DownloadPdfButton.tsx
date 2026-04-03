"use client";

import { useState } from "react";
import { buildResultPdfBlob, buildResultPdfZip, triggerPdfDownload, type ResultPdfProgress } from "@/lib/client/result-pdf";

type DownloadPdfButtonProps = {
  fileName?: string;
  fileNames?: string[];
  bundleName?: string;
};

export default function DownloadPdfButton({ fileName, fileNames, bundleName }: DownloadPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ResultPdfProgress | null>(null);
  const isBulkDownload = Array.isArray(fileNames) && fileNames.length > 1 && bundleName;

  async function handleDownload() {
    setIsExporting(true);
    setProgress(isBulkDownload ? { stage: "capturing", current: 0, total: fileNames!.length } : { stage: "capturing", current: 0, total: 1 });
    try {
      const payload = isBulkDownload
        ? await buildResultPdfZip(bundleName!, fileNames!, setProgress)
        : await buildResultPdfBlob(fileName ?? fileNames?.[0] ?? "result", setProgress);
      const { blob, fileName: resolvedFileName } = payload;
      triggerPdfDownload(blob, resolvedFileName);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  }

  const progressTitle = (() => {
    if (!isExporting) {
      return isBulkDownload ? "Download student PDFs" : "Download PDF";
    }

    if (!progress) {
      return isBulkDownload ? "Preparing student files..." : "Preparing PDF...";
    }

    if (progress.stage === "zipping") {
      return "Packing student files...";
    }

    return isBulkDownload ? "Preparing student files..." : "Preparing PDF...";
  })();

  const progressMeta = (() => {
    if (!isExporting || !progress) {
      return null;
    }

    if (progress.stage === "zipping") {
      return `Bundling ${progress.total} student PDFs into one download`;
    }

    if (isBulkDownload) {
      if (progress.stage === "capturing" && progress.label) {
        return `${progress.current} of ${progress.total}: ${progress.label.replace(/_/g, " ")}`;
      }
      return `${progress.current} of ${progress.total} student files`;
    }

    return "Generating your PDF document";
  })();

  return (
    <button
      type="button"
      className="btn btn-primary d-inline-flex align-items-center gap-2"
      onClick={handleDownload}
      disabled={isExporting}
      aria-busy={isExporting}
    >
      {isExporting ? (
        <>
          <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white/15 p-1" aria-hidden="true">
            <i className="fas fa-dove fa-beat-fade" />
          </span>
          <span className="d-flex flex-column align-items-start lh-sm text-start">
            <span>{progressTitle}</span>
            {progressMeta ? <small className="opacity-75">{progressMeta}</small> : null}
          </span>
        </>
      ) : (
        progressTitle
      )}
    </button>
  );
}
