import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listCampaignVideos } from "@/lib/google-drive";
import { Badge } from "@/components/ui/badge";

export default async function VideosCampanaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true, name: true, code: true },
  });

  if (!campaign) notFound();

  let videos: Array<{ id: string; name: string; viewUrl: string; createdTime: string }> = [];
  try {
    videos = await listCampaignVideos(campaign.code, campaign.name);
  } catch {
    // Drive no configurado o sin videos
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link href={`/campanas/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {campaign.name}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Videos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {videos.length} video{videos.length !== 1 ? "s" : ""} en Google Drive
        </p>
      </div>

      {videos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {videos.map((video) => (
            <a
              key={video.id}
              href={video.viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
                  🎬
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {video.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(video.createdTime).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <Badge variant="outline" className="mt-1.5 text-[10px]">
                    Ver en Drive ↗
                  </Badge>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Todavía no hay videos subidos para esta campaña.
          </p>
        </div>
      )}
    </div>
  );
}
