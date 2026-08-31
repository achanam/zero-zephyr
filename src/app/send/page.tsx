import type { Metadata } from "next";
import { SendForm } from "@/components/Send-Logic/SendForm";
import styles from "@/styles/send/send.module.css";

// Dynamic: encryption happens per-request in the browser, and a future
// CSP-nonce middleware will need a fresh nonce per response here.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zero Zephyr / Secure Send",
  openGraph: {
    title: "Zero Zephyr / Secure Send",
    description: "End-to-end encrypted, zero-knowledge sharing.",
    images: [{ url: "https://cdn.achanam.com/@zero-zephyr/icons/og-img" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero Zephyr / Secure Send",
    images: ["https://cdn.achanam.com/@zero-zephyr/icons/og-img"],
  },
};

export default function SendPage() {
  return (
    <div className={`zz-send-scope ${styles.page}`}>
      <div className={styles.wrap}>
        <p className={styles.tagline}>Nothing Kept. Nothing to Lose.</p>

        <SendForm />

        <p className={styles["credit-line"]}>
          Developed by Anam
          <br />© 2026 Ach Anam. All rights reserved.
        </p>
        <footer className={styles.footer}>SEALED IN TRANSIT / ZERO ZEPHYR</footer>
      </div>
    </div>
  );
}
