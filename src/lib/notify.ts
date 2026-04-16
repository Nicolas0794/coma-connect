import { prisma } from "@/lib/prisma";
import * as emailNotifications from "@/lib/notifications";
import type { CreatorSuggestion } from "@/lib/suggest-creators";

interface NotifyOptions {
  userId: string;
  title: string;
  body: string;
  link?: string;
  email?: {
    to: string;
    subject: string;
    html: string;
  };
  whatsapp?: {
    phone: string;
    message: string;
  };
}

export async function notify(options: NotifyOptions) {
  await prisma.notification.create({
    data: {
      userId: options.userId,
      channel: "IN_APP",
      title: options.title,
      body: options.body,
      link: options.link,
    },
  });

  if (options.email) {
    await prisma.notification.create({
      data: {
        userId: options.userId,
        channel: "EMAIL",
        title: options.title,
        body: options.body,
        link: options.link,
      },
    });
  }

  if (options.whatsapp) {
    await prisma.notification.create({
      data: {
        userId: options.userId,
        channel: "WHATSAPP",
        title: options.title,
        body: options.body,
        link: options.link,
      },
    });
    await sendWhatsApp(options.whatsapp.phone, options.whatsapp.message);
  }
}

async function sendWhatsApp(phone: string, message: string) {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    console.log("\n📱 WHATSAPP (modo desarrollo):");
    console.log(`Para: ${phone}`);
    console.log(`Mensaje: ${message}`);
    console.log("---\n");
    return;
  }

  // Meta WhatsApp Business API
  // Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
  await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace(/\D/g, ""),
        type: "text",
        text: { body: message },
      }),
    },
  );
}

// Helper functions for common notifications

export async function notifyCreatorSelectedAll(
  creatorUserId: string | null,
  creatorEmail: string | null,
  creatorPhone: string | null,
  creatorName: string,
  campaignName: string,
  clientName: string,
) {
  if (creatorUserId) {
    await notify({
      userId: creatorUserId,
      title: "¡Fuiste seleccionada!",
      body: `El cliente ${clientName} aprobó tu perfil para "${campaignName}".`,
      link: "/mi-espacio",
      email: creatorEmail ? {
        to: creatorEmail,
        subject: `🎉 Fuiste seleccionada para "${campaignName}"`,
        html: "",
      } : undefined,
      whatsapp: creatorPhone ? {
        phone: creatorPhone,
        message: `🎉 ¡Hola ${creatorName.split(" ")[0]}! Fuiste seleccionada para la campaña "${campaignName}" de ${clientName}. Entrá a CoMa Connect para ver tu brief. 🎬`,
      } : undefined,
    });
  }
  if (creatorEmail) {
    await emailNotifications.notifyCreatorSelected(creatorEmail, creatorName, campaignName, clientName);
  }
}

export async function notifyCreatorVideoApprovedAll(
  creatorUserId: string | null,
  creatorEmail: string | null,
  creatorPhone: string | null,
  creatorName: string,
  campaignName: string,
  pieceTitle: string,
) {
  if (creatorUserId) {
    await notify({
      userId: creatorUserId,
      title: "¡Video aprobado! Publicá ya",
      body: `Tu video "${pieceTitle}" de "${campaignName}" fue aprobado. ¡Publicalo ahora!`,
      link: "/mi-espacio",
      whatsapp: creatorPhone ? {
        phone: creatorPhone,
        message: `✅ ¡${creatorName.split(" ")[0]}, tu video "${pieceTitle}" fue aprobado! Publicalo ya en tus redes y confirmá en CoMa Connect. 🚀`,
      } : undefined,
    });
  }
  if (creatorEmail) {
    await emailNotifications.notifyCreatorVideoApproved(creatorEmail, creatorName, campaignName, pieceTitle);
  }
}

export async function notifyCreatorChangesAll(
  creatorUserId: string | null,
  creatorEmail: string | null,
  creatorPhone: string | null,
  creatorName: string,
  campaignName: string,
  pieceTitle: string,
  feedback: string,
) {
  if (creatorUserId) {
    await notify({
      userId: creatorUserId,
      title: "Cambios solicitados",
      body: `El cliente pidió ajustes en "${pieceTitle}": ${feedback}`,
      link: "/mi-espacio",
      whatsapp: creatorPhone ? {
        phone: creatorPhone,
        message: `🔄 ${creatorName.split(" ")[0]}, el cliente pidió cambios en "${pieceTitle}": "${feedback}". Revisá en CoMa Connect y volvé a subir. 💪`,
      } : undefined,
    });
  }
  if (creatorEmail) {
    await emailNotifications.notifyCreatorChangesRequested(creatorEmail, creatorName, campaignName, pieceTitle, feedback);
  }
}

export async function notifyCreatorsNewCampaignMatch(
  campaignId: string,
  suggestions: CreatorSuggestion[],
) {
  if (suggestions.length === 0) return;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { name: true, client: { select: { name: true } } },
  });
  if (!campaign) return;

  const creators = await prisma.creator.findMany({
    where: { id: { in: suggestions.map((s) => s.creatorId) } },
    select: { id: true, userId: true, email: true, phone: true, fullName: true },
  });
  const byId = new Map(creators.map((c) => [c.id, c]));

  for (const sug of suggestions) {
    const creator = byId.get(sug.creatorId);
    if (!creator) continue;

    const firstName = creator.fullName.split(" ")[0];
    const intro = sug.fromCommunity
      ? `${campaign.client.name} lanzó una nueva campaña`
      : `${campaign.client.name} lanzó una nueva campaña y tu perfil encaja`;

    if (creator.userId) {
      await notify({
        userId: creator.userId,
        title: `Nueva campaña de ${campaign.client.name}`,
        body: `${intro}: "${campaign.name}". ${sug.reason}`,
        link: "/mi-espacio",
        whatsapp: creator.phone
          ? {
              phone: creator.phone,
              message: `✨ Hola ${firstName}, ${campaign.client.name} tiene una nueva campaña "${campaign.name}" que podría encajar con vos. Mirala en CoMa Connect 🎬`,
            }
          : undefined,
      });
    }

    if (creator.email) {
      await emailNotifications.notifyCreatorNewCampaignMatch(
        creator.email,
        creator.fullName,
        campaign.client.name,
        campaign.name,
        campaignId,
        sug.fromCommunity,
      );
    }
  }
}

export async function notifyClientVideoReadyAll(
  clientUserId: string,
  clientEmail: string | null,
  clientName: string,
  campaignName: string,
  creatorName: string,
  pieceTitle: string,
) {
  await notify({
    userId: clientUserId,
    title: "Video listo para revisión",
    body: `${creatorName} subió "${pieceTitle}" para "${campaignName}". Revisalo y aprobalo.`,
    link: "/portal",
  });
  if (clientEmail) {
    await emailNotifications.notifyClientVideoReady(clientEmail, clientName, campaignName, creatorName, pieceTitle);
  }
}
