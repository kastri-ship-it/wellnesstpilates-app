# 🔍 Coupon Debug Instructions

## Step 1: Check What's Actually in Your Database

Open your browser console and run this command:

```javascript
fetch('https://azqkguctispoctvmpmci.supabase.co/functions/v1/make-server-b87b0c07/debug/coupons', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cWtndWN0aXNwb2N0dm1wbWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTM4MTAsImV4cCI6MjA4NDU4OTgxMH0.cjn0-KOMMn-_K22j2k6kk37r5IAbPE9vpqFOKooWsIg'
  }
})
.then(r => r.json())
.then(data => {
  console.log('📊 Database Contents:', data);
  console.table(data.coupons);
});
```

This will show you EXACTLY what coupons are in your database and how they're stored.

---

## Step 2: Create Coupon with CORRECT Format

Based on what you see, you need to create the coupon in Supabase with this EXACT format:

### Go to Supabase Dashboard:
1. https://supabase.com/dashboard/project/azqkguctispoctvmpmci
2. Click "Table Editor" in left sidebar
3. Find table: `kv_store_b87b0c07`

### Click "Insert Row" and enter:

**Column: `key`** (this is CRITICAL!)
```
redemption_codes:WN-SEHKKY
```
☝️ **IMPORTANT:** The key must be EXACTLY `redemption_codes:WN-SEHKKY` (with the prefix!)

**Column: `value`** (paste this JSON)
```json
{"id":"redemption_codes:WN-SEHKKY","code":"WN-SEHKKY","status":"active","used":false,"usedAt":null,"usedBy":null,"packageId":null,"expiresAt":null,"createdAt":"2026-01-28T00:00:00.000Z"}
```

### Click "Save"

---

## Step 3: Verify It's There

Run the debug command again from Step 1. You should now see:

```json
{
  "success": true,
  "count": 1,
  "coupons": [
    {
      "id": "redemption_codes:WN-SEHKKY",
      "code": "WN-SEHKKY",
      "status": "active",
      "used": false,
      ...
    }
  ]
}
```

---

## Step 4: Test the Coupon

1. Open your app
2. Go to Package Overview
3. Enter: `WN-SEHKKY`
4. Click "Apliko"
5. Should show: ✓ "Kupon i vlefshëm! +1 klasë falas"

---

## 🚨 Common Mistakes

### ❌ WRONG - Just the code in the key column:
```
key: WN-SEHKKY
```

### ✅ CORRECT - Full prefix in the key column:
```
key: redemption_codes:WN-SEHKKY
```

---

## 📸 Screenshot Example

Your Supabase table should look like this:

| key | value | created_at |
|-----|-------|------------|
| `redemption_codes:WN-SEHKKY` | `{"id":"redemption_codes:WN-SEHKKY",...}` | 2026-01-28... |

**NOT like this:**

| key | value | created_at |
|-----|-------|------------|
| `WN-SEHKKY` | `{"id":"WN-SEHKKY",...}` | 2026-01-28... |

---

## Still Not Working?

Check the server logs:
1. Supabase Dashboard → Edge Functions → `make-server-b87b0c07` → Logs
2. Look for these messages:
   - `🔍 Looking for coupon with key: redemption_codes:WN-SEHKKY`
   - `❌ Coupon not found: redemption_codes:WN-SEHKKY` ← This means the key doesn't exist
   - `✅ Coupon valid: WN-SEHKKY` ← This means it worked!
