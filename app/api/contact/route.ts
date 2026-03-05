import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { ratelimit, getClientIp } from "@/lib/ratelimit";

// 5 contact messages per hour per IP
const contactLimiter = ratelimit({ limit: 5, windowMs: 60 * 60 * 1000 });

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: parseInt(process.env.SMTP_PORT || "587") === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!contactLimiter(getClientIp(req))) {
    return NextResponse.json(
      { error: "Demasiados mensajes. Espera un momento." },
      { status: 429 }
    );
  }

  const { name, email, subject, message } = await req.json();

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Campos requeridos incompletos" }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP not configured");
    return NextResponse.json({ error: "Servicio de email no configurado" }, { status: 503 });
  }

  try {
    const transport = createTransport();
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER!;
    const fromName = process.env.SMTP_FROM_NAME || "VALE";
    const toEmail = process.env.CONTACT_EMAIL || fromEmail;

    // Send notification to VALE team
    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      replyTo: `"${name.trim()}" <${email.trim()}>`,
      subject: `[VALE Contacto] ${subject?.trim() || "Nuevo mensaje"}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
          <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 24px;">VALE — Nuevo mensaje de contacto</h1>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #565C5C; font-size: 13px; width: 80px;">Nombre</td><td style="padding: 8px 0; font-weight: 600;">${name.trim()}</td></tr>
            <tr><td style="padding: 8px 0; color: #565C5C; font-size: 13px;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email.trim()}" style="color: #114F51;">${email.trim()}</a></td></tr>
            ${subject ? `<tr><td style="padding: 8px 0; color: #565C5C; font-size: 13px;">Asunto</td><td style="padding: 8px 0;">${subject.trim()}</td></tr>` : ""}
          </table>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0; line-height: 1.7; white-space: pre-line;">${message.trim().slice(0, 2000)}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 16px;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
        </div>
      `,
    });

    // Send auto-reply to the sender
    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email.trim(),
      subject: "Hemos recibido tu mensaje — VALE",
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
          <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
          <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">¡Gracias por escribirnos, ${name.trim().split(" ")[0]}!</h2>
          <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
            Hemos recibido tu mensaje y te responderemos en menos de 24 horas.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email error:", err);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
