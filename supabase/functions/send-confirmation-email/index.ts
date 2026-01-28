import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, customerName, packageType, packagePrice, bookingDate, bookingTime, language = "sq" } = body;

    if (!to || !customerName || !packageType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalClasses = parseInt(packageType) + 1;
    const isEn = language === "en";
    
    const subject = isEn 
      ? "Booking Confirmed - " + packageType + " Classes + 1 FREE"
      : "Rezervimi u Konfirmua - " + packageType + " Klase + 1 FALAS";

    const html = "<!DOCTYPE html><html><body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;'><table width='100%' cellpadding='0' cellspacing='0' style='padding:40px 20px;'><tr><td align='center'><table width='600' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;'><tr><td style='background:#8B7355;padding:30px;text-align:center;'><h1 style='color:#fff;margin:0;font-size:28px;'>WELLNEST PILATES</h1></td></tr><tr><td style='padding:40px;text-align:center;'><div style='width:80px;height:80px;background:#4CAF50;border-radius:50%;margin:0 auto;line-height:80px;'><span style='color:#fff;font-size:40px;'>✓</span></div><h2 style='color:#333;margin:20px 0 10px;'>" + (isEn ? "Booking Confirmed!" : "Rezervimi u Konfirmua!") + "</h2><p style='color:#666;'>" + (isEn ? "Hello" : "Pershendetje") + ", " + customerName + "</p></td></tr><tr><td style='padding:0 40px 30px;'><table width='100%' style='background:#f8f6f3;border-radius:8px;'><tr><td style='padding:25px;'><p><strong>" + (isEn ? "Package" : "Paketa") + ":</strong> " + packageType + " " + (isEn ? "classes" : "klase") + "</p><p style='color:#4CAF50;'><strong>+1 " + (isEn ? "FREE CLASS" : "KLASE FALAS") + "!</strong></p><p><strong>" + (isEn ? "Total" : "Totali") + ":</strong> " + totalClasses + " " + (isEn ? "classes" : "klase") + "</p><p><strong>" + (isEn ? "Price" : "Cmimi") + ":</strong> " + packagePrice + " LEK</p><p><strong>" + (isEn ? "Date" : "Data") + ":</strong> " + bookingDate + "</p><p><strong>" + (isEn ? "Time" : "Ora") + ":</strong> " + bookingTime + "</p></td></tr></table></td></tr><tr><td style='background:#f8f6f3;padding:25px;text-align:center;'><p style='color:#999;font-size:12px;'>© 2026 WellNest Pilates</p></td></tr></table></td></tr></table></body></html>";

    console.log("Sending email to:", to);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "WellNest Pilates <info@wellnestpilates.com>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const responseText = await res.text();
    console.log("Resend response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid response from Resend", raw: responseText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Resend API error", details: data }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});