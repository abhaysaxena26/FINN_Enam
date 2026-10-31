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
      <body className="bg-finn-bg text-finn-text font-sans antialiased min-h-dvh flex flex-col items-center">
        {/* Responsive shell: 100% on mobile, max-w-3xl on tablet/desktop */}
        <div className="w-full max-w-md md:max-w-3xl min-h-dvh relative bg-finn-bg shadow-2xl shadow-black/80 md:border-x border-finn-border flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
