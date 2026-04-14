"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PdfUploadFormProps {
  docType: string;
  label: string;
  paymentId?: string;
  currentUrl?: string | null;
}

export function PdfUploadForm({ docType, label, paymentId, currentUrl }: PdfUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(currentUrl ?? null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al subir el archivo");
        setUploading(false);
        return;
      }

      const data = await res.json();
      setUrl(data.viewUrl);
      setUploading(false);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setUploading(false);
    }
  }

  if (url) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-[#D6E889]/10 border border-[#D6E889]/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lime-600 text-sm">✓</span>
          <span className="text-xs text-foreground">{label}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Ver PDF ↗
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border p-3">
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      <input type="hidden" name="docType" value={docType} />
      {paymentId && <input type="hidden" name="paymentId" value={paymentId} />}
      <div className="flex items-end gap-2">
        <input
          name="file"
          type="file"
          accept=".pdf,application/pdf"
          required
          className="flex-1 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs file:font-medium file:cursor-pointer"
        />
        <Button type="submit" size="sm" disabled={uploading}>
          {uploading ? "Subiendo..." : "Subir PDF"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      <p className="text-[10px] text-muted-foreground mt-1">Solo archivos PDF, máximo 10MB</p>
    </form>
  );
}
