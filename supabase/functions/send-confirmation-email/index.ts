import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(dateKey: string, language: string): string {
  const months: Record<string, string[]> = {
    sq: ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nentor", "Dhjetor"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  };
  const parts = dateKey.split("-");
  if (parts.length === 2) {
    const month = parseInt(parts[0]) - 1;
    const day = parts[1];
    const monthName = months[language]?.[month] || months["sq"][month];
    return day + " " + monthName + " 2026";
  }
  return dateKey;
}

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
    const formattedDate = formatDate(bookingDate, language);
    
    const subject = isEn 
      ? "Booking Confirmed - " + packageType + " Classes + 1 FREE"
      : "Rezervimi u Konfirmua - " + packageType + " Klase + 1 FALAS";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background:#452F21;padding:50px 40px;text-align:center;">
              <img src="https://i.ibb.co/tT95h4s2/unnamed.png" alt="WellNest Pilates" style="height:90px;width:auto;">
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding:50px 50px 30px;">
              
              <!-- Greeting -->
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;color:#2d2d2d;margin:0 0 15px;">
                ${isEn ? "Hello" : "Pershendetje"}, ${customerName}
              </h1>
              
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#555555;line-height:1.7;margin:0 0 30px;">
                ${isEn 
                  ? "Thank you for booking with us. Your reservation is now confirmed." 
                  : "Faleminderit qe u regjistruat ne listen tone. Rezervimi juaj eshte konfirmuar."}
              </p>
              
              <!-- Booking Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin-bottom:30px;">
                <tr>
                  <td style="padding:30px;">
                    
                    <p style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888888;margin:0 0 8px;">
                      ${isEn ? "PACKAGE" : "PAKETA"}
                    </p>
                    <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#2d2d2d;margin:0 0 20px;font-weight:600;">
                      ${packageType} ${isEn ? "classes" : "klase"}
                    </p>
                    
                    <p style="font-family:Arial,sans-serif;font-size:13px;color:#4CAF50;font-weight:600;margin:0 0 20px;">
                      +1 ${isEn ? "FREE CLASS" : "KLASE FALAS"}!
                    </p>
                    
                    <div style="border-top:1px solid #e5e5e5;padding-top:20px;margin-top:10px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="50%" style="padding-right:15px;">
                            <p style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888888;margin:0 0 8px;">
                              ${isEn ? "TOTAL" : "TOTALI"}
                            </p>
                            <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#2d2d2d;margin:0;">
                              ${totalClasses} ${isEn ? "classes" : "klase"}
                            </p>
                          </td>
                          <td width="50%">
                            <p style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888888;margin:0 0 8px;">
                              ${isEn ? "PRICE" : "CMIMI"}
                            </p>
                            <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#2d2d2d;margin:0;">
                              ${packagePrice} DEN
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="border-top:1px solid #e5e5e5;padding-top:20px;margin-top:20px;">
                      <p style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#888888;margin:0 0 8px;">
                        ${isEn ? "FIRST CLASS" : "KLASA E PARE"}
                      </p>
                      <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#2d2d2d;margin:0;">
                        ${formattedDate}
                      </p>
                      <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#666666;margin:5px 0 0;">
                        ${isEn ? "at" : "ora"} ${bookingTime}
                      </p>
                    </div>
                    
                  </td>
                </tr>
              </table>
              
              <!-- Instructions -->
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#555555;line-height:1.7;margin:0 0 10px;">
                <strong>${isEn ? "What to bring:" : "Cfare te sillni:"}</strong>
              </p>
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#555555;line-height:1.7;margin:0 0 30px;">
                ${isEn 
                  ? "Please arrive 10 minutes early. Bring a towel and water bottle."
                  : "Ju lutem arrini 10 minuta para fillimit. Sillni peshqir dhe shishe uji."}
              </p>
              
              <!-- Signature -->
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#555555;margin:0 0 5px;">
                ${isEn ? "With respect," : "Me respekt,"}
              </p>
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#2d2d2d;font-weight:600;margin:0;">
                ${isEn ? "The Wellnest Pilates Team" : "Ekipi i Wellnest Pilates"}
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;padding:25px 50px;border-top:1px solid #e5e5e5;">
              <p style="font-family:Arial,sans-serif;font-size:13px;color:#888888;margin:0 0 5px;text-align:center;">
                Gjuro Gjakovikj 59, Kumanovo 1300
              </p>
              <p style="font-family:Arial,sans-serif;font-size:12px;color:#aaaaaa;margin:0;text-align:center;">
                © 2026 WellNest Pilates
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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