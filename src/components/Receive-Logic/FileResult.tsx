"use client";

import { useState } from "react";
import { FileIcon, DownloadIcon, CheckIcon, FireIcon } from "@/components/Send-Logic/icons";
import { ProgressPanel, type Stage } from "@/components/Send-Logic/ProgressPanel";
import { decryptBytes } from "@/components/crypto";
import { xhrDownload } from "@/components/Send-Logic/xhr";
import styles from "@/styles/send/send.module.css";

type PreFetchedFile = { ivFile: string | null; saltFile: string | null; cipherBuf: ArrayBuffer } | null;

type FileResultProps = {
  title: string;
  fileName: string;
  fileMime: string;
  fileSize: number;
  burned: boolean;
  downloadUrl: string | undefined;
  password: string;
  preFetchedFile: PreFetchedFile;
};

export function FileResult({
  title,
  fileName,
  fileMime,
  fileSize,
  burned,
  downloadUrl,
  password,
  preFetchedFile,
}: FileResultProps) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stages: Stage[]; activeId: string | null; doneIds: string[]; pct: number | null } | null>(null);

  async function handleDownload() {
    setBusy(true);
    setError(null);

    try {
      let ivFile: string | null;
      let saltFile: string | null;
      let cipherBuf: ArrayBuffer;

      if (preFetchedFile) {
        // Burned — bytes already arrived with the /receive response.
        ivFile = preFetchedFile.ivFile;
        saltFile = preFetchedFile.saltFile;
        cipherBuf = preFetchedFile.cipherBuf;
        setProgress({ stages: [{ id: "dec", label: "Decrypting file…" }], activeId: "dec", doneIds: [], pct: null });
      } else {
        if (!downloadUrl) throw new Error("Missing download URL.");
        setProgress({
          stages: [
            { id: "dl", label: "Downloading encrypted file…" },
            { id: "dec", label: "Decrypting…" },
          ],
          activeId: "dl",
          doneIds: [],
          pct: 0,
        });
        const result = await xhrDownload(downloadUrl, (pct) => setProgress((p) => (p ? { ...p, pct } : p)));
        ivFile = result.ivFile;
        saltFile = result.saltFile;
        cipherBuf = result.buffer;
        setProgress((p) => (p ? { ...p, activeId: "dec", doneIds: ["dl"], pct: null } : p));
      }

      if (!ivFile || !saltFile) throw new Error("Missing decryption metadata.");
      const plainBuf = await decryptBytes(password, saltFile, ivFile, cipherBuf);

      setProgress((p) => (p ? { ...p, doneIds: [...p.doneIds, "dec"], pct: 100 } : p));

      const blob = new Blob([plainBuf], { type: fileMime || "application/octet-stream" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      setSaved(true);
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className={styles["status-note"]}>{title}</p>
      <div className={styles["file-card"]}>
        <div className={styles["file-card-icon"]}>
          <FileIcon />
        </div>
        <div>
          <div className={styles.fname}>{fileName}</div>
          <div className={styles.fsize}>{fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : ""}</div>
        </div>
      </div>
      <button type="button" className={styles["btn-primary"]} disabled={busy || saved} onClick={handleDownload}>
        {saved ? <CheckIcon /> : <DownloadIcon />} {saved ? "Saved" : "Download & Decrypt"}
      </button>
      {progress && <ProgressPanel {...progress} />}
      {error && (
        <div className={styles["error-box"]} style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
      {burned && (
        <div className={styles["burn-note"]}>
          <FireIcon /> This message has been destroyed — save it now, it cannot be reopened
        </div>
      )}
    </>
  );
}
