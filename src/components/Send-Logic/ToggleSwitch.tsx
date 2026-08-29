"use client";

import styles from "@/styles/send/send.module.css";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      className={`${styles.switch} ${checked ? styles.on : ""}`}
      style={disabled ? { opacity: 0.45, pointerEvents: "none" } : undefined}
      onClick={() => onChange(!checked)}
    />
  );
}
