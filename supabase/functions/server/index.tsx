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
    allowHeaders: ["Content-Type", "Authorization", "X-Session-Token"],
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
  const year = 2026;
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

function calculateExpiry(activationDate: string): string {
  const date = new Date(activationDate);
  date.setMonth(date.getMonth() + 6);
  return date.toISOString();
}

function getPackagePriceInfo(packageType: PackageType): { price: number, label: string, description: string } {
  const priceMap = {
    single: { price: 500, label: 'Single Session', description: '500 DEN per session' },
    package4: { price: 1800, label: '4 Classes Package', description: '450 DEN per session' },
    package8: { price: 3400, label: '8 Classes Package', description: '425 DEN per session' },
    package12: { price: 4800, label: '12 Classes Package', description: '400 DEN per session' },
    individual1: { price: 1200, label: '1-on-1 Single Session', description: 'Private training' },
    individual8: { price: 8800, label: '1-on-1 8 Sessions', description: '1100 DEN per session' },
    individual12: { price: 12000, label: '1-on-1 12 Sessions', description: '1000 DEN per session' },
    duo1: { price: 1600, label: 'DUO Single Session', description: 'For 2 people' },
    duo8: { price: 12000, label: 'DUO 8 Sessions', description: '1500 DEN per session' },
    duo12: { price: 16800, label: 'DUO 12 Sessions', description: '1400 DEN per session' },
  };
  return priceMap[packageType] || priceMap.single;
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

  const { price, label: packageName } = getPackagePriceInfo(packageType);
  const packageInfo = `${packageName} - ${price} DEN`;
  const sessionCount = extractSessionCount(packageType);

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

async function sendRegistrationEmail(
  email: string,
  name: string,
  surname: string,
  verificationToken: string,
  packageType: PackageType,
  firstSessionDate: string,
  firstSessionTime: string,
  firstSessionEndTime: string,
  appUrl: string
) {
  console.log('📧 === INSIDE sendRegistrationEmail() ===');
  console.log('📧 To:', email);
  console.log('📧 Name:', name, surname);
  console.log('📧 Package:', packageType);
  console.log('📧 Session date:', firstSessionDate);
  console.log('📧 Session time:', firstSessionTime, '-', firstSessionEndTime);
  
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  console.log('📧 RESEND_API_KEY exists?', !!RESEND_API_KEY);
  console.log('📧 RESEND_API_KEY value:', RESEND_API_KEY ? `${RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET');
  
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  // App URL is passed from frontend so it works in preview AND production
  const setupLink = `${appUrl}#/setup-password?token=${verificationToken}`;
  
  console.log(`📧 Registration link: ${setupLink}`);
  const { label: packageName } = getPackagePriceInfo(packageType);
  console.log('📧 Package name:', packageName);

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
                      Thank you for booking with WellNest Pilates! Your ${packageName} is ready to be activated. To access your member area and manage your bookings, please complete your registration.
                    </p>
                    
                    <div style="background-color: #e8f5e9; border-radius: 12px; padding: 24px; margin: 24px 0;">
                      <h3 style="margin: 0 0 16px 0; color: #2e7d32; font-size: 18px;">📅 Your First Session</h3>
                      <p style="margin: 0; color: #1b5e20; font-size: 15px; line-height: 1.6;">
                        <strong>Date:</strong> ${firstSessionDate}<br>
                        <strong>Time:</strong> ${firstSessionTime} - ${firstSessionEndTime}
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${setupLink}" style="display: inline-block; background-color: #9ca571; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">Complete Registration</a>
                    </div>
                    
                    <p style="margin: 20px 0; color: #8b7764; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:<br>
                      <span style="color: #9ca571; word-break: break-all;">${setupLink}</span>
                    </p>
                    
                    <div style="background-color: #fff8f0; border-left: 4px solid #9ca571; padding: 16px; margin: 24px 0;">
                      <p style="margin: 0; color: #6b5949; font-size: 14px; line-height: 1.6;">
                        <strong style="color: #3d2f28;">Important:</strong><br>
                        • This link will expire in 24 hours<br>
                        • After setting up your password, you can log in anytime<br>
                        • Your package activation code will be sent separately by our admin after payment confirmation<br>
                        • You can log in before receiving the activation code
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
    console.log('📧 Preparing to call Resend API...');
    
    const emailPayload = {
      from: 'WellNest Pilates <onboarding@resend.dev>',
      to: [email],
      subject: 'Complete Your Registration - WellNest Pilates',
      html: emailHtml,
    };
    
    console.log('📧 Email payload:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlLength: emailHtml.length
    });
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 Resend API response status:', emailResponse.status);
    console.log('📧 Resend API response ok?', emailResponse.ok);

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ Email sending failed. Status:', emailResponse.status);
      console.error('❌ Error response:', errorText);
      throw new Error(`Failed to send email (${emailResponse.status}): ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log('✅ Registration email sent successfully!');
    console.log('✅ Resend response:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in sendRegistrationEmail():', error);
    console.error('❌ Error message:', error.message);
    if (error.stack) {
      console.error('❌ Stack trace:', error.stack);
    }
    throw error;
  }
}

async function calculateSlotCapacity(dateKey: string, timeSlot: string): Promise<{available: number, isBlocked: boolean, isPrivate: boolean}> {
  const allReservations = await kv.getByPrefix('reservation:');
  const slotReservations = allReservations.filter((r: any) => 
    r.dateKey === dateKey && 
    r.timeSlot === timeSlot && 
    (r.reservationStatus === 'confirmed' || r.reservationStatus === 'attended')
  );

  // Check for private session (1-on-1)
  const hasPrivateSession = slotReservations.some((r: any) => r.isPrivateSession);
  if (hasPrivateSession) {
    return { available: 0, isBlocked: true, isPrivate: true };
  }

  // Calculate seats occupied
  const seatsOccupied = slotReservations.reduce((total: number, r: any) => {
    return total + (r.seatsOccupied || 1);
  }, 0);

  return {
    available: Math.max(0, 4 - seatsOccupied),
    isBlocked: seatsOccupied >= 4,
    isPrivate: false
  };
}

// ============ HEALTH CHECK ============

app.get("/make-server-b87b0c07/health", (c) => {
  return c.json({ status: "ok", model: "unified_package_reservation" });
});

// ============ PACKAGE ENDPOINTS ============

// Create package (step 1 of package purchase - does NOT book first session yet)
app.post("/make-server-b87b0c07/packages", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, packageType, name, surname, mobile, email, language, paymentToken } = body;

    // Validate required fields
    if (!userId || !packageType || !name || !surname || !mobile || !email) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Validate packageType
    const validPackageTypes = [
      'single', 'package4', 'package8', 'package12',
      'individual1', 'individual8', 'individual12',
      'duo1', 'duo8', 'duo12'
    ];
    if (!validPackageTypes.includes(packageType)) {
      return c.json({ error: "Invalid package type" }, 400);
    }

    // Single session should not use this endpoint
    if (packageType === 'single') {
      return c.json({ error: "Use /reservations endpoint for single sessions" }, 400);
    }

    // Create or get user
    const userKey = `user:${email}`;
    let user = await kv.get(userKey);
    if (!user) {
      user = {
        id: userKey,
        email,
        name,
        surname,
        mobile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blocked: false
      };
      await kv.set(userKey, user);
      console.log(`User created: ${email}`);
    }

    // Generate package ID
    const packageId = `package:${email}:${Date.now()}`;
    const totalSessions = extractSessionCount(packageType);

    // Generate activation code
    const activationCode = generateActivationCode();
    const codeKey = `activation_code:${activationCode}`;
    const codeExpiry = new Date();
    codeExpiry.setHours(codeExpiry.getHours() + 24);

    // Check if payment token provided
    let paymentStatus: PaymentStatus = 'unpaid';
    let paymentId: string | null = null;

    if (paymentToken) {
      const payment = await kv.get(`payment:token:${paymentToken}`);
      if (payment && !payment.tokenUsed && payment.userId === email) {
        paymentStatus = 'paid';
        paymentId = payment.id;
        payment.tokenUsed = true;
        payment.packageId = packageId;
        payment.linkedAt = new Date().toISOString();
        await kv.set(payment.id, payment);
        console.log(`Payment token ${paymentToken} linked to package ${packageId}`);
      }
    }

    // Create package (without firstReservationId - will be set when first session booked)
    const pkg = {
      id: packageId,
      userId: email,
      packageType,
      totalSessions,
      remainingSessions: totalSessions,
      sessionsBooked: [],
      sessionsAttended: [],
      purchaseDate: new Date().toISOString(),
      activationDate: null,
      expiryDate: null,
      packageStatus: 'pending' as PackageStatus,
      activationStatus: 'pending' as ActivationStatus,
      paymentStatus,
      firstReservationId: null, // Will be set when first session is booked
      paymentId,
      activationCodeId: codeKey,
      name,
      surname,
      mobile,
      email,
      language: language || 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(packageId, pkg);

    // Create activation code
    const activationCodeData = {
      id: codeKey,
      code: activationCode,
      email,
      packageId,
      reservationId: null,
      status: 'active',
      expiresAt: codeExpiry.toISOString(),
      usedAt: null,
      createdAt: new Date().toISOString()
    };

    await kv.set(codeKey, activationCodeData);

    console.log(`Package created: ${packageId}, activation code: ${activationCode}`);
    console.log('⚠️  First session NOT yet booked - user must select date/time next');

    // DO NOT send email yet - wait for first session booking
    return c.json({
      success: true,
      package: pkg,
      packageId,
      activationCode,
      requiresFirstSessionBooking: true,
      message: "Package created. Please select date and time for your first session."
    });

  } catch (error) {
    console.error('Error creating package:', error);
    return c.json({ error: 'Failed to create package', details: error.message }, 500);
  }
});

// Book first session for package (step 2 of package purchase - MANDATORY)
app.post("/make-server-b87b0c07/packages/:id/first-session", async (c) => {
  try {
    const packageId = c.req.param('id');
    const body = await c.req.json();
    const { dateKey, timeSlot, instructor, partnerName, partnerSurname, appUrl } = body;

    // Validate required fields
    if (!dateKey || !timeSlot || !instructor) {
      return c.json({ error: "Missing required fields: dateKey, timeSlot, instructor" }, 400);
    }

    if (!appUrl) {
      return c.json({ error: "Missing app URL for email link" }, 400);
    }

    // Get package
    const pkg = await kv.get(packageId);
    if (!pkg) {
      return c.json({ error: "Package not found" }, 404);
    }

    // Validate package is pending and has no first reservation yet
    if (pkg.firstReservationId !== null) {
      return c.json({ error: "First session already booked for this package" }, 400);
    }

    if (pkg.packageStatus !== 'pending') {
      return c.json({ error: "Package is not in pending state" }, 400);
    }

    // Extract service type
    const serviceType = extractServiceType(pkg.packageType);

    // Validate slot availability
    const capacity = await calculateSlotCapacity(dateKey, timeSlot);
    
    if (serviceType === 'individual') {
      // 1-on-1 requires empty slot
      if (capacity.available < 4) {
        return c.json({ error: "Slot not available for 1-on-1 session (must be empty)" }, 400);
      }
    } else if (serviceType === 'duo') {
      // DUO requires 2 seats
      if (capacity.available < 2) {
        return c.json({ error: "Slot does not have enough space for DUO (requires 2 spots)" }, 400);
      }
      if (!partnerName || !partnerSurname) {
        return c.json({ error: "Partner name and surname required for DUO bookings" }, 400);
      }
    } else {
      // Regular package session requires 1 seat
      if (capacity.available < 1) {
        return c.json({ error: "Slot is full" }, 400);
      }
    }

    // Get date string (e.g., "23 January")
    const [month, day] = dateKey.split('-').map(Number);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const dateString = `${day} ${monthNames[month - 1]}`;

    // Create reservation
    const reservationId = `reservation:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullDate = constructFullDate(dateKey, timeSlot);
    const endTime = calculateEndTime(timeSlot);

    const reservation = {
      id: reservationId,
      userId: pkg.email,
      packageId: pkg.id,
      sessionNumber: 1,
      serviceType,
      dateKey,
      date: dateString,
      fullDate,
      timeSlot,
      endTime,
      instructor,
      name: pkg.name,
      surname: pkg.surname,
      email: pkg.email,
      mobile: pkg.mobile,
      partnerName: partnerName || null,
      partnerSurname: partnerSurname || null,
      reservationStatus: 'pending' as ReservationStatus,
      paymentStatus: pkg.paymentStatus, // Inherit from package
      seatsOccupied: serviceType === 'duo' ? 2 : (serviceType === 'individual' ? 4 : 1),
      isPrivateSession: serviceType === 'individual',
      isOverbooked: false,
      isFirstSessionOfPackage: true,
      autoConfirmed: false,
      lateCancellation: false,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activatedAt: null,
      attendedAt: null,
      language: pkg.language
    };

    await kv.set(reservationId, reservation);

    // Update package with first reservation
    pkg.firstReservationId = reservationId;
    pkg.sessionsBooked = [reservationId];
    pkg.updatedAt = new Date().toISOString();
    await kv.set(packageId, pkg);

    // Send registration email with password setup link (NO activation code)
    // Activation code will be sent manually by admin after payment confirmation
    try {
      // Check if user already has password set up
      const user = await kv.get(`user:${pkg.email}`);
      console.log('🔍 Checking user registration status for:', pkg.email);
      console.log('🔍 User exists?', !!user);
      console.log('🔍 User has passwordHash?', !!user?.passwordHash);
      
      if (!user || !user.passwordHash) {
        console.log('✅ User needs registration - preparing to send email...');
        
        // User needs to complete registration - send password setup link
        const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
        const tokenKey = `verification_token:${verificationToken}`;
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24);

        // Store verification token
        const tokenData = {
          id: tokenKey,
          token: verificationToken,
          email: pkg.email,
          expiresAt: tokenExpiry.toISOString(),
          used: false,
          createdAt: new Date().toISOString()
        };
        await kv.set(tokenKey, tokenData);
        console.log('✅ Verification token stored:', tokenKey);

        // Update user with verification token
        if (user) {
          user.verificationToken = verificationToken;
          user.verified = false;
          user.passwordHash = null;
          user.updatedAt = new Date().toISOString();
          await kv.set(`user:${pkg.email}`, user);
          console.log('✅ User record updated');
        }

        // ALWAYS send registration email
        const registrationLink = `${appUrl}#/setup-password?token=${verificationToken}`;
        console.log('📧 About to call sendRegistrationEmail()...');
        console.log('📧 Email:', pkg.email);
        console.log('��� Name:', pkg.name);
        console.log('📧 Surname:', pkg.surname);
        console.log('🔗 Link:', registrationLink);
        
        await sendRegistrationEmail(
          pkg.email,
          pkg.name,
          pkg.surname,
          verificationToken,
          pkg.packageType,
          dateString,
          timeSlot,
          endTime,
          appUrl
        );
        console.log('✅✅✅ Registration email SENT SUCCESSFULLY to:', pkg.email);
      } else {
        // User already has account
        console.log('⚠️ User already has password - no registration email sent');
      }
    } catch (emailError) {
      console.error('❌❌❌ ERROR sending registration email:', emailError);
      console.error('❌ Error details:', emailError.message);
      if (emailError.stack) {
        console.error('❌ Stack trace:', emailError.stack);
      }
      // Don't fail the booking if email fails
    }

    console.log(`First session booked for package ${packageId}: ${reservationId}`);
    console.log(`Reservation: ${dateString} at ${timeSlot}`);
    console.log(`✅ Package purchase flow complete - registration link sent`);
    console.log(`⚠️  Admin must manually send activation code after payment confirmation`);

    return c.json({
      success: true,
      package: pkg,
      reservation,
      message: pkg.isPreviewMode 
        ? "Booking successful! (Preview mode - registration link shown below)" 
        : "Booking successful! Check your email to complete registration.",
      isPreviewMode: pkg.isPreviewMode || false,
      previewRegistrationLink: pkg.previewRegistrationLink || null
    });

  } catch (error) {
    console.error('Error booking first session:', error);
    return c.json({ error: 'Failed to book first session', details: error.message }, 500);
  }
});

