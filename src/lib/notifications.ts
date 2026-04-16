import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "CoMa Connect <noreply@comacreators.com>";
const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log("\n📧 EMAIL (modo desarrollo):");
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Link: ${BASE_URL}`);
    console.log("---\n");
    return;
  }

  await resend.emails.send({ from: FROM, to, subject, html });
}

function wrap(title: string, body: string, ctaText?: string, ctaUrl?: string) {
  return `
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px;">
      <img src="${BASE_URL}/logo.svg" alt="CoMa Connect" width="140" style="margin-bottom: 24px;" />
      <h2 style="color: #2C2C2A; font-size: 18px; margin-bottom: 8px;">${title}</h2>
      <div style="color: #555; font-size: 14px; line-height: 1.7;">${body}</div>
      ${ctaText && ctaUrl ? `
        <a href="${ctaUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 24px; background: #FF4B2C; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
          ${ctaText}
        </a>
      ` : ""}
      <p style="color: #B4B2A9; font-size: 11px; margin-top: 32px;">
        CoMa · Digital Creators Factory
      </p>
    </div>
  `;
}

export async function notifyCreatorSelected(
  creatorEmail: string,
  creatorName: string,
  campaignName: string,
  clientName: string,
) {
  const firstName = creatorName.split(" ")[0];
  await sendEmail(
    creatorEmail,
    `🎉 Fuiste seleccionada para "${campaignName}"`,
    wrap(
      `¡${firstName}, fuiste seleccionada!`,
      `<p>El cliente <strong>${clientName}</strong> aprobó tu perfil para la campaña <strong>"${campaignName}"</strong>.</p>
       <p>Entrá a CoMa Connect para ver el brief con todas las indicaciones, fechas y detalles de pago.</p>`,
      "Ver mi brief",
      `${BASE_URL}/mi-espacio`,
    ),
  );
}

export async function notifyCreatorBriefReady(
  creatorEmail: string,
  creatorName: string,
  campaignName: string,
) {
  const firstName = creatorName.split(" ")[0];
  await sendEmail(
    creatorEmail,
    `📋 Brief listo para "${campaignName}"`,
    wrap(
      `${firstName}, tu brief está listo`,
      `<p>El brief de la campaña <strong>"${campaignName}"</strong> ya está disponible con todas las indicaciones.</p>
       <p>Revisalo, producí tu video y subilo cuando esté listo. Recordá que debe ser aprobado antes de publicar.</p>`,
      "Ver brief y empezar",
      `${BASE_URL}/mi-espacio`,
    ),
  );
}

export async function notifyCreatorVideoApproved(
  creatorEmail: string,
  creatorName: string,
  campaignName: string,
  pieceTitle: string,
) {
  const firstName = creatorName.split(" ")[0];
  await sendEmail(
    creatorEmail,
    `✅ ¡Video aprobado! Publicá ya — "${pieceTitle}"`,
    wrap(
      `${firstName}, ¡tu video fue aprobado! 🎬`,
      `<p>El cliente aprobó tu video <strong>"${pieceTitle}"</strong> de la campaña <strong>"${campaignName}"</strong>.</p>
       <p><strong>Publicalo ya en tus redes sociales</strong> y confirmá la publicación en CoMa Connect con el link del post.</p>`,
      "Confirmar publicación",
      `${BASE_URL}/mi-espacio`,
    ),
  );
}

export async function notifyCreatorChangesRequested(
  creatorEmail: string,
  creatorName: string,
  campaignName: string,
  pieceTitle: string,
  feedback: string,
) {
  const firstName = creatorName.split(" ")[0];
  await sendEmail(
    creatorEmail,
    `🔄 Cambios solicitados en "${pieceTitle}"`,
    wrap(
      `${firstName}, el cliente pidió ajustes`,
      `<p>Tu video <strong>"${pieceTitle}"</strong> de la campaña <strong>"${campaignName}"</strong> necesita algunos cambios.</p>
       <div style="background: #FFF8F0; border: 1px solid #F4D79D; border-radius: 8px; padding: 12px; margin: 12px 0;">
         <p style="font-size: 12px; color: #888; margin-bottom: 4px;">Feedback del cliente:</p>
         <p style="color: #2C2C2A; margin: 0;">${feedback}</p>
       </div>
       <p>Hacé los ajustes y volvé a subir el video en CoMa Connect.</p>`,
      "Ver feedback y resubir",
      `${BASE_URL}/mi-espacio`,
    ),
  );
}

export async function notifyClientVideoReady(
  clientEmail: string,
  clientName: string,
  campaignName: string,
  creatorName: string,
  pieceTitle: string,
) {
  await sendEmail(
    clientEmail,
    `🎬 Video listo para revisión — "${pieceTitle}"`,
    wrap(
      `${clientName}, hay un video pendiente de tu revisión`,
      `<p>La creadora <strong>${creatorName}</strong> subió el video <strong>"${pieceTitle}"</strong> para la campaña <strong>"${campaignName}"</strong>.</p>
       <p>Entrá a CoMa Connect para revisarlo y aprobarlo o pedir cambios.</p>`,
      "Revisar video",
      `${BASE_URL}/portal`,
    ),
  );
}

export async function notifyCreatorNewCampaignMatch(
  creatorEmail: string,
  creatorName: string,
  clientName: string,
  campaignName: string,
  campaignId: string,
  fromCommunity: boolean,
) {
  const firstName = creatorName.split(" ")[0];
  const intro = fromCommunity
    ? `${clientName} —con quien ya trabajaste antes— lanzó una nueva campaña`
    : `${clientName} lanzó una nueva campaña y tu perfil encaja`;
  await sendEmail(
    creatorEmail,
    `✨ Nueva campaña de ${clientName} — "${campaignName}"`,
    wrap(
      `${firstName}, hay una campaña nueva que podría encajar con vos`,
      `<p>${intro}: <strong>"${campaignName}"</strong>.</p>
       <p>Mirala en CoMa Connect y postulate si te interesa.</p>`,
      "Ver campaña",
      `${BASE_URL}/mi-espacio?campaign=${campaignId}`,
    ),
  );
}

export async function notifyClientCreatorsProposed(
  clientEmail: string,
  clientName: string,
  campaignName: string,
  creatorCount: number,
) {
  await sendEmail(
    clientEmail,
    `👥 ${creatorCount} creadora${creatorCount > 1 ? "s" : ""} propuesta${creatorCount > 1 ? "s" : ""} para "${campaignName}"`,
    wrap(
      `${clientName}, hay creadoras esperando tu aprobación`,
      `<p>El equipo de CoMa seleccionó <strong>${creatorCount} creadora${creatorCount > 1 ? "s" : ""}</strong> para tu campaña <strong>"${campaignName}"</strong>.</p>
       <p>Entrá a CoMa Connect para ver sus perfiles y aprobar o rechazar cada una.</p>`,
      "Ver creadoras",
      `${BASE_URL}/portal`,
    ),
  );
}

export async function notifyTeamPublicationConfirmed(
  teamEmail: string,
  creatorName: string,
  campaignName: string,
  pieceTitle: string,
  publishedUrl: string,
) {
  await sendEmail(
    teamEmail,
    `📱 Publicación confirmada — ${creatorName} publicó "${pieceTitle}"`,
    wrap(
      `${creatorName} confirmó la publicación`,
      `<p><strong>${creatorName}</strong> publicó <strong>"${pieceTitle}"</strong> de la campaña <strong>"${campaignName}"</strong>.</p>
       <p><a href="${publishedUrl}" style="color: #FF4B2C;">Ver publicación ↗</a></p>
       <p>Ya podés registrar las métricas (views, likes, comments, etc.) en CoMa Connect.</p>`,
      "Ver en CoMa Connect",
      `${BASE_URL}/campanas`,
    ),
  );
}
