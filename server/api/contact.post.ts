import { Resend } from "resend";

interface ContactPayload {
  name: string;
  email: string;
  msg: string;
}

interface ContactSuccessResponse {
  ok: true;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildEmailHtml({ name, email, msg }: ContactPayload): string {
  return `
    <div style="background:#0a0a0f; padding:32px; font-family:'JetBrains Mono','Courier New',monospace;">
      <div style="max-width:520px; margin:0 auto; background:#000; border:1px solid #00ff88; box-shadow:0 0 22px rgba(0,255,136,0.25);">
        <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:#0a0a0f; border-bottom:1px solid #2a2a35;">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#ff5f56;"></span>
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#ffbd2e;"></span>
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#27c93f;"></span>
          <span style="margin-left:8px; font-size:11px; letter-spacing:0.14em; color:#8a8a9a; text-transform:uppercase;">VAULT-OS // NUEVO MENSAJE</span>
        </div>
        <div style="padding:18px 18px 22px; font-size:13px; line-height:1.8; color:#00ff88;">
          <div><span style="color:#00f5ff; margin-right:8px;">vault@arcade:~$</span>./contact --from=web</div>
          <div style="color:#6a6a78;">[OK] Mensaje recibido desde el formulario de contacto</div>
          <div style="margin-top:12px;">&gt; NOMBRE: ${escapeHtml(name)}</div>
          <div>&gt; EMAIL: ${escapeHtml(email)}</div>
          <div style="margin-top:12px; white-space:pre-wrap;">&gt; MENSAJE:\n${escapeHtml(msg)}</div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default defineEventHandler(async (event): Promise<ContactSuccessResponse> => {
  const body = await readBody<Partial<ContactPayload>>(event);

  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const msg = body?.msg?.trim() ?? "";

  if (!name || !email || !msg) {
    throw createError({ statusCode: 400, statusMessage: "Todos los campos son obligatorios." });
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createError({ statusCode: 400, statusMessage: "El formato del email no es válido." });
  }

  const runtimeConfig = useRuntimeConfig();
  const resend = new Resend(runtimeConfig.resendApiKey);

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: runtimeConfig.resendToEmail,
    replyTo: email,
    subject: `Nuevo mensaje de contacto de ${name}`,
    html: buildEmailHtml({ name, email, msg })
  });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message ?? "No se pudo enviar el mensaje." });
  }

  return { ok: true };
});
