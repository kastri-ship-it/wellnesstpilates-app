# 📧 Email Setup Instructions (Resend)

## ⚠️ Current Status: TEST MODE

Your Resend account is currently in **TEST MODE**, which means:
- ✅ Emails work ONLY when sent to: `asani.kastri@gmail.com`
- ❌ Emails to OTHER addresses will fail silently
- ✅ App continues to work normally (bookings/registrations succeed)
- ⚠️ Users won't receive activation codes via email

---

## 🔧 Option 1: Enable Production Email (RECOMMENDED)

To send emails to ANY address, you need to verify a domain:

### Step 1: Verify Your Domain
1. Go to https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain (e.g., `wellnest-pilates.com`)
4. Add the DNS records shown to your domain registrar
5. Wait for verification (usually 5-30 minutes)

### Step 2: Update Email Sender
Once verified, update the backend code:

**File:** `/supabase/functions/server/index.tsx` (around line 291)

**Change from:**
```javascript
from: `${STUDIO_INFO.name} <onboarding@resend.dev>`,
```

**Change to:**
```javascript
from: `${STUDIO_INFO.name} <hello@wellnest-pilates.com>`,
```

Replace `wellnest-pilates.com` with YOUR verified domain.

### Step 3: Test
- Try booking a package with any email address
- User should receive the activation email!

---

## 🧪 Option 2: Keep Test Mode (For Development)

If you're still testing and don't want to verify a domain:

### For Testing Bookings:
Always use the email: `asani.kastri@gmail.com`

This email will receive:
- ✅ Activation codes
- ✅ Booking confirmations
- ✅ First session details

### For Other Test Users:
The app will:
- ✅ Create the booking/package successfully
- ✅ Generate activation codes
- ⚠️ NOT send emails (but codes are stored in database)
- 📋 You can view codes in Supabase Table Editor

---

## 📊 How It Works Now (With Test Mode)

### What Happens When Someone Books:

1. **Package Created** ✅
   - Saved to database with activation code
   - Payment status tracked
   - First session can be booked

2. **Email Attempted** ⚠️
   - If email = `asani.kastri@gmail.com` → Email sent ✅
   - If email = anything else → Email fails silently ⚠️
   - **Important:** Booking still succeeds!

3. **Activation Code Available** 📋
   - Stored in database at key: `activation_code:XXXXXX`
   - Can be retrieved manually if needed

---

## 🔍 How to Find Activation Codes (Test Mode)

If email doesn't send, retrieve codes from Supabase:

### Method 1: Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/azqkguctispoctvmpmci/editor
2. Open table: `kv_store_b87b0c07`
3. Search for key starting with: `activation_code:`
4. The `value` column contains: `{ "code": "XXXXXX", "email": "user@email.com", ... }`

### Method 2: Add Debug Endpoint (Optional)
You can create a debug endpoint to list all activation codes - let me know if you need this!

---

## 🎯 Production Checklist

Before launching to real users:

- [ ] Verify domain at resend.com/domains
- [ ] Update `from` address to use verified domain
- [ ] Test email sending to non-verified addresses
- [ ] Remove any debug endpoints
- [ ] Monitor Resend dashboard for delivery rates

---

## 💡 Current Behavior Summary

| Scenario | What Happens |
|----------|-------------|
| User books with `asani.kastri@gmail.com` | ✅ Email sent, activation code delivered |
| User books with other email | ⚠️ Booking succeeds, email fails silently, code stored in DB |
| App crashes when email fails? | ❌ NO - app continues normally |
| User can still complete booking? | ✅ YES - all data saved correctly |

---

## 🆘 Still Having Issues?

### Check Resend Logs:
https://resend.com/emails

### Check Server Logs:
1. Supabase Dashboard → Edge Functions → `make-server-b87b0c07` → Logs
2. Look for:
   - `⚠️ EMAIL NOT SENT: Resend is in test mode...`
   - `✅ Email sent successfully to: ...`

### Error Messages:
- `validation_error` = Test mode restriction (expected in dev)
- `Email service not configured` = Missing RESEND_API_KEY
- Any other errors = Check Resend dashboard

---

## 📝 Notes

- **Production Ready:** Verify domain before launch
- **Development:** Test mode is fine, use asani.kastri@gmail.com
- **Graceful Degradation:** App works even when emails fail
- **No Data Loss:** All codes stored in database regardless of email status
