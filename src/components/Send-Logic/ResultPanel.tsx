"use client";

import { useState } from "react";
import { SealIcon, CopyIcon, CheckIcon, AlertTriangleIcon } from "./icons";
import styles from "@/styles/send/send.module.css";

type ResultPanelProps = {
  link: string;
  revealedPassword?: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={styles["btn-ghost"]}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ResultPanel({ link, revealedPassword }: ResultPanelProps) {
  return (
    <div className={styles.result}>
      <div className={styles["result-seal"]}>
        <SealIcon /> Sealed — ready to share
      </div>
      <div className={styles["link-box"]}>
        <input type="text" readOnly value={link} />
        <CopyButton text={link} />
      </div>
      <div className={styles.hint}>
        → Without the password, this data cannot be recovered by anyone — including us. Send it through a different channel than the link.
      </div>

      {revealedPassword && (
        <div className={styles["pw-reveal-box"]}>
          <div className={styles["pw-reveal-label"]}>
            <AlertTriangleIcon /> Generated password — shown only once
          </div>
          <div className={styles["pw-reveal-row"]}>
            <input type="text" readOnly value={revealedPassword} />
            <CopyButton text={revealedPassword} />
          </div>
          <div className={styles["pw-reveal-warning"]}>
            → This password will not be shown again after you leave this page. Save it now and send it to the recipient through a different channel than the link — anyone with both the link and this password can decrypt the contents.
          </div>
        </div>
      )}
    </div>
  );
}
