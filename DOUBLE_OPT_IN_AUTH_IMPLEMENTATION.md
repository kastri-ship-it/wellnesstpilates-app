# Double Opt-In Authentication System Implementation Guide

## Overview

This system implements a comprehensive authentication flow where:
1. Users register/book and receive an email with **password setup LINK** (double opt-in) - NO CODE
2. Users can log in with email/password  
3. Activation codes (WN-XXXX-XXXX) for packages are **manually sent by admin** (separate from login)
4. Users can cancel/reschedule bookings up to **24 hours before** class

## IMPORTANT: Two Different Emails

### Email 1: Registration/Password Setup (Automatic)
- Sent automatically when user books package
- Contains: **PASSWORD SETUP LINK** (not code!)
- Purpose: Complete registration
- No activation code in this email

### Email 2: Package Activation Code (Manual - Admin Only)
- Sent manually by admin after payment received
- Contains: **ACTIVATION CODE** (WN-XXXX-XXXX)
- Purpose: Unlock package sessions
- This is the email shown in user's screenshot

## Backend API Endpoints (Added to `/supabase/functions/server/index.tsx`)

### Authentication Endpoints

#### 1. POST `/make-server-b87b0c07/auth/register`
**Purpose**: User registration (Step 1)
**Body**:
```json
{
  "email": "user@example.com",
  "name": "John",
  "surname": "Doe",
  "mobile": "+1234567890"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Registration initiated. Please check your email to set up your password.",
  "requiresVerification": true
}
```
**Actions**:
- Creates user with `passwordHash: null`, `verified: false`
- Generates verification token (24h expiry)
- Sends password setup email with link containing token

---

#### 2. POST `/make-server-b87b0c07/auth/setup-password`
**Purpose**: Complete registration by setting password (Step 2)
**Body**:
```json
{
  "token": "verify_1234567890_abc123",
  "password": "securepassword123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Password set successfully! You can now log in.",
  "user": {
    "email": "user@example.com",
    "name": "John",
    "surname": "Doe"
  }
}
```
**Actions**:
- Validates token (not expired, not used)
- Hashes password with SHA-256
- Updates user: `passwordHash`, `verified: true`
- Marks token as used

---

#### 3. POST `/make-server-b87b0c07/auth/login`
**Purpose**: User login
**Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "sessionToken": "session_1234567890_xyz789",
  "user": {
    "email": "user@example.com",
    "name": "John",
    "surname": "Doe",
    "mobile": "+1234567890"
  }
}
```
**Actions**:
- Validates email/password
- Creates session token (30-day expiry)
- Returns session token for authentication

---

#### 4. GET `/make-server-b87b0c07/auth/verify`
**Purpose**: Verify session is valid
**Headers**: `Authorization: Bearer <sessionToken>`
**Response**:
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "name": "John",
    "surname": "Doe",
    "mobile": "+1234567890"
  }
}
```

---

#### 5. POST `/make-server-b87b0c07/auth/logout`
**Purpose**: Log out user
**Headers**: `Authorization: Bearer <sessionToken>`
**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Admin Endpoint

#### POST `/make-server-b87b0c07/admin/send-activation-code`
**Purpose**: Admin manually sends activation code to user for package
**Body**:
```json
{
  "packageId": "package:user@example.com:1234567890"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Activation code sent to user@example.com",
  "activationCode": "WN-ABCD-EFGH"
}
```
**Actions**:
- Gets package and activation code
- Sends email with activation code
- Used by admin when user pays for package

---

### Booking Management Endpoints

#### POST `/make-server-b87b0c07/reservations/:id/cancel`
**Purpose**: Cancel a booking (24h restriction)
**Body**:
```json
{
  "userId": "user:user@example.com",
  "reason": "Schedule conflict"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "reservation": { ... }
}
```
**Validation**:
- Must be >24 hours before class
- Must be owner of reservation
- Cannot be already cancelled

---

#### POST `/make-server-b87b0c07/reservations/:id/reschedule`
**Purpose**: Reschedule a booking (24h restriction)
**Body**:
```json
{
  "userId": "user:user@example.com",
  "dateKey": "1-27",
  "timeSlot": "10:00",
  "instructor": "Rina Krasniqi"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Reservation rescheduled successfully",
  "oldReservation": { ... },
  "newReservation": { ... }
}
```
**Validation**:
- Must be >24 hours before original class
- New slot must have availability
- Cancels old reservation, creates new one

