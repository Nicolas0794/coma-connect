import Anthropic from "@anthropic-ai/sdk";

const BRIEF_SYSTEM_PROMPT = `Eres el equipo creativo de CoMa, una agencia de creadores de contenido en Colombia. Tu trabajo es transformar la información que el cliente proporciona sobre su campaña en un brief estructurado para creadoras de contenido UGC.

El brief debe estar en español colombiano, con tono cercano, motivador y directo. Usá "vos" cuando te dirigís a la creadora.

ESTRUCTURA OBLIGATORIA del brief (respetá este orden y estos títulos exactos):

1. **Contexto de campaña**
Un párrafo narrativo que explique el contexto del producto/servicio y por qué es relevante esta campaña.

2. **Objetivo de la campaña**
Bullets claros con los objetivos principales.

3. **¿Qué vas a hacer?**
Lista de acciones concretas para la creadora:
- Crear un video UGC de 30 a 60 segundos mencionando [tema central]
- Mencionar [beneficios clave]
- Invitar a [acción deseada]
- Seguir la guía creativa entregada por el equipo CoMa
- Publicar el video en [plataforma] después de aprobación

4. **¿Qué queremos que comuniques?**
Bullets con los mensajes clave que el video debe transmitir.

5. **¿A quién te estás dirigiendo?**
Descripción detallada del público objetivo con bullets.

6. **Ideas o ejemplos de hooks que puedes utilizar**
Generá entre 8 y 12 hooks creativos, en lenguaje coloquial colombiano, que la creadora pueda usar para abrir su video. Deben sonar naturales, como si alguien estuviera hablando en TikTok/Instagram. Usá expresiones como "parce", "literal", "yo pensé que...", etc.

7. **Checklist para tu contenido**
- Duración: entre 30 y 45 segundos
- Formato vertical 9:16
- Mostrarte hablando o usando elementos visuales (texto, pantallas)
- Mensaje claro: [resumen del mensaje]
- Buena calidad de imagen y audio (celular está bien)
- Lenguaje cercano, esperanzador, inspirador
- No usar logos ni marcas registradas
- No comprometer información técnica específica

8. **¿Dónde se va a publicar?**
- En [plataforma], desde tu cuenta personal
- Debe ser aprobado por el equipo antes de subir
- Puedes usar tu tono y estilo, mientras cumplas con el objetivo

9. **¿Cómo es tu pago?**
"Como siempre, esta campaña es pagada por contenido entregado y validado. Recibirás una remuneración de $[monto] ([monto en letras]) dentro de los 30 días calendario siguientes. Vos ya sos parte del equipo. No es un concurso ni sorteo: creás, publicás y te pagamos. 🎬💚"

10. **Call to Action**
[URL o acción que deben mencionar]

11. **Fechas de tu generación, entrega y publicación de contenido**
Tabla con:
- Tiempo para generación del contenido: [fechas]
- Fecha máxima de entrega: [fecha]
- Fecha máxima de publicación: [fecha]

IMPORTANTE:
- Los hooks son la parte más creativa e importante del brief. Deben ser auténticos, coloquiales y variados.
- Adaptá el tono según el producto: si es financiero, más serio pero accesible; si es lifestyle, más relajado y divertido.
- Siempre incluí la frase sobre el pago con el tono cercano característico de CoMa.`;

interface CampaignInput {
  name: string;
  description: string;
  productType: string;
  targetAudience: string;
  objectives: string;
  keyMessages: string;
  callToAction: string;
  startDate: string;
  endDate: string;
  deliveryDate: string;
  paymentAmount: string;
  platform: string;
  additionalNotes: string;
}

export interface BriefAttachment {
  fileName: string;
  mimeType: string;
  data: Buffer;
}

