import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

// Supabase's "Send SMS Hook" fires whenever it needs to deliver a phone OTP.
// We intercept it and deliver the code over WhatsApp via MSG91 instead of SMS.
// Supabase still generates the OTP and validates it on verifyOtp — we only
// change the delivery channel. WhatsApp is not subject to Indian DLT/SMS rules.
const DEFAULT_WA_ENDPOINT =
  "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

type HookPayload = {
  user?: { phone?: string };
  sms?: { otp?: string };
};

function hookSecret(): string {
  const raw = Deno.env.get("SEND_SMS_HOOK_SECRET");
  if (!raw) throw new Error("SEND_SMS_HOOK_SECRET is not set");
  return raw.replace(/^v1,whsec_/, "");
}

/** MSG91 expects digits only, with country code (e.g. 919876543210). */
function toDigits(e164: string): string {
  return e164.replace(/\D/g, "");
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function sendWhatsAppOtp(otp: string, e164Phone: string): Promise<Response> {
  const authkey = requireEnv("MSG91_AUTHKEY");
  const integratedNumber = toDigits(requireEnv("MSG91_WA_INTEGRATED_NUMBER"));
  const templateName = requireEnv("MSG91_WA_TEMPLATE_NAME");

  const endpoint = Deno.env.get("MSG91_WA_ENDPOINT") ?? DEFAULT_WA_ENDPOINT;
  const langCode = Deno.env.get("MSG91_WA_TEMPLATE_LANG") ?? "en_US";
  const namespace = Deno.env.get("MSG91_WA_NAMESPACE");
  // Authentication templates require a "copy code" URL button carrying the OTP.
  const includeButton = (Deno.env.get("MSG91_WA_INCLUDE_BUTTON") ?? "true") !== "false";

  const components: Record<string, unknown> = {
    body_1: { type: "text", value: otp },
  };
  if (includeButton) {
    components.button_1 = { subtype: "url", type: "text", value: otp };
  }

  const template: Record<string, unknown> = {
    name: templateName,
    language: { code: langCode, policy: "deterministic" },
    to_and_components: [
      {
        to: [toDigits(e164Phone)],
        components,
      },
    ],
  };
  if (namespace) template.namespace = namespace;

  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey,
    },
    body: JSON.stringify({
      integrated_number: integratedNumber,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template,
      },
    }),
  });
}

function jsonError(httpCode: number, message: string, status = httpCode): Response {
  return new Response(JSON.stringify({ error: { http_code: httpCode, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret());
    const { user, sms } = wh.verify(payload, headers) as HookPayload;

    const phone = user?.phone ?? "";
    const otp = sms?.otp ?? "";
    if (!phone || !otp) {
      return jsonError(400, "Missing phone or OTP in hook payload");
    }

    const response = await sendWhatsAppOtp(otp, phone);
    const body = await response.text();

    // MSG91 sometimes returns 200 with an error type in the body.
    let msg91Failed = !response.ok;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.type && String(parsed.type).toLowerCase() === "error") {
        msg91Failed = true;
      }
    } catch {
      // non-JSON body; rely on HTTP status only
    }

    if (msg91Failed) {
      console.error("[sms-hook] MSG91 WhatsApp error", response.status, body);
      return jsonError(response.status || 502, `MSG91 WhatsApp send failed: ${body}`);
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[sms-hook]", error);
    const message = error instanceof Error ? error.message : "Failed to send WhatsApp OTP";
    return jsonError(500, message);
  }
});
