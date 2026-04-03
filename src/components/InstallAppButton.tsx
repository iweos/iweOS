"use client";

import { Download, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallAppButtonProps = {
  className?: string;
  iosHintClassName?: string;
};

export default function InstallAppButton({ className, iosHintClassName }: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  const isIosInstallHintEligible = useMemo(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    return isIos && !isStandalone;
  }, []);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!installPrompt && !isIosInstallHintEligible) {
    return null;
  }

  async function handleClick() {
    if (installPrompt) {
      setIsInstalling(true);
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
      } finally {
        setInstallPrompt(null);
        setIsInstalling(false);
      }
      return;
    }

    setShowIosHint((current) => !current);
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <button type="button" onClick={handleClick} className={className} disabled={isInstalling}>
        {installPrompt ? <Download className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        <span>{installPrompt ? (isInstalling ? "Preparing install..." : "Install iweOS") : "Add to Home Screen"}</span>
      </button>
      {showIosHint ? (
        <p className={iosHintClassName}>
          On iPhone, tap <strong>Share</strong> and choose <strong>Add to Home Screen</strong>.
        </p>
      ) : null}
    </div>
  );
}
