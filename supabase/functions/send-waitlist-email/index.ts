import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const LOGO_URL = "https://azqkguctispoctvmpmci.supabase.co/storage/v1/object/sign/Logo/wellnestpilates_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yYjI3MjJkNi04NTZmLTQzZTYtYjI0My0xNTMzM2E4NzAzZWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMb2dvL3dlbGxuZXN0cGlsYXRlc19sb2dvLnBuZyIsImlhdCI6MTc2OTU1NjYwNiwiZXhwIjoxODAxMDkyNjA2fQ.JfL5XPlVZtq1oI_abB4H5tGEJqhgB1uRNtwInmlg9KI";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
function getAlbanianEmail(greeting, name, code) {
  const displayName = name && name.trim() ? `, ${name}` : '';
  return {
    subject: "Wellnest eshte hapur - kodi juaj i listes se pritjes",
    html: `
<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Language" content="sq">
  <title>Wellnest Pilates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f7f5f3;">
    Vendosni kodin ne checkout gjate blerjes se paketes. Vlen 90 dite.
  </div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f5f3;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px;">
          
          <tr>
            <td align="center" style="padding: 48px 24px; background-color: #452f21; border-radius: 8px 8px 0 0;">
              <img src="${LOGO_URL}" alt="Wellnest Pilates" width="480" style="display: block; max-width: 480px; width: 100%; height: auto;">
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px 32px 32px 32px; background-color: #ffffff;">
              
              <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; line-height: 1.3;">
                Pershendetje${displayName}
              </h1>
              
              <p style="font-size: 16px; line-height: 1.6; color: #3d3d3d; margin: 0 0 12px 0;">
                Faleminderit qe u regjistruat ne listen tone te pritjes. Rezervimet tani jane te hapura.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #3d3d3d; margin: 0 0 28px 0;">
                Si falenderim, keni perfituar nje bonus te vecante. Vendosni kodin ne checkout gjate blerjes se paketes.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="background-color: #fcfcfb; border: 1px solid #e5e5e0; border-left: 3px solid #6b7c5e; border-radius: 8px; padding: 24px;">
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7c5e; margin: 0 0 8px 0; font-weight: 600;">
                      Perfitimi i listes se pritjes
                    </p>
                    <p style="font-size: 17px; font-weight: 600; color: #1a1a1a; margin: 0 0 6px 0; line-height: 1.4;">
                      1 seance bonus shtohet vetem pasi blini pakete me 8 ose me shume
                    </p>
                    <p style="font-size: 14px; color: #5a5a5a; margin: 0 0 12px 0;">
                      Paguani 8, merrni 9 seanca
                    </p>
                    <p style="font-size: 13px; color: #888888; margin: 0;">
                      Nuk vlen per seance teke, 1 on 1, ose duo.
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                <tr>
                  <td style="background-color: #ffffff; border: 1px solid #e5e5e0; border-left: 3px solid #6b7c5e; border-radius: 8px; padding: 20px 24px;">
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888; margin: 0 0 8px 0;">
                      Kodi juaj personal
                    </p>
                    <p style="font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 22px; font-weight: 600; color: #1a1a1a; letter-spacing: 2px; margin: 0;">
                      ${code}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 13px; color: #888888; margin: 0 0 28px 0; line-height: 1.5;">
                Vlen per paketat 8, 10, 12. Vendoset ne checkout. Vlen 90 dite. Nje perdorim.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 4px 0 28px 0;">
                    <a href="https://wellnestpilates.com/packages?code=${code}" style="display: inline-block; background-color: #6b7c5e; color: #ffffff; text-decoration: none; padding: 14px 48px; border-radius: 12px; font-size: 15px; font-weight: 600; line-height: 1;">
                      Zgjidh paketen
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="border-top: 1px solid #e5e5e0; margin: 0 0 24px 0;"></div>
              
              <p style="font-size: 15px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">
                Si ta perdorni kodin
              </p>
              
              <p style="font-size: 15px; line-height: 1.7; color: #3d3d3d; margin: 0 0 8px 0;">1. Hapni faqen e paketave</p>
              <p style="font-size: 15px; line-height: 1.7; color: #3d3d3d; margin: 0 0 8px 0;">2. Zgjidhni paketen 8, 10, ose 12</p>
              <p style="font-size: 15px; line-height: 1.7; color: #3d3d3d; margin: 0 0 20px 0;">3. Ne checkout, vendosni kodin dhe shtohet 1 seance bonus</p>
              
              <p style="font-size: 14px; color: #888888; margin: 0 0 28px 0;">
                Nese keni problem me kodin, na shkruani te hello@wellnestpilates.com
              </p>
              
              <div style="border-top: 1px solid #e5e5e0; margin: 0 0 24px 0;"></div>
              
              <p style="font-size: 15px; line-height: 1.6; color: #3d3d3d; margin: 0 0 4px 0;">Me respekt,</p>
              <p style="font-size: 15px; font-weight: 600; color: #1a1a1a; margin: 0;">Ekipi i Wellnest Pilates</p>
              
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e5e5e0; background-color: #fafaf9;">
              <p style="font-size: 13px; color: #888888; margin: 0 0 8px 0; line-height: 1.5;">Gjuro Gjakovcki 59, Kumanovo 1300</p>
              <p style="font-size: 13px; margin: 0 0 12px 0;"><a href="https://www.instagram.com/wellnestpilates.mk/" style="color: #5a5a5a; text-decoration: none;">Instagram</a></p>
              <p style="font-size: 12px; color: #a0a0a0; margin: 0; line-height: 1.5;">Kete email e morret sepse u regjistruat ne listen e pritjes se Wellnest Pilates.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}
function getMacedonianEmail(greeting, name, code) {
  const displayName = name && name.trim() ? `, ${name}` : '';
  return {
    subject: "Wellnest e otvoreno - vashiot kod od listata na chekanje",
    html: `
<!DOCTYPE html>
<html lang="mk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Language" content="mk">
  <title>Wellnest Pilates</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f7f5f3;">
    Vnesete go kodot pri checkout koga kupuvate paket. Vazhi 90 dena.
  </div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f5f3;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px;">
          
          <tr>
            <td align="center" style="padding: 48px 24px; background-color: #452f21; border-radius: 8px 8px 0 0;">
              <img src="${LOGO_URL}" alt="Wellnest Pilates" width="480" style="display: block; max-width: 480px; width: 100%; height: auto;">
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px 32px 32px 32px; background-color: #ffffff;">
              
              <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; line-height: 1.3;">
                Zdravo${displayName}
              </h1>
              
              <p style="font-size: 16px; line-height: 1.6; color: #3d3d3d; margin: 0 0 12px 0;">
                Vi blagodarime shto se registriravte na nashata lista na chekanje. Rezervaciite sega se otvoreni.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #3d3d3d; margin: 0 0 28px 0;">
                Kako blagodarnost, imate poseben bonus. Vnesete go kodot pri checkout koga kupuvate paket.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="background-color: #fcfcfb; border: 1px solid #e5e5e0; border-left: 3px solid #6b7c5e; border-radius: 8px; padding: 24px;">
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7c5e; margin: 0 0 8px 0; font-weight: 600;">
                      Benefit od listata na chekanje
                    </p>
                    <p style="font-size: 17px; font-weight: 600; color: #1a1a1a; margin: 0 0 6px 0; line-height: 1.4;">
                      1 bonus seansa se dodava samo otkako kje kupite paket od 8 ili povekje
                    </p>
                    <p style="font-size: 14px; color: #5a5a5a; margin: 0 0 12px 0;">
                      Plakjate 8, dobivate 9 seansi
                    </p>
                    <p style="font-size: 13px; color: #888888; margin: 0;">
                      Ne vazhi za edna seansa, 1 on 1, ili duo.
                    </p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                <tr>
                  <td style="background-color: #ffffff; border: 1px solid #e5e5e0; border-left: 3px solid #6b7c5e; border-radius: 8px; padding: 20px 24px;">
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888888; margin: 0 0 8px 0;">
                      Vashiot lichen kod
                    </p>
                    <p style="font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 22px; font-weight: 600; color: #1a1a1a; letter-spacing: 2px; margin: 0;">
                      ${code}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 13px; color: #888888; margin: 0 0 28px 0; line-height: 1.5;">
                Vazhi za paketi 8, 10, 12. Se vnesuva pri checkout. Vazhi 90 dena. Edna upotreba.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 4px 0 28px 0;">
                    <a href="https://wellnestpilates.com/packages?code=${code}" style="display: inline-block; background-color: #6b7c5e; color: #ffffff; text-decoration: none; padding: 14px 48px; border-radius: 12px; font-size: 15px; font-weight: 600; line-height: 1;">
                      Izberi paket
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="border-top: 1px solid #e5e5e0; margin: 0 0 24px 0;"></div>
              
              <p style="font-size: 15px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">
                Kako da go koristite kodot
              </p>
              
              <p style="font-size: 15px; line-height: 1.7; color: #3d3d3d; margin: 0 0 8px 0;">1. Otvorete ja stranicata so paketi</p>
              <p style="font-size: 15px; line-height: 1.7; color: #3d3d3d; margin: 0 0 8px 0;">2. Izberete paket 8, 10, ili 12</p>
              <p style="font-size: 15px; line-height: 1.7; color: #3d3d3d; margin: 0 0 20px 0;">3. Pri checkout, vnesete go kodot i se dodava 1 bonus seansa</p>
              
              <p style="font-size: 14px; color: #888888; margin: 0 0 28px 0;">
                Ako imate problem so kodot, pisheteni na hello@wellnestpilates.com
              </p>
              
              <div style="border-top: 1px solid #e5e5e0; margin: 0 0 24px 0;"></div>
              
              <p style="font-size: 15px; line-height: 1.6; color: #3d3d3d; margin: 0 0 4px 0;">So pochit,</p>
              <p style="font-size: 15px; font-weight: 600; color: #1a1a1a; margin: 0;">Timot na Wellnest Pilates</p>
              
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e5e5e0; background-color: #fafaf9;">
              <p style="font-size: 13px; color: #888888; margin: 0 0 8px 0; line-height: 1.5;">Gjuro Gjakovchki 59, Kumanovo 1300</p>
              <p style="font-size: 13px; margin: 0 0 12px 0;"><a href="https://www.instagram.com/wellnestpilates.mk/" style="color: #5a5a5a; text-decoration: none;">Instagram</a></p>
              <p style="font-size: 12px; color: #a0a0a0; margin: 0; line-height: 1.5;">Ovoj email go dobivte bidejki se registriravte na listata na chekanje na Wellnest Pilates.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const { memberId, email, name, language, greeting, code } = await req.json();
    if (!email || !code) {
      return new Response(JSON.stringify({
        error: "Missing email or code"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const emailContent = language === "mk" ? getMacedonianEmail(greeting || "Zdravo", name || "", code) : getAlbanianEmail(greeting || "Pershendetje", name || "", code);
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "Wellnest Pilates <onboarding@resend.dev>",
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      })
    });
    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      return new Response(JSON.stringify({
        error: "Failed to send",
        details: errorData
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from("waitlist_members").update({
      status: "invited",
      invited_at: new Date().toISOString()
    }).eq("id", memberId);
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
