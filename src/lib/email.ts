// Transactional email adapter. Resend when configured; console fallback otherwise.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  delivered: boolean;
  provider: "resend" | "console";
  detail?: string;
}

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("[email:console] to=%s subject=%s\n%s", msg.to, msg.subject, msg.html);
    return { delivered: false, provider: "console", detail: "RESEND_API_KEY not set — logged to console" };
  }
  const from = process.env.EMAIL_FROM || "CrewOS <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.error("[email:resend] send failed (%s): %s — falling back to console log", res.status, detail);
      console.log("[email:console] to=%s subject=%s\n%s", msg.to, msg.subject, msg.html);
      return { delivered: false, provider: "console", detail };
    }
    return { delivered: true, provider: "resend" };
  } catch (e) {
    const detail = e instanceof Error ? e.message : "network error";
    console.error("[email:resend] network failure: %s — falling back to console log", detail);
    console.log("[email:console] to=%s subject=%s\n%s", msg.to, msg.subject, msg.html);
    return { delivered: false, provider: "console", detail };
  }
}

export function shellEmail(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#09090b;padding:32px;font-family:ui-sans-serif,system-ui,sans-serif;color:#e4e4e7">
  <div style="max-width:520px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px">
    <div style="font-size:13px;letter-spacing:.2em;color:#10b981;font-weight:700">CREWOS</div>
    <h1 style="font-size:20px;margin:12px 0 16px">${title}</h1>
    <div style="font-size:14px;line-height:1.6;color:#a1a1aa">${bodyHtml}</div>
    ${
      cta
        ? `<a href="${cta.url}" style="display:inline-block;margin-top:20px;background:#10b981;color:#052e16;font-weight:700;padding:10px 18px;border-radius:8px;text-decoration:none">${cta.label}</a>`
        : ""
    }
  </div></body></html>`;
}
