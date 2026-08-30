"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Dropdown } from "./Dropdown";
import { ToggleSwitch } from "./ToggleSwitch";
import { FileDrop } from "./FileDrop";
import { PasswordField } from "./PasswordField";
import { ProgressPanel, type Stage } from "./ProgressPanel";
import { ResultPanel } from "./ResultPanel";
import { encryptJson, encryptBytes, randomBytes, bufToB64 } from "@/components/crypto";
import { xhrUpload } from "./xhr";
import type { PwGenOptions } from "./password-generator";
import { TextIcon, FileIcon, KeyIcon, EyeIcon, ClockIcon, SendIcon } from "./icons";
import styles from "@/styles/send/send.module.css";

type Mode = "text" | "file";

type FormValues = {
  title: string;
  content: string;
  apiKey: string;
  password: string;
  maxViews: string;
  expiresIn: string;
  burnAfterRead: boolean;
};

const MAX_VIEWS_OPTIONS = Array.from({ length: 9 }, (_, i) => {
  const n = i + 1;
  return { value: String(n), label: `${n} View${n > 1 ? "s" : ""}` };
});

const EXPIRES_OPTIONS = [
  { value: "1", label: "1 Hour" },
  { value: "3", label: "3 Hours" },
  { value: "6", label: "6 Hours" },
  { value: "12", label: "12 Hours" },
  { value: "24", label: "1 Day (24h)" },
  { value: "48", label: "2 Days (48h)" },
  { value: "72", label: "3 Days (72h)" },
];

const PUBLIC_MAX_FILE = 20 * 1024 * 1024;
const AUTH_MAX_FILE = 100 * 1024 * 1024;