// Get packages for user
app.get("/make-server-b87b0c07/packages", async (c) => {
  try {
    const userId = c.req.query('userId');
    
    if (userId) {
      // Get packages for specific user
      const allPackages = await kv.getByPrefix(`package:${userId}:`);
      return c.json({ success: true, packages: allPackages });
    } else {
      // Admin: get all packages
      const allPackages = await kv.getByPrefix('package:');
      return c.json({ success: true, packages: allPackages });
    }
  } catch (error) {
    console.error('Error fetching packages:', error);
    return c.json({ error: 'Failed to fetch packages', details: error.message }, 500);
  }
});

// Get single package
app.get("/make-server-b87b0c07/packages/:id", async (c) => {
  try {
    const packageId = c.req.param('id');
    const pkg = await kv.get(packageId);
    
    if (!pkg) {
      return c.json({ error: 'Package not found' }, 404);
    }

    return c.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error fetching package:', error);
    return c.json({ error: 'Failed to fetch package', details: error.message }, 500);
  }
});

// ============ RESERVATION ENDPOINTS ============

// Create reservation (for single session OR subsequent package sessions)
app.post("/make-server-b87b0c07/reservations", async (c) => {
  try {
    const body = await c.req.json();
    const {
      userId,
      packageId,
      serviceType,
      dateKey,
      timeSlot,
      instructor,
      name,
      surname,
      email,
      mobile,
      partnerName,
      partnerSurname,
      language
    } = body;

    // Validate required fields
    if (!userId || !serviceType || !dateKey || !timeSlot || !instructor) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    if (!name || !surname || !email || !mobile) {
      return c.json({ error: "Missing personal information" }, 400);
    }

    // Determine if this is single session or package session
    const isPackageSession = !!packageId;
    let pkg = null;
    let sessionNumber = null;

    if (isPackageSession) {
      // Get and validate package
      pkg = await kv.get(packageId);
      if (!pkg) {
        return c.json({ error: "Package not found" }, 404);
      }

      if (pkg.userId !== userId) {
        return c.json({ error: "Package does not belong to this user" }, 403);
      }

      if (pkg.packageStatus !== 'active') {
        return c.json({ error: "Package is not active" }, 400);
      }

      if (pkg.remainingSessions <= 0) {
        return c.json({ error: "No remaining sessions in package" }, 400);
      }

      // Check expiry
      if (pkg.expiryDate && new Date(pkg.expiryDate) < new Date()) {
        return c.json({ error: "Package has expired" }, 400);
      }

      sessionNumber = pkg.sessionsBooked.length + 1;
    }

    // Validate slot availability
    const capacity = await calculateSlotCapacity(dateKey, timeSlot);
    
    if (serviceType === 'individual') {
      if (capacity.available < 4) {
        return c.json({ error: "Slot not available for 1-on-1 session (must be empty)" }, 400);
      }
    } else if (serviceType === 'duo') {
      if (capacity.available < 2) {
        return c.json({ error: "Slot does not have enough space for DUO (requires 2 spots)" }, 400);
      }
      if (!partnerName || !partnerSurname) {
        return c.json({ error: "Partner information required for DUO bookings" }, 400);
      }
    } else {
      if (capacity.available < 1) {
        return c.json({ error: "Slot is full" }, 400);
      }
    }

    // Check for duplicate booking (same user, same time)
    const allReservations = await kv.getByPrefix('reservation:');
    const duplicateBooking = allReservations.find((r: any) => 
      r.userId === userId &&
      r.dateKey === dateKey &&
      r.timeSlot === timeSlot &&
      (r.reservationStatus === 'pending' || r.reservationStatus === 'confirmed')
    );

    if (duplicateBooking) {
      return c.json({ error: "You already have a booking at this time" }, 400);
    }

    // Get date string
    const [month, day] = dateKey.split('-').map(Number);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const dateString = `${day} ${monthNames[month - 1]}`;

    // Create reservation
    const reservationId = `reservation:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullDate = constructFullDate(dateKey, timeSlot);
    const endTime = calculateEndTime(timeSlot);

    // Determine reservation status
    // - Single sessions: pending (requires activation)
    // - Subsequent package sessions: confirmed (auto-confirmed)
    const reservationStatus: ReservationStatus = isPackageSession ? 'confirmed' : 'pending';
    const autoConfirmed = isPackageSession;

    const reservation = {
      id: reservationId,
      userId,
      packageId: packageId || null,
      sessionNumber,
      serviceType,
      dateKey,
      date: dateString,
      fullDate,
      timeSlot,
      endTime,
      instructor,
      name,
      surname,
      email,
      mobile,
      partnerName: partnerName || null,
      partnerSurname: partnerSurname || null,
      reservationStatus,
      paymentStatus: (pkg?.paymentStatus || 'unpaid') as PaymentStatus,
      seatsOccupied: serviceType === 'duo' ? 2 : (serviceType === 'individual' ? 4 : 1),
      isPrivateSession: serviceType === 'individual',
      isOverbooked: false,
      isFirstSessionOfPackage: false,
      autoConfirmed,
      lateCancellation: false,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activatedAt: autoConfirmed ? new Date().toISOString() : null,
      attendedAt: null,
      language: language || 'en'
    };

    await kv.set(reservationId, reservation);

    // Handle single session vs package session differently
    if (isPackageSession) {
      // Subsequent package session - update package
      pkg.remainingSessions--;
      pkg.sessionsBooked.push(reservationId);
      pkg.updatedAt = new Date().toISOString();
      
      if (pkg.remainingSessions === 0) {
        pkg.packageStatus = 'fully_used';
      }
      
      await kv.set(packageId, pkg);

      console.log(`Subsequent package session booked: ${reservationId} (session ${sessionNumber}/${pkg.totalSessions})`);
      console.log(`Package ${packageId} remaining sessions: ${pkg.remainingSessions}`);

      return c.json({
        success: true,
        reservation,
        reservationId,
        requiresActivation: false,
        message: "Session booked successfully!",
        package: pkg
      });

    } else {
      // Single session - generate activation code and send email
      const activationCode = generateActivationCode();
      const codeKey = `activation_code:${activationCode}`;
      const codeExpiry = new Date();
      codeExpiry.setHours(codeExpiry.getHours() + 24);

      const activationCodeData = {
        id: codeKey,
        code: activationCode,
        email,
        packageId: null,
        reservationId,
        status: 'active',
        expiresAt: codeExpiry.toISOString(),
        usedAt: null,
        createdAt: new Date().toISOString()
      };

      await kv.set(codeKey, activationCodeData);

      // Create or get user for single session bookings
      const userKey = `user:${email}`;
      let user = await kv.get(userKey);
      
      if (!user) {
        // Create new user
        user = {
          id: userKey,
          email,
          name,
          surname,
          mobile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          blocked: false,
          passwordHash: null,
          verified: false
        };
        await kv.set(userKey, user);
        console.log(`✅ User created for single session booking: ${email}`);
      }

      // Send activation email with activation code
      try {
        await sendActivationEmail(
          email,
          name,
          surname,
          activationCode,
          'single',
          {
            date: dateString,
            timeSlot,
            endTime,
            instructor
          }
        );
        console.log(`✅ Activation email sent with code: ${activationCode}`);
      } catch (emailError) {
        console.error('❌ Failed to send activation email:', emailError);
        // Don't fail the booking if email fails
      }

      // Send registration email if user doesn't have password yet
      try {
        console.log('🔍 Checking if user needs registration email for single session...');
        console.log('🔍 User has passwordHash?', !!user?.passwordHash);
        
        if (!user || !user.passwordHash) {
          console.log('✅ User needs registration - preparing to send email...');
          
          // Generate verification token for password setup
          const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
          const tokenKey = `verification_token:${verificationToken}`;
          const tokenExpiry = new Date();
          tokenExpiry.setHours(tokenExpiry.getHours() + 24);

          // Store verification token
          const tokenData = {
            id: tokenKey,
            token: verificationToken,
            email: email,
            expiresAt: tokenExpiry.toISOString(),
            used: false,
            createdAt: new Date().toISOString()
          };
          await kv.set(tokenKey, tokenData);
          console.log('✅ Verification token stored:', tokenKey);

          // Update user with verification token
          if (user) {
            user.verificationToken = verificationToken;
            user.verified = false;
            user.passwordHash = null;
            user.updatedAt = new Date().toISOString();
            await kv.set(userKey, user);
            console.log('✅ User record updated');
          }

          // Get app URL from request origin
          const appUrl = c.req.header('origin') || c.req.header('referer') || 'https://app.wellnest-pilates.com';
          console.log('📧 About to send registration email for single session...');
          
          await sendRegistrationEmail(
            email,
            name,
            surname,
            verificationToken,
            'single',
            dateString,
            timeSlot,
            endTime,
            appUrl
          );
          console.log('✅✅✅ Registration email SENT SUCCESSFULLY to:', email);
        } else {
          console.log('⚠️ User already has password - no registration email sent');
        }
      } catch (emailError) {
        console.error('❌❌❌ ERROR sending registration email:', emailError);
        console.error('❌ Error details:', emailError.message);
        if (emailError.stack) {
          console.error('❌ Stack trace:', emailError.stack);
        }
        // Don't fail the booking if email fails
      }

      console.log(`Single session reserved: ${reservationId}`);
      console.log(`Activation code: ${activationCode} (sent via email)`);
      console.log(`✅ Complete flow: User created + Activation email sent + Registration email sent`);

      return c.json({
        success: true,
        reservation,
        reservationId,
        requiresActivation: true,
        activationCode,
        message: "Reservation created! Check your email for activation code and registration link."
      });
    }

  } catch (error) {
    console.error('Error creating reservation:', error);
    return c.json({ error: 'Failed to create reservation', details: error.message }, 500);
  }
});

// Get all reservations (with filters)
app.get("/make-server-b87b0c07/reservations", async (c) => {
  try {
    const userId = c.req.query('userId');
    const dateKey = c.req.query('dateKey');
    const status = c.req.query('status');
    const paymentStatus = c.req.query('paymentStatus');

    let reservations = await kv.getByPrefix('reservation:');

    // Apply filters
    if (userId) {
      reservations = reservations.filter((r: any) => r.userId === userId);
    }

    if (dateKey) {
      reservations = reservations.filter((r: any) => r.dateKey === dateKey);
    }

    if (status) {
      reservations = reservations.filter((r: any) => r.reservationStatus === status);
    }

    if (paymentStatus) {
      reservations = reservations.filter((r: any) => r.paymentStatus === paymentStatus);
    }

    console.log(`Retrieved ${reservations.length} reservations (filters: ${JSON.stringify({ userId, dateKey, status, paymentStatus })})`);

    return c.json({ success: true, reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return c.json({ error: 'Failed to fetch reservations', details: error.message }, 500);
  }
});

// Get single reservation
app.get("/make-server-b87b0c07/reservations/:id", async (c) => {
  try {
    const reservationId = c.req.param('id');
    const reservation = await kv.get(reservationId);
    
    if (!reservation) {
      return c.json({ error: 'Reservation not found' }, 404);
    }

    return c.json({ success: true, reservation });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return c.json({ error: 'Failed to fetch reservation', details: error.message }, 500);
  }
});

// Update reservation status
app.patch("/make-server-b87b0c07/reservations/:id/status", async (c) => {
  try {
    const reservationId = c.req.param('id');
    const body = await c.req.json();
    const { status, cancelledBy, cancelReason } = body;

    const reservation = await kv.get(reservationId);
    if (!reservation) {
      return c.json({ error: 'Reservation not found' }, 404);
    }

    const oldStatus = reservation.reservationStatus;

    // Handle cancellation
    if (status === 'cancelled') {
      const now = new Date();
      const sessionTime = new Date(reservation.fullDate);
      const hoursUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      reservation.cancelledAt = now.toISOString();
      reservation.cancelledBy = cancelledBy || 'user';
      reservation.cancelReason = cancelReason || 'User requested cancellation';

      // Determine if late cancellation
      if (hoursUntil < 24 && cancelledBy !== 'admin') {
        reservation.lateCancellation = true;
        
        if (hoursUntil < 2) {
          // Too late - mark as no_show instead
          reservation.reservationStatus = 'no_show';
          console.log(`Cancellation too late (<2hr) - marked as no_show: ${reservationId}`);
        } else {
          // Late cancellation (2-24hr) - flag for admin review
          reservation.reservationStatus = 'cancelled';
          console.log(`Late cancellation (${hoursUntil.toFixed(1)}hr notice) flagged for review: ${reservationId}`);
        }
      } else {
        // Normal cancellation (>24hr or admin)
        reservation.reservationStatus = 'cancelled';
        
        // Refund session if from package
        if (reservation.packageId && (hoursUntil >= 24 || cancelledBy === 'admin')) {
          const pkg = await kv.get(reservation.packageId);
          if (pkg) {
            pkg.remainingSessions++;
            pkg.sessionsBooked = pkg.sessionsBooked.filter((id: string) => id !== reservationId);
            pkg.updatedAt = new Date().toISOString();
            await kv.set(pkg.id, pkg);
            console.log(`Session credited back to package ${pkg.id}: ${pkg.remainingSessions} sessions remaining`);
          }
        }
      }
    } else {
      // Other status changes
      reservation.reservationStatus = status;
      
      if (status === 'attended') {
        reservation.attendedAt = new Date().toISOString();
        
        // Add to package sessionsAttended
        if (reservation.packageId) {
          const pkg = await kv.get(reservation.packageId);
          if (pkg) {
            if (!pkg.sessionsAttended.includes(reservationId)) {
              pkg.sessionsAttended.push(reservationId);
              pkg.updatedAt = new Date().toISOString();
              await kv.set(pkg.id, pkg);
            }
          }
        }
      }
    }

    reservation.updatedAt = new Date().toISOString();
    await kv.set(reservationId, reservation);

    console.log(`Reservation ${reservationId} status updated: ${oldStatus} → ${reservation.reservationStatus}`);

    return c.json({
      success: true,
      reservation,
      message: `Reservation ${status === 'cancelled' ? 'cancelled' : 'updated'} successfully`
    });

  } catch (error) {
    console.error('Error updating reservation status:', error);
    return c.json({ error: 'Failed to update reservation status', details: error.message }, 500);
  }
});

// Delete reservation (admin only)
app.delete("/make-server-b87b0c07/reservations/:id", async (c) => {
  try {
    const reservationId = c.req.param('id');
    
    const reservation = await kv.get(reservationId);
    if (!reservation) {
      return c.json({ error: 'Reservation not found' }, 404);
    }

    // If linked to package, remove from package
    if (reservation.packageId) {
      const pkg = await kv.get(reservation.packageId);
      if (pkg) {
        pkg.sessionsBooked = pkg.sessionsBooked.filter((id: string) => id !== reservationId);
        pkg.sessionsAttended = pkg.sessionsAttended.filter((id: string) => id !== reservationId);
        
        // If this was first reservation, clear it
        if (pkg.firstReservationId === reservationId) {
          pkg.firstReservationId = null;
        }
        
        // Restore session credit if confirmed/attended
        if (reservation.reservationStatus === 'confirmed' || reservation.reservationStatus === 'attended') {
          pkg.remainingSessions++;
        }
        
        pkg.updatedAt = new Date().toISOString();
        await kv.set(pkg.id, pkg);
      }
    }

    await kv.del(reservationId);
    console.log(`Reservation deleted: ${reservationId}`);

    return c.json({ success: true, message: "Reservation deleted successfully" });

  } catch (error) {
    console.error('Error deleting reservation:', error);
    return c.json({ error: 'Failed to delete reservation', details: error.message }, 500);
  }
});

// ============ ACTIVATION ENDPOINT ============

app.post("/make-server-b87b0c07/activate", async (c) => {
  try {
    const body = await c.req.json();
    const { email, code } = body;

    if (!email || !code) {
      return c.json({ error: "Missing email or activation code" }, 400);
    }

    const codeUpper = code.toUpperCase().trim();
    const codeKey = `activation_code:${codeUpper}`;

    // Get activation code
    const activationCode = await kv.get(codeKey);
    
    if (!activationCode) {
      return c.json({ error: "Invalid activation code. Please check the code and try again." }, 400);
    }

    // Validate activation code
    if (activationCode.status === 'used') {
      return c.json({ error: "This activation code has already been used and cannot be reused." }, 400);
    }

    if (new Date(activationCode.expiresAt) < new Date()) {
      return c.json({ error: "This activation code has expired. Please contact support." }, 400);
    }

    if (activationCode.email.toLowerCase() !== email.toLowerCase()) {
      return c.json({ error: "This activation code is not valid for this email address." }, 400);
    }

    // Determine if this is package or reservation activation
    if (activationCode.packageId) {
      // PACKAGE ACTIVATION
      const pkg = await kv.get(activationCode.packageId);
      
      if (!pkg) {
        return c.json({ error: "Package not found." }, 404);
      }

      if (pkg.activationStatus === 'activated') {
        return c.json({ error: "This package is already activated." }, 400);
      }

      // CRITICAL: Validate that first session has been booked
      if (!pkg.firstReservationId) {
        return c.json({ 
          error: "Cannot activate package without first session booked. Please complete the booking flow." 
        }, 400);
      }

      // Get first reservation
      const firstReservation = await kv.get(pkg.firstReservationId);
      if (!firstReservation) {
        return c.json({ error: "First reservation not found. Please contact support." }, 404);
      }

      // Activate package
      const now = new Date().toISOString();
      pkg.packageStatus = 'active';
      pkg.activationStatus = 'activated';
      pkg.activationDate = now;
      pkg.expiryDate = calculateExpiry(now);
      pkg.remainingSessions = pkg.totalSessions - 1; // First session now booked
      pkg.updatedAt = now;
      await kv.set(pkg.id, pkg);

      // Confirm first reservation
      firstReservation.reservationStatus = 'confirmed';
      firstReservation.activatedAt = now;
      firstReservation.updatedAt = now;
      await kv.set(firstReservation.id, firstReservation);

      // Mark activation code as used
      activationCode.status = 'used';
      activationCode.usedAt = now;
      await kv.set(codeKey, activationCode);

      console.log(`Package activated: ${pkg.id}`);
      console.log(`First reservation confirmed: ${firstReservation.id}`);
      console.log(`Remaining sessions: ${pkg.remainingSessions}`);

      return c.json({
        success: true,
        type: 'package',
        package: pkg,
        firstReservation,
        message: "Package activated successfully!"
      });

    } else if (activationCode.reservationId) {
      // RESERVATION ACTIVATION (single session)
      const reservation = await kv.get(activationCode.reservationId);
      
      if (!reservation) {
        return c.json({ error: "Reservation not found." }, 404);
      }

      if (reservation.reservationStatus === 'confirmed') {
        return c.json({ error: "This reservation is already confirmed." }, 400);
      }

      // Confirm reservation
      const now = new Date().toISOString();
      reservation.reservationStatus = 'confirmed';
      reservation.activatedAt = now;
      reservation.updatedAt = now;
      await kv.set(reservation.id, reservation);

      // Mark activation code as used
      activationCode.status = 'used';
      activationCode.usedAt = now;
      await kv.set(codeKey, activationCode);

      console.log(`Reservation confirmed: ${reservation.id}`);

      return c.json({
        success: true,
        type: 'reservation',
        reservation,
        message: "Reservation confirmed successfully!"
      });

    } else {
      return c.json({ error: "Activation code is not linked to any package or reservation." }, 500);
    }

  } catch (error) {
    console.error('Error during activation:', error);
    return c.json({ error: 'Failed to activate', details: error.message }, 500);
  }
});

// ============ LEGACY COMPATIBILITY (for gradual migration) ============

// Legacy /bookings endpoint - maps to reservations
app.get("/make-server-b87b0c07/bookings", async (c) => {
  try {
    console.warn('⚠️  Legacy /bookings endpoint called - use /reservations instead');
    
    // Return reservations as "bookings" for backwards compatibility
    const reservations = await kv.getByPrefix('reservation:');
    
    return c.json({ 
      success: true, 
      bookings: reservations,
      _deprecated: "This endpoint is deprecated. Use /reservations instead."
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return c.json({ error: 'Failed to fetch bookings', details: error.message }, 500);
  }
});

// Legacy POST /bookings endpoint - creates account immediately with password
app.post("/make-server-b87b0c07/bookings", async (c) => {
  console.log('📝 Legacy /bookings POST endpoint called');
  
  try {
    let body;
    try {
      body = await c.req.json();
      console.log('Request body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
    const { name, surname, email, mobile, password, date, dateKey, timeSlot, instructor, selectedPackage, language } = body;
    
    // Validate required fields
    if (!email || !password) {
      console.error('Missing required fields: email or password');
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    if (password.length < 6) {
      console.error('Password too short');
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }
    
    console.log(`Creating booking for ${email}, package: ${selectedPackage || 'single session'}`);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create or update user account immediately with password
    const userKey = `user:${normalizedEmail}`;
    let user = await kv.get(userKey);
    
    if (!user) {
      user = {
        id: userKey,
        email: normalizedEmail,
        name,
        surname,
        mobile,
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blocked: false,
        verified: true  // Immediately verified since they set password
      };
      await kv.set(userKey, user);
      console.log(`✅ User account created with password: ${normalizedEmail}`);
    } else if (!user.passwordHash) {
      // Update existing user with password
      user.passwordHash = passwordHash;
      user.verified = true;
      user.updatedAt = new Date().toISOString();
      await kv.set(userKey, user);
      console.log(`✅ Existing user updated with password: ${normalizedEmail}`);
    } else {
      // User exists with password - verify password matches
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        console.error(`❌ Invalid password for existing user: ${normalizedEmail}`);
        return c.json({ 
          error: 'This email is already registered with a different password. Please enter your correct password or login first.',
          errorType: 'WRONG_PASSWORD'
        }, 400);
      }
      console.log(`✅ Existing user verified with password: ${normalizedEmail}`);
      // Update user info if needed
      user.name = name || user.name;
      user.surname = surname || user.surname;
      user.mobile = mobile || user.mobile;
      user.updatedAt = new Date().toISOString();
      await kv.set(userKey, user);
    }
    
    // Handle package vs single session
    if (selectedPackage) {
      // Package booking - create package and first session
      const packageType = selectedPackage as PackageType;
      const totalSessions = extractSessionCount(packageType);
      const packageId = `package:${normalizedEmail}:${Date.now()}`;
      
      const pkg = {
        id: packageId,
        userId: normalizedEmail,
        packageType,
        totalSessions,
        remainingSessions: totalSessions - 1, // First session will be booked
        sessionsBooked: [],
        sessionsAttended: [],
        purchaseDate: new Date().toISOString(),
        activationDate: null,
        expiryDate: null,
        packageStatus: 'pending' as PackageStatus,
        activationStatus: 'pending' as ActivationStatus,
        paymentStatus: 'unpaid' as PaymentStatus,
        firstReservationId: null,
        paymentId: null,
        activationCodeId: null,
        name,
        surname,
        email: normalizedEmail,
        mobile,
        language: language || 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(packageId, pkg);
      console.log(`✅ Package created: ${packageId}`);
      
      // If package has first session selected, create reservation
      if (dateKey && timeSlot && timeSlot !== 'package') {
        const reservationId = `reservation:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullDate = constructFullDate(dateKey, timeSlot);
        const endTime = calculateEndTime(timeSlot);
        const serviceType = extractServiceType(packageType);
        
        const reservation = {
          id: reservationId,
          userId: normalizedEmail,
          packageId,
          sessionNumber: 1,
          serviceType,
          dateKey,
          date,
          fullDate,
          timeSlot,
          endTime,
          instructor: instructor || 'Rina Krasniqi',
          name,
          surname,
          email: normalizedEmail,
          mobile,
          partnerName: null,
          partnerSurname: null,
          reservationStatus: 'pending' as ReservationStatus,
          paymentStatus: 'unpaid' as PaymentStatus,
          seatsOccupied: serviceType === 'duo' ? 2 : (serviceType === 'individual' ? 4 : 1),
          isPrivateSession: serviceType === 'individual',
          isOverbooked: false,
          isFirstSessionOfPackage: true,
          autoConfirmed: false,
          lateCancellation: false,
          cancelledAt: null,
          cancelledBy: null,
          cancelReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          activatedAt: null,
          attendedAt: null,
          language: language || 'en'
        };
        
        await kv.set(reservationId, reservation);
        
        pkg.firstReservationId = reservationId;
        pkg.sessionsBooked.push(reservationId);
        await kv.set(packageId, pkg);
        
        console.log(`✅ First session reservation created: ${reservationId}`);
      }
      
      // Create session token for auto-login
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      const sessionKey = `session:${sessionToken}`;
      const sessionData = {
        id: sessionKey,
        token: sessionToken,
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
      await kv.set(sessionKey, sessionData);
      
      return c.json({
        success: true,
        message: "Account created! You can now login. Admin will send activation code after payment confirmation.",
        userId: normalizedEmail,
        package: pkg,
        session: sessionToken,
        user: {
          email: normalizedEmail,
          name: user.name,
          surname: user.surname,
          mobile: user.mobile
        }
      });
      
    } else {
      // Single session booking
      const reservationId = `reservation:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fullDate = constructFullDate(dateKey, timeSlot);
      const endTime = calculateEndTime(timeSlot);
      
      const reservation = {
        id: reservationId,
        userId: normalizedEmail,
        packageId: null,
        sessionNumber: null,
        serviceType: 'single' as ServiceType,
        dateKey,
        date,
        fullDate,
        timeSlot,
        endTime,
        instructor: instructor || 'Rina Krasniqi',
        name,
        surname,
        email: normalizedEmail,
        mobile,
        partnerName: null,
        partnerSurname: null,
        reservationStatus: 'pending' as ReservationStatus,
        paymentStatus: 'unpaid' as PaymentStatus,
        seatsOccupied: 1,
        isPrivateSession: false,
        isOverbooked: false,
        isFirstSessionOfPackage: false,
        autoConfirmed: false,
        lateCancellation: false,
        cancelledAt: null,
        cancelledBy: null,
        cancelReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activatedAt: null,
        attendedAt: null,
        language: language || 'en'
      };
      
      await kv.set(reservationId, reservation);
      
      // Generate activation code for single session
      const activationCode = generateActivationCode();
      const codeKey = `activation_code:${activationCode}`;
      const codeExpiry = new Date();
      codeExpiry.setHours(codeExpiry.getHours() + 24);
      
      const activationCodeData = {
        id: codeKey,
        code: activationCode,
        email: normalizedEmail,
        packageId: null,
        reservationId,
        status: 'active',
        expiresAt: codeExpiry.toISOString(),
        usedAt: null,
        createdAt: new Date().toISOString()
      };
      
      await kv.set(codeKey, activationCodeData);
      
      console.log(`✅ Single session reservation created: ${reservationId}`);
      console.log(`✅ Activation code generated: ${activationCode}`);
      
      // Create session token for auto-login
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      const sessionKey = `session:${sessionToken}`;
      const sessionData = {
        id: sessionKey,
        token: sessionToken,
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
      await kv.set(sessionKey, sessionData);
      
      return c.json({
        success: true,
        message: `Account created! You can login now. Your activation code is: ${activationCode}`,
        userId: normalizedEmail,
        reservation,
        activationCode,
        session: sessionToken,
        user: {
          email: normalizedEmail,
          name: user.name,
          surname: user.surname,
          mobile: user.mobile
        }
      });
    }
    
  } catch (error) {
    console.error('Error creating booking:', error);
    return c.json({ error: 'Failed to create booking', details: error.message }, 500);
  }
});

// Legacy /activate-member endpoint
app.post("/make-server-b87b0c07/activate-member", async (c) => {
  console.warn('⚠️  Legacy /activate-member endpoint called - use /activate instead');
  
  // Forward to new activation endpoint
  const body = await c.req.json();
  const { email, code } = body;
  
  // Call the new activation logic
  const activationResult = await app.fetch(
    new Request(`${c.req.url.replace('/activate-member', '/activate')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    })
  );
  
  return activationResult;
});

