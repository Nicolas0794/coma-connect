"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function VideoUploadForm({ contentPieceId }: { contentPieceId: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al subir el video");
        setUploading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg bg-[#D6E889]/20 border border-[#D6E889]/40 px-3 py-2 text-sm text-lime-700 mt-3">
        Video subido correctamente. Recargando...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 mt-3">
      <input type="hidden" name="contentPieceId" value={contentPieceId} />
      <div className="flex-1">
        <input
          name="video"
          type="file"
          accept=".mp4,video/mp4"
          required
          className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs file:font-medium file:cursor-pointer"
        />
      </div>
      <Button type="submit" size="sm" disabled={uploading}>
        {uploading ? "Subiendo..." : "Enviar video"}
      </Button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </form>
  );
}
