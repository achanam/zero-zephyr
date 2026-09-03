"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { BrandMarkIcon } from "@/components/Send-Logic/icons";
=======
import { useEffect, useRef, useState } from "react";
import { BrandMarkIcon, EyeIcon, FireIcon } from "@/components/Send-Logic/icons";
>>>>>>> origin/dev/logics
import { PasswordPrompt } from "./PasswordPrompt";
import { TextResult } from "./TextResult";
import { FileResult } from "./FileResult";
import { decryptJson } from "@/components/crypto";
import styles from "@/styles/send/send.module.css";

type Envelope = {
  type: "text" | "file";
  burned: boolean;
  salt: string;
  iv_meta: string;
  meta_cipher: string;
  download_url?: string;
};

type PreFetchedFile = { ivFile: string | null; saltFile: string | null; cipherBuf: ArrayBuffer } | null;

type TextMeta = { title: string; content: string };
type FileMeta = { title: string; file_name: string; file_mime: string; file_size: number };

type Phase =
  | { step: "reveal" }
  | { step: "loading" }
  | { step: "fatal"; message: string }
  | { step: "password"; wrongAttempt: boolean }
  | { step: "decrypting" }
  | { step: "text-result"; meta: TextMeta }
  | { step: "file-result"; meta: FileMeta; password: string };

export function ReceiveView({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<Phase>({ step: "reveal" });
  const [envelope, setEnvelope] = useState<Envelope | null>(null);
  const [preFetchedFile, setPreFetchedFile] = useState<PreFetchedFile>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  async function handleReveal() {
    setPhase({ step: "loading" });
    try {
      const resp = await fetch(`/api/receive/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const contentType = resp.headers.get("Content-Type") || "";

      if (resp.ok && !contentType.includes("application/json")) {
        const env: Envelope = {
          type: "file",
          burned: true,
          salt: resp.headers.get("X-Salt") || "",
          iv_meta: resp.headers.get("X-Iv-Meta") || "",
          meta_cipher: resp.headers.get("X-Meta-Cipher") || "",
        };
        const ivFile = resp.headers.get("X-Iv-File");
        const saltFile = resp.headers.get("X-Salt-File");
        const cipherBuf = await resp.arrayBuffer();
        if (unmountedRef.current) return;
        setEnvelope(env);
        setPreFetchedFile({ ivFile, saltFile, cipherBuf });
        setPhase({ step: "password", wrongAttempt: false });
        return;
      }

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (unmountedRef.current) return;
        setPhase({ step: "fatal", message: data.error || "This message could not be accessed." });
        return;
      }

      const env = (await resp.json()) as Envelope;
      if (unmountedRef.current) return;
      setEnvelope(env);
      setPhase({ step: "password", wrongAttempt: false });
    } catch (err) {
      if (unmountedRef.current) return;
      setPhase({ step: "fatal", message: `Failed to load: ${err instanceof Error ? err.message : "unknown error"}` });
    }
  }

  async function handleUnlock(password: string) {
    if (!password || !envelope) return;
    setPhase({ step: "decrypting" });

    try {
      const meta = await decryptJson<TextMeta | FileMeta>(password, envelope.salt, envelope.iv_meta, envelope.meta_cipher);
      await new Promise((r) => setTimeout(r, 180));

      if (envelope.type === "text") {
        setPhase({ step: "text-result", meta: meta as TextMeta });
      } else {
        setPhase({ step: "file-result", meta: meta as FileMeta, password });
      }
    } catch {
      setPhase({ step: "password", wrongAttempt: true });
    }
  }

  return (
    <div className={`${styles.panel} ${styles["receive-card"]}`}>
      <div className={styles["receive-icon"]}>
        <BrandMarkIcon />
      </div>

      {phase.step === "reveal" && (
        <>
          <p className={styles["status-note"]}>This message is encrypted end-to-end.</p>
          <div className={styles["burn-note"]}>
            <FireIcon /> Opening this uses up one view — only continue when you&apos;re ready to read it.
          </div>
          <button
            type="button"
            className={styles["btn-primary"]}
            style={{ marginTop: 14 }}
            onClick={handleReveal}
          >
            <EyeIcon /> Reveal message
          </button>
        </>
      )}

      {phase.step === "loading" && <p className={styles["status-note"]}>Opening…</p>}

      {phase.step === "fatal" && <div className={styles["error-box"]}>{phase.message}</div>}

      {phase.step === "password" && <PasswordPrompt onSubmit={handleUnlock} wrongAttempt={phase.wrongAttempt} />}

      {phase.step === "decrypting" && (
        <div className={styles["progress-wrap"]}>
          <div className={styles["progress-stage"]}>
            <span className={styles.dot} />
            <span>Decrypting…</span>
          </div>
          <div className={styles["progress-bar-track"]}>
            <div className={`${styles["progress-bar-fill"]} ${styles.indeterminate}`} />
          </div>
        </div>
      )}

      {phase.step === "text-result" && (
        <TextResult title={phase.meta.title} content={phase.meta.content} burned={envelope?.burned ?? false} />
      )}

      {phase.step === "file-result" && (
        <FileResult
          title={phase.meta.title}
          fileName={phase.meta.file_name}
          fileMime={phase.meta.file_mime}
          fileSize={phase.meta.file_size}
          burned={envelope?.burned ?? false}
          downloadUrl={envelope?.download_url}
          password={phase.password}
          preFetchedFile={preFetchedFile}
        />
      )}
    </div>
  );
}