// ============ MIGRATION ENDPOINT ============

app.post("/make-server-b87b0c07/migrate-bookings", async (c) => {
  console.log("🔄 Starting migration from bookings to packages + reservations...");
  
  const stats = {
    reservations: 0,
    orphanedPackages: 0,
    linkedReservations: 0,
    activationCodes: 0,
    errors: [] as string[]
  };
  
  try {
    // Step 1: Get all old bookings
    const oldBookings = await kv.getByPrefix('booking:');
    console.log(`📦 Found ${oldBookings.length} old bookings to migrate`);
    
    // Step 2: Migrate bookings with date/time → Reservations
    for (const booking of oldBookings) {
      try {
        if (booking.dateKey && booking.timeSlot) {
          // Has date/time → create Reservation
          const serviceType = booking.selectedPackage?.includes('individual') ? 'individual' 
                            : booking.selectedPackage?.includes('duo') ? 'duo'
                            : booking.selectedPackage ? 'package' 
                            : 'single';
          
          const reservation = {
            id: `reservation:${booking.id.replace('booking:', '')}`,
            userId: booking.email,
            packageId: null, // will link later
            serviceType,
            sessionNumber: null,
            dateKey: booking.dateKey,
            date: booking.date,
            fullDate: constructFullDate(booking.dateKey, booking.timeSlot),
            timeSlot: booking.timeSlot,
            endTime: calculateEndTime(booking.timeSlot),
            instructor: booking.instructor || 'Rina Krasniqi',
            name: booking.name,
            surname: booking.surname,
            email: booking.email,
            mobile: booking.mobile,
            partnerName: null,
            partnerSurname: null,
            reservationStatus: booking.status === 'confirmed' ? 'confirmed' : 'pending',
            paymentStatus: 'unpaid' as PaymentStatus,
            seatsOccupied: serviceType === 'duo' ? 2 : (serviceType === 'individual' ? 4 : 1),
            isPrivateSession: serviceType === 'individual',
            isOverbooked: false,
            isFirstSessionOfPackage: false,
            autoConfirmed: false,
            lateCancellation: false,
            cancelledAt: null,
            cancelledBy: null,
            cancelReason: null,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt || booking.createdAt,
            activatedAt: booking.activatedAt || null,
            attendedAt: null,
            language: booking.language || 'en'
          };
          
          await kv.set(reservation.id, reservation);
          stats.reservations++;
          console.log(`  ✓ Migrated booking → reservation: ${reservation.id}`);
        } 
        else if (booking.selectedPackage) {
          // Has package but NO date/time → create orphaned Package
          const packageType = booking.selectedPackage.includes('4') ? 'package4'
                           : booking.selectedPackage.includes('8') ? 'package8'
                           : booking.selectedPackage.includes('12') ? 'package12'
                           : booking.selectedPackage.includes('individual1') ? 'individual1'
                           : booking.selectedPackage.includes('individual8') ? 'individual8'
                           : booking.selectedPackage.includes('individual12') ? 'individual12'
                           : booking.selectedPackage.includes('duo1') ? 'duo1'
                           : booking.selectedPackage.includes('duo8') ? 'duo8'
                           : booking.selectedPackage.includes('duo12') ? 'duo12'
                           : 'package4';
          
          const totalSessions = extractSessionCount(packageType);
          
          const pkg = {
            id: `package:${booking.email}:${Date.parse(booking.createdAt)}`,
            userId: booking.email,
            packageType,
            totalSessions,
            remainingSessions: totalSessions,
            sessionsBooked: [],
            sessionsAttended: [],
            purchaseDate: booking.createdAt,
            activationDate: booking.activatedAt || null,
            expiryDate: booking.activatedAt ? calculateExpiry(booking.activatedAt) : null,
            packageStatus: (booking.status === 'cancelled' ? 'cancelled' 
                          : booking.activatedAt ? 'active' 
                          : 'pending') as PackageStatus,
            activationStatus: (booking.status === 'confirmed' ? 'activated' : 'pending') as ActivationStatus,
            paymentStatus: 'unpaid' as PaymentStatus,
            firstReservationId: null, // ORPHANED
            paymentId: null,
            activationCodeId: null,
            name: booking.name,
            surname: booking.surname,
            mobile: booking.mobile,
            email: booking.email,
            language: booking.language || 'en',
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt || booking.createdAt
          };
          
          await kv.set(pkg.id, pkg);
          await kv.set(`orphaned_package:${pkg.id}`, {userId: booking.email});
          stats.orphanedPackages++;
          console.log(`  ⚠️  Migrated booking → orphaned package: ${pkg.id}`);
        }
      } catch (error) {
        console.error(`  ❌ Error migrating booking ${booking.id}:`, error);
        stats.errors.push(`Booking ${booking.id}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Migration complete!`);
    console.log(`  Reservations created: ${stats.reservations}`);
    console.log(`  Orphaned packages: ${stats.orphanedPackages}`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    return c.json({ 
      success: true, 
      migrated: stats,
      message: "Migration completed. Please review orphaned packages."
    });
    
  } catch (error) {
    console.error("❌ Migration error:", error);
    stats.errors.push(error.message);
    return c.json({ success: false, stats, error: error.message }, 500);
  }
});

// ============ ADMIN UTILITIES ============

// Get orphaned packages
app.get("/make-server-b87b0c07/admin/orphaned-packages", async (c) => {
  try {
    const orphanedKeys = await kv.getByPrefix('orphaned_package:');
    const packages = [];
    
    for (const orphanedData of orphanedKeys) {
      const packageId = orphanedData.id.replace('orphaned_package:', '');
      const pkg = await kv.get(packageId);
      if (pkg) {
        packages.push(pkg);
      }
    }
    
    return c.json({ success: true, orphanedPackages: packages, count: packages.length });
  } catch (error) {
    console.error('Error fetching orphaned packages:', error);
    return c.json({ error: 'Failed to fetch orphaned packages', details: error.message }, 500);
  }
});

// Get calendar view
app.get("/make-server-b87b0c07/admin/calendar", async (c) => {
  try {
    const dateKey = c.req.query('dateKey');
    
    if (!dateKey) {
      return c.json({ error: "dateKey parameter required" }, 400);
    }

    // Get all reservations for this date
    const allReservations = await kv.getByPrefix('reservation:');
    const dateReservations = allReservations.filter((r: any) => r.dateKey === dateKey);

    // Standard time slots
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '16:00', '17:00', '18:00'];
    
    const calendarData = await Promise.all(timeSlots.map(async (timeSlot) => {
      const slotReservations = dateReservations.filter((r: any) => 
        r.timeSlot === timeSlot &&
        (r.reservationStatus === 'confirmed' || r.reservationStatus === 'attended')
      );
      
      const capacity = await calculateSlotCapacity(dateKey, timeSlot);
      
      return {
        timeSlot,
        endTime: calculateEndTime(timeSlot),
        capacity: capacity.available,
        maxCapacity: 4,
        isBlocked: capacity.isBlocked,
        isPrivate: capacity.isPrivate,
        reservations: slotReservations,
        count: slotReservations.length
      };
    }));

    return c.json({ success: true, dateKey, slots: calendarData });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return c.json({ error: 'Failed to fetch calendar', details: error.message }, 500);
  }
});

// ============ DEV UTILITIES ============

// Clear all data (dev only)
app.post("/make-server-b87b0c07/dev/clear-all-data", async (c) => {
  try {
    console.log('🗑️  Clearing all data...');
    
    // Get all keys
    const allReservations = await kv.getByPrefix('reservation:');
    const allPackages = await kv.getByPrefix('package:');
    const allActivationCodes = await kv.getByPrefix('activation_code:');
    const allOrphanedPackages = await kv.getByPrefix('orphaned_package:');
    const allBookings = await kv.getByPrefix('booking:'); // Legacy
    const allMembers = await kv.getByPrefix('member:'); // Legacy
    
    let deletedCount = 0;
    
    // Delete reservations
    for (const item of allReservations) {
      await kv.del(item.id);
      deletedCount++;
    }
    
    // Delete packages
    for (const item of allPackages) {
      await kv.del(item.id);
      deletedCount++;
    }
    
    // Delete activation codes
    for (const item of allActivationCodes) {
      await kv.del(item.id);
      deletedCount++;
    }
    
    // Delete orphaned package markers
    for (const item of allOrphanedPackages) {
      await kv.del(item.id);
      deletedCount++;
    }
    
    // Delete legacy bookings
    for (const item of allBookings) {
      await kv.del(item.id);
      deletedCount++;
    }
    
    // Delete legacy members
    for (const item of allMembers) {
      await kv.del(item.id);
      deletedCount++;
    }
    
    console.log(`✅ Cleared ${deletedCount} items from database`);
    
    return c.json({ 
      success: true, 
      cleared: {
        reservations: allReservations.length,
        packages: allPackages.length,
        activationCodes: allActivationCodes.length,
        orphanedPackages: allOrphanedPackages.length,
        bookings: allBookings.length,
        members: allMembers.length,
        total: deletedCount
      },
      message: 'All data cleared successfully'
    });
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to clear data', 
      details: error.message 
    }, 500);
  }
});

