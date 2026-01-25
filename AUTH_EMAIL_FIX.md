# Fix: Registration Email Should Have Link (Not Activation Code)

## Problem
Currently when users book a package, they receive an email with an **activation code** (WN-XXXX-XXXX).  
This is WRONG for the initial registration email.

## Correct Flow

### 1. Initial Booking/Registration Email
**When**: User books their first package  
**Email Subject**: "Complete Your Registration - WellNest Pilates"  
**Contains**: 
- Welcome message
- First session details (date, time)
- **PASSWORD SETUP LINK** (not code!)
- Link expires in 24 hours

**Purpose**: User clicks link → sets password → can log in

### 2. Package Activation Code Email (Manual - sent by admin)
**When**: Admin manually sends after payment received  
**Email Subject**: "Your Activation Code - WellNest Pilates"  
**Contains**:
- Activation code (WN-XXXX-XXXX) ← Like in the image you showed
- Package details
- Sessions remaining

**Purpose**: User enters this code in dashboard to unlock package sessions

---

## Code Changes Needed

### Step 1: Add Registration Email Function

Add this function in `/supabase/functions/server/index.tsx` after the `sendActivationEmail` function (around line 246):

```typescript
async function sendRegistrationEmailWithPasswordSetup(\n  email: string,\n  name: string,\n  surname: string,\n  verificationToken: string,\n  firstSessionDate: string,\n  firstSessionTime: string,\n  firstSessionEndTime: string\n) {\n  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');\n  if (!RESEND_API_KEY) {\n    console.error('RESEND_API_KEY not configured');\n    throw new Error('Email service not configured');\n  }\n\n  const setupLink = `https://wellnest-pilates.com/setup-password?token=${verificationToken}`;\n\n  const emailHtml = `\n    <!DOCTYPE html>\n    <html>\n      <head>\n        <meta charset=\"utf-8\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n      </head>\n      <body style=\"margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f0ed;\">\n        <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f5f0ed; padding: 40px 20px;\">\n          <tr>\n            <td align=\"center\">\n              <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">\n                <tr>\n                  <td style=\"background-color: #9ca571; padding: 40px 40px 30px 40px; text-align: center;\">\n                    <h1 style=\"margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;\">WellNest Pilates</h1>\n                    <p style=\"margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;\">Gjuro Gjakovikj 59, Kumanovo 1300</p>\n                  </td>\n                </tr>\n                <tr>\n                  <td style=\"padding: 40px;\">\n                    <h2 style=\"margin: 0 0 20px 0; color: #3d2f28; font-size: 24px;\">Welcome, ${name}${surname ? ' ' + surname : ''}! 🎉</h2>\n                    \n                    <p style=\"margin: 0 0 20px 0; color: #6b5949; font-size: 16px; line-height: 1.6;\">\n                      Thank you for booking with WellNest Pilates! To access your member area and manage your bookings, please complete your registration by setting up your password.\n                    </p>\n                    \n                    <div style=\"background-color: #e8f5e9; border-radius: 12px; padding: 24px; margin: 24px 0;\">\n                      <h3 style=\"margin: 0 0 16px 0; color: #2e7d32; font-size: 18px;\">📅 Your First Session</h3>\n                      <p style=\"margin: 0; color: #1b5e20; font-size: 15px; line-height: 1.6;\">\n                        <strong>Date:</strong> ${firstSessionDate}<br>\n                        <strong>Time:</strong> ${firstSessionTime} - ${firstSessionEndTime}\n                      </p>\n                    </div>\n                    \n                    <div style=\"text-align: center; margin: 30px 0;\">\n                      <a href=\"${setupLink}\" style=\"display: inline-block; background-color: #9ca571; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;\">Complete Registration</a>\n                    </div>\n                    \n                    <p style=\"margin: 20px 0; color: #8b7764; font-size: 14px; line-height: 1.6;\">\n                      Or copy and paste this link into your browser:<br>\n                      <span style=\"color: #9ca571; word-break: break-all;\">${setupLink}</span>\n                    </p>\n                    \n                    <div style=\"background-color: #fff8f0; border-left: 4px solid #9ca571; padding: 16px; margin: 24px 0;\">\n                      <p style=\"margin: 0; color: #6b5949; font-size: 14px; line-height: 1.6;\">\n                        <strong style=\"color: #3d2f28;\">Important:</strong><br>\n                        • This link will expire in 24 hours<br>\n                        • After setting up your password, you can log in to manage bookings<br>\n                        • Your package activation code will be sent separately by our admin after payment confirmation\n                      </p>\n                    </div>\n                  </td>\n                </tr>\n                <tr>\n                  <td style=\"background-color: #f5f0ed; padding: 30px; text-align: center;\">\n                    <p style=\"margin: 0 0 10px 0; color: #6b5949; font-size: 14px;\">Questions? Contact us:</p>\n                    <p style=\"margin: 0; color: #9ca571; font-size: 14px;\">\n                      📍 Gjuro Gjakovikj 59, Kumanovo 1300<br>\n                      📧 info@wellnest-pilates.com\n                    </p>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n        </table>\n      </body>\n    </html>\n  `;\n\n  try {\n    const emailResponse = await fetch('https://api.resend.com/emails', {\n      method: 'POST',\n      headers: {\n        'Authorization': `Bearer ${RESEND_API_KEY}`,\n        'Content-Type': 'application/json',\n      },\n      body: JSON.stringify({\n        from: 'WellNest Pilates <onboarding@resend.dev>',\n        to: [email],\n        subject: 'Complete Your Registration - WellNest Pilates',\n        html: emailHtml,\n      }),\n    });\n\n    if (!emailResponse.ok) {\n      const errorText = await emailResponse.text();\n      console.error('Email sending failed:', errorText);\n      throw new Error(`Failed to send email: ${errorText}`);\n    }\n\n    const result = await emailResponse.json();\n    console.log('Registration email sent successfully:', result);\n    return result;\n  } catch (error) {\n    console.error('Error sending registration email:', error);\n    throw error;\n  }\n}
```

### Step 2: Update First Session Booking Endpoint

In `/supabase/functions/server/index.tsx`, find the "Book first session for package" endpoint (around line 524-557) and replace this section:

**FIND THIS CODE:**
```typescript
    // Get activation code\n    const activationCode = await kv.get(pkg.activationCodeId);\n\n    // NOW send combined email with package + first session details\n    try {\n      await sendActivationEmail(\n        pkg.email,\n        pkg.name,\n        pkg.surname,\n        activationCode.code,\n        pkg.packageType,\n        {\n          date: dateString,\n          timeSlot,\n          endTime,\n          instructor\n        }\n      );\n    } catch (emailError) {\n      console.error('Failed to send activation email:', emailError);\n      // Don't fail the booking if email fails\n    }\n\n    console.log(`First session booked for package ${packageId}: ${reservationId}`);\n    console.log(`Reservation: ${dateString} at ${timeSlot}`);\n    console.log(`✅ Package purchase flow complete - email sent with activation code`);\n\n    return c.json({\n      success: true,\n      package: pkg,\n      reservation,\n      activationCode: activationCode.code,\n      message: \"First session booked successfully! Check your email for activation code.\"\n    });
