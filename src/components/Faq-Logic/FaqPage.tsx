"use client";

import { useEffect, useState } from "react";
import { i18n, STORAGE_KEY, DEFAULT_LANG, type Lang } from "./i18n";
import { FaqAccordionItem } from "./FaqAccordionItem";
import { LockIcon, ShieldIcon, AlertTriangleIcon } from "@/components/Send-Logic/icons";
import styles from "@/styles/faq/faq.module.css";

function getInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "id") return saved;
  } catch {
    // localStorage unavailable — fall through to browser-language guess.
  }
  return (navigator.language || "").toLowerCase().startsWith("id") ? "id" : DEFAULT_LANG;
}

export function FaqPage() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    setLang(getInitialLang());
  }, []);

  function selectLang(next: Lang) {
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not fatal — language switching still works for this page view.
    }
  }

  const t = i18n[lang];

  return (
    <>
      <div className={styles["lang-switch"]} role="group" aria-label="Language">
        <button
          type="button"
          className={`${styles["lang-btn"]} ${lang === "en" ? styles.active : ""}`}
          aria-pressed={lang === "en"}
          onClick={() => selectLang("en")}
        >
          EN
        </button>
        <button
          type="button"
          className={`${styles["lang-btn"]} ${lang === "id" ? styles.active : ""}`}
          aria-pressed={lang === "id"}
          onClick={() => selectLang("id")}
        >
          ID
        </button>
      </div>

      <div className={styles["seal-icon"]}>
        <LockIcon />
      </div>

      {/* Fixed, author-written strings only (i18n.ts) — never user input. */}
      <div className={styles.eyebrow} dangerouslySetInnerHTML={{ __html: t.eyebrow }} />
      <h1>{t.h1}</h1>
      <p className={styles.lede}>{t.lede}</p>

      <div className={styles.thesis}>
        <div className={styles["thesis-icon"]}>
          <ShieldIcon />
        </div>
        <div className={styles["thesis-text"]} dangerouslySetInnerHTML={{ __html: t.thesis }} />
      </div>

      <div className={styles["section-label"]}>{t.sectionHowTo}</div>
      <p className={styles["howto-lede"]}>{t.howtoLede}</p>

      {[
        { num: "01", title: t.howto1Title, text: t.howto1Text },
        { num: "02", title: t.howto2Title, text: t.howto2Text },
        { num: "03", title: t.howto3Title, text: t.howto3Text },
      ].map((h) => (
        <div className={styles["howto-card"]} key={h.num}>
          <div className={styles["howto-num"]}>{h.num}</div>
          <div className={styles["howto-body"]}>
            <div className={styles["howto-title"]}>{h.title}</div>
            <div className={styles["howto-text"]}>{h.text}</div>
          </div>
        </div>
      ))}

      <div className={styles["section-label"]}>{t.sectionWhat}</div>

      <FaqAccordionItem question={t.q1} answerHtml={t.a1} />
      <FaqAccordionItem question={t.q2} answerHtml={t.a2} />
      <FaqAccordionItem question={t.q3} answerHtml={t.a3} />
      <FaqAccordionItem question={t.q4} answerHtml={t.a4} />
      <FaqAccordionItem question={t.q5} answerHtml={t.a5} />

      <div className={styles["section-label"]}>{t.sectionLimits}</div>

      <div className={styles["limits-callout"]}>
        <div className={styles["limits-callout-label"]}>
          <AlertTriangleIcon /> <span>{t.limitsLabel}</span>
        </div>
        <ul className={styles["limits-list"]}>
          {[t.limit1, t.limit2, t.limit3, t.limit4].map((limit, i) => (
            <li key={i}>
              <span className={styles.dash}>•</span>
              {/* Fixed, author-written strings only (i18n.ts) — never user input. */}
              <span dangerouslySetInnerHTML={{ __html: limit }} />
            </li>
          ))}
        </ul>
      </div>

      <p className={styles["footer-note"]} dangerouslySetInnerHTML={{ __html: t.footer }} />

      <div className={styles.closing}>
        <p className={styles["closing-sign"]}>{t.closingSign}</p>
        <p className={styles["closing-name"]}>{t.closingName}</p>
        <p className={styles["closing-date"]}>{t.closingDate}</p>
      </div>
    </>
  );
}
