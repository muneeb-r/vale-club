import https from "node:https";
import { lookup } from "node:dns/promises";

/**
 * Fetch a Graph API access token using client_credentials grant.
 * Scope: https://graph.microsoft.com/.default (requires Mail.Send app permission in Azure AD).
 * Uses node:https to avoid Next.js undici timeout issues.
 */
async function getGraphAccessToken(): Promise<string> {
  const tenantId = process.env.SMTP_TENANT_ID!;
  const clientId = process.env.SMTP_CLIENT_ID!;
  const clientSecret = process.env.SMTP_CLIENT_SECRET!;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  }).toString();

  // Pre-resolve DNS to avoid Next.js dev mode stalling on node:https requests
  const { address } = await lookup("login.microsoftonline.com");

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: address,
        servername: "login.microsoftonline.com",
        path: `/${tenantId}/oauth2/v2.0/token`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
          "Host": "login.microsoftonline.com",
        },
        timeout: 15000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (!json.access_token) {
              reject(new Error(`Graph token fetch failed: ${data}`));
            } else {
              resolve(json.access_token as string);
            }
          } catch {
            reject(new Error(`Graph token parse error: ${data}`));
          }
        });
      },
    );

    req.on("timeout", () => { req.destroy(); reject(new Error("Graph token request timed out")); });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Send an email via Microsoft Graph API /sendMail endpoint.
 * Requires Mail.Send application permission granted in Azure AD.
 */
