"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function VerifyButton({ creatorId }: { creatorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    setLoading(true);
    try {
      await fetch(`/api/creators/${creatorId}/verify`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleVerify}
      disabled={loading}
      className="text-[11px] h-6 px-2"
    >
      {loading ? "Verificando..." : "Verificar"}
    </Button>
  );
}
