# 🔍 Email Debugging Guide - Registration Emails Not Arriving

## Current Status

**Problem**: Registration emails are not being received after booking a package.

**Expected**: User books package → receives email with password setup link → clicks link → sets password

**What We Fixed**:
1. ✅ Removed preview mode detection that blocked emails in Figma environment
2. ✅ Added extensive logging to track email sending process
3. ✅ Fixed null user handling (`!user || !user.passwordHash`)

---

## 📋 Step-by-Step Debugging Checklist

### Step 1: Check Browser Console Logs

After clicking "KONFIRMO REZERVIMIN" (confirm reservation), check the browser console for:

**Look for success response:**
```json
{
  "success": true,
  "package": {...},
  "reservation": {...},
  "message": "Booking successful! Check your email to complete registration."
}
```

**If you see errors:**
- Copy the full error message
- Check HTTP status code (should be 200)
- Look for error details in response

### Step 2: Check Server Logs (Supabase Edge Function Logs)

The backend now has detailed logging. You should see these console logs in order:

#### ✅ Expected Log Sequence:

```
1. 🔍 Checking user registration status for: asani.kastri@gmail.com
2. 🔍 User exists? true
3. 🔍 User has passwordHash? false
4. ✅ User needs registration - preparing to send email...
5. ✅ Verification token stored: verification_token:verify_123456789_abc123
6. ✅ User record updated
7. 📧 About to call sendRegistrationEmail()...
8. 📧 Email: asani.kastri@gmail.com
9. 📧 Name: asani
10. 📧 Surname: asani
11. 🔗 Link: https://your-app-url.com#/setup-password?token=verify_123456789_abc123
12. 📧 === INSIDE sendRegistrationEmail() ===
13. 📧 To: asani.kastri@gmail.com
14. 📧 Name: asani asani
15. 📧 Package: package8
16. 📧 Session date: 26 January
17. 📧 Session time: 08:00 - 08:55
18. 📧 RESEND_API_KEY exists? true
19. 📧 RESEND_API_KEY value: re_xxxxxxxx...
20. 📧 Registration link: https://your-app-url.com#/setup-password?token=verify_123456789_abc123
21. 📧 Package name: 8 KLASA
22. 📧 Preparing to call Resend API...
23. 📧 Email payload: { from: ..., to: [...], subject: ..., htmlLength: 5432 }
24. 📧 Resend API response status: 200
25. 📧 Resend API response ok? true
26. ✅ Registration email sent successfully!
27. ✅ Resend response: { id: 're_xxxxxxxxxx' }
28. ✅✅✅ Registration email SENT SUCCESSFULLY to: asani.kastri@gmail.com
```

#### ❌ Common Error Patterns:

**Error Pattern 1: User Already Has Password**
```
⚠️ User already has password - no registration email sent
```
**Solution**: User already completed registration. They should just log in.

**Error Pattern 2: RESEND_API_KEY Missing**
```
❌ RESEND_API_KEY not configured
❌ Error: Email service not configured
```
**Solution**: Check that RESEND_API_KEY environment variable is set in Supabase.

**Error Pattern 3: Resend API Error**
```
❌ Email sending failed. Status: 400
❌ Error response: {"message":"Invalid from address"}
```
**Solution**: Check Resend API configuration (see below).

**Error Pattern 4: Network Error**
```
❌ Error in sendRegistrationEmail(): TypeError: fetch failed
```
**Solution**: Check internet connectivity, Resend API status.

### Step 3: Verify Environment Variables

Check that these environment variables are set in Supabase:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to check:**
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions → Environment Variables
3. Verify `RESEND_API_KEY` exists and is not empty

### Step 4: Test Resend API Directly

You can test if Resend API is working by calling it directly:

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_RESEND_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "WellNest Pilates <onboarding@resend.dev>",
    "to": ["your-test-email@gmail.com"],
    "subject": "Test Email",
    "html": "<p>This is a test email</p>"
  }'
