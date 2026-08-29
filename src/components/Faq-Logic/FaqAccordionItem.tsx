"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/Send-Logic/icons";
import styles from "@/styles/faq/faq.module.css";

type FaqAccordionItemProps = {
  question: string;
  answerHtml: string;
};

export function FaqAccordionItem({ question, answerHtml }: FaqAccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${styles["faq-item"]} ${open ? styles.open : ""}`}>
      <button
        type="button"
        className={styles["faq-question"]}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{question}</span>
        <span className={styles["faq-chevron"]}>
          <ChevronDownIcon />
        </span>
      </button>
      <div className={styles["faq-answer-wrap"]}>
        <div className={styles["faq-answer-inner"]}>
          {/* Fixed, author-written strings only (src/components/Faq-Logic/i18n.ts) — never user input. */}
          <div className={styles["faq-answer"]} dangerouslySetInnerHTML={{ __html: answerHtml }} />
        </div>
      </div>
    </div>
  );
}