// Generate mock data (dev only)
app.post("/make-server-b87b0c07/dev/generate-mock-data", async (c) => {
  try {
    console.log('🎲 Generating mock data...');
    
    // Mock names
    const firstNames = ['Ana', 'Marija', 'Elena', 'Katerina', 'Jovana', 'Milica', 'Aleksandra', 'Tamara', 'Ivana', 'Natasha', 
                        'Stefan', 'Nikola', 'Aleksandar', 'Marko', 'Dejan', 'Ivan', 'Lazar', 'Filip', 'Bojan', 'Goran'];
    const lastNames = ['Petrovska', 'Nikolovska', 'Stojanovski', 'Dimitrievski', 'Todorovska', 'Kostovski', 'Trajkovski', 
                       'Angelovska', 'Gligorovski', 'Janeva', 'Ristovski', 'Mitrevski', 'Ilievska', 'Georgievski'];
    
    const stats = {
      users: 0,
      bookings: 0,
      reservations: 0,
      packages: 0,
      dateRange: 'Jan 23 - Feb 28, 2026',
      weekdays: 0
    };
    
    // Generate 100 users with bookings
    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const mobile = `+389 7${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)}`;
      
      stats.users++;
      
      // Generate 2-4 bookings per user
      const bookingCount = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < bookingCount; j++) {
        // Random date between Jan 23 and Feb 28 (weekdays only)
        const month = Math.random() < 0.3 ? 1 : 2; // 30% Jan, 70% Feb
        const maxDay = month === 1 ? 31 : 28;
        let day = Math.floor(Math.random() * maxDay) + 1;
        
        // Skip weekends (for Jan: 25-26, Feb: 1-2, 8-9, 15-16, 22-23)
        const dateObj = new Date(2026, month - 1, day);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // Skip to next weekday
          day = (day + 2) % maxDay;
          if (day === 0) day = 1;
        }
        
        const dateKey = `${month}-${day}`;
        const timeSlots = ['09:00', '10:00', '11:00', '12:00', '17:00', '18:00', '19:00', '20:00'];
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const instructors = ['Rina Krasniqi', 'Viki Stojanovska'];
        const instructor = instructors[Math.floor(Math.random() * instructors.length)];
        
        // Randomly choose service type
        const serviceTypes = ['single', 'package', 'individual', 'duo'];
        const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)] as ServiceType;
        
        // Create reservation (simplified for mock data)
        const reservationId = `reservation:${email}:${Date.now() + j}`;
        const reservation = {
          id: reservationId,
          userId: email,
          packageId: serviceType !== 'single' ? `package:${email}:mock` : null,
          serviceType,
          packageType: serviceType === 'single' ? 'single' : 
                       serviceType === 'package' ? 'package8' :
                       serviceType === 'individual' ? 'individual8' : 'duo8',
          dateKey,
          timeSlot,
          instructor,
          date: dateObj.toISOString().split('T')[0],
          month,
          day,
          status: 'confirmed' as ReservationStatus,
          paymentStatus: 'paid' as PaymentStatus,
          name: firstName,
          surname: lastName,
          email,
          mobile,
          language: 'en',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
          sessionNumber: serviceType !== 'single' ? Math.floor(Math.random() * 8) + 1 : null,
          cancellationReason: null,
          cancelledBy: null,
          cancelledAt: null
        };
        
        await kv.set(reservationId, reservation);
        stats.reservations++;
        stats.bookings++;
      }
    }
    
    // Count unique weekdays
    stats.weekdays = 37; // Approximate weekdays between Jan 23 - Feb 28
    
    console.log(`✅ Generated ${stats.users} users with ${stats.bookings} bookings`);
    
    return c.json({
      success: true,
      stats,
      message: 'Mock data generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to generate mock data', 
      details: error.message 
    }, 500);
  }
});

