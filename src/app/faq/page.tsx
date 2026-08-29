import type { Metadata } from "next";
import { FaqPage } from "@/components/Faq-Logic/FaqPage";
import styles from "@/styles/faq/faq.module.css";

export const metadata: Metadata = {
  title: "Zero Zephyr / Security FAQ",
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
