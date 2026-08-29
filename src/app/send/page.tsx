import type { Metadata } from "next";
import Link from "next/link";
import { SendForm } from "@/components/Send-Logic/SendForm";
import { BrandLockIcon, HelpCircleIcon } from "@/components/Send-Logic/icons";
import styles from "@/styles/send/send.module.css";

// Dynamic: encryption happens per-request in the browser, and a future
// CSP-nonce middleware will need a fresh nonce per response here.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zero Zephyr / Secure Send",
};

export default function SendPage() {
  return (
    <div className={`zz-send-scope ${styles.page}`}>
      <div className={styles.wrap}>
        <header className={styles.brand}>
          <div className={styles["brand-mark"]}>
            <BrandLockIcon className={styles["brand-icon"]} />
            <h1>
              ZERO <span>ZEPHYR</span>
            </h1>
          </div>
          <Link href="/faq" aria-label="Read the security FAQ" className={styles["faq-link"]}>
            <HelpCircleIcon /> FAQ
          </Link>
        </header>
        <p className={styles.tagline}>// nothing kept is nothing to lose</p>

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
