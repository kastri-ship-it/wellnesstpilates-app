# Coupon Redemption System

## Overview

The coupon redemption system allows users to apply promotional codes when purchasing multipackage deals (8, 10, or 12 classes). Valid coupons grant +1 free class to the package.

## Features

### Frontend (PackageOverview Component)
- Coupon input field below the email field
- Real-time validation with visual feedback (green checkmark for valid, red X for invalid)
- Auto-uppercase formatting
- Apply button to validate the code
- Multi-language support (Albanian, Macedonian, English)

### Backend (Supabase)
- `/validate-coupon` endpoint validates codes without consuming them
- Coupon codes are stored in the KV store with key: `redemption_code:{CODE}`
- On valid redemption during package purchase:
  - Total sessions increased by +1
  - Coupon marked as used with timestamp and user email
  - Package metadata includes `bonusClasses`, `redeemedCouponCode`, `baseSessions`

### Email Confirmation
- When a user redeems a coupon, the confirmation email includes a special bonus section
- Shows "🎁 Bonus Redeemed! +{N} Free Class Added!"
- Available in all supported languages

## Coupon Data Structure

Coupons are stored in Supabase KV store:

```javascript
{
  id: 'redemption_code:SUMMER2024',
  code: 'SUMMER2024',
  status: 'active',          // 'active' or 'inactive'
  used: false,               // becomes true after redemption
  usedAt: null,              // timestamp when redeemed
  usedBy: null,              // user email who redeemed it
  packageId: null,           // linked package ID
  expiresAt: '2024-12-31',   // optional expiry date
  createdAt: '2024-01-01T00:00:00.000Z'
}
```

## Creating Coupons

To create a redemption code, add it to the Supabase KV store via the admin panel or directly in the database:

```javascript
// Example: Create a coupon code
const coupon = {
  id: 'redemption_code:WELCOME10',
  code: 'WELCOME10',
  status: 'active',
  used: false,
  usedAt: null,
  usedBy: null,
  packageId: null,
  expiresAt: '2026-12-31T23:59:59.000Z', // Optional: set expiry
  createdAt: new Date().toISOString()
};

await kv.set('redemption_code:WELCOME10', coupon);
```

## Usage Flow

1. **User enters coupon code** in the Package Overview form
2. **User clicks "Apply"** button
3. **Frontend validates** code via `/validate-coupon` endpoint
4. **Visual feedback** shown (green checkmark or red X)
5. **On package purchase**, if coupon is valid:
   - Package created with bonus class included
   - Coupon marked as used
   - Email sent with bonus notification
6. **User receives confirmation** email showing their bonus class

## Restrictions

- ✅ Only works for multipackages (8, 10, 12 classes)
- ✅ One-time use per coupon code
- ✅ Must be active and not expired
- ❌ Does NOT work for single sessions, individual training, or duo packages

## API Endpoints

### POST /make-server-b87b0c07/validate-coupon
Validates a coupon code without consuming it.

**Request:**
```json
{
  "code": "SUMMER2024"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "message": "Valid coupon! You'll receive +1 free class",
  "bonusClasses": 1
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "error": "Coupon not found" // or "Coupon already redeemed" / "Coupon expired"
}
```

### POST /make-server-b87b0c07/packages
Create a package with optional coupon redemption.

**Request:**
```json
{
  "userId": "user@email.com",
  "packageType": "package10",
  "name": "John",
  "surname": "Doe",
  "mobile": "+38970123456",
  "email": "user@email.com",
  "language": "en",
  "couponCode": "SUMMER2024" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "packageId": "package:user@email.com:1234567890",
  "activationCode": "ABC123",
  "bonusClasses": 1,
  "redeemedCoupon": "SUMMER2024",
  "message": "Package created with +1 bonus class! Please select date and time for your first session."
}
```

## Translations

The system includes full multi-language support for coupon-related text:

| Key | Albanian | Macedonian | English |
|-----|----------|------------|---------|
| couponCode | Kodi i kuponit | Купонски код | Coupon Code |
| apply | Apliko | Примени | Apply |
| couponValid | ✓ Kupon i vlefshëm! +1 klasë falas | ✓ Валиден купон! +1 бесплатен час | ✓ Valid coupon! +1 free class |
| couponInvalid | Kodi i kuponit i pavlefshëm ose i skaduar | Невалиден или истечен купонски код | Invalid or expired coupon code |
