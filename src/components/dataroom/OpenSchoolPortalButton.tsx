"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import { useState } from "react";

export default function OpenSchoolPortalButton({ profileId }: { profileId: string }) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    if (loading) return;
    const portalWindow = window.open("about:blank", "_blank");
    if (!portalWindow) {
      window.alert("Allow pop-ups for iweOS to open the school portal in a new tab.");
      return;
    }
    portalWindow.opener = null;
    setLoading(true);
    try {
      const response = await fetch("/api/auth/switch-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const payload = (await response.json()) as { destination?: string; error?: string };
      if (!response.ok || !payload.destination) throw new Error(payload.error || "Unable to open this school.");
      portalWindow.location.replace(payload.destination);
      setLoading(false);
    } catch (error) {
      portalWindow.close();
      setLoading(false);
      window.alert(error instanceof Error ? error.message : "Unable to open this school.");
    }
  }

  return (
    <button className="platform-open-portal" type="button" onClick={openPortal} disabled={loading}>
      {loading ? <LoaderCircle className="is-spinning" /> : <LogIn />}
      {loading ? "Opening..." : "Open admin portal"}
    </button>
  );
}
