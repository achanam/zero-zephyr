"use client";

import { useEffect, useRef, useState } from "react";
import { KeyIcon, LockIcon } from "@/components/Send-Logic/icons";
import styles from "@/styles/send/send.module.css";

type PasswordPromptProps = {
  onSubmit: (password: string) => void;
  wrongAttempt: boolean;
};

export function PasswordPrompt({ onSubmit, wrongAttempt }: PasswordPromptProps) {
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <p className={styles["status-note"]} style={{ marginBottom: 14 }}>
        This message is encrypted end-to-end.
      </p>
      <div className={styles.field}>
        <label>
          <KeyIcon /> Password
        </label>
        <input
          ref={inputRef}
          type="password"
          placeholder="Enter password"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit(password);
          }}
        />
      </div>
      <button type="button" className={styles["btn-primary"]} onClick={() => onSubmit(password)}>
        <LockIcon /> Unlock
      </button>
      {wrongAttempt && (
        <div className={styles["error-box"]} style={{ marginTop: 12 }}>
          Incorrect password — decryption failed.
        </div>
      )}
    </>
  );
}
