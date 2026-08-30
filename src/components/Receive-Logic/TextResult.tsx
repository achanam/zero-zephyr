"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, FireIcon } from "@/components/Send-Logic/icons";
import styles from "@/styles/send/send.module.css";

type TextResultProps = {
  title: string;
  content: string;
  burned: boolean;
};

export function TextResult({ title, content, burned }: TextResultProps) {
  const [copied, setCopied] = useState(false);

  return (
    <>
      <p className={styles["status-note"]}>{title}</p>
      <div className={styles["content-box"]}>{content}</div>
      <button
        type="button"
        className={styles["btn-ghost"]}
        style={{ marginTop: 14 }}
        onClick={() => {
          navigator.clipboard.writeText(content);
          setCopied(true);
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy Text"}
      </button>
      {burned && (
        <div className={styles["burn-note"]}>
          <FireIcon /> Destroyed after opening — this was your only chance to read it
        </div>
      )}
    </>
  );
}