```

**Expected Response (Success):**
```json
{
  "id": "re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Common Resend Errors:**

| Status | Error | Solution |
|--------|-------|----------|
| 401 | Unauthorized | Invalid API key - check RESEND_API_KEY |
| 403 | Forbidden | API key doesn't have permission - check Resend dashboard |
| 422 | Validation Error | Invalid email format or missing required fields |
| 429 | Rate Limit | Too many requests - wait and try again |
| 500 | Server Error | Resend service issue - check status.resend.com |

### Step 5: Check Email Delivery

If server logs show "✅ Registration email sent successfully", but you don't receive it:

**Check These:**

1. ✅ **Spam/Junk Folder**
   - Gmail: Check "Promotions" and "Spam" tabs
   - Outlook: Check "Junk Email" folder

2. ✅ **Email Address Typo**
   - Verify you entered correct email: `asani.kastri@gmail.com`
   - Check for extra spaces or typos

3. ✅ **Resend Dashboard**
   - Log in to resend.com
   - Go to "Emails" tab
   - Check delivery status of recent emails
   - Look for bounce or rejection reasons

4. ✅ **From Address Verification**
   - Resend requires verified sending domains for production
   - Default `onboarding@resend.dev` works for testing only
   - For production, verify your own domain in Resend dashboard

### Step 6: Check Email Provider Blocking

Some email providers block automated emails:

**Gmail:**
- Allows emails from `onboarding@resend.dev` (usually)
- Check "All Mail" folder - sometimes hidden

**Outlook/Hotmail:**
- More aggressive spam filtering
- May block `onboarding@resend.dev`
- Try adding to safe senders list

**Corporate Email:**
- Often blocks external automated emails
- Contact IT department to whitelist Resend IPs

---

## 🐛 Common Issues & Solutions

### Issue 1: "User already has password"

**Symptom:**
```
⚠️ User already has password - no registration email sent
```

**Cause**: User previously completed registration

**Solution**: 
1. User should just log in with existing password
2. Or use "Forgot Password" feature (if implemented)
3. Or admin can reset user password in database

### Issue 2: Email Never Reaches Inbox

**Symptom**: Server logs show "✅ Registration email sent successfully" but email doesn't arrive

**Possible Causes:**
1. Email in spam/junk folder
2. Email provider blocking automated emails
3. Resend domain not verified (for production use)
4. Email address typo

**Solutions:**
1. Check spam folder thoroughly
2. Try different email provider (Gmail usually works best)
3. Verify domain in Resend dashboard
4. Double-check email address spelling

### Issue 3: Resend API Rate Limit

**Symptom:**
```
❌ Email sending failed. Status: 429
❌ Error response: {"message":"Rate limit exceeded"}
```

**Cause**: Sent too many emails in short time

**Resend Free Tier Limits:**
- 100 emails per day
- 1 email per second

**Solution:**
- Wait a few minutes and try again
- Upgrade Resend plan for higher limits
- Check for email loops (multiple sends to same user)

### Issue 4: Invalid API Key

**Symptom:**
```
❌ Email sending failed. Status: 401
❌ Error response: {"message":"Invalid API key"}
```

**Solutions:**
1. Check RESEND_API_KEY is set correctly in Supabase environment variables
2. Verify API key in Resend dashboard (Settings → API Keys)
3. Generate new API key if needed
4. Make sure API key starts with `re_`

### Issue 5: User Doesn't Exist in Database

**Symptom:**
```
❌ TypeError: Cannot read property 'passwordHash' of null
```

**Cause**: User record not created during package creation

**Solution**: This should be fixed now with `!user || !user.passwordHash` check, but if it still happens:
1. Check package creation logs
2. Verify user was created: `user:${email}`
3. May need to manually create user in KV store

---

## 📧 Email Template Preview

The registration email looks like this:

**Subject:** Complete Your Registration - WellNest Pilates

**From:** WellNest Pilates <onboarding@resend.dev>

**To:** [user's email]

**Content:**
```
─────────────────────────────────────────
│       WellNest Pilates                │
│   Gjuro Gjakovikj 59, Kumanovo 1300  │
─────────────────────────────────────────

Welcome, [Name] [Surname]! 🎉

Thank you for booking with WellNest Pilates! Your 
[Package Name] is ready to be activated. To access 
your member area and manage your bookings, please 
complete your registration.

┌────────────────────────────────────────┐
│ 📅 Your First Session                  │
│                                        │
│ Date: 26 January                       │
│ Time: 08:00 - 08:55                    │
└────────────────────────────────────────┘

         [Complete Registration]
         
Or copy and paste this link:
https://your-app-url.com#/setup-password?token=...

Important:
• This link will expire in 24 hours
• After setting up your password, you can log in
• Your package activation code will be sent 
  separately by our admin after payment
• You can log in before receiving activation code

─────────────────────────────────────────
Questions? Contact us:
📍 Gjuro Gjakovikj 59, Kumanovo 1300
📧 info@wellnest-pilates.com
─────────────────────────────────────────
```

---

## 🧪 Manual Testing Steps

### Test 1: New User Registration Email

1. **Clear previous data** (optional):
   ```bash
   # In Supabase KV store, delete:
   # - user:asani.kastri@gmail.com
   # - All packages for this user
   # - All verification tokens
   ```

2. **Book a package**:
   - Name: Test
   - Surname: User
   - Email: YOUR_REAL_EMAIL@gmail.com
   - Mobile: 123456789
   - Select: 8 KLASA package
   - Choose first session time

3. **Check server logs immediately**:
   - Look for "✅ Registration email sent successfully"
   - Copy the registration link from logs

4. **Check email inbox**:
   - Check spam folder
   - Wait 1-2 minutes for delivery

5. **If email doesn't arrive**:
   - Use the registration link from server logs directly
   - Paste it into browser address bar

### Test 2: Existing User (Should Skip Email)

1. **Create user first** (book once and complete registration)

2. **Book another package with same email**

3. **Expected logs**:
   ```
   ⚠️ User already has password - no registration email sent
   ```

4. **User should**:
   - Just log in with existing password
   - No new registration email needed

---

## 🔧 Advanced Debugging

### Check KV Store Data

You can inspect the database to see user status:

**Check User Record:**
```
Key: user:asani.kastri@gmail.com
Value: {
  "id": "user:asani.kastri@gmail.com",
  "email": "asani.kastri@gmail.com",
  "name": "asani",
  "surname": "asani",
  "mobile": "232132321",
  "passwordHash": null,  // <-- Should be null for new users
  "verificationToken": "verify_123456...",
  "verified": false,
  "createdAt": "2026-01-25T...",
  "updatedAt": "2026-01-25T..."
}
```

**Check Verification Token:**
```
Key: verification_token:verify_123456789_abc123
Value: {
  "id": "verification_token:verify_123456789_abc123",
  "token": "verify_123456789_abc123",
  "email": "asani.kastri@gmail.com",
  "expiresAt": "2026-01-26T...",  // <-- 24 hours from creation
  "used": false,
  "createdAt": "2026-01-25T..."
}
```

### Enable Resend Webhooks (Optional)

To get real-time email delivery notifications:

1. Go to Resend Dashboard → Webhooks
2. Add webhook URL: `https://your-supabase-url.com/functions/v1/make-server-b87b0c07/webhooks/resend`
3. Select events: `email.delivered`, `email.bounced`, `email.complained`
4. Resend will POST to this endpoint with delivery status

---

## 🆘 Quick Solutions

### Solution 1: Manual Registration Link

If emails not working, you can:

1. Check server logs for registration link
2. Copy the link that looks like:
   ```
   https://your-app-url.com#/setup-password?token=verify_123456789_abc123
   ```
3. Manually send this link to user via other means (WhatsApp, SMS, etc.)
4. User can click link and complete registration

### Solution 2: Bypass Email Verification (TEMPORARY)

For testing only, you can create user with password directly in KV store:

```javascript
// In Supabase SQL editor or via API:
{
  "id": "user:test@example.com",
  "email": "test@example.com",
  "name": "Test",
  "surname": "User",
  "mobile": "123456789",
  "passwordHash": "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash
  "verified": true,
  "createdAt": "2026-01-25T12:00:00Z",
  "updatedAt": "2026-01-25T12:00:00Z"
}
```

### Solution 3: Use Different Email Provider

If Gmail not receiving emails:

1. Try Outlook/Hotmail
2. Try Yahoo Mail
3. Try ProtonMail
4. Gmail usually works best for automated emails

---

## 📝 Checklist Summary

Before reporting email issue, verify:

- [ ] Checked spam/junk folder
- [ ] Checked server logs for "✅ Registration email sent successfully"
- [ ] Verified RESEND_API_KEY is set in Supabase environment
- [ ] Email address is correct (no typos)
- [ ] User doesn't already have password (check logs)
- [ ] Tried with Gmail address (best compatibility)
- [ ] Checked Resend dashboard for delivery status
- [ ] Waited at least 2-3 minutes for email delivery
- [ ] Tried manual registration link from server logs

---

## 🎯 Next Steps

1. **Book a test package** with your real email
2. **Immediately check server logs** in Supabase Edge Function logs
3. **Copy all logs** that start with 📧, 🔍, ✅, or ❌
4. **Check your email** (including spam)
5. **Report back** with:
   - Full server log output
   - Email address used
   - Whether email arrived
   - Any error messages

This will help us diagnose the exact issue!
