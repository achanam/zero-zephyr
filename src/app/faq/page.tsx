import type { Metadata } from "next";
import { FaqPage } from "@/components/Faq-Logic/FaqPage";
import styles from "@/styles/faq/faq.module.css";

export const metadata: Metadata = {
  title: "Zero Zephyr / Security FAQ",
  openGraph: {
    title: "Zero Zephyr / Security FAQ",
    description: "End-to-end encrypted, zero-knowledge sharing.",
    images: [{ url: "https://cdn.achanam.com/@zero-zephyr/icons/og-img" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero Zephyr / Security FAQ",
    images: ["https://cdn.achanam.com/@zero-zephyr/icons/og-img"],
  },
};

export default function Faq() {
  return (
    <div className={`zz-faq-scope ${styles.page}`}>
      <div className={styles.wrap}>
        <FaqPage />
      </div>
    </div>
  );
}
