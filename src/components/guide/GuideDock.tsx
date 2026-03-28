"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GuideDock() {
  const pathname = usePathname();

  if (!pathname || pathname === "/guide" || pathname.includes("/print") || pathname.startsWith("/app")) {
    return null;
  }

  return (
    <div className="guide-dock">
      <Link href="/guide" className="guide-dock-link" aria-label="Open setup guide">
        <span className="guide-dock-icon" aria-hidden="true">
          <i className="fas fa-compass" />
        </span>
        <span className="guide-dock-copy">
          <strong>Guide</strong>
          <small>Setup help</small>
        </span>
      </Link>
    </div>
  );
}