export function SendForm() {
  const { register, control, watch, getValues } = useForm<FormValues>({
    defaultValues: {
      title: "",
      content: "",
      apiKey: "",
      password: "",
      maxViews: "1",
      expiresIn: "1",
      burnAfterRead: false,
    },
  });

  const [mode, setMode] = useState<Mode>("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [pwMode, setPwMode] = useState<"manual" | "generate">("generate");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [pwGenOptions, setPwGenOptions] = useState<PwGenOptions>({
    length: 20,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
  });

  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ stages: Stage[]; activeId: string | null; doneIds: string[]; pct: number | null } | null>(null);
  const [result, setResult] = useState<{ link: string; revealedPassword?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiKey = watch("apiKey");
  const burnAfterRead = watch("burnAfterRead");
  const hasKey = apiKey.trim().length > 0;

  function switchMode(next: Mode) {
    if (mode === next) return;
    setMode(next);
    setSelectedFile(null);
    setResult(null);
    setError(null);
  }

  async function handleSend() {
    setResult(null);
    setError(null);

    const values = getValues();
    const title = values.title.trim() || "Untitled";
    const password = pwMode === "generate" ? generatedPassword : values.password;

    if (!password) {
      setError(pwMode === "generate" ? "Generate a password first — adjust the options above, then try again." : "An encryption password is required.");
      return;
    }

    const maxViewsNum = Number(values.maxViews);
    if (!Number.isInteger(maxViewsNum) || maxViewsNum < 1 || maxViewsNum > 9) {
      setError("Max Views must be between 1 and 9.");
      return;
    }

    setSending(true);

    try {
      let data: { slug: string };

      if (mode === "text") {
        if (!values.content.trim()) throw new Error("Message cannot be empty.");

        setProgress({
          stages: [
            { id: "enc", label: "Encrypting message…" },
            { id: "send", label: "Sending to vault…" },
          ],
          activeId: "enc",
          doneIds: [],
          pct: null,
        });

        const enc = await encryptJson(password, { title, content: values.content });
        setProgress((p) => (p ? { ...p, activeId: "send", doneIds: ["enc"] } : p));

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (values.apiKey.trim()) headers["X-Api-Key"] = values.apiKey.trim();

        const resp = await fetch("/api/send/text", {
          method: "POST",
          headers,
          body: JSON.stringify({
            ciphertext: enc.ciphertext,
            salt: enc.salt,
            iv: enc.iv,
            burn_after_read: burnAfterRead,
            max_views: values.maxViews,
            expires_in_hours: values.expiresIn,
          }),
        });
        data = await resp.json();
        if (!resp.ok) throw new Error((data as unknown as { error?: string }).error || "Send failed.");
        setProgress((p) => (p ? { ...p, doneIds: ["enc", "send"], pct: 100 } : p));
      } else {
        if (!selectedFile) throw new Error("Please select a file first.");
        const maxAllowed = hasKey ? AUTH_MAX_FILE : PUBLIC_MAX_FILE;
        if (selectedFile.size > maxAllowed) {
          throw new Error(
            hasKey
              ? "File too large. Max 100 MB with Internal Key."
              : "File too large. Max 20 MB without Internal Key. Enter a valid key to upload up to 100 MB."
          );
        }

        setProgress({
          stages: [
            { id: "enc", label: "Encrypting file…" },
            { id: "upload", label: "Uploading encrypted file…" },
          ],
          activeId: "enc",
          doneIds: [],
          pct: null,
        });

        const metaEnc = await encryptJson(password, {
          title,
          file_name: selectedFile.name,
          file_mime: selectedFile.type || "application/octet-stream",
          file_size: selectedFile.size,
        });
        const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
        // Separate salt for the file vs meta so the two ciphertexts never
        // share a derived key.
        const saltFileBytes = randomBytes(16);
        const fileEnc = await encryptBytes(password, saltFileBytes, fileBytes);

        setProgress((p) => (p ? { ...p, activeId: "upload", doneIds: ["enc"], pct: 0 } : p));

        const headers: Record<string, string> = {
          "X-Meta-Cipher": metaEnc.ciphertext,
          "X-Salt": metaEnc.salt,
          "X-Iv-Meta": metaEnc.iv,
          "X-Salt-File": bufToB64(saltFileBytes),
          "X-Iv-File": fileEnc.iv,
          "X-Burn-After-Read": burnAfterRead ? "1" : "0",
          "X-Max-Views": values.maxViews,
          "X-Expires-In-Hours": values.expiresIn,
        };
        if (values.apiKey.trim()) headers["X-Api-Key"] = values.apiKey.trim();

        data = await xhrUpload("/api/send/file", headers, fileEnc.ciphertext, (pct) =>
          setProgress((p) => (p ? { ...p, pct } : p))
        );
        setProgress((p) => (p ? { ...p, doneIds: ["enc", "upload"], pct: 100 } : p));
      }

      const link = `${window.location.origin}/receive/${data.slug}`;
      setResult({
        link,
        revealedPassword: pwMode === "generate" ? generatedPassword : undefined,
      });
      setProgress(null);
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.field}>
          <label>Title (optional)</label>
          <input type="text" placeholder="Untitled" {...register("title")} />
        </div>

        {mode === "text" ? (
          <div className={styles.field}>
            <label>
              <TextIcon /> Message <span className={styles["req-asterisk"]}>*</span>
            </label>
            <textarea placeholder="Write your secret message here…" {...register("content")} />
          </div>
        ) : (
          <div className={styles.field}>
            <label>
              <FileIcon /> File <span className={styles["req-asterisk"]}>*</span>
            </label>
            <FileDrop file={selectedFile} onFile={setSelectedFile} />
          </div>
        )}

        <div className={styles.field}>
          <label>
            <KeyIcon /> Internal Key <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="password"
            placeholder={mode === "file" ? "Leave blank to upload up to 20 MB" : "Leave blank to send without a key"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            {...register("apiKey")}
          />
        </div>

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordField
              pwMode={pwMode}
              onPwModeChange={setPwMode}
              manualPassword={field.value}
              onManualPasswordChange={field.onChange}
              generatedPassword={generatedPassword}
              onGeneratedPasswordChange={setGeneratedPassword}
              pwGenOptions={pwGenOptions}
              onPwGenOptionsChange={setPwGenOptions}
              locked={sending}
            />
          )}
        />

        <div className={styles.row2}>
          <div className={styles.field}>
            <label>
              <EyeIcon /> Max Views
            </label>
            <Controller
              name="maxViews"
              control={control}
              render={({ field }) => (
                <Dropdown options={MAX_VIEWS_OPTIONS} value={field.value} onChange={field.onChange} disabled={burnAfterRead} />
              )}
            />
          </div>
          <div className={styles.field}>
            <label>
              <ClockIcon /> Expires in <span className={styles["req-asterisk"]}>*</span>
            </label>
            <Controller
              name="expiresIn"
              control={control}
              render={({ field }) => <Dropdown options={EXPIRES_OPTIONS} value={field.value} onChange={field.onChange} />}
            />
          </div>
        </div>

        <div className={styles.divider} />
        <div className={styles["section-label"]}>Options</div>

        <div className={styles["toggle-row"]}>
          <div className={styles["toggle-label"]}>
            <div className={styles.title}>Burn after read</div>
            <div className={styles.sub}>Permanently destroyed after first open — overrides Max Views</div>
          </div>
          <Controller
            name="burnAfterRead"
            control={control}
            render={({ field }) => <ToggleSwitch checked={field.value} onChange={field.onChange} />}
          />
        </div>

        <div id="result-area">
          {error && <div className={styles["error-box"]}>{error}</div>}
          {progress && <ProgressPanel {...progress} />}
          {result && <ResultPanel link={result.link} revealedPassword={result.revealedPassword} />}
        </div>
      </div>

      <div className={styles["bottom-bar"]}>
        <div className={styles["bar-tabs"]}>
          <button
            type="button"
            className={`${styles["bar-tab"]} ${mode === "text" ? styles.active : ""}`}
            onClick={() => switchMode("text")}
          >
            <TextIcon />
            <span className={styles["bar-tab-text"]}>Send Text</span>
          </button>
          <button
            type="button"
            className={`${styles["bar-tab"]} ${mode === "file" ? styles.active : ""}`}
            onClick={() => switchMode("file")}
          >
            <FileIcon />
            <span className={styles["bar-tab-text"]}>Send File</span>
          </button>
        </div>
        <button type="button" className={styles["bar-send"]} disabled={sending} onClick={handleSend}>
          <SendIcon /> {sending ? "Sealing…" : "Seal & Send"}
        </button>
      </div>
    </>
  );
}