async function sendViaGraph({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER!;
  const fromName = process.env.SMTP_FROM_NAME || "VALE";
  const [accessToken, { address: graphIp }] = await Promise.all([
    getGraphAccessToken(),
    lookup("graph.microsoft.com"),
  ]);

  const payload = JSON.stringify({
    message: {
      subject,
      body: { contentType: "HTML", content: html },
      toRecipients: [{ emailAddress: { address: to } }],
      from: { emailAddress: { name: fromName, address: fromEmail } },
    },
    saveToSentItems: false,
  });

  await new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        host: graphIp,
        servername: "graph.microsoft.com",
        path: `/v1.0/users/${encodeURIComponent(fromEmail)}/sendMail`,
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "Host": "graph.microsoft.com",
        },
        timeout: 20000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          // Graph returns 202 Accepted on success (no body)
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Graph sendMail failed ${res.statusCode}: ${data}`));
          }
        });
      },
    );
    req.on("timeout", () => { req.destroy(); reject(new Error("Graph sendMail timed out")); });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

interface SendPasswordResetEmailOptions {
  to: string;
  resetUrl: string;
  locale?: string;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  locale = "es",
}: SendPasswordResetEmailOptions) {
  const isEs = locale === "es";

  const subject = isEs
    ? "Restablecer tu contraseña — VALE"
    : "Reset your password — VALE";

  const html = isEs
    ? `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Restablece tu contraseña</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
          Haz clic en el botón de abajo para crear una nueva contraseña.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Restablecer contraseña
        </a>
        <p style="color: #565C5C; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
          Este enlace expira en <strong>1 hora</strong>.<br>
          Si no solicitaste este cambio, puedes ignorar este mensaje.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
      </div>
    `
    : `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Reset your password</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset the password for your account.
          Click the button below to create a new password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Reset password
        </a>
        <p style="color: #565C5C; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
          This link expires in <strong>1 hour</strong>.<br>
          If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Business Directory</p>
      </div>
    `;

  await sendViaGraph({ to, subject, html });
}

interface SendRenewalWarningEmailOptions {
  to: string;
  businessName: string;
  planName: string;
  expiryDate: Date;
  locale?: string;
}

export async function sendRenewalWarningEmail({
  to,
  businessName,
  planName,
  expiryDate,
  locale = "es",
}: SendRenewalWarningEmailOptions) {
  const appUrl = process.env.APP_URL || "https://vale.club";

  const isEs = locale === "es";
  const dateStr = expiryDate.toLocaleDateString(isEs ? "es-GT" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = isEs
    ? `Tu plan ${planName} vence pronto — VALE`
    : `Your ${planName} plan expires soon — VALE`;

  const html = isEs
    ? `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Tu suscripción vence en 7 días</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          Hola, el plan <strong>${planName}</strong> de <strong>${businessName}</strong> vencerá el <strong>${dateStr}</strong>.
        </p>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Para mantener tus beneficios activos, contacta al equipo de VALE para renovar tu suscripción antes de la fecha de vencimiento.
        </p>
        <a href="${appUrl}/dashboard/plan" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Ver mi plan
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
          Si ya realizaste el pago, puedes ignorar este mensaje.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
      </div>
    `
    : `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Your subscription expires in 7 days</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          Hi, the <strong>${planName}</strong> plan for <strong>${businessName}</strong> will expire on <strong>${dateStr}</strong>.
        </p>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          To keep your benefits active, please contact the VALE team to renew your subscription before the expiry date.
        </p>
        <a href="${appUrl}/dashboard/plan" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          View my plan
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
          If you've already made the payment, you can ignore this message.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Business Directory</p>
      </div>
    `;

  await sendViaGraph({ to, subject, html });
}

interface SendPlanExpiredEmailOptions {
  to: string;
  businessName: string;
  planName: string;
  locale?: string;
}

export async function sendPlanExpiredEmail({
  to,
  businessName,
  planName,
  locale = "es",
}: SendPlanExpiredEmailOptions) {
  const appUrl = process.env.APP_URL || "https://vale.club";

  const isEs = locale === "es";

  const subject = isEs
    ? `Tu plan ${planName} ha vencido — VALE`
    : `Your ${planName} plan has expired — VALE`;

  const html = isEs
    ? `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Tu suscripción ha vencido</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          El plan <strong>${planName}</strong> de <strong>${businessName}</strong> ha vencido y tu negocio ha sido cambiado al plan gratuito.
        </p>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Para volver a activar los beneficios premium, solicita una nueva suscripción desde tu panel.
        </p>
        <a href="${appUrl}/dashboard/plan" style="display: inline-block; background: #E05C2A; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Renovar suscripción
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
      </div>
    `
    : `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Your subscription has expired</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          The <strong>${planName}</strong> plan for <strong>${businessName}</strong> has expired and your business has been moved to the free plan.
        </p>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          To re-activate premium benefits, submit a new subscription request from your dashboard.
        </p>
        <a href="${appUrl}/dashboard/plan" style="display: inline-block; background: #E05C2A; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Renew subscription
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Business Directory</p>
      </div>
    `;

  await sendViaGraph({ to, subject, html });
}

// ─── Business approve / reject ────────────────────────────────────────────────

interface SendBusinessApprovedEmailOptions {
  to: string;
  businessName: string;
  slug: string;
  locale?: string;
}

export async function sendBusinessApprovedEmail({
  to,
  businessName,
  slug,
  locale = "es",
}: SendBusinessApprovedEmailOptions) {
  const appUrl = process.env.APP_URL || "https://vale.club";
  const profileUrl = `${appUrl}/empresa/${slug}`;
  const isEs = locale === "es";

  const subject = isEs
    ? `¡Tu empresa "${businessName}" ha sido aprobada — VALE`
    : `Your business "${businessName}" has been approved — VALE`;

  const html = isEs
    ? `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">¡Tu empresa ha sido aprobada! 🎉</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          Nos complace informarte que <strong>${businessName}</strong> ya está activa en el directorio de VALE y visible para todos los usuarios.
        </p>
        <a href="${profileUrl}" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Ver perfil
        </a>
        <p style="color: #565C5C; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
          Desde tu panel puedes actualizar la información de tu empresa, gestionar reseñas y más.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
      </div>
    `
    : `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Your business has been approved! 🎉</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          We're happy to let you know that <strong>${businessName}</strong> is now live in the VALE directory and visible to all users.
        </p>
        <a href="${profileUrl}" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          View profile
        </a>
        <p style="color: #565C5C; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
          From your dashboard you can update your business info, manage reviews, and more.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Business Directory</p>
      </div>
    `;

  await sendViaGraph({ to, subject, html });
}

interface SendBusinessRejectedEmailOptions {
  to: string;
  businessName: string;
  reason?: string;
  locale?: string;
}

export async function sendBusinessRejectedEmail({
  to,
  businessName,
  reason,
  locale = "es",
}: SendBusinessRejectedEmailOptions) {
  const appUrl = process.env.APP_URL || "https://vale.club";
  const isEs = locale === "es";

  const subject = isEs
    ? `Tu empresa "${businessName}" no ha sido aprobada — VALE`
    : `Your business "${businessName}" was not approved — VALE`;

  const reasonBlock = reason
    ? isEs
      ? `<div style="background: #fef2f2; border-left: 3px solid #f87171; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;"><p style="margin: 0; color: #b91c1c; font-size: 14px; line-height: 1.6;"><strong>Motivo:</strong> ${reason}</p></div>`
      : `<div style="background: #fef2f2; border-left: 3px solid #f87171; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;"><p style="margin: 0; color: #b91c1c; font-size: 14px; line-height: 1.6;"><strong>Reason:</strong> ${reason}</p></div>`
    : "";

  const html = isEs
    ? `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Solicitud de empresa no aprobada</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          Lamentamos informarte que la solicitud de <strong>${businessName}</strong> no ha sido aprobada en este momento.
        </p>
        ${reasonBlock}
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Si crees que hay un error o quieres corregir la información, puedes actualizar tu perfil desde el panel y contactar al equipo de VALE.
        </p>
        <a href="${appUrl}/dashboard" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Ir al panel
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
      </div>
    `
    : `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Business application not approved</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          We're sorry to inform you that the application for <strong>${businessName}</strong> has not been approved at this time.
        </p>
        ${reasonBlock}
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          If you believe this is an error or would like to correct your information, you can update your profile from the dashboard and reach out to the VALE team.
        </p>
        <a href="${appUrl}/dashboard" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Go to dashboard
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Business Directory</p>
      </div>
    `;

  await sendViaGraph({ to, subject, html });
}

// ─── Business submitted for review ───────────────────────────────────────────

interface SendBusinessInReviewEmailOptions {
  to: string;
  businessName: string;
  locale?: string;
}

export async function sendBusinessInReviewEmail({
  to,
  businessName,
  locale = "es",
}: SendBusinessInReviewEmailOptions) {
  const appUrl = process.env.APP_URL || "https://vale.club";
  const isEs = locale === "es";

  const subject = isEs
    ? `Solicitud de empresa recibida — VALE`
    : `Business application received — VALE`;

  const html = isEs
    ? `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">¡Solicitud recibida!</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          Hemos recibido la solicitud de <strong>${businessName}</strong> para aparecer en el directorio de VALE.
        </p>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Nuestro equipo revisará tu perfil en los próximos días y recibirás un correo con la decisión. Puedes seguir editando tu información desde el panel mientras tanto.
        </p>
        <a href="${appUrl}/dashboard" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Ir al panel
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
      </div>
    `
    : `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Application received!</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          We've received the application for <strong>${businessName}</strong> to be listed in the VALE directory.
        </p>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Our team will review your profile in the coming days and you'll receive an email with the decision. You can continue editing your information from the dashboard in the meantime.
        </p>
        <a href="${appUrl}/dashboard" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Go to dashboard
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Business Directory</p>
      </div>
    `;

  await sendViaGraph({ to, subject, html });
}

// ─── Subscription approve / reject ───────────────────────────────────────────

interface SendSubscriptionApprovedEmailOptions {
  to: string;
  businessName: string;
  planName: string;
  featuredUntil: Date;
  locale?: string;
}

export async function sendSubscriptionApprovedEmail({
  to,
  businessName,
  planName,
  featuredUntil,
  locale = "es",
}: SendSubscriptionApprovedEmailOptions) {
  const appUrl = process.env.APP_URL || "https://vale.club";
  const isEs = locale === "es";
  const dateStr = featuredUntil.toLocaleDateString(isEs ? "es-GT" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = isEs
    ? `Suscripción aprobada — ${planName} activo en VALE`
    : `Subscription approved — ${planName} active on VALE`;

  const html = isEs
    ? `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">¡Suscripción activada! 🚀</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          El plan <strong>${planName}</strong> de <strong>${businessName}</strong> ha sido aprobado y está activo hasta el <strong>${dateStr}</strong>.
        </p>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Tu empresa ahora aparece destacada en el directorio con todos los beneficios del plan premium.
        </p>
        <a href="${appUrl}/dashboard/plan" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Ver mi plan
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
      </div>
    `
    : `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Subscription activated! 🚀</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          The <strong>${planName}</strong> plan for <strong>${businessName}</strong> has been approved and is active until <strong>${dateStr}</strong>.
        </p>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Your business is now featured in the directory with all the benefits of the premium plan.
        </p>
        <a href="${appUrl}/dashboard/plan" style="display: inline-block; background: #114F51; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          View my plan
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Business Directory</p>
      </div>
    `;

  await sendViaGraph({ to, subject, html });
}

interface SendSubscriptionRejectedEmailOptions {
  to: string;
  businessName: string;
  planName: string;
  reason?: string;
  locale?: string;
}

export async function sendSubscriptionRejectedEmail({
  to,
  businessName,
  planName,
  reason,
  locale = "es",
}: SendSubscriptionRejectedEmailOptions) {
  const appUrl = process.env.APP_URL || "https://vale.club";
  const isEs = locale === "es";

  const subject = isEs
    ? `Solicitud de suscripción rechazada — VALE`
    : `Subscription request rejected — VALE`;

  const reasonBlock = reason
    ? isEs
      ? `<div style="background: #fef2f2; border-left: 3px solid #f87171; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;"><p style="margin: 0; color: #b91c1c; font-size: 14px; line-height: 1.6;"><strong>Motivo:</strong> ${reason}</p></div>`
      : `<div style="background: #fef2f2; border-left: 3px solid #f87171; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;"><p style="margin: 0; color: #b91c1c; font-size: 14px; line-height: 1.6;"><strong>Reason:</strong> ${reason}</p></div>`
    : "";

  const html = isEs
    ? `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Solicitud de suscripción rechazada</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          La solicitud del plan <strong>${planName}</strong> para <strong>${businessName}</strong> no ha podido ser procesada.
        </p>
        ${reasonBlock}
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          Puedes enviar una nueva solicitud desde tu panel una vez resuelto el problema.
        </p>
        <a href="${appUrl}/dashboard/plan" style="display: inline-block; background: #E05C2A; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Intentar de nuevo
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Directorio de Empresas</p>
      </div>
    `
    : `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #010A0A;">
        <h1 style="font-size: 24px; font-weight: 700; color: #114F51; margin: 0 0 8px;">VALE</h1>
        <h2 style="font-size: 18px; font-weight: 600; margin: 24px 0 12px;">Subscription request rejected</h2>
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 16px;">
          The <strong>${planName}</strong> plan request for <strong>${businessName}</strong> could not be processed.
        </p>
        ${reasonBlock}
        <p style="color: #565C5C; line-height: 1.6; margin: 0 0 24px;">
          You can submit a new request from your dashboard once the issue has been resolved.
        </p>
        <a href="${appUrl}/dashboard/plan" style="display: inline-block; background: #E05C2A; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-weight: 600; font-size: 15px;">
          Try again
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VALE — Business Directory</p>
      </div>
    `;

  await sendViaGraph({ to, subject, html });
}
