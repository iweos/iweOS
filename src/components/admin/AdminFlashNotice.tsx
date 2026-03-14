"use client";

import { useEffect, useState } from "react";

type AdminFlashNoticeProps = {
  status: "success" | "error";
  message: string;
};

export default function AdminFlashNotice({ status, message }: AdminFlashNoticeProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!visible || !message) {
    return null;
  }

  return (
    <div
      className={`alert ${status === "success" ? "alert-success" : "alert-danger"} shadow-lg border-0`}
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1600,
        minWidth: "min(32rem, calc(100vw - 2rem))",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>{message}</div>
        <button
          type="button"
          className="btn-close"
          aria-label="Close notification"
          onClick={() => setVisible(false)}
        />
      </div>
    </div>
  );
}
