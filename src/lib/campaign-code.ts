import { prisma } from "@/lib/prisma";

export async function getNextCampaignCode(): Promise<string> {
  const lastCampaign = await prisma.campaign.findFirst({
    where: { code: { startsWith: "CBL-" } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  if (!lastCampaign) {
    return "CBL-0001";
  }

  const lastNumber = parseInt(lastCampaign.code.replace("CBL-", ""), 10);
  const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
  return `CBL-${nextNumber}`;
}
