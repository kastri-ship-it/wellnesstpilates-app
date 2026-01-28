# How to Create a Valid Coupon in Supabase

## Issue
The coupon `WN-SEHKKY` is showing as invalid because the database record doesn't have the correct structure.

## Required Data Structure

In your Supabase KV Store table (`kv_store_b87b0c07`), you need to create a record with:

### Key (id column)
```
redemption_codes:WN-SEHKKY
```

### Value (value column) - Must be valid JSON
```json
{
  "id": "redemption_codes:WN-SEHKKY",
  "code": "WN-SEHKKY",
  "status": "active",
  "used": false,
  "usedAt": null,
  "usedBy": null,
  "packageId": null,
  "expiresAt": null,
  "createdAt": "2026-01-28T00:00:00.000Z"
}
```

## Steps to Fix in Supabase Dashboard

1. **Open your Supabase project**
2. **Go to Table Editor**
3. **Find the `kv_store_b87b0c07` table**
4. **Click "Insert" → "Insert row"**
5. **Fill in the fields:**

   **id:** `redemption_codes:WN-SEHKKY`
   
   **value:** (paste this exact JSON)
   ```json
   {"id":"redemption_codes:WN-SEHKKY","code":"WN-SEHKKY","status":"active","used":false,"usedAt":null,"usedBy":null,"packageId":null,"expiresAt":null,"createdAt":"2026-01-28T00:00:00.000Z"}
   ```
   
   **created_at:** (auto-generated)

6. **Click "Save"**

## Common Mistakes to Avoid

❌ **Wrong key format:**
- `WN-SEHKKY` (missing prefix)
- `redemption_code:WN-SEHKKY` (wrong prefix - should be plural "codes")

✅ **Correct:** `redemption_codes:WN-SEHKKY`

❌ **Wrong status values:**
- `"status": "pending"` 
- `"status": "inactive"`
- `"status": null`

✅ **Correct:** `"status": "active"`

❌ **Wrong used value:**
- `"used": true` (already redeemed)
- `"used": "false"` (string instead of boolean)

✅ **Correct:** `"used": false`

## Testing the Coupon

After creating the coupon with the correct structure:

1. Go to Package Overview
2. Enter `WN-SEHKKY` in the coupon field
3. Click "Apply"
4. You should see: ✓ Kupon i vlefshëm! +1 klasë falas

## Multiple Coupons Example

If you want to create multiple coupons:

### WELCOME2026
```
id: redemption_codes:WELCOME2026
value: {"id":"redemption_codes:WELCOME2026","code":"WELCOME2026","status":"active","used":false,"usedAt":null,"usedBy":null,"packageId":null,"expiresAt":"2026-12-31T23:59:59.000Z","createdAt":"2026-01-28T00:00:00.000Z"}
```

### SPRING10
```
id: redemption_codes:SPRING10
value: {"id":"redemption_codes:SPRING10","code":"SPRING10","status":"active","used":false,"usedAt":null,"usedBy":null,"packageId":null,"expiresAt":"2026-06-30T23:59:59.000Z","createdAt":"2026-01-28T00:00:00.000Z"}
```

## What Happens When Coupon is Redeemed

After a user successfully redeems a coupon, the database record will automatically update:

```json
{
  "id": "redemption_codes:WN-SEHKKY",
  "code": "WN-SEHKKY",
  "status": "active",
  "used": true,                              // ← Changed to true
  "usedAt": "2026-01-28T15:30:00.000Z",     // ← Timestamp added
  "usedBy": "fatonibri@gmail.com",          // ← User email added
  "packageId": "package:fatonibri@gmail.com:1738078200000",  // ← Package linked
  "expiresAt": null,
  "createdAt": "2026-01-28T00:00:00.000Z"
}
```

## Debugging

To check if a coupon is correctly structured, you can:

1. Open Supabase Table Editor
2. Find the row with id `redemption_codes:WN-SEHKKY`
3. Click on the "value" column to view the JSON
4. Verify it has all required fields:
   - ✅ `status: "active"`
   - ✅ `used: false`
   - ✅ `expiresAt: null` OR a future date

## No User Email Required

**Important:** The coupon redemption does NOT require:
- ❌ User to have a specific email beforehand
- ❌ User to be in a "pending" status
- ❌ User to receive an email first

The coupon is validated independently and can be used by ANY user purchasing a package.
