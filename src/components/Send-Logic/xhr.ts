// fetch() has no upload/download progress events — XHR does.

export function xhrUpload(
  url: string,
  headers: Record<string, string>,
  body: XMLHttpRequestBodyInit,
  onProgress?: (pct: number) => void
): Promise<{ slug: string; type: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.responseType = "text";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        // ignore malformed body, handled by status check below
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as { slug: string; type: string });
      else reject(new Error((data.error as string) || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(body);
  });
}

export function xhrDownload(
  url: string,
  onProgress?: (pct: number) => void
): Promise<{ ivFile: string | null; saltFile: string | null; buffer: ArrayBuffer }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";

    xhr.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          ivFile: xhr.getResponseHeader("X-Iv-File"),
          saltFile: xhr.getResponseHeader("X-Salt-File"),
          buffer: xhr.response,
        });
      } else {
        let errMsg = "Download failed.";
        try {
          errMsg = JSON.parse(new TextDecoder().decode(xhr.response)).error || errMsg;
        } catch {
          // ignore, fall back to default message
        }
        reject(new Error(errMsg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during download."));
    xhr.send();
  });
}
