"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, CheckIcon } from "./icons";
import styles from "@/styles/send/send.module.css";

export type DropdownOption = { value: string; label: string };

type DropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function Dropdown({ options, value, onChange, disabled }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.dropdown} ${open ? styles.open : ""} ${disabled ? styles.disabled : ""}`}
    >
      <button
        type="button"
        className={styles["dropdown-trigger"]}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <span>{selected?.label}</span>
        <span className={styles["dropdown-chevron"]}>
          <ChevronDownIcon />
        </span>
      </button>
      <div className={styles["dropdown-menu"]}>
        {options.map((opt) => (
          <div
            key={opt.value}
            className={`${styles["dropdown-option"]} ${opt.value === value ? styles.selected : ""}`}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
          >
            {opt.label}
            <CheckIcon className={styles["opt-check"]} />
          </div>
        ))}
      </div>
    </div>
  );
}