// ============ AUTHENTICATION ENDPOINTS ============

// Setup password (complete registration)
app.post("/make-server-b87b0c07/auth/setup-password", async (c) => {
  try {
    const body = await c.req.json();
    const { token, password } = body;

    if (!token || !password) {
      return c.json({ error: "Token and password are required" }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    // Get verification token
    const tokenKey = `verification_token:${token}`;
    const tokenData = await kv.get(tokenKey);

    if (!tokenData) {
      return c.json({ error: "Invalid or expired registration link" }, 400);
    }

    if (tokenData.used) {
      return c.json({ error: "This registration link has already been used. Please log in instead." }, 400);
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return c.json({ error: "This registration link has expired. Please contact support." }, 400);
    }

    // Get user
    const userKey = `user:${tokenData.email}`;
    const user = await kv.get(userKey);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (user.passwordHash) {
      return c.json({ error: "Password already set. Please log in instead." }, 400);
    }

    // Hash password (simple hash - in production use bcrypt)
    const passwordHash = await hashPassword(password);

    // Update user
    user.passwordHash = passwordHash;
    user.verified = true;
    user.verificationToken = null;
    user.updatedAt = new Date().toISOString();
    await kv.set(userKey, user);

    // Mark token as used
    tokenData.used = true;
    tokenData.usedAt = new Date().toISOString();
    await kv.set(tokenKey, tokenData);

    // Create session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const sessionKey = `session:${sessionToken}`;
    const sessionData = {
      id: sessionKey,
      token: sessionToken,
      email: user.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    await kv.set(sessionKey, sessionData);

    console.log(`✅ Password set for user: ${user.email}`);

    return c.json({
      success: true,
      message: "Registration complete! You can now log in.",
      session: sessionToken,
      user: {
        email: user.email,
        name: user.name,
        surname: user.surname
      }
    });

  } catch (error) {
    console.error('Error setting up password:', error);
    return c.json({ error: 'Failed to set up password', details: error.message }, 500);
  }
});

// Register - create user account without booking
app.post("/make-server-b87b0c07/auth/register", async (c) => {
  console.log('📝 /auth/register endpoint called');
  
  try {
    let body;
    try {
      body = await c.req.json();
      console.log('Registration request received:', { email: body.email, name: body.name });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
    const { email, password, name, surname, mobile } = body;
    
    // Validate required fields
    if (!email || !password) {
      console.error('Missing required fields: email or password');
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    if (password.length < 6) {
      console.error('Password too short');
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const userKey = `user:${normalizedEmail}`;
    const existingUser = await kv.get(userKey);
    
    if (existingUser && existingUser.passwordHash) {
      console.log(`ℹ️  Registration attempt for existing user: ${normalizedEmail} - Directing to login`);
      return c.json({ 
        error: 'An account with this email already exists. Please use the login form instead.',
        errorType: 'USER_EXISTS'
      }, 400);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user account
    const user = {
      id: userKey,
      email: normalizedEmail,
      name: name || '',
      surname: surname || '',
      mobile: mobile || '',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocked: false,
      verified: true  // Immediately verified since they set password
    };
    
    await kv.set(userKey, user);
    console.log(`✅ User account created: ${normalizedEmail}`);
    
    return c.json({
      success: true,
      message: 'Registration successful! You can now login.',
      user: {
        email: normalizedEmail,
        name: name || '',
        surname: surname || ''
      }
    });
    
  } catch (error) {
    console.error('Error during registration:', error);
    return c.json({ error: 'Registration failed', details: error.message }, 500);
  }
});

// Login
app.post("/make-server-b87b0c07/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Get user
    const userKey = `user:${email.toLowerCase()}`;
    const user = await kv.get(userKey);

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    if (user.blocked) {
      return c.json({ error: "This account has been blocked. Please contact support." }, 403);
    }

    if (!user.passwordHash) {
      return c.json({ error: "Please complete your registration first. Check your email for the registration link." }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Create session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const sessionKey = `session:${sessionToken}`;
    const sessionData = {
      id: sessionKey,
      token: sessionToken,
      email: user.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    await kv.set(sessionKey, sessionData);

    console.log(`✅ User logged in: ${user.email}`);

    return c.json({
      success: true,
      message: "Login successful",
      session: sessionToken,
      user: {
        email: user.email,
        name: user.name,
        surname: user.surname,
        mobile: user.mobile
      }
    });

  } catch (error) {
    console.error('Error logging in:', error);
    return c.json({ error: 'Login failed', details: error.message }, 500);
  }
});

// Verify session
app.get("/make-server-b87b0c07/auth/verify", async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');

    if (!sessionToken) {
      return c.json({ error: "No session token provided" }, 401);
    }

    const sessionKey = `session:${sessionToken}`;
    const session = await kv.get(sessionKey);

    if (!session) {
      return c.json({ error: "Invalid session" }, 401);
    }

    if (new Date(session.expiresAt) < new Date()) {
      return c.json({ error: "Session expired" }, 401);
    }

    // Get user
    const userKey = `user:${session.email}`;
    const user = await kv.get(userKey);

    if (!user || user.blocked) {
      return c.json({ error: "User not found or blocked" }, 401);
    }

    return c.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        surname: user.surname,
        mobile: user.mobile
      }
    });

  } catch (error) {
    console.error('Error verifying session:', error);
    return c.json({ error: 'Session verification failed', details: error.message }, 500);
  }
});

// Logout
app.post("/make-server-b87b0c07/auth/logout", async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');

    if (sessionToken) {
      const sessionKey = `session:${sessionToken}`;
      await kv.del(sessionKey);
      console.log(`✅ User logged out`);
    }

    return c.json({ success: true, message: "Logged out successfully" });

  } catch (error) {
    console.error('Error logging out:', error);
    return c.json({ error: 'Logout failed', details: error.message }, 500);
  }
});

// Get user's packages and bookings
app.get("/make-server-b87b0c07/user/packages", async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');

    if (!sessionToken) {
      return c.json({ error: "No session token provided" }, 401);
    }

    // Verify session
    const sessionKey = `session:${sessionToken}`;
    const session = await kv.get(sessionKey);

    if (!session) {
      return c.json({ error: "Invalid session" }, 401);
    }

    if (new Date(session.expiresAt) < new Date()) {
      return c.json({ error: "Session expired" }, 401);
    }

    const userEmail = session.email;

    // Get all packages for this user
    const allPackages = await kv.getByPrefix('package:');
    const userPackages = allPackages.filter((pkg: any) => pkg.email === userEmail);

    // For each package, get the first session reservation details
    const packagesWithDetails = await Promise.all(
      userPackages.map(async (pkg: any) => {
        let firstSessionDetails = null;

        if (pkg.firstReservationId) {
          const reservation = await kv.get(pkg.firstReservationId);
          if (reservation) {
            firstSessionDetails = {
              id: reservation.id,
              date: reservation.date,
              dateKey: reservation.dateKey,
              time: reservation.time,
              endTime: reservation.endTime,
              instructor: reservation.instructor,
            };
          }
        }

        return {
          id: pkg.id,
          packageType: pkg.packageType,
          packageStatus: pkg.packageStatus, // 'pending' or 'active'
          totalSessions: pkg.totalSessions,
          remainingSessions: pkg.remainingSessions,
          sessionsBooked: pkg.sessionsBooked || [],
          firstSession: firstSessionDetails,
          createdAt: pkg.createdAt,
          activationCodeId: pkg.activationCodeId,
        };
      })
    );

    return c.json({
      success: true,
      packages: packagesWithDetails,
    });

  } catch (error) {
    console.error('Error getting user packages:', error);
    return c.json({ error: 'Failed to get packages', details: error.message }, 500);
  }
});