---

## Frontend Components to Create

### 1. `/src/app/components/PasswordSetupPage.tsx`
**Purpose**: Page where user sets password after clicking email link
**Features**:
- Extracts token from URL query param
- Password input with validation (min 6 characters)
- Calls `/auth/setup-password`
- Shows success message with redirect to login

### 2. `/src/app/components/LoginPage.tsx`
**Purpose**: User login page
**Features**:
- Email/password form
- Calls `/auth/login`
- Stores sessionToken in localStorage
- Redirects to user dashboard on success

### 3. `/src/app/components/RegisterPage.tsx`
**Purpose**: User registration page
**Features**:
- Name, surname, email, mobile fields
- Calls `/auth/register`
- Shows "Check your email" success message

### 4. Update `/src/app/components/UserDashboard.tsx`
**Add Features**:
- Cancel booking button (with 24h check)
- Reschedule booking button (with 24h check)
- Show confirmation dialog before cancel/reschedule
- Update booking list after action

### 5. Update `/src/app/components/AdminPanel.tsx`
**Add Features**:
- "Send Activation Code" button next to each package
- Calls `/admin/send-activation-code`
- Shows confirmation that email was sent

---

## User Flow

### New User Registration Flow:
1. User visits app → clicks "Register"
2. Fills out registration form (name, surname, email, mobile)
3. Submits → receives "Check your email" message
4. Opens email → clicks "Set Up Password" link
5. Enters password → account activated
6. Can now log in with email/password

### Booking Flow:
1. User logs in
2. Can browse and book classes (even without activation codes)
3. **Activation codes are manually sent by admin** when user pays
4. User enters activation code in dashboard to unlock package sessions

### Cancellation Flow:
1. User logs in → views "My Bookings"
2. Clicks "Cancel" on a booking
3. **If >24h before class**: Cancellation successful
4. **If <24h before class**: Error message "Contact studio directly"

---

## Database Schema Changes

### User Object (in KV store):
```typescript
{
  id: "user:email@example.com",
  email: string,
  name: string,
  surname: string,
  mobile: string,
  passwordHash: string | null,  // null until password is set
  verified: boolean,             // false until password setup complete
  verificationToken: string | null,
  createdAt: string,
  updatedAt: string,
  blocked: boolean
}
```

### Verification Token Object:
```typescript
{
  id: "verification_token:verify_xxx",
  token: string,
  email: string,
  expiresAt: string,  // 24 hours from creation
  used: boolean,
  usedAt: string | null,
  createdAt: string
}
```

### Session Object:
```typescript
{
  id: "session:session_xxx",
  token: string,
  userId: string,  // Reference to user:email
  email: string,
  createdAt: string,
  expiresAt: string,  // 30 days from creation
  lastAccessedAt: string
}
```

---

## Implementation Priority

1. ✅ Backend auth endpoints (register, setup-password, login, verify, logout)
2. ✅ Backend booking management (cancel, reschedule with 24h check)
3. ✅ Backend admin endpoint (send activation code)
4. ⏳ Frontend: PasswordSetupPage component
5. ⏳ Frontend: LoginPage component
6. ⏳ Frontend: RegisterPage component
7. ⏳ Frontend: Update UserDashboard with cancel/reschedule
8. ⏳ Frontend: Update AdminPanel with "Send Code" button

---

## Email Templates

### 1. Password Setup Email
- Subject: "Complete Your Registration - WellNest Pilates"
- Contains link with verification token
- Expires in 24 hours
- CTA: "Set Up Password" button

### 2. Manual Activation Code Email (sent by admin)
- Subject: "Your Activation Code - WellNest Pilates"
- Contains activation code (WN-XXXX-XXXX)
- Shows sessions remaining
- Instructions to log in and use code

---

## Security Notes

- Passwords hashed with SHA-256 (for production, use bcrypt)
- Session tokens expire after 30 days
- Verification tokens expire after 24 hours
- Email as salt for password hashing
- 24-hour cancellation policy prevents last-minute cancellations
- Users can only cancel their own bookings (ownership verification)

