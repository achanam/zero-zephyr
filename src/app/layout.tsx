import type { Metadata, Viewport } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "optional",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-eb-garamond",
  display: "optional",
});

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
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable}`} style={{ background: "#f5f5f5" }}>
      <body style={{ background: "#f5f5f5" }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
