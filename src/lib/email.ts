import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
    from: process.env.EMAIL_FROM ?? "CoMa Connect <noreply@comacreators.com>",
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
