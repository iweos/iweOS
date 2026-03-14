import { Suspense } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import ClerkDiagnosticsClient from "@/components/ClerkDiagnosticsClient";
import GlobalPendingIndicator from "@/components/GlobalPendingIndicator";
import GlobalTableEnhancer from "@/components/GlobalTableEnhancer";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ui = Plus_Jakarta_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://iweos.com"),
  title: {
    default: "ìwéOS",
    template: "%s | ìwéOS",
  },
  description: "School operating system for grading workflows and parent payments.",
  openGraph: {
    title: "ìwéOS",
    description: "School operating system for grading workflows and parent payments.",
    type: "website",
    images: [
      {
        url: "/images/iweos-features-concept.svg",
        width: 1200,
        height: 630,
        alt: "ìwéOS",
      },
    ],
  },
  icons: {
    icon: [
      { media: "(prefers-color-scheme: light)", url: "/favicon-dove.svg" },
      { media: "(prefers-color-scheme: dark)", url: "/favicon-dove-white.svg" },
      { url: "/favicon-dove.svg" },
    ],
    shortcut: "/favicon-dove.svg",
    apple: "/favicon-dove.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="stylesheet" href="/kaiadmin/assets/css/fonts.min.css" />
          <link rel="icon" href="/favicon-dove.svg" type="image/svg+xml" media="(prefers-color-scheme: light)" />
          <link rel="icon" href="/favicon-dove-white.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
          <link rel="shortcut icon" href="/favicon-dove.svg" />
        </head>
        <body className={`${display.variable} ${ui.variable} ui`}>
          <ClerkDiagnosticsClient />
          <Suspense fallback={null}>
            <GlobalPendingIndicator />
          </Suspense>
          <GlobalTableEnhancer />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
