import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FINN — Financial Investment Agent",
  description: "Push intelligence & pull research for Indian equity investors",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FINN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B0D10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#050608] text-finn-text font-sans antialiased min-h-dvh m-0 p-0">
        {/* Constrain app: 100% on mobile, max 430px on desktop */}
        <div
          style={{ width: "100%", maxWidth: "430px" }}
          className="mx-auto min-h-dvh relative bg-finn-bg border-x border-[#23272F] flex flex-col"
        >
          {/* Header: just "FINN" wordmark on the left, small "Updated Fri 30 Oct, close" on the right */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-[#23272F] bg-finn-bg/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
            <span className="text-base font-bold tracking-tight text-white">FINN</span>
            <span className="text-[11px] text-finn-muted tabular-nums">Updated Fri 30 Oct, close</span>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