export async function generateBrief(
  input: CampaignInput,
  attachments: BriefAttachment[] = [],
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return generateFallbackBrief(input);
  }

  const client = new Anthropic({ apiKey });

  const attachmentSummary =
    attachments.length > 0
      ? `\n\n**Archivos adjuntos del cliente:**\n${attachments
          .map((a) => `- ${a.fileName} (${a.mimeType})`)
          .join("\n")}\n\nRevisá los documentos adjuntos arriba y usalos como contexto adicional para el brief.`
      : "";

  const userText = `Generá el brief para creadoras basándote en esta información del cliente:

**Nombre de la campaña:** ${input.name}
**Descripción:** ${input.description}
**Tipo de producto/servicio:** ${input.productType}
**Público objetivo:** ${input.targetAudience}
**Objetivos:** ${input.objectives}
**Mensajes clave:** ${input.keyMessages}
**Call to Action:** ${input.callToAction}
**Plataforma:** ${input.platform}
**Monto de pago por creadora:** ${input.paymentAmount}
**Fecha de inicio producción:** ${input.startDate}
**Fecha máxima de entrega:** ${input.deliveryDate}
**Fecha máxima de publicación:** ${input.endDate}
**Notas adicionales:** ${input.additionalNotes}${attachmentSummary}

Generá el brief completo siguiendo la estructura exacta.`;

  // Construir content blocks: adjuntos soportados primero, luego el prompt.
  const contentBlocks: Anthropic.ContentBlockParam[] = [];
  for (const att of attachments) {
    if (att.mimeType === "application/pdf") {
      contentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: att.data.toString("base64"),
        },
      });
    } else if (att.mimeType.startsWith("image/")) {
      const media = att.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: media,
          data: att.data.toString("base64"),
        },
      });
    }
    // Otros tipos quedan solo listados en texto (no se envían al modelo).
  }
  contentBlocks.push({ type: "text", text: userText });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: BRIEF_SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock?.text ?? generateFallbackBrief(input);
  } catch (err) {
    console.error("[generateBrief] AI call failed:", err);
    return generateFallbackBrief(input);
  }
}

function generateFallbackBrief(input: CampaignInput): string {
  return `# Diseño de Campaña
## ${input.name}

### 🌟 Contexto de campaña
${input.description}

### 🎯 Objetivo de la campaña
${input.objectives}

### 🎬 ¿Qué vas a hacer?
• Crear un video UGC de 30 a 60 segundos sobre ${input.productType}
• Comunicar los mensajes clave de la campaña
• Seguir la guía creativa entregada por el equipo CoMa
• Publicar el video en ${input.platform} después de aprobación

### 📢 ¿Qué queremos que comuniques?
${input.keyMessages}

### 👥 ¿A quién te estás dirigiendo?
${input.targetAudience}

### 💡 Ideas o ejemplos de hooks
(Los hooks serán generados automáticamente cuando se conecte la API de IA)

### ✅ Checklist para tu contenido
• Duración: entre 30 y 45 segundos
• Formato vertical 9:16
• Mostrarte hablando o usando elementos visuales
• Buena calidad de imagen y audio (celular está bien)
• Lenguaje cercano, esperanzador, inspirador
• No usar logos ni marcas registradas

### 📍 ¿Dónde se va a publicar?
• En ${input.platform}, desde tu cuenta personal
• Debe ser aprobado por el equipo antes de subir

### 💰 ¿Cómo es tu pago?
Como siempre, esta campaña es pagada por contenido entregado y validado. Recibirás una remuneración de $${input.paymentAmount} dentro de los 30 días calendario siguientes. Vos ya sos parte del equipo. No es un concurso ni sorteo: creás, publicás y te pagamos. 🎬💚

### 🔗 Call to Action
${input.callToAction}

### 📅 Fechas
| | Fecha |
|---|---|
| Producción | ${input.startDate} |
| Entrega máxima | ${input.deliveryDate} |
| Publicación máxima | ${input.endDate} |

${input.additionalNotes ? `### Notas adicionales\n${input.additionalNotes}` : ""}`;
}