// Reschedule first session (only if >24h before class)
app.post("/make-server-b87b0c07/user/packages/:id/reschedule", async (c) => {
  try {
    const sessionToken = c.req.header('X-Session-Token');

    if (!sessionToken) {
      return c.json({ error: "No session token provided" }, 401);
    }

    // Verify session
    const sessionKey = `session:${sessionToken}`;
    const session = await kv.get(sessionKey);

    if (!session) {
      return c.json({ error: "Invalid session" }, 401);
    }

    if (new Date(session.expiresAt) < new Date()) {
      return c.json({ error: "Session expired" }, 401);
    }

    const packageId = c.req.param('id');
    const body = await c.req.json();
    const { dateKey, timeSlot } = body;

    if (!dateKey || !timeSlot) {
      return c.json({ error: "Missing required fields: dateKey, timeSlot" }, 400);
    }

    // Get package
    const pkg = await kv.get(packageId);
    if (!pkg) {
      return c.json({ error: "Package not found" }, 404);
    }

    // Verify user owns this package
    if (pkg.email !== session.email) {
      return c.json({ error: "Unauthorized - package belongs to different user" }, 403);
    }

    // Get current first reservation
    if (!pkg.firstReservationId) {
      return c.json({ error: "No first session booked yet" }, 400);
    }

    const oldReservation = await kv.get(pkg.firstReservationId);
    if (!oldReservation) {
      return c.json({ error: "Current reservation not found" }, 404);
    }

    // Check if >24 hours before class
    const classDateTime = new Date(`${oldReservation.date}T${oldReservation.time}`);
    const now = new Date();
    const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilClass < 24) {
      return c.json({ 
        error: "Cannot reschedule within 24 hours of class time",
        hoursUntilClass: Math.round(hoursUntilClass * 10) / 10
      }, 400);
    }

    // Extract service type
    const serviceType = extractServiceType(pkg.packageType);

    // Check new slot availability
    const capacity = await calculateSlotCapacity(dateKey, timeSlot);
    
    if (serviceType === 'individual') {
      if (capacity.available < 4) {
        return c.json({ error: "New slot not available for 1-on-1 session" }, 400);
      }
    } else if (serviceType === 'duo') {
      if (capacity.available < 2) {
        return c.json({ error: "New slot does not have enough space for DUO" }, 400);
      }
    } else {
      if (capacity.available < 1) {
        return c.json({ error: "New slot is full" }, 400);
      }
    }

    // Delete old reservation (free up the slot)
    await kv.del(pkg.firstReservationId);

    // Create new reservation
    const endTime = calculateEndTime(timeSlot);
    const dateObj = new Date(dateKey);
    const dateString = formatDateForDisplay(dateObj);
    
    const newReservationId = `reservation:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newReservation = {
      id: newReservationId,
      packageId: pkg.id,
      email: pkg.email,
      name: pkg.name,
      surname: pkg.surname,
      mobile: pkg.mobile,
      date: dateString,
      dateKey: dateKey,
      time: timeSlot,
      endTime: endTime,
      instructor: oldReservation.instructor || 'Rina Krasniqi',
      packageType: pkg.packageType,
      createdAt: new Date().toISOString(),
      sessionNumber: 1,
    };

    await kv.set(newReservationId, newReservation);

    // Update package with new reservation ID
    pkg.firstReservationId = newReservationId;
    pkg.sessionsBooked = [newReservationId];
    pkg.updatedAt = new Date().toISOString();
    await kv.set(packageId, pkg);

    console.log(`✅ Rescheduled first session for ${packageId}`);
    console.log(`   Old: ${oldReservation.date} at ${oldReservation.time}`);
    console.log(`   New: ${dateString} at ${timeSlot}`);

    return c.json({
      success: true,
      message: "First session rescheduled successfully",
      newReservation: {
        date: dateString,
        dateKey: dateKey,
        time: timeSlot,
        endTime: endTime,
      },
    });

  } catch (error) {
    console.error('Error rescheduling session:', error);
    return c.json({ error: 'Failed to reschedule', details: error.message }, 500);
  }
});

// Helper functions for password hashing
async function hashPassword(password: string): Promise<string> {
  // Simple hash - in production use bcrypt or similar
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ============ DEBUG ENDPOINT ============

// Debug endpoint to check if users exist
app.get("/make-server-b87b0c07/debug/check-users", async (c) => {
  try {
    const allUsers = await kv.getByPrefix('user:');
    return c.json({
      success: true,
      userCount: allUsers.length,
      hasUsers: allUsers.length > 0,
      users: allUsers.map((u: any) => ({
        email: u.email,
        name: u.name,
        surname: u.surname,
        hasPassword: !!u.passwordHash,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('Error checking users:', error);
    return c.json({ error: 'Failed to check users', details: error.message }, 500);
  }
});

Deno.serve(app.fetch);
