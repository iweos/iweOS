"use client";

import { useEffect, useState } from "react";
import { buildResultPdfBlob, triggerPdfDownload } from "@/lib/client/result-pdf";

type SharePdfButtonProps = {
  fileName: string;
};

function canUseNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export default function SharePdfButton({ fileName }: SharePdfButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(canUseNativeShare());
  }, []);

  if (!isSupported) {
    return null;
  }

  async function handleShare() {
    setIsSharing(true);
    try {
      const { blob, fileName: resolvedFileName } = await buildResultPdfBlob(fileName);
      const file = new File([blob], resolvedFileName, { type: "application/pdf" });

      const canShareFile =
        typeof navigator.canShare === "function" ? navigator.canShare({ files: [file] }) : false;

      if (!canShareFile) {
        triggerPdfDownload(blob, resolvedFileName);
        window.alert("Direct file sharing is not supported on this browser. The PDF has been downloaded instead.");
        return;
      }

      await navigator.share({
        title: resolvedFileName.replace(/\.pdf$/i, ""),
        text: "Student result report",
        files: [file],
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      window.alert(error instanceof Error ? error.message : "PDF share failed. Please try again.");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <button type="button" className="btn btn-outline-primary" onClick={handleShare} disabled={isSharing}>
      {isSharing ? "Preparing share..." : "Share PDF"}
    </button>
  );
}

