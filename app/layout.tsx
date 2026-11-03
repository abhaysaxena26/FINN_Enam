import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "FINN",
  description: "Push intelligence & pull research for Indian equity investors",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FINN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
