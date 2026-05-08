// Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email)
// Usamos HTTP API en lugar de SMTP porque Render free bloquea outbound 465/587.
// HTTP API usa 443 (siempre permitido), misma API key.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 15_000;

const MOTIVO_LABELS = {
  'proyectos': 'Proyectos',
  'informes': 'Informes',
  'bolsa-de-trabajo': 'Bolsa de trabajo'
};

function safe (s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

export function buildContactEmail (lead, meta = {}) {
  const motivoLabel = MOTIVO_LABELS[lead.motivo] || lead.motivo;
  const subject = `[Slowcraft · ${motivoLabel}] ${lead.nombre} — ${lead.cargo}`;

  const text =
`Nuevo contacto desde slowcraft.ai

Nombre:       ${lead.nombre}
Email:        ${lead.email}
Cargo:        ${lead.cargo}
Empresa:      ${lead.empresa_web}
Motivo:       ${motivoLabel}

Descripción:
${lead.descripcion}

---
Lead ID:  ${lead.id || '—'}
Recibido: ${meta.created_at || new Date().toISOString()}
IP:       ${meta.ip || '—'}
Referrer: ${meta.referrer || '—'}
UA:       ${meta.user_agent || '—'}
`;

  const empresaUrl = lead.empresa_web.startsWith('http')
    ? lead.empresa_web
    : 'https://' + lead.empresa_web;

  const html = `
<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F0F0E;background:#F5F1EA;padding:32px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;padding:32px;border:1px solid #DDD8D0;">
    <p style="font-size:11px;letter-spacing:2px;color:#7A7570;text-transform:uppercase;margin:0 0 8px;font-weight:500;">Nuevo contacto · ${safe(motivoLabel)}</p>
    <h2 style="font-family:'Newsreader',Georgia,serif;font-weight:400;font-size:28px;margin:0 0 24px;color:#0F0F0E;">${safe(lead.nombre)} <span style="color:#7A7570;font-style:italic;">— ${safe(lead.cargo)}</span></h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5;">
      <tr><td style="padding:8px 0;color:#7A7570;width:120px;vertical-align:top;">Email</td><td style="padding:8px 0;"><a href="mailto:${safe(lead.email)}" style="color:#A8593D;text-decoration:none;">${safe(lead.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#7A7570;vertical-align:top;">Empresa</td><td style="padding:8px 0;"><a href="${safe(empresaUrl)}" target="_blank" rel="noopener" style="color:#A8593D;text-decoration:none;">${safe(lead.empresa_web)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#7A7570;vertical-align:top;">Motivo</td><td style="padding:8px 0;">${safe(motivoLabel)}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #DDD8D0;margin:24px 0;">
    <p style="font-size:11px;letter-spacing:2px;color:#7A7570;text-transform:uppercase;margin:0 0 12px;font-weight:500;">Descripción</p>
    <p style="font-size:15px;line-height:1.6;white-space:pre-wrap;margin:0;">${safe(lead.descripcion)}</p>
    <hr style="border:none;border-top:1px solid #DDD8D0;margin:24px 0;">
    <p style="font-size:11px;color:#B5B0A8;font-family:'Courier New',monospace;line-height:1.5;margin:0;">Lead #${safe(String(lead.id || '—'))} · ${safe(meta.created_at || new Date().toISOString())}<br>IP ${safe(meta.ip || '—')} · Referrer ${safe(meta.referrer || '—')}</p>
  </div>
</body></html>`;

  return { subject, text, html };
}

export async function sendContactEmail (lead, meta = {}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }
  if (!process.env.CONTACT_FROM_EMAIL || !process.env.CONTACT_TO_EMAIL) {
    throw new Error('CONTACT_FROM_EMAIL y CONTACT_TO_EMAIL son obligatorios');
  }

  const { subject, text, html } = buildContactEmail(lead, meta);

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL,
      to: [process.env.CONTACT_TO_EMAIL],
      reply_to: lead.email,
      subject,
      text,
      html
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS)
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Resend HTTP ${res.status}: ${errBody.slice(0, 300)}`);
  }

  return await res.json();
}
