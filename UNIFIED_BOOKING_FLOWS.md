# UNIFIED BOOKING FLOWS - VISUAL DIAGRAMS

## 📋 TABLE OF CONTENTS

1. [Single Session Flow](#single-session-flow)
2. [Package Purchase Flow (4/8/12 Classes)](#package-purchase-flow)
3. [Individual 1-on-1 Flow](#individual-1-on-1-flow)
4. [DUO Training Flow](#duo-training-flow)
5. [Subsequent Package Session Booking](#subsequent-package-session-booking)
6. [Cancellation Flow](#cancellation-flow)
7. [Activation Flow](#activation-flow)
8. [Orphaned Package Recovery](#orphaned-package-recovery)

---

## SINGLE SESSION FLOW

### User Journey
```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE SESSION BOOKING                        │
└─────────────────────────────────────────────────────────────────┘

👤 USER                    🖥️  FRONTEND                  ⚙️  BACKEND

  │                           │                            │
  │  1. Click "Single"        │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │  2. Show calendar          │
  │                           │     + time slots           │
  │<──────────────────────────┤                            │
  │                           │                            │
  │  3. Select Date           │                            │
  │     (Jan 23)              │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │  4. Select Time           │                            │
  │     (08:00)               │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │  5. Fill form:            │                            │
  │     Name, Surname,        │                            │
  │     Mobile, Email         │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │  6. Click "CONFIRM"       │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │  7. POST /reservations     │
  │                           │     {                      │
  │                           │       userId: email,       │
  │                           │       packageId: null,     │
  │                           │       serviceType: 'single',│
  │                           │       dateKey: "1-23",     │
  │                           │       timeSlot: "08:00",   │
  │                           │       name, surname, ...   │
  │                           │     }                      │
  │                           ├────────────────────────────>│
  │                           │                            │
  │                           │                            │  8. Validate slot
  │                           │                            │     availability
  │                           │                            │
  │                           │                            │  9. CREATE Reservation
  │                           │                            │     status='pending'
  │                           │                            │
  │                           │                            │ 10. GENERATE code
  │                           │                            │     "WN-XXXX-XXXX"
  │                           │                            │
  │                           │                            │ 11. CREATE ActivationCode
  │                           │                            │     linked to reservationId
  │                           │                            │
  │                           │                            │ 12. SEND email
  │                           │                            │     (Resend API)
  │                           │                            │
  │                           │  13. Response:             │
  │                           │      {                     │
  │                           │        reservation,        │
  │                           │        activationCode,     │
  │                           │        requiresActivation: true │
  │                           │      }                     │
  │                           │<────────────────────────────┤
  │                           │                            │
  │  14. Show success:        │                            │
  │      "Check your email    │                            │
  │       for activation"     │                            │
  │<──────────────────────────┤                            │
  │                           │                            │
  
  ⏰ USER CHECKS EMAIL
  
  │  15. Receives email       │                            │
  │      Code: WN-AB12-CD34   │                            │
  │                           │                            │
  │  16. Enter code           │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │  17. POST /activate        │
  │                           │      {                     │
  │                           │        email,              │
  │                           │        code: "WN-AB12-CD34"│
  │                           │      }                     │
  │                           ├────────────────────────────>│
  │                           │                            │
  │                           │                            │ 18. Validate code
  │                           │                            │
  │                           │                            │ 19. UPDATE Reservation
  │                           │                            │     status='confirmed'
  │                           │                            │
  │                           │                            │ 20. UPDATE ActivationCode
  │                           │                            │     status='used'
  │                           │                            │
  │                           │  21. Response:             │
  │                           │      {                     │
  │                           │        type: 'reservation',│
  │                           │        reservation         │
  │                           │      }                     │
  │                           │<────────────────────────────┤
  │                           │                            │
  │  22. Show confirmation:   │                            │
  │      "✓ Booking Confirmed!"│                           │
  │      Session: Jan 23, 08:00│                           │
  │<──────────────────────────┤                            │
  │                           │                            │
  ✓ COMPLETE
```

### Data Created
```
Reservation {
  id: "reservation:123456"
  userId: "user@email.com"
  packageId: null               ← No package (single session)
  serviceType: "single"
  dateKey: "1-23"
  timeSlot: "08:00"
  reservationStatus: "pending" → "confirmed" (after activation)
  seatsOccupied: 1
}

ActivationCode {
  id: "activation_code:WN-AB12-CD34"
  code: "WN-AB12-CD34"
  email: "user@email.com"
  reservationId: "reservation:123456"  ← Linked to reservation
  packageId: null
  status: "active" → "used"
}
```

---

## PACKAGE PURCHASE FLOW

### User Journey (8-Class Package Example)
```
┌─────────────────────────────────────────────────────────────────┐
│                   PACKAGE PURCHASE (2-STEP)                      │
└─────────────────────────────────────────────────────────────────┘

👤 USER                    🖥️  FRONTEND                  ⚙️  BACKEND

  │                           │                            │
  │  1. Click "PACKAGE"       │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │  2. Select "8 CLASSES"    │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │  3. Fill form:            │                            │
  │     Name, Surname,        │                            │
  │     Mobile, Email         │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │  4. Click "CONFIRM"       │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │  5. POST /packages         │
  │                           │     {                      │
  │                           │       userId: email,       │
  │                           │       packageType: 'package8',│
  │                           │       name, surname, ...   │
  │                           │     }                      │
  │                           ├────────────────────────────>│
  │                           │                            │
  │                           │                            │  6. CREATE Package
  │                           │                            │     status='pending'
  │                           │                            │     firstReservationId=null
  │                           │                            │     remainingSessions=8
  │                           │                            │
  │                           │                            │  7. GENERATE code
  │                           │                            │     "WN-EF56-GH78"
  │                           │                            │
  │                           │                            │  8. CREATE ActivationCode
  │                           │                            │     linked to packageId
  │                           │                            │
  │                           │                            │  ⚠️  DO NOT send email yet
  │                           │                            │
  │                           │  9. Response:              │
  │                           │     {                      │
  │                           │       packageId,           │
  │                           │       activationCode,      │
  │                           │       requiresFirstSessionBooking: true │
  │                           │     }                      │
  │                           │<────────────────────────────┤
  │                           │                            │
  │                           │ 10. ⚠️  CRITICAL:          │
  │                           │     Must proceed to        │
  │                           │     first session booking  │
  │                           │                            │
  ┌─────────────────────────────────────────────────────────────────┐
  │              TRANSITION: FIRST SESSION BOOKING                   │
  └─────────────────────────────────────────────────────────────────┘
  │                           │                            │
  │ 11. Show modal:           │                            │
  │     "✓ Package Registered!"│                           │
  │     "Now book first session"│                          │
  │<──────────────────────────┤                            │
  │                           │                            │
  │ 12. Click "CONTINUE"      │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │ 13. Show calendar          │
  │                           │     + time slots           │
  │                           │     (form pre-filled)      │
  │<──────────────────────────┤                            │
  │                           │                            │
  │ 14. Select Date (Jan 25)  │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │ 15. Select Time (09:00)   │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │ 16. Click "CONFIRM FIRST  │                            │
  │     SESSION"              │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │ 17. POST /packages/:id/first-session │
  │                           │     {                      │
  │                           │       dateKey: "1-25",     │
  │                           │       timeSlot: "09:00",   │
  │                           │       instructor: "Rina"   │
  │                           │     }                      │
  │                           ├────────────────────────────>│
  │                           │                            │
  │                           │                            │ 18. Validate package
  │                           │                            │     pending + no firstReservationId
  │                           │                            │
  │                           │                            │ 19. Validate slot
  │                           │                            │     availability
  │                           │                            │
  │                           │                            │ 20. CREATE Reservation
  │                           │                            │     status='pending'
  │                           │                            │     packageId=package.id
  │                           │                            │     sessionNumber=1
  │                           │                            │     isFirstSessionOfPackage=true
  │                           │                            │
  │                           │                            │ 21. UPDATE Package
  │                           │                            │     firstReservationId=reservation.id
  │                           │                            │     sessionsBooked=[reservation.id]
  │                           │                            │
  │                           │                            │ 22. ✅ NOW send email
  │                           │                            │     (combined package + session)
  │                           │                            │
  │                           │ 23. Response:              │
  │                           │     {                      │
  │                           │       package,             │
  │                           │       reservation,         │
  │                           │       activationCode       │
  │                           │     }                      │
  │                           │<────────────────────────────┤
  │                           │                            │
  │ 24. Show success:         │                            │
  │     "✓ Package & First    │                            │
  │      Session Booked!"     │                            │
  │     "Check email for code"│                            │
  │     "7 sessions remaining"│                            │
  │<──────────────────────────┤                            │
  │                           │                            │
  
  ⏰ USER CHECKS EMAIL
  
  │ 25. Receives email:       │                            │
  │     - Package: 8 Classes  │                            │
  │     - First: Jan 25, 09:00│                            │
  │     - Code: WN-EF56-GH78  │                            │
  │                           │                            │
  │ 26. Enter code            │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │ 27. POST /activate         │
  │                           │     {                      │
  │                           │       email,               │
  │                           │       code: "WN-EF56-GH78" │
  │                           │     }                      │
  │                           ├────────────────────────────>│
  │                           │                            │
  │                           │                            │ 28. Validate code
  │                           │                            │
  │                           │                            │ 29. Get packageId from code
  │                           │                            │
  │                           │                            │ 30. ⚠️  CRITICAL CHECK:
  │                           │                            │     Validate firstReservationId exists
  │                           │                            │
  │                           │                            │ 31. UPDATE Package:
  │                           │                            │     status='active'
  │                           │                            │     activationStatus='activated'
  │                           │                            │     activationDate=now
  │                           │                            │     expiryDate=now+6months
  │                           │                            │     remainingSessions=7 (8-1)
  │                           │                            │
  │                           │                            │ 32. UPDATE First Reservation:
  │                           │                            │     status='confirmed'
  │                           │                            │     activatedAt=now
  │                           │                            │
  │                           │                            │ 33. UPDATE ActivationCode:
  │                           │                            │     status='used'
  │                           │                            │
  │                           │ 34. Response:              │
  │                           │     {                      │
  │                           │       type: 'package',     │
  │                           │       package,             │
  │                           │       firstReservation     │
  │                           │     }                      │
  │                           │<────────────────────────────┤
  │                           │                            │
  │ 35. Redirect to dashboard │                            │
  │     Show:                 │                            │
  │     - Package: 8 Classes  │                            │
  │     - Remaining: 7        │                            │
  │     - Next: Jan 25, 09:00 │                            │
  │<──────────────────────────┤                            │
  │                           │                            │
  ✓ COMPLETE
```

### Data Created
```
Package {
  id: "package:user@email.com:123456"
  userId: "user@email.com"
  packageType: "package8"
  totalSessions: 8
  remainingSessions: 8 → 7 (after activation)
  sessionsBooked: ["reservation:first123"]
  firstReservationId: "reservation:first123"  ← MUST exist before activation
  packageStatus: "pending" → "active"
  activationStatus: "pending" → "activated"
  expiryDate: null → "2026-07-25" (6 months from activation)
}

Reservation {
  id: "reservation:first123"
  userId: "user@email.com"
  packageId: "package:user@email.com:123456"  ← Linked to package
  sessionNumber: 1
  serviceType: "package"
  dateKey: "1-25"
  timeSlot: "09:00"
  reservationStatus: "pending" → "confirmed"
  isFirstSessionOfPackage: true
  seatsOccupied: 1
}

ActivationCode {
  id: "activation_code:WN-EF56-GH78"
  code: "WN-EF56-GH78"
  email: "user@email.com"
  packageId: "package:user@email.com:123456"  ← Linked to package (NOT reservation)
  reservationId: null
  status: "active" → "used"
}
```

---

## SUBSEQUENT PACKAGE SESSION BOOKING

### User Journey (Booking Session 2-8)
```
┌─────────────────────────────────────────────────────────────────┐
│           SUBSEQUENT SESSION (AUTO-CONFIRMED)                    │
└─────────────────────────────────────────────────────────────────┘

👤 USER (Logged In)       🖥️  FRONTEND                  ⚙️  BACKEND

  │                           │                            │
  │  In Dashboard:            │                            │
  │  Package: 8 Classes       │                            │
  │  Remaining: 7             │                            │
  │  [BOOK NEXT SESSION]      │                            │
  │                           │                            │
  │  1. Click "Book Session"  │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │  2. Show inline calendar   │
  │                           │     + time slots           │
  │<──────────────────────────┤                            │
  │                           │                            │
  │  3. Select Date (Jan 28)  │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │  4. Select Time (10:00)   │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │  5. Click "CONFIRM"       │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │  6. POST /reservations     │
  │                           │     {                      │
  │                           │       userId: email,       │
  │                           │       packageId: pkg.id,   │
  │                           │       serviceType: 'package',│
  │                           │       dateKey: "1-28",     │
  │                           │       timeSlot: "10:00",   │
  │                           │       ...                  │
  │                           │     }                      │
  │                           ├────────────────────────────>│
  │                           │                            │
  │                           │                            │  7. Validate package:
  │                           │                            │     - status='active' ✓
  │                           │                            │     - remainingSessions>0 ✓
  │                           │                            │     - not expired ✓
  │                           │                            │
  │                           │                            │  8. Validate slot
  │                           │                            │     availability
  │                           │                            │
  │                           │                            │  9. CREATE Reservation
  │                           │                            │     status='confirmed'  ← Auto-confirmed!
  │                           │                            │     autoConfirmed=true
  │                           │                            │     sessionNumber=2
  │                           │                            │
  │                           │                            │ 10. UPDATE Package:
  │                           │                            │     remainingSessions=6 (7-1)
  │                           │                            │     sessionsBooked.push(reservationId)
  │                           │                            │
  │                           │                            │ 11. ⚠️  NO activation code
  │                           │                            │     ⚠️  NO email
  │                           │                            │
  │                           │ 12. Response:              │
  │                           │     {                      │
  │                           │       reservation,         │
  │                           │       requiresActivation: false,│
  │                           │       package (updated)    │
  │                           │     }                      │
  │                           │<────────────────────────────┤
  │                           │                            │
  │ 13. ✅ Instant confirmation│                            │
  │     "✓ Session Booked!"   │                            │
  │     "Jan 28, 10:00-10:50" │                            │
  │     "Remaining: 6 sessions"│                           │
  │<──────────────────────────┤                            │
  │                           │                            │
  │     Dashboard auto-updates│                            │
  │     - Remaining: 6        │                            │
  │     - Next: Jan 28, 10:00 │                            │
  │<──────────────────────────┤                            │
  │                           │                            │
  ✓ COMPLETE (No activation needed!)
```

### Key Differences from First Session
```
First Session:
├─ status='pending'
├─ requiresActivation=true
├─ Email sent with code
└─ User must activate

Subsequent Sessions:
├─ status='confirmed' (instant)
├─ requiresActivation=false
├─ NO email sent
├─ NO activation needed
└─ autoConfirmed=true
```

---

## INDIVIDUAL 1-ON-1 FLOW

### Special Behavior
```
Same as Package Flow BUT:

1. Slot Validation (CRITICAL):
   ┌─────────────────────────────────────┐
   │  Slot must be COMPLETELY EMPTY      │
   │  available seats = 4 (no other      │
   │  confirmed/attended reservations)   │
   └─────────────────────────────────────┘

2. Reservation Properties:
   ┌─────────────────────────────────────┐
   │  seatsOccupied: 4                   │
   │  isPrivateSession: true             │
   │  → Blocks entire slot for others    │
   └─────────────────────────────────────┘

3. Calendar Display:
   11:00-11:50  [🔒 PRIVATE SESSION]
   Cannot book - occupied by 1-on-1
```

---

## DUO TRAINING FLOW

### Special Behavior
```
Same as Package Flow BUT:

1. Slot Validation (CRITICAL):
   ┌─────────────────────────────────────┐
   │  Slot must have ≥ 2 seats available │
   │  No existing DUO in this slot       │
   │  (Only 1 DUO allowed per slot)      │
   └─────────────────────────────────────┘

2. Form Requirements:
   ┌─────────────────────────────────────┐
   │  + Partner Name (required)          │
   │  + Partner Surname (required)       │
   └─────────────────────────────────────┘

3. Reservation Properties:
   ┌─────────────────────────────────────┐
   │  seatsOccupied: 2                   │
   │  partnerName: "Jane"                │
   │  partnerSurname: "Smith"            │
   └─────────────────────────────────────┘

4. Capacity Example:
   09:00-09:50  [●● ○ ○]
   DUO (2 seats) + 2 available
   
   If someone books regular class:
   09:00-09:50  [●● ● ○]
   DUO (2 seats) + Regular (1 seat) + 1 available
   
   If someone tries to book another DUO:
   ❌ ERROR: Only 1 DUO per slot allowed
```

---

## CANCELLATION FLOW

### Time-Based Logic
```
┌─────────────────────────────────────────────────────────────────┐
│                    CANCELLATION RULES                            │
└─────────────────────────────────────────────────────────────────┘

Time Until Session:  Action:                Package Credit:

>24 hours           status='cancelled'      ✅ Full credit
                    Seat freed              remainingSessions++

2-24 hours          status='cancelled'      ⚠️  Admin review
                    lateCancellation=true   (flagged, no auto-credit)
                    Seat freed

<2 hours            status='no_show'        ❌ No credit
                    Session consumed        Session lost
                    Seat freed

Admin cancels       status='cancelled'      ✅ Always full credit
(any time)          cancelledBy='admin'     remainingSessions++
```

### Flow Diagram
```
👤 USER                    🖥️  FRONTEND                  ⚙️  BACKEND

  │ Click "Cancel" on       │                            │
  │ reservation             │                            │
  ├──────────────────────────>│                            │
  │                           │                            │
  │                           │  PATCH /reservations/:id/status │
  │                           │  {                         │
  │                           │    status: 'cancelled',    │
  │                           │    cancelledBy: 'user',    │
  │                           │    cancelReason: "..."     │
  │                           │  }                         │
  │                           ├────────────────────────────>│
  │                           │                            │
  │                           │                            │  Calculate hours until
  │                           │                            │  session time
  │                           │                            │
  │                           │                            │  IF >24hr OR admin:
  │                           │                            │    status='cancelled'
  │                           │                            │    IF packageId:
  │                           │                            │      remainingSessions++
  │                           │                            │
  │                           │                            │  ELSE IF 2-24hr:
  │                           │                            │    status='cancelled'
  │                           │                            │    lateCancellation=true
  │                           │                            │    NO auto-credit
  │                           │                            │
  │                           │                            │  ELSE (<2hr):
  │                           │                            │    status='no_show'
  │                           │                            │    NO credit
  │                           │                            │
  │                           │  Response                  │
  │                           │<────────────────────────────┤
  │                           │                            │
  │  Show result based       │                            │
  │  on time:                │                            │
  │  ✅ "Cancelled, credit   │                            │
  │     returned"            │                            │
  │  OR ⚠️  "Late cancel,    │                            │
  │     under review"        │                            │
  │  OR ❌ "Too late,        │                            │
  │     session lost"        │                            │
  │<──────────────────────────┤                            │
```

---

## ORPHANED PACKAGE RECOVERY

### Scenario: User Abandoned After Step 1
```
┌─────────────────────────────────────────────────────────────────┐
│              ORPHANED PACKAGE DETECTION & RECOVERY               │
└─────────────────────────────────────────────────────────────────┘

1. User creates package → Closes browser before booking first session

Package State:
{
  id: "package:user@email.com:123456"
  firstReservationId: null        ← ⚠️  ORPHANED
  packageStatus: "pending"
  activationStatus: "pending"
}

2. System detection:
   POST /packages/:id
   → Creates package
   → Returns requiresFirstSessionBooking: true
   → BUT user navigates away

3. On next login:
   GET /packages?userId=email
   → Returns packages including orphaned one
   
   Frontend checks:
   const orphaned = packages.find(pkg => 
     pkg.firstReservationId === null && 
     pkg.packageStatus === 'pending'
   );

4. If orphaned package found:
   ┌─────────────────────────────────────┐
   │  MODAL (Cannot dismiss)             │
   │                                     │
   │  ⚠️  Complete Your Package Purchase │
   │                                     │
   │  You have an incomplete 8-Class     │
   │  package. Please select your first  │
   │  session to activate.               │
   │                                     │
   │  [SELECT DATE & TIME] ←─────────────┤
   └─────────────────────────────────────┘
   
5. User forced through first-session booking:
   → Select date + time
   → POST /packages/:id/first-session
   → Email sent
   → Package complete
```

### Admin View
```
GET /admin/orphaned-packages

Response:
{
  orphanedPackages: [
    {
      id: "package:user1@email.com:123",
      userId: "user1@email.com",
      packageType: "package8",
      createdAt: "2026-01-23T10:00:00Z",
      hoursOrphaned: 48
    },
    {
      id: "package:user2@email.com:456",
      userId: "user2@email.com",
      packageType: "individual8",
      createdAt: "2026-01-24T14:30:00Z",
      hoursOrphaned: 18
    }
  ],
  count: 2
}

Admin Actions:
1. Send reminder email to users
2. Manually complete booking for user
3. Cancel and refund if requested
```

---

## 🎯 KEY TAKEAWAYS

### Universal Rules (ALL Service Types)
```
✅ ALWAYS select date + time during checkout
✅ ALWAYS create at least one reservation
✅ NEVER allow booking without concrete slot
✅ Packages MUST book first session before activation
```

### Status Flow Summary
```
Package Purchase:
  pending → (first session booked) → (activation) → active

Single Reservation:
  pending → (activation) → confirmed → (attend) → attended

Package Reservation (First):
  pending → (package activation) → confirmed → attended

Package Reservation (Subsequent):
  confirmed (instant) → attended
```

### Activation Code Linking
```
Single Session:    code → reservationId
Package:           code → packageId (NOT reservationId)
```

### Seat Occupancy
```
Single/Package:   1 seat
DUO:              2 seats
Individual 1-on-1: 4 seats (entire slot)
```

---

**Last Updated**: 2026-01-25  
**Document Version**: 1.0.0  
**System Version**: 2.0.0 (Unified Model)
