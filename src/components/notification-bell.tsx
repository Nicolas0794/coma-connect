import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function NotificationBell({ userId }: { userId: string }) {
  const unreadCount = await prisma.notification.count({
    where: { userId, read: false, channel: "IN_APP" },
  });

  return (
    <Link
      href="/notificaciones"
      className="relative size-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
