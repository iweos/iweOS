"use client";

import { useEffect } from "react";

export default function ResultsThemeBridge() {
  useEffect(() => {
    document.documentElement.classList.add("kai-admin");
    document.body.classList.add("kai-admin");

    return () => {
      document.documentElement.classList.remove("kai-admin");
      document.body.classList.remove("kai-admin");
    };
  }, []);

  return null;
}
