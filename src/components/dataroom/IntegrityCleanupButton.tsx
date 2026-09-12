"use client";

import { Trash2 } from "lucide-react";

export default function IntegrityCleanupButton() {
  return (
    <button
      className="platform-danger-button"
      type="submit"
      onClick={(event) => {
        if (!window.confirm("Remove this empty generated workspace? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 /> Remove empty workspace
    </button>
  );
}
