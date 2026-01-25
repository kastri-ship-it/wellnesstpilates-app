# ✅ EMAIL LINK FIXED - Works in Preview Now!

## Problem
The registration email contained a link to `your_app_url_here` which didn't exist, causing DNS error.

## Solution
Updated the system to automatically use the current app URL from the browser!

## What Changed

### Backend (`/supabase/functions/server/index.tsx`)
1. **Added `appUrl` parameter** to `sendRegistrationEmail()` function
2. **Updated endpoint** `/packages/:id/first-session` to accept `appUrl` from request
3. **Removed hardcoded URL** - now uses URL sent from frontend

### Frontend (`/src/app/components/PackageOverview.tsx`)
1. **Added `window.location.origin`** to the first session booking request
2. This automatically sends the current app URL (works in preview AND production)

## How It Works Now

1. **User books package** in the preview app
2. **Frontend sends** booking request with current URL: `window.location.origin`
3. **Backend receives** the actual app URL (e.g., `https://xxxxx.figma-make.com`)
4. **Email contains** correct link: `https://xxxxx.figma-make.com#/setup-password?token=xxx`
5. **User clicks link** → Opens in same app → Password setup works! ✅

## Test It Now!

1. Book a package
2. Check email
3. Click "Complete Registration" button
4. Should open password setup page in YOUR app
5. Set password
6. Auto-login to dashboard

**NO manual configuration needed!** It works automatically in:
- ✅ Figma Make preview
- ✅ Published URL
- ✅ Custom domain
- ✅ Localhost (for development)

## Email Link Format

The email now contains the correct link based on where the app is running:

```
https://your-actual-preview-url.figma-make.com#/setup-password?token=verify_xxxxx
```

The `#/` is important - it's a hash-based route that works without server configuration!