```

**REPLACE WITH THIS CODE:**
```typescript
    // Send registration email with password setup link (NOT activation code)\n    // Activation code will be manually sent by admin after payment\n    try {\n      // Check if user already has password\n      const user = await kv.get(`user:${pkg.email}`);\n      \n      if (!user.passwordHash) {\n        // User needs to complete registration - send password setup link\n        const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;\n        const tokenKey = `verification_token:${verificationToken}`;\n        const tokenExpiry = new Date();\n        tokenExpiry.setHours(tokenExpiry.getHours() + 24);\n\n        // Store verification token\n        const tokenData = {\n          id: tokenKey,\n          token: verificationToken,\n          email: pkg.email,\n          expiresAt: tokenExpiry.toISOString(),\n          used: false,\n          createdAt: new Date().toISOString()\n        };\n        await kv.set(tokenKey, tokenData);\n\n        // Update user with verification token\n        user.verificationToken = verificationToken;\n        user.verified = false;\n        user.passwordHash = null;\n        user.updatedAt = new Date().toISOString();\n        await kv.set(`user:${pkg.email}`, user);\n\n        // Send registration email with link\n        await sendRegistrationEmailWithPasswordSetup(\n          pkg.email,\n          pkg.name,\n          pkg.surname,\n          verificationToken,\n          dateString,\n          timeSlot,\n          endTime\n        );\n        console.log('📧 Registration email with password setup link sent (NO activation code)');\n      } else {\n        // User already has account, just log it\n        console.log('📧 User already has account - no registration email needed');\n      }\n    } catch (emailError) {\n      console.error('Failed to send email:', emailError);\n      // Don't fail the booking if email fails\n    }\n\n    console.log(`First session booked for package ${packageId}: ${reservationId}`);\n    console.log(`Reservation: ${dateString} at ${timeSlot}`);\n    console.log(`✅ Package purchase flow complete - registration link sent`);\n    console.log(`⚠️  Admin must manually send activation code after payment confirmation`);\n\n    return c.json({\n      success: true,\n      package: pkg,\n      reservation,\n      message: \"Booking successful! Check your email to complete registration.\"\n    });
```

### Step 3: Keep Activation Code Email for Manual Admin Use

The existing `sendActivationEmail` function should ONLY be used by the admin endpoint `/admin/send-activation-code`. This is the email that contains the activation code WN-XXXX-XXXX (like in your image).

---

## Summary

**Before**: User books → gets email with activation code WN-XXXX-XXXX ❌  
**After**: User books → gets email with password setup LINK ✅

**Activation codes** are now ONLY sent manually by admin after payment is confirmed.

---

## Testing

1. Book a package as new user
2. Check email - should receive "Complete Your Registration" with a LINK (not code)
3. Click link → set password
4. Log in to dashboard
5. Admin manually sends activation code
6. User receives second email with code WN-XXXX-XXXX
7. User enters code in dashboard to unlock package

