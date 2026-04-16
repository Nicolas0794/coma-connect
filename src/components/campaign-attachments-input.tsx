"use client";

import { useState, useRef } from "react";

const MAX_SIZE_MB = 25;
const MAX_FILES = 8;

export function CampaignAttachmentsInput() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const syncInput = (next: File[]) => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    setError(null);
    const arr = Array.from(incoming);
    const tooBig = arr.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" supera los ${MAX_SIZE_MB} MB.`);
      return;
    }
    const combined = [...files, ...arr].slice(0, MAX_FILES);
    if (files.length + arr.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} archivos.`);
    }
    setFiles(combined);
    syncInput(combined);
  };

  const removeAt = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    syncInput(next);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <input
        ref={inputRef}
        name="attachments"
        type="file"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input/60 bg-secondary/40 px-4 py-6 text-center cursor-pointer hover:border-input hover:bg-secondary/60 transition-colors"
      >
        <span className="text-sm text-foreground">
          Arrastrá archivos o hacé clic para seleccionar
        </span>
        <span className="text-[11px] text-muted-foreground">
          PDF, imágenes, docs, presentaciones — hasta {MAX_SIZE_MB} MB cada uno (máx {MAX_FILES})
        </span>
      </div>

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatSize(f.size)} · {f.type || "desconocido"}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="text-[11px] text-muted-foreground hover:text-destructive px-2 shrink-0"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
