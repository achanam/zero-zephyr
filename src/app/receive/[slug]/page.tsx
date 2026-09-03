import type { Metadata } from "next";
import { ReceiveView } from "@/components/Receive-Logic/ReceiveView";
import styles from "@/styles/send/send.module.css";

// Dynamic: decryption depends on a password entered per-visit, and the
// server-side view/burn accounting must run fresh on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zero Zephyr / Receive",
  openGraph: {
    title: "Zero Zephyr / Receive",
    description: "End-to-end encrypted, zero-knowledge sharing.",
    images: [{ url: "https://cdn.achanam.com/@zero-zephyr/icons/og-img" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero Zephyr / Receive",
    images: ["https://cdn.achanam.com/@zero-zephyr/icons/og-img"],
  },
};

export default async function ReceivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className={`zz-send-scope ${styles.page}`}>
      <div className={styles.wrap}>
        <p className={styles.tagline}>Nothing Kept. Nothing to Lose.</p>

        <ReceiveView slug={slug} />

        <p className={styles["credit-line"]}>
          Developed by Anam
          <br />© 2026 Ach Anam. All rights reserved.
        </p>
        <footer className={styles.footer}>SEALED IN TRANSIT / ZERO ZEPHYR</footer>
      </div>
    </div>
  );
}
