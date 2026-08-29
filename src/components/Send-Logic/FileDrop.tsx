"use client";

import { useRef, useState } from "react";
import { FileIcon, UploadIcon } from "./icons";
import styles from "@/styles/send/send.module.css";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileDropProps = {
  file: File | null;
  onFile: (file: File | null) => void;
};

export function FileDrop({ file, onFile }: FileDropProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`${styles.filedrop} ${file ? styles["has-file"] : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) onFile(dropped);
      }}
      style={dragOver ? { borderColor: "rgba(201,163,93,0.6)" } : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <>
          <div className={styles["filedrop-icon"]}>
            <FileIcon />
          </div>
          <div className={styles["filedrop-name"]}>{file.name}</div>
          <div className={styles["filedrop-size"]}>{formatBytes(file.size)}</div>
        </>
      ) : (
        <>
          <div className={styles["filedrop-icon"]}>
            <UploadIcon />
          </div>
          <div className={styles["filedrop-text"]}>Click or drag a file here</div>
        </>
      )}
    </div>
  );
}
