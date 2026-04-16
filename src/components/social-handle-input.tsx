"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SocialMetrics {
  followers: number;
  following?: number;
  posts?: number;
  fullName?: string;
  avgEngagement?: number;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-CO");
}

export function SocialHandleInput({
  platform,
  handleName,
  followersName,
  defaultHandle,
  defaultFollowers,
}: {
  platform: "INSTAGRAM" | "TIKTOK";
  handleName: string;
  followersName: string;
  defaultHandle?: string;
  defaultFollowers?: number;
}) {
  const label = platform === "INSTAGRAM" ? "Instagram" : "TikTok";
  const prefix = platform === "INSTAGRAM" ? "IG" : "TK";

  const [handle, setHandle] = useState(defaultHandle ?? "");
  const [metrics, setMetrics] = useState<SocialMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async () => {
    const clean = handle.replace("@", "").trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setMetrics(null);

    try {
      const res = await fetch(
        `/api/social-lookup?platform=${platform}&handle=${encodeURIComponent(clean)}`
      );
      if (res.status === 404) {
        setError("No se encontró el perfil. Verificá el usuario.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Instagram temporalmente no disponible. Intentá de nuevo en unos minutos.");
        return;
      }
      const data = await res.json();
      setMetrics(data);
    } catch {
      setError("Error al consultar");
    } finally {
      setLoading(false);
    }
  }, [handle, platform]);

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{label} @</Label>
        <div className="flex gap-2">
          <Input
            name={handleName}
            placeholder="usuario"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onBlur={lookup}
          />
          <button
            type="button"
            onClick={lookup}
            disabled={loading || !handle.trim()}
            className="shrink-0 h-[38px] px-3 rounded-lg border border-input/60 bg-secondary text-xs font-medium text-foreground hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* Hidden input para enviar los seguidores verificados */}
      <input
        type="hidden"
        name={followersName}
        value={metrics?.followers ?? defaultFollowers ?? ""}
      />

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <div className="size-3 rounded-full bg-muted-foreground/30" />
          Consultando {label}...
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {metrics && (
        <div className="rounded-lg border border-[#D6E889]/50 bg-[#D6E889]/10 px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block size-4 rounded-full bg-[#D6E889] text-[10px] text-center leading-4 font-bold text-[#2A3B0F]">✓</span>
            <span className="text-xs font-medium text-foreground">
              {prefix} @{handle.replace("@", "")}
            </span>
            {metrics.fullName && (
              <span className="text-xs text-muted-foreground">· {metrics.fullName}</span>
            )}
          </div>
          <div className="flex gap-4 text-xs">
            <div>
              <span className="font-bold text-foreground">{formatNumber(metrics.followers)}</span>
              <span className="text-muted-foreground ml-1">seguidores</span>
            </div>
            {metrics.following != null && (
              <div>
                <span className="font-medium text-foreground">{formatNumber(metrics.following)}</span>
                <span className="text-muted-foreground ml-1">seguidos</span>
              </div>
            )}
            {metrics.posts != null && (
              <div>
                <span className="font-medium text-foreground">{formatNumber(metrics.posts)}</span>
                <span className="text-muted-foreground ml-1">posts</span>
              </div>
            )}
            {metrics.avgEngagement != null && (
              <div>
                <span className="font-medium text-foreground">{metrics.avgEngagement}%</span>
                <span className="text-muted-foreground ml-1">engagement</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
