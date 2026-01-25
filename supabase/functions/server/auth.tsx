// Authentication system helper functions and endpoints
// This file contains the double opt-in authentication system

import * as kv from "./kv_store.tsx";

export async function sendPasswordSetupEmail(email: string, name: string, surname: string, verificationToken: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const setupLink = `https://wellnest-pilates.com/setup-password?token=${verificationToken}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f0ed;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0ed; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background-color: #9ca571; padding: 40px 40px 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">WellNest Pilates</h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Gjuro Gjakovikj 59, Kumanovo 1300</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #3d2f28; font-size: 24px;">Welcome, ${name}${surname ? ' ' + surname : ''}! 🎉</h2>
                    
                    <p style="margin: 0 0 20px 0; color: #6b5949; font-size: 16px; line-height: 1.6;">
                      Thank you for registering with WellNest Pilates! To complete your registration and access your member area, please set up your password.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${setupLink}" style="display: inline-block; background-color: #9ca571; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">Set Up Password</a>
                    </div>
                    
                    <p style="margin: 20px 0; color: #8b7764; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:<br>
                      <span style="color: #9ca571; word-break: break-all;">${setupLink}</span>
                    </p>
                    
                    <div style="background-color: #fff8f0; border-left: 4px solid #9ca571; padding: 16px; margin: 24px 0;">
                      <p style="margin: 0; color: #6b5949; font-size: 14px; line-height: 1.6;">
                        <strong style="color: #3d2f28;">Important:</strong><br>
                        • This link will expire in 24 hours<br>
                        • After setting up your password, you can log in to book classes<br>
                        • Activation codes for packages will be sent separately by our admin
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f5f0ed; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #6b5949; font-size: 14px;">Questions? Contact us:</p>
                    <p style="margin: 0; color: #9ca571; font-size: 14px;">
                      📍 Gjuro Gjakovikj 59, Kumanovo 1300<br>
                      📧 info@wellnest-pilates.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WellNest Pilates <onboarding@resend.dev>',
        to: [email],
        subject: 'Complete Your Registration - WellNest Pilates',
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email sending failed:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log('Password setup email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending password setup email:', error);
    throw error;
  }
}

export async function hashPassword(password: string, email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + email); // Add email as salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
