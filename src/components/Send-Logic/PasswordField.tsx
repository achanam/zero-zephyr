"use client";

import { useState } from "react";
import {
  generatePassword,
  estimatePasswordStrength,
  type PwGenOptions,
  type PwCharClass,
} from "./password-generator";
import { RefreshIcon, CopyIcon, CheckIcon, ShieldIcon } from "./icons";
import styles from "@/styles/send/send.module.css";

const CHAR_TOGGLES: { key: PwCharClass; label: string }[] = [
  { key: "upper", label: "A-Z Uppercase" },
  { key: "lower", label: "a-z Lowercase" },
  { key: "numbers", label: "0-9 Numbers" },
  { key: "symbols", label: "!@# Symbols" },
];

type PasswordFieldProps = {
  pwMode: "manual" | "generate";
  onPwModeChange: (mode: "manual" | "generate") => void;
  manualPassword: string;
  onManualPasswordChange: (v: string) => void;
  generatedPassword: string;
  onGeneratedPasswordChange: (v: string) => void;
  pwGenOptions: PwGenOptions;
  onPwGenOptionsChange: (opts: PwGenOptions) => void;
  locked: boolean;
};

export function PasswordField({
  pwMode,
  onPwModeChange,
  manualPassword,
  onManualPasswordChange,
  generatedPassword,
  onGeneratedPasswordChange,
  pwGenOptions,
  onPwGenOptionsChange,
  locked,
}: PasswordFieldProps) {
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function regenerate(opts: PwGenOptions) {
    try {
      onGeneratedPasswordChange(generatePassword(opts));
      setGenError(null);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Could not generate a password.");
    }
  }

  function updateOptions(patch: Partial<PwGenOptions>) {
    const next = { ...pwGenOptions, ...patch };
    onPwGenOptionsChange(next);
    regenerate(next);
  }

  function toggleClass(key: PwCharClass) {
    const enabledCount = CHAR_TOGGLES.filter((c) => pwGenOptions[c.key]).length;
    if (pwGenOptions[key] && enabledCount === 1) return; // can't disable the only active class
    updateOptions({ [key]: !pwGenOptions[key] } as Partial<PwGenOptions>);
  }

  const strength = estimatePasswordStrength(pwGenOptions);
  const activeCount = CHAR_TOGGLES.filter((c) => pwGenOptions[c.key]).length;

  return (
    <div className={styles.field}>
      <label>
        <ShieldIcon /> Encryption Password <span className={styles["req-asterisk"]}>*</span>
      </label>
      <div className={styles["pw-mode-tabs"]}>
        <button
          type="button"
          disabled={locked}
          className={`${styles["pw-mode-tab"]} ${pwMode === "manual" ? styles.active : ""}`}
          onClick={() => onPwModeChange("manual")}
        >
          Manual
        </button>
        <button
          type="button"
          disabled={locked}
          className={`${styles["pw-mode-tab"]} ${pwMode === "generate" ? styles.active : ""}`}
          onClick={() => {
            if (!generatedPassword) regenerate(pwGenOptions);
            onPwModeChange("generate");
          }}
        >
          Generate
        </button>
        <span className={styles["pw-recommended-badge"]}>Recommended</span>
      </div>

      {pwMode === "manual" ? (
        <>
          <input
            type="password"
            placeholder="Required — never sent to the server"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={manualPassword}
            onChange={(e) => onManualPasswordChange(e.target.value)}
          />
          <div className={styles.hint}>
            → Encrypted in this browser before it ever leaves your device. Share the link and password through separate channels.
          </div>
        </>
      ) : (
        <>
          <div className={styles["pw-generated-box"]}>
            <input type="text" readOnly value={generatedPassword} />
            <button
              type="button"
              className={styles["pw-icon-btn"]}
              disabled={locked}
              title="Generate a new password"
              onClick={() => regenerate(pwGenOptions)}
            >
              <RefreshIcon />
            </button>
            <button
              type="button"
              className={styles["pw-icon-btn"]}
              title="Copy"
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>

          <div className={styles["pw-gen-options"]}>
            <div className={styles["pw-length-row"]}>
              <span>Length</span>
              <span className={styles["pw-length-value"]}>{pwGenOptions.length}</span>
            </div>
            <input
              type="range"
              className={styles["pw-slider"]}
              min={5}
              max={99}
              disabled={locked}
              value={pwGenOptions.length}
              style={{
                background: `linear-gradient(to right, var(--brass) 0%, var(--brass) ${
                  ((pwGenOptions.length - 5) / (99 - 5)) * 100
                }%, var(--line) ${((pwGenOptions.length - 5) / (99 - 5)) * 100}%, var(--line) 100%)`,
              }}
              onChange={(e) => updateOptions({ length: Number(e.target.value) })}
            />
            <div className={styles["pw-char-grid"]}>
              {CHAR_TOGGLES.map((c) => (
                <div className={styles["pw-char-row"]} key={c.key}>
                  <span className={styles["pw-char-label"]}>{c.label}</span>
                  <div
                    role="switch"
                    aria-checked={pwGenOptions[c.key]}
                    className={`${styles.switch} ${pwGenOptions[c.key] ? styles.on : ""}`}
                    style={locked ? { pointerEvents: "none", opacity: 0.45 } : undefined}
                    onClick={() => toggleClass(c.key)}
                  />
                </div>
              ))}
            </div>
            <div className={`${styles["pw-strength-note"]} ${styles[strength.level]}`}>
              <ShieldIcon /> {strength.label} — {pwGenOptions.length} characters, {activeCount} character{" "}
              {activeCount === 1 ? "type" : "types"}
            </div>
          </div>
          {genError && <div className={styles["error-box"]} style={{ marginTop: 10 }}>{genError}</div>}
          <div className={styles.hint} style={{ marginTop: 10 }}>
            → Generated locally with a cryptographically secure random generator. Never sent to the server. Save it now — it will not be shown again after you leave this page.
          </div>
        </>
      )}
    </div>
  );
}
