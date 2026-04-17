import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const alt = "Perfil en CoMa Connect";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const creator = await prisma.creator.findUnique({
    where: { slug },
    select: {
      fullName: true,
      artistName: true,
      headline: true,
      city: true,
      profileImageUrl: true,
      comaVerifiedAt: true,
      profileStatus: true,
    },
  });

  const name = creator?.artistName || creator?.fullName || "Creador";
  const headline = creator?.headline || "Creador de contenido en CoMa Connect";
  const city = creator?.city;
  const isVerified = Boolean(creator?.comaVerifiedAt);
  const imageUrl = creator?.profileImageUrl;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #FFF7F5 0%, #FFE8E2 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#111",
            }}
          >
            CoMa
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#FF4B2C",
            }}
          >
            Connect
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              width={220}
              height={220}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                border: "6px solid white",
              }}
            />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: "#FF4B2C",
                color: "white",
                fontSize: 96,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#111",
                  lineHeight: 1.1,
                }}
              >
                {name}
              </div>
              {isVerified && (
                <div
                  style={{
                    background: "#FF4B2C",
                    color: "white",
                    fontSize: 20,
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: 8,
                  }}
                >
                  ✓ Verificado
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#666",
                lineHeight: 1.3,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
            >
              {headline}
            </div>
            {city && (
              <div style={{ marginTop: 16, fontSize: 22, color: "#888" }}>
                {`📍 ${city}`}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 20, color: "#999" }}>
          Red profesional de creadores de contenido — LATAM
        </div>
      </div>
    ),
    { ...size },
  );
}
