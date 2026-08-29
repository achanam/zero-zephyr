import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/styles/not-found/not-found.module.css";

export const metadata: Metadata = {
  title: "404 — Zero Zephyr",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className={`zz-404-scope ${styles.page}`}>
      <div className={styles.wrap}>
        <h2 className={styles.heading}>
          <span>404</span> Not Found
        </h2>
        <p className={styles.sub}>
          It may have expired, been deleted, or never existed. Like everything here, once it&apos;s gone, it&apos;s
          gone for good.
        </p>
        <Link href="/" className={styles["cta-primary"]}>
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
