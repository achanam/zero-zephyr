import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";
import "@/styles/globals.css";

const ogImage = "https://cdn.achanam.com/@zero-zephyr/icons/og-img";

export const metadata: Metadata = {
  title: "Zero Zephyr",
  description: "End-to-end encrypted, zero-knowledge sharing.",
  openGraph: {
    title: "Zero Zephyr",
    description: "End-to-end encrypted, zero-knowledge sharing.",
    images: [{ url: ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero Zephyr",
    description: "End-to-end encrypted, zero-knowledge sharing.",
    images: [ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: "#f5f5f5" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=EB+Garamond:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: "#f5f5f5" }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
