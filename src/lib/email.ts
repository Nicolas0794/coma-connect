import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "CoMa Connect <noreply@comacreators.com>";
const BASE = process.env.AUTH_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  if (!resend) {
    console.log("\n========================================");
    console.log("LINK DE RESETEO (modo desarrollo):");
    console.log(resetUrl);
    console.log("========================================\n");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Restablecé tu contraseña — CoMa Connect",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2C2C2A; font-size: 20px; margin-bottom: 8px;">Restablecer contraseña</h2>
        <p style="color: #888780; font-size: 14px; line-height: 1.6;">
          Recibimos una solicitud para restablecer tu contraseña en CoMa Connect.
          Hacé click en el botón para crear una nueva:
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 20px 0; padding: 10px 24px; background: #FF4B2C; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
          Restablecer contraseña
        </a>
        <p style="color: #B4B2A9; font-size: 12px; margin-top: 24px;">
          Si no pediste esto, ignorá este correo. El link expira en 1 hora.
        </p>
      </div>
    `,
  });
}

export async function sendBrandApprovedEmail(opts: {
  email: string;
  contactName: string;
  brandName: string;
}) {
  const registerUrl = `${BASE}/register`;
  if (!resend) {
    console.log("\n========== BRAND APPROVED EMAIL (dev) ==========");
    console.log(`To: ${opts.email}`);
    console.log(`Marca: ${opts.brandName}`);
    console.log(`Registrate en: ${registerUrl} (email debe ser ${opts.email})`);
    console.log("================================================\n");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: `Bienvenida, ${opts.brandName} — tu acceso a CoMa Connect`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#2C2C2A; font-size:20px; margin:0 0 8px 0;">¡Hola, ${opts.contactName}!</h2>
        <p style="color:#555; font-size:14px; line-height:1.6;">
          Aprobamos el acceso de <strong>${opts.brandName}</strong> a CoMa Connect.
          Podés crear tu cuenta con este mismo email y empezar a lanzar campañas con nuestras creadoras.
        </p>
        <a href="${registerUrl}" style="display:inline-block; margin:20px 0; padding:12px 24px; background:#FF4B2C; color:#fff; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">
          Crear mi cuenta →
        </a>
        <p style="color:#888; font-size:13px; line-height:1.6;">
          Importante: registrate con <strong>${opts.email}</strong> exactamente.
          Si usás otro email no vas a tener acceso como marca.
        </p>
        <p style="color:#B4B2A9; font-size:12px; margin-top:24px;">
          ¿Dudas? Respondé este correo, somos humanos del otro lado. 🧡
        </p>
      </div>
    `,
  });
}

export async function sendBrandRejectedEmail(opts: {
  email: string;
  contactName: string;
  brandName: string;
  reason?: string;
}) {
  if (!resend) {
    console.log(`[email] brand rejected (dev): ${opts.email}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: `Sobre tu solicitud en CoMa Connect`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#2C2C2A; font-size:18px; margin:0 0 8px 0;">Hola ${opts.contactName},</h2>
        <p style="color:#555; font-size:14px; line-height:1.6;">
          Gracias por tu interés en sumar a ${opts.brandName} a CoMa Connect.
          Por ahora no vamos a poder avanzar con tu solicitud${opts.reason ? ": " + opts.reason : "."}
        </p>
        <p style="color:#888; font-size:13px; line-height:1.6; margin-top:16px;">
          Si querés darnos más contexto, respondé este correo y lo revisamos.
        </p>
      </div>
    `,
  });
}
