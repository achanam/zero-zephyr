"use client";

import styles from "@/styles/send/send.module.css";

export type Stage = { id: string; label: string };

type ProgressPanelProps = {
  stages: Stage[];
  activeId: string | null;
  doneIds: string[];
  pct: number | null; // null = indeterminate
};

export function ProgressPanel({ stages, activeId, doneIds, pct }: ProgressPanelProps) {
  return (
    <div className={styles["progress-wrap"]}>
      {stages.map((s) => (
        <div
          key={s.id}
          className={`${styles["progress-stage"]} ${doneIds.includes(s.id) ? styles.done : ""} ${
            activeId === s.id ? styles.active : ""
          }`}
        >
          <span className={styles.dot} />
          <span>{s.label}</span>
        </div>
      ))}
      <div className={styles["progress-bar-track"]}>
        <div
          className={`${styles["progress-bar-fill"]} ${pct === null ? styles.indeterminate : ""}`}
          style={pct !== null ? { width: `${pct}%` } : undefined}
        />
      </div>
      <div className={styles["progress-pct"]}>{pct !== null ? `${pct}%` : ""}</div>
    </div>
  );
}
