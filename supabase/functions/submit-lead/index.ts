/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = "re_UgkVMq9k_BH26hQBP48XS8poNXzfsajEx";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, email, business_type, service_needed, instagram, tiktok, facebook, message } = body;

    if (!name || !email || !service_needed) {
      return new Response(JSON.stringify({ ok: false, error: "Faltan campos requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save lead using service role key — bypasses PostgREST schema cache entirely
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await adminClient.from("leads").insert([{
      name,
      email,
      business_type: business_type || null,
      service_needed,
      instagram: instagram || null,
      tiktok: tiktok || null,
      facebook: facebook || null,
      message: message || null,
    }]);

    if (dbError) {
      console.error("DB insert error:", JSON.stringify(dbError));
    }

    // Build email content
    const socialLines = [
      instagram ? `Instagram: @${instagram}` : null,
      tiktok ? `TikTok: @${tiktok}` : null,
      facebook ? `Facebook: @${facebook}` : null,
    ].filter(Boolean).join("<br>") || "No proporcionadas";

    const internalHtml = `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <div style="background:linear-gradient(135deg,#C94208,#F59E0B);padding:32px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:22px;">Nueva solicitud de llamada gratuita</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Candela — Lead entrante</p>
        </div>
        <div style="background:#f9f9f7;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:13px;color:#666;width:40%;">Nombre</td><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:14px;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:13px;color:#666;">Email</td><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:14px;"><a href="mailto:${email}" style="color:#C94208;">${email}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:13px;color:#666;">Tipo de negocio</td><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:14px;">${business_type || "No especificado"}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:13px;color:#666;">Servicio solicitado</td><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:14px;font-weight:600;color:#C94208;">${service_needed}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:13px;color:#666;vertical-align:top;">Redes sociales</td><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;font-size:14px;">${socialLines}</td></tr>
            ${message ? `<tr><td style="padding:10px 0;font-size:13px;color:#666;vertical-align:top;">Mensaje</td><td style="padding:10px 0;font-size:14px;">${message}</td></tr>` : ""}
          </table>
          <div style="margin-top:24px;padding:16px;background:#fff3ed;border-left:3px solid #C94208;border-radius:4px;">
            <p style="margin:0;font-size:13px;color:#666;">Responde directamente a este email o escribe a <strong>${email}</strong></p>
          </div>
        </div>
      </div>`;

    const confirmationHtml = `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <div style="background:linear-gradient(135deg,#C94208,#F59E0B);padding:40px 32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:26px;font-weight:700;">¡Gracias por agendar tu llamada gratuita!</h1>
          <p style="color:rgba(255,255,255,0.9);margin:12px 0 0;font-size:15px;">Hemos recibido tu solicitud correctamente</p>
        </div>
        <div style="background:#ffffff;padding:40px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;">
          <p style="font-size:16px;color:#333;margin:0 0 16px;">Hola <strong>${name}</strong>,</p>
          <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">Recibimos tu solicitud para agendar una llamada gratuita con el equipo de <strong>Candela</strong>. Nos pondremos en contacto contigo en menos de <strong>24 horas</strong>.</p>
          <div style="background:#f9f9f7;border-radius:10px;padding:24px;margin:0 0 28px;">
            <p style="font-size:13px;color:#888;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Resumen de tu solicitud</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;font-size:13px;color:#888;width:45%;">Servicio de interés</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#C94208;">${service_needed}</td></tr>
              ${business_type ? `<tr><td style="padding:8px 0;font-size:13px;color:#888;">Tipo de negocio</td><td style="padding:8px 0;font-size:14px;">${business_type}</td></tr>` : ""}
            </table>
          </div>
          <div style="border-top:1px solid #efefef;padding-top:24px;text-align:center;">
            <p style="font-size:13px;color:#aaa;margin:0;">El equipo de <strong style="color:#C94208;">Candela</strong></p>
          </div>
        </div>
      </div>`;

    const [internalRes] = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Candela <hello@wearecandela.com>",
          to: ["hello@wearecandela.com"],
          reply_to: email,
          subject: `Nueva solicitud de llamada — ${name}`,
          html: internalHtml,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Candela <hello@wearecandela.com>",
          to: [email],
          subject: "¡Gracias por agendar tu llamada gratuita con Candela!",
          html: confirmationHtml,
        }),
      }),
    ]);

    if (!internalRes.ok) {
      const errBody = await internalRes.text();
      throw new Error(`Error email: ${internalRes.status} ${errBody}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-lead error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
