import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import ClerkDiagnosticsClient from "@/components/ClerkDiagnosticsClient";
import GuideDock from "@/components/guide/GuideDock";
import GlobalPendingIndicator from "@/components/GlobalPendingIndicator";
import GlobalTableEnhancer from "@/components/GlobalTableEnhancer";
import PwaClient from "@/components/PwaClient";
import ThemeSync from "@/components/ThemeSync";
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

const hornbill = localFont({
  src: "../../public/fonts/Hornbill-Regular.otf",
  variable: "--font-site-hornbill",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://iweos.com"),
  title: {
    default: "ìwéOS",
    template: "%s | ìwéOS",
  },
  description: "School operating system for grading workflows and parent payments.",
  manifest: "/manifest.webmanifest",
  applicationName: "ìwéOS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ìwéOS",
  },
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
    icon: [{ url: "/icon", sizes: "512x512", type: "image/png" }],
    shortcut: [{ url: "/icon", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2f6b3f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="stylesheet" href="/kaiadmin/assets/css/fonts.min.css" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <link rel="icon" href="/icon" sizes="512x512" type="image/png" />
          <link rel="shortcut icon" href="/icon" type="image/png" />
          <link rel="apple-touch-icon" href="/apple-icon" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function () {
                  try {
                    var stored = window.localStorage.getItem('iweos-theme');
                    var theme = stored === 'dark' || stored === 'light'
                      ? stored
                      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    document.documentElement.dataset.theme = theme;
                    document.documentElement.style.colorScheme = theme;
                  } catch (error) {}
                })();
              `,
            }}
          />
        </head>
        <body className={`${display.variable} ${ui.variable} ${hornbill.variable} ui`}>
          <PwaClient />
          <ThemeSync />
          <ClerkDiagnosticsClient />
          <GuideDock />
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
