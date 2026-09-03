import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircleIcon, ShieldIcon, SendIcon } from "@/components/Send-Logic/icons";
import styles from "@/styles/home/home.module.css";

export const metadata: Metadata = {
  title: "Zero Zephyr",
  alternates: { canonical: "https://z.achanam.com/" },
  openGraph: {
    title: "Zero Zephyr",
    description: "End-to-end encrypted, zero-knowledge sharing.",
    url: "https://z.achanam.com/",
    images: [{ url: "https://cdn.achanam.com/@zero-zephyr/icons/og-img" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero Zephyr",
    images: ["https://cdn.achanam.com/@zero-zephyr/icons/og-img"],
  },
};

export default function HomePage() {
  return (
    <div className={`zz-home-scope ${styles.page}`}>
      <div className={styles.wrap}>
        <p className={styles.tagline}>Nothing Kept. Nothing to Lose.</p>

        <div className={styles["hero-atmosphere"]} aria-hidden="true">
          <div className={`${styles.orb} ${styles["orb-mint"]}`} />
          <div className={`${styles.orb} ${styles["orb-peach"]}`} />
          <div className={`${styles.orb} ${styles["orb-lavender"]}`} />
        </div>

        <div className={styles.hero}>
          <div className={styles["zk-badge"]}>
            <ShieldIcon /> Zero-Knowledge Architecture
          </div>

          <h2 className={styles["hero-title"]}>
            Say it once.
            <br />
            Then it&apos;s <span>gone</span>.
          </h2>
          <p className={styles["hero-sub"]}>
            Zero Zephyr is built on zero-knowledge encryption: your message is sealed inside your own browser before
            it ever reaches us. We don&apos;t hold the key, so we physically cannot read what you send, not now, not
            ever.
          </p>

          <Link href="/send" className={styles["cta-primary"]}>
            <SendIcon /> Get Started
          </Link>
          <p className={styles["cta-note"]}>No account needed. Takes about 20 seconds.</p>
        </div>

        <div className={styles["section-label"]}>How it works</div>

        <div className={styles["step-card"]}>
          <div className={styles["step-num"]}>01</div>
          <div>
            <div className={styles["step-title"]}>Write your message or attach a file</div>
            <div className={styles["step-text"]}>
              It&apos;s sealed with zero-knowledge encryption on your device before anything is sent anywhere. We
              never see it in its original form, not even for a moment.
            </div>
          </div>
        </div>

        <div className={styles["step-card"]}>
          <div className={styles["step-num"]}>02</div>
          <div>
            <div className={styles["step-title"]}>Set how long it lives</div>
            <div className={styles["step-text"]}>
              Choose how many times the link can be opened and when it expires. Once that&apos;s reached, it&apos;s
              deleted for good.
            </div>
          </div>
        </div>

        <div className={styles["step-card"]}>
          <div className={styles["step-num"]}>03</div>
          <div>
            <div className={styles["step-title"]}>Share the link and the password separately</div>
            <div className={styles["step-text"]}>
              Send the link one way and the password another. The recipient opens it, reads it, and that&apos;s the
              only copy that ever existed.
            </div>
          </div>
        </div>

        <div className={styles["principle-strip"]}>
          <div className={styles["principle-item"]}>
            <svg
              className={styles["principle-icon"]}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="7" width="10" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M5.3 7V5.3C5.3 4 6.4 3 7.7 3v0c1.3 0 2.4 1 2.4 2.3V7"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <div className={styles["principle-label"]}>
              Zero-knowledge
              <br />
              encryption
            </div>
          </div>
          <div className={styles["principle-item"]}>
            <svg
              className={styles["principle-icon"]}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className={styles["principle-label"]}>
              Expires on
              <br />
              its own
            </div>
          </div>
          <div className={styles["principle-item"]}>
            <ShieldIcon className={styles["principle-icon"]} />
            <div className={styles["principle-label"]}>
              Nothing kept
              <br />
              after
            </div>
          </div>
        </div>

        <div className={styles["cta-secondary-row"]}>
          <Link href="/faq" className={styles["cta-secondary"]}>
            <HelpCircleIcon /> How is this actually safe? Read the FAQ
          </Link>
        </div>

        <p className={styles["credit-line"]}>
          Developed by Anam
          <br />© 2026 Ach Anam. All rights reserved.
        </p>
        <footer className={styles.footer}>SEALED IN TRANSIT / ZERO ZEPHYR</footer>
      </div>
    </div>
  );
}
