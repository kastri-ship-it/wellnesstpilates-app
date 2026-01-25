import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ============ TYPES ============

type PackageType = 
  | 'single'
  | 'package4' | 'package8' | 'package12'
  | 'individual1' | 'individual8' | 'individual12'
  | 'duo1' | 'duo8' | 'duo12';

type ServiceType = 'single' | 'package' | 'individual' | 'duo';

type ReservationStatus = 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'no_show' | 'expired';
type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';
type PackageStatus = 'pending' | 'active' | 'fully_used' | 'expired' | 'cancelled';
type ActivationStatus = 'pending' | 'activated' | 'expired';

// ============ HELPER FUNCTIONS ============

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'WN-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3) code += '-';
  }
  return code;
}

function extractServiceType(packageType: PackageType): ServiceType {
  if (packageType === 'single') return 'single';
  if (packageType.startsWith('individual')) return 'individual';
  if (packageType.startsWith('duo')) return 'duo';
  if (packageType.startsWith('package')) return 'package';
  return 'single';
}

function extractSessionCount(packageType: PackageType): number {
  if (packageType === 'single') return 1;
  const match = packageType.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 50;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

function constructFullDate(dateKey: string, timeSlot: string): string {
  const [month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const year = 2026; // Hardcoded for now
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

function calculateExpiry(activationDate: string): string {
  const date = new Date(activationDate);
  date.setMonth(date.getMonth() + 6);
  return date.toISOString();
}

async function sendActivationEmail(
  email: string,
  name: string,
  surname: string,
  activationCode: string,
  packageType: PackageType,
  firstSessionDetails?: {
    date: string;
    timeSlot: string;
    endTime: string;
    instructor: string;
  }
) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  let packageInfo = '';
  let packageName = '';
  const sessionCount = extractSessionCount(packageType);

  if (packageType === 'single') {
    packageInfo = 'Single Session - 500 DEN';
    packageName = 'Single Session';
  } else if (packageType === 'package4') {
    packageInfo = '4 Classes Package - 1800 DEN';
    packageName = '4 Classes';
  } else if (packageType === 'package8') {
    packageInfo = '8 Classes Package - 3400 DEN';
    packageName = '8 Classes';
  } else if (packageType === 'package12') {
    packageInfo = '12 Classes Package - 4800 DEN';
    packageName = '12 Classes';
  } else if (packageType === 'individual1') {
    packageInfo = '1-on-1 Single Session - 1200 DEN';
    packageName = '1-on-1 Session';
  } else if (packageType === 'individual8') {
    packageInfo = '1-on-1 8 Sessions - 8800 DEN';
    packageName = '1-on-1 8 Sessions';
  } else if (packageType === 'individual12') {
    packageInfo = '1-on-1 12 Sessions - 12000 DEN';
    packageName = '1-on-1 12 Sessions';
  } else if (packageType === 'duo1') {
    packageInfo = 'DUO Single Session - 1600 DEN';
    packageName = 'DUO Session';
  } else if (packageType === 'duo8') {
    packageInfo = 'DUO 8 Sessions - 12000 DEN';
    packageName = 'DUO 8 Sessions';
  } else if (packageType === 'duo12') {
    packageInfo = 'DUO 12 Sessions - 16800 DEN';
    packageName = 'DUO 12 Sessions';
  }

  const firstSessionHtml = firstSessionDetails ? `
    <div style="background-color: #e8f5e9; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: #2e7d32; font-size: 18px;">📅 Your First Session</h3>
      <p style="margin: 0; color: #1b5e20; font-size: 15px; line-height: 1.6;">
        <strong>Date:</strong> ${firstSessionDetails.date}<br>
        <strong>Time:</strong> ${firstSessionDetails.timeSlot} - ${firstSessionDetails.endTime}<br>
        <strong>Instructor:</strong> ${firstSessionDetails.instructor}
      </p>
    </div>
    <p style="margin: 0 0 20px 0; color: #6b5949; font-size: 15px; line-height: 1.6;">
      <strong>Remaining sessions:</strong> ${sessionCount - 1} more session${sessionCount - 1 !== 1 ? 's' : ''} to book through your dashboard.
    </p>
  ` : '';

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
                      Thank you for choosing WellNest Pilates! Your ${packageName} ${firstSessionDetails ? 'package is ready to be activated' : 'booking is confirmed'}.
                    </p>
                    
                    <div style="background-color: #f5f0ed; border-radius: 12px; padding: 24px; margin: 30px 0;">
                      <p style="margin: 0 0 12px 0; color: #6b5949; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Activation Code</p>
                      <p style="margin: 0; color: #3d2f28; font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                        ${activationCode}
                      </p>
                    </div>
                    
                    <div style="background-color: #fff8f0; border-left: 4px solid #9ca571; padding: 16px; margin: 24px 0;">
                      <p style="margin: 0; color: #6b5949; font-size: 14px; line-height: 1.6;">
                        <strong style="color: #3d2f28;">Package Details:</strong><br>
                        ${packageInfo}
                      </p>
                    </div>
                    
                    ${firstSessionHtml}
                    
                    <h3 style="margin: 30px 0 16px 0; color: #3d2f28; font-size: 18px;">How to Activate:</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #6b5949; font-size: 15px; line-height: 1.8;">
                      <li>Open the WellNest Pilates booking app</li>
                      <li>Click on "Member Login" or "Activate Member Area"</li>
                      <li>Enter your email and the activation code above</li>
                      <li>Start ${firstSessionDetails ? 'booking your remaining sessions' : 'enjoying your Pilates journey'}!</li>
                    </ol>
                    
                    <div style="background-color: #f5f0ed; border-radius: 12px; padding: 20px; margin: 30px 0;">
                      <p style="margin: 0 0 12px 0; color: #3d2f28; font-size: 14px; font-weight: 600;">Important:</p>
                      <ul style="margin: 0; padding-left: 20px; color: #6b5949; font-size: 14px; line-height: 1.6;">
                        <li>Payment is due in the studio before your session</li>
                        <li>Please arrive 10 minutes early for your first session</li>
                        <li>Cancellations must be made at least 24 hours in advance</li>
                        <li>This activation code expires in 24 hours</li>
                      </ul>
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
        subject: firstSessionDetails 
          ? `Activate Your ${packageName} Package - WellNest Pilates`
          : `Confirm Your Booking - WellNest Pilates`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email sending failed:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending activation email:', error);
    throw error;
  }
}

// ============ HEALTH CHECK ============

app.get("/make-server-b87b0c07/health", (c) => {
  return c.json({ status: "ok", model: "unified_package_reservation" });
});

// Continue in next file due to length...
// This is part 1 of the new backend implementation

Deno.serve(app.fetch);
