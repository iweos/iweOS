import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ìwéOS",
    short_name: "ìwéOS",
    description: "School operating system for grading workflows and parent payments.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8faf7",
    theme_color: "#2f6b3f",
    categories: ["education", "productivity", "utilities"],
    lang: "en-NG",
    icons: [
      {
        src: "/icons/iweos-app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/iweos-app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
